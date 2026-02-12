import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, Star, Thermometer, Ruler, Weight, Clock, Sun, Orbit, Zap,
  CircleDot, AlertTriangle, Sparkles, Info, Globe, Heart, Share2,
  ArrowLeftRight, Check, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import type { KeplerSystemData, PlanetData } from "@/lib/types";
import { useFavorites, useCompareList } from "@/lib/favorites";
import { useToast } from "@/hooks/use-toast";

const PLANET_COLORS = [
  "from-blue-500 to-cyan-400",
  "from-amber-500 to-orange-400",
  "from-emerald-500 to-teal-400",
  "from-purple-500 to-pink-400",
  "from-rose-500 to-red-400",
  "from-indigo-500 to-blue-400",
  "from-yellow-500 to-amber-400",
  "from-green-500 to-emerald-400",
];

const PLANET_FILL_COLORS = [
  "#3b82f6", "#f59e0b", "#10b981", "#a855f7",
  "#f43f5e", "#6366f1", "#eab308", "#22c55e",
];

const PLANET_BG_COLORS = [
  "bg-blue-500/10 text-blue-400",
  "bg-amber-500/10 text-amber-400",
  "bg-emerald-500/10 text-emerald-400",
  "bg-purple-500/10 text-purple-400",
  "bg-rose-500/10 text-rose-400",
  "bg-indigo-500/10 text-indigo-400",
  "bg-yellow-500/10 text-yellow-400",
  "bg-green-500/10 text-green-400",
];

const REFERENCE_PLANETS = [
  { name: "Earth", size: 1, color: "#3b82f6" },
  { name: "Neptune", size: 3.88, color: "#6366f1" },
  { name: "Jupiter", size: 11.2, color: "#f59e0b" },
];

function StatItem({ icon: Icon, label, value, tooltip }: { icon: typeof Star; label: string; value: string; tooltip?: string }) {
  const content = (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground break-words" data-testid={`text-stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
          {value}
        </p>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">{content}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

function OrbitVisualization({ planets }: { planets: PlanetData[] }) {
  const containerSize = 300;
  const center = containerSize / 2;
  const starRadius = 18;
  const maxOrbitRadius = (containerSize / 2) - 20;
  const minOrbitRadius = 40;

  const sortedPlanets = [...planets].sort((a, b) => {
    const periodA = parseFloat(a.orbit.match(/[\d.]+/)?.[0] || "0");
    const periodB = parseFloat(b.orbit.match(/[\d.]+/)?.[0] || "0");
    return periodA - periodB;
  });

  return (
    <Card data-testid="card-orbit-visualization">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Orbit className="w-4 h-4 text-chart-2" />
          Orbital View
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <svg
            width={containerSize}
            height={containerSize}
            viewBox={`0 0 ${containerSize} ${containerSize}`}
            className="max-w-full"
          >
            {sortedPlanets.map((_, i) => {
              const orbitRadius = minOrbitRadius + (i / Math.max(sortedPlanets.length - 1, 1)) * (maxOrbitRadius - minOrbitRadius);
              return (
                <circle
                  key={`orbit-${i}`}
                  cx={center}
                  cy={center}
                  r={orbitRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              );
            })}
            <circle cx={center} cy={center} r={starRadius} fill="hsl(var(--chart-4))" />
            <circle cx={center} cy={center} r={starRadius - 4} fill="hsl(var(--chart-4))" fillOpacity={0.6} />
            {sortedPlanets.map((planet, i) => {
              const orbitRadius = minOrbitRadius + (i / Math.max(sortedPlanets.length - 1, 1)) * (maxOrbitRadius - minOrbitRadius);
              const sizeMatch = planet.size.match(/([\d.]+)/);
              const planetSize = sizeMatch ? Math.min(Math.max(parseFloat(sizeMatch[1]) * 1.2, 3), 12) : 5;
              const angle = (i * 137.5 * Math.PI) / 180;
              const px = center + orbitRadius * Math.cos(angle);
              const py = center + orbitRadius * Math.sin(angle);

              return (
                <g key={`planet-${i}`}>
                  <motion.circle
                    cx={px}
                    cy={py}
                    r={planetSize}
                    fill={PLANET_FILL_COLORS[i % PLANET_FILL_COLORS.length]}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 * i, duration: 0.4 }}
                  />
                  <text
                    x={px}
                    y={py + planetSize + 10}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[8px]"
                  >
                    P{planet.planet_number}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Sizes and distances not to scale
        </p>
      </CardContent>
    </Card>
  );
}

function PlanetSizeComparison({ planets }: { planets: PlanetData[] }) {
  const planetSizes = planets.map((p) => {
    const match = p.size.match(/([\d.]+)/);
    return { number: p.planet_number, size: match ? parseFloat(match[1]) : 1 };
  });

  const allItems = [
    ...REFERENCE_PLANETS.map((r) => ({ name: r.name, size: r.size, color: r.color, isRef: true })),
    ...planetSizes.map((p, i) => ({
      name: `Planet ${p.number}`,
      size: p.size,
      color: PLANET_FILL_COLORS[i % PLANET_FILL_COLORS.length],
      isRef: false,
    })),
  ].sort((a, b) => a.size - b.size);

  const maxSize = Math.max(...allItems.map((i) => i.size), 1);
  const maxVisualRadius = 40;

  return (
    <Card data-testid="card-size-comparison">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Ruler className="w-4 h-4 text-chart-3" />
          Size Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-center gap-3 flex-wrap py-4">
          {allItems.map((item) => {
            const visualRadius = Math.max((item.size / maxSize) * maxVisualRadius, 6);
            return (
              <div key={item.name} className="flex flex-col items-center gap-1.5">
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: visualRadius * 2,
                    height: visualRadius * 2,
                    backgroundColor: item.color,
                    opacity: item.isRef ? 0.4 : 0.8,
                    border: item.isRef ? "1px dashed currentColor" : "none",
                  }}
                />
                <div className="text-center">
                  <p className={`text-[10px] font-medium ${item.isRef ? "text-muted-foreground" : "text-foreground"}`}>
                    {item.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {item.size.toFixed(1)}x
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Sizes relative to Earth. Dashed circles are solar system reference planets.
        </p>
      </CardContent>
    </Card>
  );
}

function PlanetCard({ planet, index }: { planet: PlanetData; index: number }) {
  const colorClass = PLANET_COLORS[index % PLANET_COLORS.length];
  const bgColorClass = PLANET_BG_COLORS[index % PLANET_BG_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 * index, duration: 0.5 }}
    >
      <Card className="overflow-visible" data-testid={`card-planet-${planet.planet_number}`}>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg shrink-0`}>
              <span className="text-white font-bold text-sm">{planet.planet_number}</span>
            </div>
            <div>
              <CardTitle className="text-base">Planet {planet.planet_number}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{planet.orbit}</p>
            </div>
          </div>
          {planet.interesting_features.length > 0 && (
            <Badge variant="outline" className={`text-xs ${bgColorClass} border-0`}>
              <Sparkles className="w-3 h-3 mr-1" />
              Notable
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Size
              </p>
              <p className="text-sm font-medium" data-testid={`text-planet-size-${planet.planet_number}`}>{planet.size}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Thermometer className="w-3 h-3" /> Temperature
              </p>
              <p className="text-sm font-medium" data-testid={`text-planet-temp-${planet.planet_number}`}>{planet.temperature}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sun className="w-3 h-3" /> Sunlight
              </p>
              <p className="text-sm font-medium" data-testid={`text-planet-sunlight-${planet.planet_number}`}>{planet.sunlight_received}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Transit Duration
              </p>
              <p className="text-sm font-medium" data-testid={`text-planet-transit-${planet.planet_number}`}>{planet.transit_duration}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CircleDot className="w-3 h-3" /> Transit Depth
              </p>
              <p className="text-sm font-medium" data-testid={`text-planet-depth-${planet.planet_number}`}>{planet.transit_depth}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" /> Detection SNR
              </p>
              <p className="text-sm font-medium" data-testid={`text-planet-snr-${planet.planet_number}`}>{planet.detection_snr.toFixed(1)}</p>
            </div>
          </div>

          {planet.interesting_features.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Interesting Features
              </p>
              <div className="space-y-1.5">
                {planet.interesting_features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2" data-testid={`text-feature-${planet.planet_number}-${i}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-gradient-to-br ${colorClass}`} />
                    <p className="text-sm text-foreground">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-64" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-52" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, kepid }: { error: Error; kepid: string }) {
  const [, navigate] = useLocation();
  const is404 = error.message.includes("404");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="mb-8"
        data-testid="button-back-error"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">
          {is404 ? "System Not Found" : "Something Went Wrong"}
        </h2>
        <p className="text-muted-foreground max-w-md mb-6">
          {is404
            ? `No data was found for Kepler ID ${kepid}. Try a different ID or explore one of our featured systems.`
            : `We had trouble fetching data for Kepler ID ${kepid}. The NASA servers may be temporarily unavailable.`}
        </p>
        <Button onClick={() => navigate("/")} data-testid="button-go-home">
          Explore Featured Systems
        </Button>
      </div>
    </div>
  );
}

export default function StarSystem() {
  const params = useParams<{ kepid: string }>();
  const kepid = params.kepid || "";
  const [, navigate] = useLocation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCompare, removeFromCompare, isInCompare, compareList } = useCompareList();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const kepidNum = parseInt(kepid);
  const isFav = isFavorite(kepidNum);
  const inCompare = isInCompare(kepidNum);

  const { data, isLoading, error } = useQuery<KeplerSystemData>({
    queryKey: ["/api/kepler", kepid],
    enabled: !!kepid,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this system with anyone." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: url, variant: "destructive" });
    }
  };

  const handleToggleCompare = () => {
    if (inCompare) {
      removeFromCompare(kepidNum);
    } else if (compareList.length < 3) {
      addToCompare(kepidNum);
      toast({ title: "Added to compare", description: `${compareList.length + 1}/3 systems selected` });
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error as Error} kepid={kepid} />;
  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between gap-3 mb-8 flex-wrap"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-system-title">
              {data.star_system}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">KepID {kepid}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => toggleFavorite(kepidNum, data.star_system)}
            className={`toggle-elevate ${isFav ? "toggle-elevated" : ""}`}
            data-testid="button-favorite"
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-current text-red-500" : ""}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleToggleCompare}
            className={`toggle-elevate ${inCompare ? "toggle-elevated" : ""}`}
            disabled={!inCompare && compareList.length >= 3}
            data-testid="button-compare"
          >
            <ArrowLeftRight className={`w-4 h-4 ${inCompare ? "text-primary" : ""}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleShare}
            data-testid="button-share"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-4 h-4 text-chart-4" />
                Star Properties
              </CardTitle>
              <Badge variant="secondary" data-testid="text-planet-count">
                {data.number_of_planets} planet{data.number_of_planets !== 1 ? "s" : ""} detected
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <StatItem
                icon={Thermometer}
                label="Temperature"
                value={data.star_temperature}
                tooltip="The effective surface temperature of the host star"
              />
              <StatItem
                icon={Ruler}
                label="Size"
                value={data.star_size}
                tooltip="The radius of the star relative to our Sun"
              />
              {data.star_mass && (
                <StatItem
                  icon={Weight}
                  label="Mass"
                  value={data.star_mass}
                  tooltip="The mass of the star relative to our Sun"
                />
              )}
              {data.star_age && (
                <StatItem
                  icon={Clock}
                  label="Age"
                  value={data.star_age}
                  tooltip="Estimated age of the star"
                />
              )}
              <StatItem
                icon={Orbit}
                label="Coordinates"
                value={data.ra_dec}
                tooltip="Right Ascension and Declination of the star"
              />
              <StatItem
                icon={Info}
                label="Catalog"
                value={data.last_update}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {data.smart_summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-primary mb-1.5">AI Summary</p>
                  <p className="text-sm text-foreground leading-relaxed" data-testid="text-ai-summary">
                    {data.smart_summary}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {data.system_note && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="mb-6 border-chart-4/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-chart-4/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-chart-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-chart-4 mb-1">System Note</p>
                  <p className="text-sm text-foreground" data-testid="text-system-note">{data.system_note}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        <OrbitVisualization planets={data.potential_planets} />
        <PlanetSizeComparison planets={data.potential_planets} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mb-4"
      >
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-chart-2" />
          Potential Planets
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {data.number_of_planets} candidate{data.number_of_planets !== 1 ? "s" : ""} detected via transit method
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-16">
        {data.potential_planets.map((planet, i) => (
          <PlanetCard key={planet.planet_number} planet={planet} index={i} />
        ))}
      </div>
    </div>
  );
}
