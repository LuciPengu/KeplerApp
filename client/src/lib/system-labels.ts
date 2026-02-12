export function getSystemLabel(system: {
  planet_count: number;
  star_temp_raw?: number;
  star_size_raw?: number;
  warmest_planet_temp_raw?: number;
  largest_planet_raw?: number;
  star_temp?: string;
  star_size?: string;
}): string {
  const pc = system.planet_count || 0;
  const starTemp = system.star_temp_raw ?? parseTemp(system.star_temp);
  const starSize = system.star_size_raw ?? parseSize(system.star_size);
  const planetTemp = system.warmest_planet_temp_raw ?? 0;
  const planetSize = system.largest_planet_raw ?? 0;

  if (pc >= 6) return "Rich planetary system";
  if (pc >= 4) return "Multi-planet system";
  if (planetTemp > 1500) return "Scorching hot worlds";
  if (planetTemp > 0 && planetTemp < 200) return "Frozen distant worlds";
  if (planetTemp >= 200 && planetTemp <= 310) return "Habitable zone candidate";
  if (planetSize > 15) return "Super-Jupiter system";
  if (planetSize > 8) return "Giant planet system";
  if (planetSize > 0 && planetSize < 0.5) return "Tiny sub-Earth worlds";
  if (planetSize >= 0.5 && planetSize <= 1.5) return "Earth-sized planets";
  if (starSize > 3) return "Very large star";
  if (starSize > 1.5) return "Expanded star";
  if (starTemp > 8000) return "Hot blue-white star";
  if (starTemp > 6500) return "Bright warm star";
  if (starTemp > 0 && starTemp < 4000) return "Cool red star";
  if (pc >= 2) return "Multi-planet system";
  return "Distant star system";
}

function parseTemp(val?: string): number {
  if (!val) return 0;
  const match = val.replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function parseSize(val?: string): number {
  if (!val) return 0;
  const match = val.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}
