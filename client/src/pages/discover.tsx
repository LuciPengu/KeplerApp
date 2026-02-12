import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  Shuffle,
  Globe,
  Thermometer,
  Ruler,
  ChevronRight,
  Loader2,
  Flame,
  Droplets,
  Orbit,
  Star,
  Telescope,
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
  Heart,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import type { BrowseResponse } from "@/lib/types";
import { useFavorites, useCompareList } from "@/lib/favorites";
import { getSystemLabel } from "@/lib/system-labels";

const CATEGORIES = [
  {
    id: "all",
    label: "All Systems",
    icon: Compass,
    description: "Browse all Kepler star systems",
    color: "from-primary to-chart-3",
  },
  {
    id: "most-planets",
    label: "Most Planets",
    icon: Orbit,
    description: "Systems with 4+ detected planets",
    color: "from-chart-1 to-chart-2",
  },
  {
    id: "habitable",
    label: "Habitable Zone",
    icon: Droplets,
    description: "Planets at temperatures where liquid water could exist",
    color: "from-chart-3 to-chart-4",
  },
  {
    id: "hot-jupiters",
    label: "Hot Jupiters",
    icon: Flame,
    description: "Giant planets scorched by their parent star",
    color: "from-chart-4 to-destructive",
  },
  {
    id: "compact",
    label: "Compact Systems",
    icon: Star,
    description: "Multiple planets packed into tight orbits",
    color: "from-chart-2 to-primary",
  },
  {
    id: "giant-stars",
    label: "Giant Stars",
    icon: Telescope,
    description: "Systems with unusually large host stars",
    color: "from-chart-5 to-chart-1",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

interface AdvancedFilters {
  minPlanets: string;
  minTemp: string;
  maxTemp: string;
  minSize: string;
  maxSize: string;
}

const defaultFilters: AdvancedFilters = {
  minPlanets: "",
  minTemp: "",
  maxTemp: "",
  minSize: "",
  maxSize: "",
};

export default function Discover() {
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters>(defaultFilters);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCompare, isInCompare, compareList } = useCompareList();

  const hasActiveFilters = Object.values(appliedFilters).some((v) => v !== "");

  const useAdvancedSearch = hasActiveFilters;

  const browseQuery = useQuery<BrowseResponse>({
    queryKey: ["/api/browse", activeCategory, page],
    queryFn: async () => {
      const res = await fetch(`/api/browse?category=${activeCategory}&page=${page}&limit=20`);
      if (!res.ok) throw new Error("Failed to load systems");
      return res.json();
    },
    enabled: !useAdvancedSearch,
  });

  const advancedQuery = useQuery<BrowseResponse>({
    queryKey: ["/api/search/advanced", appliedFilters, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appliedFilters.minPlanets) params.set("minPlanets", appliedFilters.minPlanets);
      if (appliedFilters.minTemp) params.set("minTemp", appliedFilters.minTemp);
      if (appliedFilters.maxTemp) params.set("maxTemp", appliedFilters.maxTemp);
      if (appliedFilters.minSize) params.set("minSize", appliedFilters.minSize);
      if (appliedFilters.maxSize) params.set("maxSize", appliedFilters.maxSize);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await fetch(`/api/search/advanced?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to search");
      return res.json();
    },
    enabled: useAdvancedSearch,
  });

  const data = useAdvancedSearch ? advancedQuery.data : browseQuery.data;
  const isLoading = useAdvancedSearch ? advancedQuery.isLoading : browseQuery.isLoading;
  const isFetching = useAdvancedSearch ? advancedQuery.isFetching : browseQuery.isFetching;

  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    setPage(1);
    setAppliedFilters(defaultFilters);
    setFilters(defaultFilters);
    setShowAdvanced(false);
  }, []);

  const handleRandomSystem = useCallback(async () => {
    setIsRandomLoading(true);
    try {
      const res = await fetch("/api/random");
      const { kepid } = await res.json();
      navigate(`/system/${kepid}`);
    } catch {
      navigate("/system/11442793");
    } finally {
      setIsRandomLoading(false);
    }
  }, [navigate]);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
  };

  const activeCat = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  return (
    <div className="relative min-h-screen">
      <section className="px-4 pt-10 pb-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1">
              Discover Systems
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse thousands of star systems from the Kepler mission
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              data-testid="button-toggle-advanced"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Advanced Search
            </Button>
            <Button
              onClick={handleRandomSystem}
              disabled={isRandomLoading}
              className="shrink-0"
              data-testid="button-random-system"
            >
              {isRandomLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Shuffle className="w-4 h-4 mr-2" />
              )}
              I'm Feeling Lucky
            </Button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary" />
                      Search by Planet Properties
                    </CardTitle>
                    <Button size="icon" variant="ghost" onClick={() => setShowAdvanced(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Min Planets</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.minPlanets}
                        onChange={(e) => setFilters((f) => ({ ...f, minPlanets: e.target.value }))}
                        placeholder="e.g. 3"
                        className="w-full bg-card border border-border/50 rounded-md px-2 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                        data-testid="input-min-planets"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Min Temp (K)</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.minTemp}
                        onChange={(e) => setFilters((f) => ({ ...f, minTemp: e.target.value }))}
                        placeholder="e.g. 200"
                        className="w-full bg-card border border-border/50 rounded-md px-2 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                        data-testid="input-min-temp"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Max Temp (K)</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.maxTemp}
                        onChange={(e) => setFilters((f) => ({ ...f, maxTemp: e.target.value }))}
                        placeholder="e.g. 500"
                        className="w-full bg-card border border-border/50 rounded-md px-2 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                        data-testid="input-max-temp"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Min Size (R Earth)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={filters.minSize}
                        onChange={(e) => setFilters((f) => ({ ...f, minSize: e.target.value }))}
                        placeholder="e.g. 1"
                        className="w-full bg-card border border-border/50 rounded-md px-2 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                        data-testid="input-min-size"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Max Size (R Earth)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={filters.maxSize}
                        onChange={(e) => setFilters((f) => ({ ...f, maxSize: e.target.value }))}
                        placeholder="e.g. 15"
                        className="w-full bg-card border border-border/50 rounded-md px-2 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                        data-testid="input-max-size"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleApplyFilters} data-testid="button-apply-filters">
                      <Search className="w-3.5 h-3.5 mr-1.5" />
                      Search
                    </Button>
                    {hasActiveFilters && (
                      <Button size="sm" variant="ghost" onClick={handleClearFilters} data-testid="button-clear-filters">
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              <Search className="w-3 h-3 mr-1" />
              Advanced Search Active
            </Badge>
            {appliedFilters.minPlanets && <Badge variant="outline" className="text-xs">Min {appliedFilters.minPlanets} planets</Badge>}
            {appliedFilters.minTemp && <Badge variant="outline" className="text-xs">Min {appliedFilters.minTemp}K</Badge>}
            {appliedFilters.maxTemp && <Badge variant="outline" className="text-xs">Max {appliedFilters.maxTemp}K</Badge>}
            {appliedFilters.minSize && <Badge variant="outline" className="text-xs">Min {appliedFilters.minSize}R</Badge>}
            {appliedFilters.maxSize && <Badge variant="outline" className="text-xs">Max {appliedFilters.maxSize}R</Badge>}
            <Button size="sm" variant="ghost" onClick={handleClearFilters}>
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {!hasActiveFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-8"
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-md border transition-all duration-200 text-center ${
                      isActive
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/50 bg-card/50 hover-elevate"
                    }`}
                    data-testid={`button-category-${cat.id}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center ${
                        isActive ? "bg-primary/20" : "bg-muted/50"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium leading-tight ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>

            <div className="flex items-center gap-2 mb-5">
              <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${activeCat.color} flex items-center justify-center`}>
                <activeCat.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">{activeCat.label}</h2>
                <p className="text-xs text-muted-foreground">{activeCat.description}</p>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="px-4 pb-20 max-w-6xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-8 h-8 rounded-md" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-8 rounded-md" />
                      <Skeleton className="h-8 rounded-md" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data && data.systems.length > 0 ? (
          <>
            {hasActiveFilters && data.total != null && (
              <p className="text-sm text-muted-foreground mb-4">{data.total} systems found</p>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCategory}-${page}-${hasActiveFilters}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
              >
                {data.systems.map((system) => (
                  <motion.div key={system.kepid} variants={itemVariants}>
                    <Card
                      className="hover-elevate active-elevate-2 cursor-pointer transition-all duration-200 group"
                      onClick={() => navigate(`/system/${system.kepid}`)}
                      data-testid={`card-browse-${system.kepid}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                              <Globe className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <h3
                                className="font-semibold text-foreground text-sm"
                                data-testid={`text-browse-name-${system.kepid}`}
                              >
                                KepID {system.kepid}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {getSystemLabel(system)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(system.kepid, `Kepler-${system.kepid}`);
                              }}
                              className="p-1 rounded-md"
                              data-testid={`button-fav-browse-${system.kepid}`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFavorite(system.kepid) ? "fill-current text-red-500" : "text-muted-foreground"}`} />
                            </button>
                            {!isInCompare(system.kepid) && compareList.length < 3 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCompare(system.kepid);
                                }}
                                className="p-1 rounded-md"
                                data-testid={`button-compare-browse-${system.kepid}`}
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="flex items-center gap-1.5 bg-muted/30 rounded-md px-2 py-1.5">
                            <Thermometer className="w-3 h-3 text-chart-4 shrink-0" />
                            <span className="text-xs text-muted-foreground truncate" data-testid={`text-browse-temp-${system.kepid}`}>
                              {system.star_temp}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-muted/30 rounded-md px-2 py-1.5">
                            <Ruler className="w-3 h-3 text-chart-3 shrink-0" />
                            <span className="text-xs text-muted-foreground truncate" data-testid={`text-browse-size-${system.kepid}`}>
                              {system.star_size}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <Badge variant="secondary" data-testid="text-page-number">
                Page {page}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.hasMore || isFetching}
                onClick={() => setPage((p) => p + 1)}
                data-testid="button-next-page"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Telescope className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No systems found. Try adjusting your filters or browse a different category.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
