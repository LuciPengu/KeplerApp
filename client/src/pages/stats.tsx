import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  BarChart3,
  Flame,
  Ruler,
  Orbit,
  Zap,
  Star,
  Telescope,
  Globe,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import type { StatsData } from "@/lib/types";

function DistributionBar({ items, colorStart }: { items: { label: string; count: number }[]; colorStart: number }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate">{item.label}</span>
            <span className="text-xs font-mono text-foreground shrink-0">{item.count.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / max) * 100}%` }}
              transition={{ delay: 0.1 * i, duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: `hsl(var(--chart-${((i + colorStart) % 5) + 1}))` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordCard({
  icon: Icon,
  title,
  value,
  subtitle,
  kepid,
  colorIndex,
  onNavigate,
}: {
  icon: typeof Star;
  title: string;
  value: string;
  subtitle: string;
  kepid: number;
  colorIndex: number;
  onNavigate: (kepid: number) => void;
}) {
  return (
    <Card
      className="hover-elevate active-elevate-2 cursor-pointer group"
      onClick={() => onNavigate(kepid)}
      data-testid={`card-record-${title.toLowerCase().replace(/\s/g, "-")}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: `hsl(var(--chart-${colorIndex}) / 0.15)` }}
            >
              <Icon className="w-4 h-4" style={{ color: `hsl(var(--chart-${colorIndex}))` }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className="text-sm font-semibold text-foreground">{value}</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function Stats() {
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <Telescope className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">Could not load statistics. NASA servers may be temporarily unavailable.</p>
        <Button onClick={() => navigate("/")} data-testid="button-stats-home">Go Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 relative z-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Kepler Mission Stats
        </h1>
        <p className="text-sm text-muted-foreground">
          Aggregate statistics from the Q1-Q17 DR25 TCE catalog
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground" data-testid="text-total-systems">{data.totalSystems.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Star Systems</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Orbit className="w-5 h-5 text-chart-2 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground" data-testid="text-total-planets">{data.totalPlanets.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Planet Candidates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-5 h-5 text-chart-4 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground" data-testid="text-most-planets">{data.mostPlanetsSystem.count}</p>
            <p className="text-xs text-muted-foreground">Max Planets in One System</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Ruler className="w-5 h-5 text-chart-3 mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground" data-testid="text-largest-planet">{data.largestPlanet.size.toFixed(1)}x</p>
            <p className="text-xs text-muted-foreground">Largest Planet (Earth radii)</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-chart-4" />
          Record Holders
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <RecordCard
            icon={Flame}
            title="Hottest Planet"
            value={`${Math.round(data.hottestPlanet.temp).toLocaleString()} K`}
            subtitle={`KepID ${data.hottestPlanet.kepid} - ${data.hottestPlanet.size.toFixed(1)}x Earth`}
            kepid={data.hottestPlanet.kepid}
            colorIndex={1}
            onNavigate={(k) => navigate(`/system/${k}`)}
          />
          <RecordCard
            icon={Ruler}
            title="Largest Planet"
            value={`${data.largestPlanet.size.toFixed(1)}x Earth`}
            subtitle={`KepID ${data.largestPlanet.kepid} - ${Math.round(data.largestPlanet.temp)} K`}
            kepid={data.largestPlanet.kepid}
            colorIndex={2}
            onNavigate={(k) => navigate(`/system/${k}`)}
          />
          <RecordCard
            icon={Orbit}
            title="Most Planets"
            value={`${data.mostPlanetsSystem.count} planets`}
            subtitle={`KepID ${data.mostPlanetsSystem.kepid}`}
            kepid={data.mostPlanetsSystem.kepid}
            colorIndex={3}
            onNavigate={(k) => navigate(`/system/${k}`)}
          />
          <RecordCard
            icon={Globe}
            title="Smallest Planet"
            value={`${data.smallestPlanet.size.toFixed(2)}x Earth`}
            subtitle={`KepID ${data.smallestPlanet.kepid} - ${Math.round(data.smallestPlanet.temp)} K`}
            kepid={data.smallestPlanet.kepid}
            colorIndex={4}
            onNavigate={(k) => navigate(`/system/${k}`)}
          />
          <RecordCard
            icon={Zap}
            title="Fastest Orbit"
            value={`${data.fastestOrbit.period.toFixed(3)} days`}
            subtitle={`KepID ${data.fastestOrbit.kepid} - ${data.fastestOrbit.size.toFixed(1)}x Earth`}
            kepid={data.fastestOrbit.kepid}
            colorIndex={5}
            onNavigate={(k) => navigate(`/system/${k}`)}
          />
          <RecordCard
            icon={Star}
            title="Largest Star"
            value={`${data.largestStar.size.toFixed(1)}x Sun`}
            subtitle={`KepID ${data.largestStar.kepid}`}
            kepid={data.largestStar.kepid}
            colorIndex={1}
            onNavigate={(k) => navigate(`/system/${k}`)}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-16"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ruler className="w-4 h-4 text-chart-2" />
              Planet Size Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionBar items={data.sizeDistribution} colorStart={0} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-4 h-4 text-chart-4" />
              Planet Temperature Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionBar items={data.tempDistribution} colorStart={2} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
