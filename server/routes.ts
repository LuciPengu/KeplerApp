import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_MESSAGE = `You are an AI astronomer assistant. You provide a concise, engaging summary of exoplanet data from the Kepler mission. Include interesting facts, comparisons to our solar system, and habitability potential. Keep it to 2-3 sentences. Start with the star system name. Plain text only, no markdown.`;

interface NasaTceRow {
  kepid: number;
  tce_plnt_num: number;
  tce_period: number;
  tce_prad: number;
  tce_eqt: number;
  tce_insol: number;
  tce_duration: number;
  tce_depth: number;
  tce_model_snr: number;
  tce_impact: number;
  tce_steff: number;
  tce_sradius: number;
  tce_smass?: number;
  tce_sage?: number;
  ra: number;
  dec: number;
  tce_time0bk?: number;
}

function formatDiscoveryDate(value: unknown): string {
  if (typeof value === "string") return value.split(" ")[0];
  if (typeof value === "number") return `Day ${Math.round(value)}`;
  return "Unknown";
}

async function queryNasaApi(kepid: number): Promise<NasaTceRow[]> {
  const tapUrl = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
  const query = `SELECT * FROM q1_q17_dr25_tce WHERE kepid = ${kepid} ORDER BY tce_plnt_num`;

  const params = new URLSearchParams({
    REQUEST: "doQuery",
    LANG: "ADQL",
    QUERY: query,
    FORMAT: "json",
  });

  const response = await fetch(`${tapUrl}?${params.toString()}`, {
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`NASA API returned ${response.status}`);
  }

  const data = await response.json();
  return data as NasaTceRow[];
}

async function generateSummary(systemData: Record<string, unknown>): Promise<string> {
  try {
    const dataStr = JSON.stringify(systemData, null, 2);
    const completion = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: SYSTEM_MESSAGE },
        {
          role: "user",
          content: `Here is the data for a Kepler system:\n\n${dataStr}\n\nPlease provide a concise summary.`,
        },
      ],
      max_completion_tokens: 1024,
    });
    return completion.choices[0]?.message?.content || "Summary unavailable.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "AI summary is temporarily unavailable.";
  }
}

function processNasaData(rows: NasaTceRow[], kepid: number) {
  const first = rows[0];

  const result: Record<string, unknown> = {
    star_system: `Kepler-${kepid}`,
    number_of_planets: rows.length,
    star_temperature: `${first.tce_steff?.toLocaleString() || "Unknown"} Kelvin (Earth's Sun is about 5,800 Kelvin)`,
    star_size: `${first.tce_sradius?.toFixed(2) || "Unknown"} times the size of Earth's Sun`,
    star_mass: first.tce_smass != null ? `${first.tce_smass.toFixed(2)} times the mass of Earth's Sun` : null,
    star_age: first.tce_sage != null ? `${first.tce_sage.toFixed(2)} billion years` : null,
    ra_dec: `RA: ${first.ra?.toFixed(4) || "N/A"}, Dec: ${first.dec?.toFixed(4) || "N/A"}`,
    potential_planets: [] as Record<string, unknown>[],
    system_note: rows.length > 5 ? "This star has an unusually high number of potential planets!" : null,
    discovery_date: formatDiscoveryDate(first.tce_time0bk),
    last_update: "Data from Q1-Q17 DR25 TCE catalog",
    smart_summary: "",
  };

  for (const row of rows) {
    const planet: Record<string, unknown> = {
      planet_number: row.tce_plnt_num,
      orbit: `Circles its star every ${row.tce_period?.toFixed(2) || "?"} days`,
      size: `About ${row.tce_prad?.toFixed(1) || "?"} times bigger than Earth`,
      temperature: `Approximately ${row.tce_eqt?.toFixed(0) || "?"} Kelvin`,
      sunlight_received: `${row.tce_insol?.toFixed(0) || "?"} times more than Earth gets`,
      transit_duration: `${row.tce_duration?.toFixed(2) || "?"} hours`,
      transit_depth: `${row.tce_depth?.toFixed(2) || "?"} parts per million`,
      detection_snr: row.tce_model_snr || 0,
      impact_parameter: row.tce_impact || 0,
      interesting_features: [] as string[],
    };

    const features = planet.interesting_features as string[];
    if (row.tce_period < 1) features.push("This planet orbits very quickly!");
    if (row.tce_prad > 15) features.push("This planet is extremely large!");
    if (row.tce_eqt > 200 && row.tce_eqt < 300) features.push("This planet's temperature might allow for liquid water!");
    if (row.tce_insol > 10000) features.push("This planet receives an extreme amount of starlight!");

    (result.potential_planets as Record<string, unknown>[]).push(planet);
  }

  return result;
}

interface BrowseRawRow {
  kepid: number;
  tce_plnt_num: number;
  tce_steff: number;
  tce_sradius: number;
  tce_eqt: number;
  tce_prad: number;
  tce_period: number;
}

interface BrowseSystemResult {
  kepid: number;
  planet_count: number;
  star_temp: number;
  star_size: number;
  warmest_planet_temp: number;
  largest_planet: number;
}

function buildBrowseQuery(category: string, maxrec: number): { query: string; maxrec: number } {
  const baseFields = "kepid, tce_plnt_num, tce_steff, tce_sradius, tce_eqt, tce_prad, tce_period";

  switch (category) {
    case "most-planets": {
      const q = `SELECT ${baseFields} FROM q1_q17_dr25_tce WHERE kepid IN (SELECT kepid FROM q1_q17_dr25_tce GROUP BY kepid HAVING COUNT(*) >= 4) ORDER BY kepid`;
      return { query: q, maxrec: 500 };
    }
    case "habitable": {
      const q = `SELECT ${baseFields} FROM q1_q17_dr25_tce WHERE tce_eqt BETWEEN 180 AND 310 ORDER BY tce_eqt ASC`;
      return { query: q, maxrec: maxrec * 3 };
    }
    case "hot-jupiters": {
      const q = `SELECT ${baseFields} FROM q1_q17_dr25_tce WHERE tce_prad > 8 AND tce_eqt > 1000 ORDER BY tce_prad DESC`;
      return { query: q, maxrec: maxrec * 3 };
    }
    case "compact": {
      const q = `SELECT ${baseFields} FROM q1_q17_dr25_tce WHERE kepid IN (SELECT kepid FROM q1_q17_dr25_tce GROUP BY kepid HAVING COUNT(*) >= 3) AND tce_period < 30 ORDER BY tce_period ASC`;
      return { query: q, maxrec: 500 };
    }
    case "giant-stars": {
      const q = `SELECT ${baseFields} FROM q1_q17_dr25_tce WHERE tce_sradius > 1.5 ORDER BY tce_sradius DESC`;
      return { query: q, maxrec: maxrec * 3 };
    }
    default: {
      const q = `SELECT ${baseFields} FROM q1_q17_dr25_tce ORDER BY kepid`;
      return { query: q, maxrec: maxrec * 5 };
    }
  }
}

function groupBySystem(rows: BrowseRawRow[]): BrowseSystemResult[] {
  const systemMap: Record<number, BrowseRawRow[]> = {};
  for (const row of rows) {
    if (!systemMap[row.kepid]) {
      systemMap[row.kepid] = [];
    }
    systemMap[row.kepid].push(row);
  }

  const results: BrowseSystemResult[] = [];
  for (const kepidStr of Object.keys(systemMap)) {
    const kepid = Number(kepidStr);
    const sysRows = systemMap[kepid];
    results.push({
      kepid,
      planet_count: sysRows.length,
      star_temp: sysRows[0].tce_steff || 0,
      star_size: sysRows[0].tce_sradius || 0,
      warmest_planet_temp: Math.min(...sysRows.map((r: BrowseRawRow) => r.tce_eqt || 0)),
      largest_planet: Math.max(...sysRows.map((r: BrowseRawRow) => r.tce_prad || 0)),
    });
  }

  results.sort((a, b) => b.planet_count - a.planet_count);
  return results;
}

const browseCache = new Map<string, { systems: BrowseSystemResult[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function queryBrowseSystems(
  category: string,
  page: number,
  limit: number
): Promise<{ systems: BrowseSystemResult[]; hasMore: boolean }> {
  const cacheKey = category;
  const cached = browseCache.get(cacheKey);
  let allSystems: BrowseSystemResult[];

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    allSystems = cached.systems;
  } else {
    const tapUrl = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
    const { query, maxrec } = buildBrowseQuery(category, limit);

    const params = new URLSearchParams({
      REQUEST: "doQuery",
      LANG: "ADQL",
      QUERY: query,
      FORMAT: "json",
      MAXREC: String(maxrec),
    });

    const response = await fetch(`${tapUrl}?${params.toString()}`, {
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`NASA API returned ${response.status}`);
    }

    const data = (await response.json()) as BrowseRawRow[];
    allSystems = groupBySystem(data);
    browseCache.set(cacheKey, { systems: allSystems, timestamp: Date.now() });
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  const pageResults = allSystems.slice(start, end);

  return { systems: pageResults, hasMore: end < allSystems.length };
}

const statsCache: { data: StatsData | null; timestamp: number } = { data: null, timestamp: 0 };

interface StatsData {
  totalSystems: number;
  totalPlanets: number;
  hottestPlanet: { kepid: number; temp: number; size: number };
  largestPlanet: { kepid: number; size: number; temp: number };
  mostPlanetsSystem: { kepid: number; count: number };
  smallestPlanet: { kepid: number; size: number; temp: number };
  fastestOrbit: { kepid: number; period: number; size: number };
  hottestStar: { kepid: number; temp: number };
  largestStar: { kepid: number; size: number };
  sizeDistribution: { label: string; count: number }[];
  tempDistribution: { label: string; count: number }[];
}

async function getStats(): Promise<StatsData> {
  if (statsCache.data && Date.now() - statsCache.timestamp < CACHE_TTL * 6) {
    return statsCache.data;
  }

  const tapUrl = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
  const query = `SELECT kepid, tce_plnt_num, tce_prad, tce_eqt, tce_period, tce_steff, tce_sradius FROM q1_q17_dr25_tce ORDER BY kepid`;
  const params = new URLSearchParams({
    REQUEST: "doQuery", LANG: "ADQL", QUERY: query, FORMAT: "json", MAXREC: "10000",
  });

  const response = await fetch(`${tapUrl}?${params.toString()}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`NASA API returned ${response.status}`);
  const rows = (await response.json()) as BrowseRawRow[];

  const systemSet = new Set<number>();
  let hottestPlanet = { kepid: 0, temp: 0, size: 0 };
  let largestPlanet = { kepid: 0, size: 0, temp: 0 };
  let smallestPlanet = { kepid: 0, size: Infinity, temp: 0 };
  let fastestOrbit = { kepid: 0, period: Infinity, size: 0 };
  let hottestStar = { kepid: 0, temp: 0 };
  let largestStar = { kepid: 0, size: 0 };
  const systemCounts: Record<number, number> = {};
  const sizeBuckets = { "Sub-Earth (<0.5)": 0, "Earth-size (0.5-1.5)": 0, "Super-Earth (1.5-4)": 0, "Neptune-size (4-8)": 0, "Jupiter-size (8-15)": 0, "Super-Jupiter (>15)": 0 };
  const tempBuckets = { "Frozen (<200K)": 0, "Cool (200-300K)": 0, "Warm (300-500K)": 0, "Hot (500-1000K)": 0, "Scorching (>1000K)": 0 };

  for (const row of rows) {
    systemSet.add(row.kepid);
    systemCounts[row.kepid] = (systemCounts[row.kepid] || 0) + 1;

    if (row.tce_eqt > hottestPlanet.temp) hottestPlanet = { kepid: row.kepid, temp: row.tce_eqt, size: row.tce_prad };
    if (row.tce_prad > largestPlanet.size) largestPlanet = { kepid: row.kepid, size: row.tce_prad, temp: row.tce_eqt };
    if (row.tce_prad > 0 && row.tce_prad < smallestPlanet.size) smallestPlanet = { kepid: row.kepid, size: row.tce_prad, temp: row.tce_eqt };
    if (row.tce_period > 0 && row.tce_period < fastestOrbit.period) fastestOrbit = { kepid: row.kepid, period: row.tce_period, size: row.tce_prad };
    if (row.tce_steff > hottestStar.temp) hottestStar = { kepid: row.kepid, temp: row.tce_steff };
    if (row.tce_sradius > largestStar.size) largestStar = { kepid: row.kepid, size: row.tce_sradius };

    const r = row.tce_prad;
    if (r < 0.5) sizeBuckets["Sub-Earth (<0.5)"]++;
    else if (r < 1.5) sizeBuckets["Earth-size (0.5-1.5)"]++;
    else if (r < 4) sizeBuckets["Super-Earth (1.5-4)"]++;
    else if (r < 8) sizeBuckets["Neptune-size (4-8)"]++;
    else if (r < 15) sizeBuckets["Jupiter-size (8-15)"]++;
    else sizeBuckets["Super-Jupiter (>15)"]++;

    const t = row.tce_eqt;
    if (t < 200) tempBuckets["Frozen (<200K)"]++;
    else if (t < 300) tempBuckets["Cool (200-300K)"]++;
    else if (t < 500) tempBuckets["Warm (300-500K)"]++;
    else if (t < 1000) tempBuckets["Hot (500-1000K)"]++;
    else tempBuckets["Scorching (>1000K)"]++;
  }

  let mostPlanetsSystem = { kepid: 0, count: 0 };
  for (const [k, v] of Object.entries(systemCounts)) {
    if (v > mostPlanetsSystem.count) mostPlanetsSystem = { kepid: Number(k), count: v };
  }

  const data: StatsData = {
    totalSystems: systemSet.size,
    totalPlanets: rows.length,
    hottestPlanet,
    largestPlanet,
    mostPlanetsSystem,
    smallestPlanet: smallestPlanet.size === Infinity ? { kepid: 0, size: 0, temp: 0 } : smallestPlanet,
    fastestOrbit: fastestOrbit.period === Infinity ? { kepid: 0, period: 0, size: 0 } : fastestOrbit,
    hottestStar,
    largestStar,
    sizeDistribution: Object.entries(sizeBuckets).map(([label, count]) => ({ label, count })),
    tempDistribution: Object.entries(tempBuckets).map(([label, count]) => ({ label, count })),
  };

  statsCache.data = data;
  statsCache.timestamp = Date.now();
  return data;
}

async function getSystemOfDay(): Promise<{ kepid: number; dayIndex: number }> {
  if (cachedKepids.length === 0 || Date.now() - kepidCacheTime >= CACHE_TTL) {
    await getRandomKepid();
  }
  const today = new Date();
  const dayIndex = Math.floor((today.getFullYear() * 366 + (today.getMonth() + 1) * 31 + today.getDate()) % Math.max(cachedKepids.length, 1));
  return { kepid: cachedKepids[dayIndex] || 11442793, dayIndex };
}

let cachedKepids: number[] = [];
let kepidCacheTime = 0;

async function getRandomKepid(): Promise<number> {
  if (cachedKepids.length > 0 && Date.now() - kepidCacheTime < CACHE_TTL) {
    return cachedKepids[Math.floor(Math.random() * cachedKepids.length)];
  }

  const tapUrl = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
  const query = `SELECT kepid, COUNT(*) as cnt FROM q1_q17_dr25_tce GROUP BY kepid HAVING COUNT(*) >= 2 ORDER BY cnt DESC`;

  const params = new URLSearchParams({
    REQUEST: "doQuery",
    LANG: "ADQL",
    QUERY: query,
    FORMAT: "json",
    MAXREC: "500",
  });

  const response = await fetch(`${tapUrl}?${params.toString()}`, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`NASA API returned ${response.status}`);
  }

  const data = (await response.json()) as { kepid: number }[];
  if (!data || data.length === 0) {
    return 11442793;
  }

  cachedKepids = data.map((d) => d.kepid);
  kepidCacheTime = Date.now();
  return cachedKepids[Math.floor(Math.random() * cachedKepids.length)];
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/browse", async (req, res) => {
    const category = (req.query.category as string) || "all";
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    try {
      const { systems, hasMore } = await queryBrowseSystems(category, page, limit);
      res.json({
        systems: systems.map((s) => ({
          kepid: s.kepid,
          planet_count: s.planet_count,
          star_temp: s.star_temp ? `${s.star_temp.toLocaleString()} K` : "Unknown",
          star_size: s.star_size ? `${s.star_size.toFixed(2)} R\u2609` : "Unknown",
          warmest_planet_temp: s.warmest_planet_temp ? `${Math.round(s.warmest_planet_temp)} K` : "Unknown",
          largest_planet: s.largest_planet ? `${s.largest_planet.toFixed(1)} R\u2295` : "Unknown",
          star_temp_raw: s.star_temp,
          star_size_raw: s.star_size,
          warmest_planet_temp_raw: s.warmest_planet_temp,
          largest_planet_raw: s.largest_planet,
        })),
        page,
        hasMore,
      });
    } catch (error: unknown) {
      console.error("Browse error:", error);
      res.status(502).json({ error: "Failed to browse systems." });
    }
  });

  app.get("/api/random", async (_req, res) => {
    try {
      const kepid = await getRandomKepid();
      res.json({ kepid });
    } catch (error: unknown) {
      console.error("Random system error:", error);
      res.json({ kepid: 11442793 });
    }
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await getStats();
      res.json(stats);
    } catch (error: unknown) {
      console.error("Stats error:", error);
      res.status(502).json({ error: "Failed to fetch stats." });
    }
  });

  app.get("/api/system-of-day", async (_req, res) => {
    try {
      const { kepid } = await getSystemOfDay();
      const rows = await queryNasaApi(kepid);
      if (!rows || rows.length === 0) {
        return res.json({ kepid: 11442793, name: "Kepler-90", description: "An 8-planet system rivaling our Solar System", planetCount: 8 });
      }
      const systemData = processNasaData(rows, kepid);
      const sotdPrompt = `You are an AI astronomer. Write an engaging 3-4 sentence "System of the Day" highlight about this Kepler system. Make it exciting and educational. Include one fun comparison to our solar system. Plain text only, no markdown.`;
      let description = "";
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-5-nano",
          messages: [
            { role: "system", content: sotdPrompt },
            { role: "user", content: `System data:\n${JSON.stringify(systemData, null, 2)}` },
          ],
          max_completion_tokens: 1024,
        });
        description = completion.choices[0]?.message?.content || "A fascinating star system awaiting your exploration.";
      } catch {
        description = "A fascinating star system awaiting your exploration.";
      }
      res.json({
        kepid,
        name: `Kepler-${kepid}`,
        description,
        planetCount: rows.length,
        starTemp: rows[0].tce_steff,
        starSize: rows[0].tce_sradius,
      });
    } catch (error: unknown) {
      console.error("System of day error:", error);
      res.json({ kepid: 11442793, name: "Kepler-90", description: "An 8-planet system rivaling our Solar System", planetCount: 8, starTemp: 5930, starSize: 1.2 });
    }
  });

  app.get("/api/search/advanced", async (req, res) => {
    const minPlanets = parseInt(req.query.minPlanets as string) || 0;
    const maxTemp = parseInt(req.query.maxTemp as string) || 99999;
    const minTemp = parseInt(req.query.minTemp as string) || 0;
    const minSize = parseFloat(req.query.minSize as string) || 0;
    const maxSize = parseFloat(req.query.maxSize as string) || 99999;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    try {
      const conditions: string[] = [];
      if (minTemp > 0) conditions.push(`tce_eqt >= ${minTemp}`);
      if (maxTemp < 99999) conditions.push(`tce_eqt <= ${maxTemp}`);
      if (minSize > 0) conditions.push(`tce_prad >= ${minSize}`);
      if (maxSize < 99999) conditions.push(`tce_prad <= ${maxSize}`);

      const baseFields = "kepid, tce_plnt_num, tce_steff, tce_sradius, tce_eqt, tce_prad, tce_period";
      let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const query = `SELECT ${baseFields} FROM q1_q17_dr25_tce ${whereClause} ORDER BY kepid`;

      const cacheKey = `search_${JSON.stringify(req.query)}`;
      const cached = browseCache.get(cacheKey);
      let allSystems: BrowseSystemResult[];

      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        allSystems = cached.systems;
      } else {
        const tapUrl = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
        const params = new URLSearchParams({
          REQUEST: "doQuery", LANG: "ADQL", QUERY: query, FORMAT: "json", MAXREC: "2000",
        });
        const response = await fetch(`${tapUrl}?${params.toString()}`, { signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error(`NASA API returned ${response.status}`);
        const data = (await response.json()) as BrowseRawRow[];
        allSystems = groupBySystem(data);
        if (minPlanets > 0) {
          allSystems = allSystems.filter((s) => s.planet_count >= minPlanets);
        }
        browseCache.set(cacheKey, { systems: allSystems, timestamp: Date.now() });
      }

      const start = (page - 1) * limit;
      const end = start + limit;
      res.json({
        systems: allSystems.slice(start, end).map((s) => ({
          kepid: s.kepid,
          planet_count: s.planet_count,
          star_temp: s.star_temp ? `${s.star_temp.toLocaleString()} K` : "Unknown",
          star_size: s.star_size ? `${s.star_size.toFixed(2)} R\u2609` : "Unknown",
          warmest_planet_temp: s.warmest_planet_temp ? `${Math.round(s.warmest_planet_temp)} K` : "Unknown",
          largest_planet: s.largest_planet ? `${s.largest_planet.toFixed(1)} R\u2295` : "Unknown",
          star_temp_raw: s.star_temp,
          star_size_raw: s.star_size,
          warmest_planet_temp_raw: s.warmest_planet_temp,
          largest_planet_raw: s.largest_planet,
        })),
        total: allSystems.length,
        page,
        hasMore: end < allSystems.length,
      });
    } catch (error: unknown) {
      console.error("Advanced search error:", error);
      res.status(502).json({ error: "Failed to search systems." });
    }
  });

  app.get("/api/compare", async (req, res) => {
    const kepidsParam = req.query.kepids as string;
    if (!kepidsParam) {
      return res.status(400).json({ error: "Provide kepids parameter (comma-separated)" });
    }
    const kepids = kepidsParam.split(",").map(Number).filter((n) => !isNaN(n) && n > 0).slice(0, 3);
    if (kepids.length < 2) {
      return res.status(400).json({ error: "Provide at least 2 valid Kepler IDs" });
    }

    try {
      const results = await Promise.all(
        kepids.map(async (kepid) => {
          const rows = await queryNasaApi(kepid);
          if (!rows || rows.length === 0) return null;
          return {
            kepid,
            name: `Kepler-${kepid}`,
            planetCount: rows.length,
            starTemp: rows[0].tce_steff || 0,
            starSize: rows[0].tce_sradius || 0,
            starMass: rows[0].tce_smass || null,
            planets: rows.map((r) => ({
              number: r.tce_plnt_num,
              size: r.tce_prad,
              temp: r.tce_eqt,
              period: r.tce_period,
              sunlight: r.tce_insol,
            })),
          };
        })
      );

      const validResults = results.filter(Boolean);
      if (validResults.length < 2) {
        return res.status(404).json({ error: "Could not find data for at least 2 of the provided systems" });
      }

      res.json({ systems: validResults });
    } catch (error: unknown) {
      console.error("Compare error:", error);
      res.status(502).json({ error: "Failed to compare systems." });
    }
  });

  function parseQueryLocally(query: string): Record<string, unknown> {
    const q = query.toLowerCase();
    const params: Record<string, unknown> = {};

    if (q.includes("cold") || q.includes("frozen") || q.includes("icy")) {
      params.maxTemp = 200;
      params.sortBy = "coldest";
      params.summary = "Systems with the coldest planets";
    } else if (q.includes("hot") || q.includes("scorch") || q.includes("burn")) {
      params.minTemp = 500;
      params.sortBy = "hottest";
      params.summary = "Systems with the hottest planets";
    } else if (q.includes("habitable") || q.includes("earth-like") || q.includes("goldilocks") || q.includes("mild")) {
      params.minTemp = 200;
      params.maxTemp = 310;
      params.minSize = 0.5;
      params.maxSize = 2.0;
      params.summary = "Potentially habitable Earth-like worlds";
    } else if (q.includes("giant") || q.includes("jupiter") || q.includes("large") || q.includes("big")) {
      params.minSize = 8;
      params.sortBy = "largest_planets";
      params.summary = "Systems with giant Jupiter-sized planets";
    } else if (q.includes("small") || q.includes("tiny") || q.includes("sub-earth")) {
      params.maxSize = 1.0;
      params.sortBy = "smallest_planets";
      params.summary = "Systems with small sub-Earth planets";
    } else if (q.includes("many planet") || q.includes("most planet") || q.includes("lots of planet") || q.includes("crowded")) {
      params.minPlanets = 5;
      params.sortBy = "most_planets";
      params.summary = "Systems with many planets";
    } else if (q.includes("biggest star") || q.includes("largest star") || q.includes("giant star")) {
      params.sortBy = "largest_star";
      params.summary = "Systems with the largest stars";
    } else if (q.includes("hottest star") || q.includes("brightest")) {
      params.sortBy = "hottest_star";
      params.summary = "Systems with the hottest stars";
    } else if (q.includes("neptune")) {
      params.minSize = 4;
      params.maxSize = 8;
      params.summary = "Systems with Neptune-sized planets";
    } else if (q.includes("super-earth") || q.includes("super earth")) {
      params.minSize = 1.5;
      params.maxSize = 4;
      params.summary = "Systems with super-Earth planets";
    } else {
      params.sortBy = "most_planets";
      params.summary = "Exploring star systems";
    }

    return params;
  }

  app.post("/api/search/natural", async (req, res) => {
    const { query: userQuery } = req.body;
    if (!userQuery || typeof userQuery !== "string" || userQuery.trim().length === 0) {
      return res.status(400).json({ error: "Please provide a search query" });
    }

    try {
      const extractPrompt = `Extract search parameters as JSON from user queries about exoplanets. Fields: minPlanets(int), minTemp(int K), maxTemp(int K), minSize(float Earth radii), maxSize(float), sortBy("most_planets"|"hottest"|"coldest"|"largest_planets"|"smallest_planets"|"largest_star"|"hottest_star"), summary(string 6-12 words). Temps: icy<200K, habitable 200-310K, hot>500K, scorching>1000K. Sizes: Earth-like 0.5-1.5, super-Earth 1.5-4, Neptune 4-8, Jupiter 8-15. Only include relevant fields. Always include sortBy if inferrable and a summary. Respond with ONLY valid JSON.`;

      const aiMessages: { role: "system" | "user"; content: string }[] = [
        { role: "system", content: extractPrompt },
        { role: "user", content: `User query: "${userQuery}"\n\nRespond with ONLY a JSON object, no other text.` },
      ];

      let params: Record<string, unknown> = {};
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-5-nano",
            messages: aiMessages,
            max_completion_tokens: 2048,
          });
          const rawResponse = (completion.choices[0]?.message?.content || "").trim();
          console.log(`Natural search AI attempt ${attempt + 1}:`, rawResponse);
          if (rawResponse) {
            const cleaned = rawResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
            const parsed = JSON.parse(cleaned);
            if (Object.keys(parsed).length > 0) {
              params = parsed;
              break;
            }
          }
        } catch (parseErr) {
          console.error(`AI attempt ${attempt + 1} failed:`, parseErr);
        }
      }

      if (Object.keys(params).length === 0) {
        params = parseQueryLocally(userQuery);
        console.log("Fell back to local parsing:", JSON.stringify(params));
      }

      const summary = (params.summary as string) || "Matching star systems";
      const sortBy = (params.sortBy as string) || "";

      const conditions: string[] = [];
      if (params.minTemp) conditions.push(`tce_eqt >= ${Number(params.minTemp)}`);
      if (params.maxTemp) conditions.push(`tce_eqt <= ${Number(params.maxTemp)}`);
      if (params.minSize) conditions.push(`tce_prad >= ${Number(params.minSize)}`);
      if (params.maxSize) conditions.push(`tce_prad <= ${Number(params.maxSize)}`);
      if (params.minStarTemp) conditions.push(`tce_steff >= ${Number(params.minStarTemp)}`);
      if (params.maxStarTemp) conditions.push(`tce_steff <= ${Number(params.maxStarTemp)}`);
      if (params.minStarSize) conditions.push(`tce_sradius >= ${Number(params.minStarSize)}`);
      if (params.maxStarSize) conditions.push(`tce_sradius <= ${Number(params.maxStarSize)}`);

      const baseFields = "kepid, tce_plnt_num, tce_steff, tce_sradius, tce_eqt, tce_prad, tce_period";
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const query = `SELECT ${baseFields} FROM q1_q17_dr25_tce ${whereClause} ORDER BY kepid`;

      const tapUrl = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
      const tapParams = new URLSearchParams({
        REQUEST: "doQuery", LANG: "ADQL", QUERY: query, FORMAT: "json", MAXREC: "2000",
      });
      const response = await fetch(`${tapUrl}?${tapParams.toString()}`, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`NASA API returned ${response.status}`);
      const data = (await response.json()) as BrowseRawRow[];
      let allSystems = groupBySystem(data);

      const minPlanets = Number(params.minPlanets) || 0;
      if (minPlanets > 0) {
        allSystems = allSystems.filter((s) => s.planet_count >= minPlanets);
      }

      if (sortBy === "coldest") allSystems.sort((a, b) => a.warmest_planet_temp - b.warmest_planet_temp);
      else if (sortBy === "hottest") allSystems.sort((a, b) => b.warmest_planet_temp - a.warmest_planet_temp);
      else if (sortBy === "largest_planets") allSystems.sort((a, b) => b.largest_planet - a.largest_planet);
      else if (sortBy === "smallest_planets") allSystems.sort((a, b) => a.largest_planet - b.largest_planet);
      else if (sortBy === "most_planets") allSystems.sort((a, b) => b.planet_count - a.planet_count);
      else if (sortBy === "largest_star") allSystems.sort((a, b) => b.star_size - a.star_size);
      else if (sortBy === "hottest_star") allSystems.sort((a, b) => b.star_temp - a.star_temp);

      const pageResults = allSystems.slice(0, 20);

      res.json({
        summary,
        params: {
          minPlanets: minPlanets || undefined,
          minTemp: params.minTemp,
          maxTemp: params.maxTemp,
          minSize: params.minSize,
          maxSize: params.maxSize,
          sortBy: sortBy || undefined,
        },
        systems: pageResults.map((s) => ({
          kepid: s.kepid,
          planet_count: s.planet_count,
          star_temp: s.star_temp ? `${s.star_temp.toLocaleString()} K` : "Unknown",
          star_size: s.star_size ? `${s.star_size.toFixed(2)} R\u2609` : "Unknown",
          warmest_planet_temp: s.warmest_planet_temp ? `${Math.round(s.warmest_planet_temp)} K` : "Unknown",
          largest_planet: s.largest_planet ? `${s.largest_planet.toFixed(1)} R\u2295` : "Unknown",
          star_temp_raw: s.star_temp,
          star_size_raw: s.star_size,
          warmest_planet_temp_raw: s.warmest_planet_temp,
          largest_planet_raw: s.largest_planet,
        })),
        total: allSystems.length,
        hasMore: allSystems.length > 20,
      });
    } catch (error: unknown) {
      console.error("Natural search error:", error);
      res.status(502).json({ error: "Failed to search. Please try again." });
    }
  });

  app.get("/api/kepler/:kepid", async (req, res) => {
    const kepid = parseInt(req.params.kepid, 10);

    if (isNaN(kepid) || kepid < 1) {
      return res.status(400).json({ error: "Invalid Kepler ID. Must be a positive integer." });
    }

    try {
      const rows = await queryNasaApi(kepid);

      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: `No data found for KepID ${kepid}` });
      }

      const systemData = processNasaData(rows, kepid);
      systemData.smart_summary = await generateSummary(systemData);

      res.json(systemData);
    } catch (error: unknown) {
      console.error("Error fetching Kepler data:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("NASA API")) {
        return res.status(502).json({ error: "Failed to retrieve data from NASA's servers. Please try again." });
      }
      res.status(500).json({ error: "An unexpected error occurred." });
    }
  });

  return httpServer;
}
