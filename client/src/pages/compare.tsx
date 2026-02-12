import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ArrowLeftRight,
  Plus,
  X,
  Thermometer,
  Ruler,
  Orbit,
  Globe,
  Loader2,
  Telescope,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import type { CompareResponse } from "@/lib/types";
import { useCompareList } from "@/lib/favorites";

const COMPARE_COLORS = [
  { bg: "bg-chart-1/10", text: "text-chart-1", bar: "bg-chart-1" },
  { bg: "bg-chart-2/10", text: "text-chart-2", bar: "bg-chart-2" },
  { bg: "bg-chart-3/10", text: "text-chart-3", bar: "bg-chart-3" },
];

function ComparisonBar({ values, labels, unit, maxOverride }: { values: number[]; labels: string[]; unit: string; maxOverride?: number }) {
  const max = maxOverride || Math.max(...values, 1);
  return (
    <div className="space-y-1.5">
      {values.map((val, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-24 truncate">{labels[i]}</span>
          <div className="flex-1 h-3 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(val / max) * 100}%` }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className={`h-full rounded-full ${COMPARE_COLORS[i % 3].bar}`}
            />
          </div>
          <span className="text-xs font-mono text-foreground w-20 text-right shrink-0">
            {val > 0 ? `${val.toFixed(1)} ${unit}` : "N/A"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Compare() {
  const [, navigate] = useLocation();
  const { compareList, removeFromCompare, clearCompare, addToCompare } = useCompareList();
  const [addInput, setAddInput] = useState("");

  const kepidsParam = compareList.join(",");
  const { data, isLoading, error } = useQuery<CompareResponse>({
    queryKey: ["/api/compare", kepidsParam],
    queryFn: async () => {
      const res = await fetch(`/api/compare?kepids=${kepidsParam}`);
      if (!res.ok) throw new Error("Failed to compare");
      return res.json();
    },
    enabled: compareList.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const handleAdd = () => {
    const val = parseInt(addInput.trim());
    if (!isNaN(val) && val > 0 && compareList.length < 3) {
      addToCompare(val);
      setAddInput("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 relative z-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-primary" />
          Compare Systems
        </h1>
        <p className="text-sm text-muted-foreground">
          Compare up to 3 star systems side by side
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <AnimatePresence>
                  {compareList.map((kepid, i) => (
                    <motion.div
                      key={kepid}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge variant="secondary" className="gap-1" data-testid={`badge-compare-${kepid}`}>
                        <div className={`w-2 h-2 rounded-full ${COMPARE_COLORS[i % 3].bar}`} />
                        KepID {kepid}
                        <button
                          onClick={() => removeFromCompare(kepid)}
                          className="ml-1"
                          data-testid={`button-remove-compare-${kepid}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {compareList.length < 3 && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={addInput}
                      onChange={(e) => setAddInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                      placeholder="Add Kepler ID..."
                      className="bg-transparent border border-border/50 rounded-md px-2 py-1 text-sm font-mono text-foreground placeholder:text-muted-foreground w-36 outline-none focus:border-primary/50"
                      data-testid="input-compare-add"
                    />
                    <Button size="icon" variant="ghost" onClick={handleAdd} disabled={!addInput.trim()} data-testid="button-add-compare">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              {compareList.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCompare} data-testid="button-clear-compare">
                  Clear All
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {compareList.length < 2 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ArrowLeftRight className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Add Systems to Compare</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Enter at least 2 Kepler IDs above, or add systems from the Discover page or system detail pages using the compare button.
            </p>
            <Button variant="outline" onClick={() => navigate("/discover")} data-testid="button-compare-browse">
              <Telescope className="w-4 h-4 mr-2" />
              Browse Systems
            </Button>
          </CardContent>
        </Card>
      )}

      {compareList.length >= 2 && isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {compareList.length >= 2 && error && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Failed to load comparison data. Some systems may not exist.</p>
          </CardContent>
        </Card>
      )}

      {data && data.systems.length >= 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 pb-16"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {data.systems.map((system, i) => (
              <Card
                key={system.kepid}
                className="hover-elevate cursor-pointer"
                onClick={() => navigate(`/system/${system.kepid}`)}
                data-testid={`card-compare-system-${system.kepid}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${COMPARE_COLORS[i % 3].bar}`} />
                    <h3 className="font-semibold text-foreground text-sm">{system.name}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-foreground">{system.planetCount}</p>
                      <p className="text-xs text-muted-foreground">Planets</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{Math.round(system.starTemp).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">K (Star)</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{system.starSize.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">R (Star)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-chart-4" />
                Star Temperature (Kelvin)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonBar
                values={data.systems.map((s) => s.starTemp)}
                labels={data.systems.map((s) => s.name)}
                unit="K"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="w-4 h-4 text-chart-3" />
                Star Size (Solar radii)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonBar
                values={data.systems.map((s) => s.starSize)}
                labels={data.systems.map((s) => s.name)}
                unit="R"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Number of Planets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonBar
                values={data.systems.map((s) => s.planetCount)}
                labels={data.systems.map((s) => s.name)}
                unit=""
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Orbit className="w-4 h-4 text-chart-2" />
                Largest Planet (Earth radii)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonBar
                values={data.systems.map((s) => Math.max(...s.planets.map((p) => p.size)))}
                labels={data.systems.map((s) => s.name)}
                unit="R"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="w-4 h-4 text-chart-4" />
                Hottest Planet Temperature (Kelvin)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonBar
                values={data.systems.map((s) => Math.max(...s.planets.map((p) => p.temp)))}
                labels={data.systems.map((s) => s.name)}
                unit="K"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
