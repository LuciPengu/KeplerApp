import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Telescope, Sparkles, ArrowRight, Globe, Shuffle, Compass, Loader2, Star, CalendarDays, MessageSquare, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import type { FeaturedSystem, SystemOfDay, NaturalSearchResult } from "@/lib/types";
import { getSystemLabel } from "@/lib/system-labels";

const FEATURED_SYSTEMS: FeaturedSystem[] = [
  {
    kepid: 11442793,
    name: "Kepler-90",
    description: "An 8-planet system rivaling our own Solar System in complexity",
    planetCount: 8,
    highlight: "Most planets found",
  },
  {
    kepid: 10666592,
    name: "Kepler-11",
    description: "Six tightly packed planets in a remarkably compact arrangement",
    planetCount: 6,
    highlight: "Tightly packed",
  },
  {
    kepid: 6922244,
    name: "Kepler-62",
    description: "Hosts two potentially habitable zone planets with mild temperatures",
    planetCount: 5,
    highlight: "Habitable zone",
  },
  {
    kepid: 10227020,
    name: "Kepler-80",
    description: "A resonant chain of five planets locked in gravitational harmony",
    planetCount: 5,
    highlight: "Resonant chain",
  },
  {
    kepid: 3544595,
    name: "Kepler-289",
    description: "Features planets with extreme temperature variations and fast orbits",
    planetCount: 3,
    highlight: "Extreme temps",
  },
  {
    kepid: 4276002,
    name: "Kepler-4276002",
    description: "A fascinating star system with unique transit signatures",
    planetCount: 2,
    highlight: "Unique transits",
  },
];

const EXAMPLE_QUERIES = [
  "Stars with the coldest planets",
  "Systems with 5 or more planets",
  "Giant planets larger than Jupiter",
  "Habitable zone Earth-sized worlds",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Home() {
  const [promptInput, setPromptInput] = useState("");
  const [kepidInput, setKepidInput] = useState("");
  const [showIdSearch, setShowIdSearch] = useState(false);
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [, navigate] = useLocation();

  const { data: sotd, isLoading: sotdLoading } = useQuery<SystemOfDay>({
    queryKey: ["/api/system-of-day"],
    staleTime: 30 * 60 * 1000,
  });

  const searchMutation = useMutation<NaturalSearchResult, Error, string>({
    mutationFn: async (query: string) => {
      const res = await fetch("/api/search/natural", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
  });

  const handlePromptSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = promptInput.trim();
    if (q) {
      searchMutation.mutate(q);
    }
  };

  const handleExampleClick = (example: string) => {
    setPromptInput(example);
    searchMutation.mutate(example);
  };

  const handleIdSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const kepid = kepidInput.trim();
    if (kepid && !isNaN(Number(kepid))) {
      navigate(`/system/${kepid}`);
    }
  };

  const handleFeaturedClick = (kepid: number) => {
    navigate(`/system/${kepid}`);
  };

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

  return (
    <div className="relative min-h-screen flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto w-full"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Telescope className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
              NASA Kepler Mission
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4 text-foreground">
            Explore Exoplanets
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Describe the kind of planets you want to find and we'll search thousands of Kepler systems for you.
          </p>

          <form
            onSubmit={handlePromptSearch}
            className="relative max-w-lg mx-auto mb-4"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-chart-3/20 to-chart-2/30 rounded-md blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center bg-card border border-card-border rounded-md">
                <MessageSquare className="w-4 h-4 text-muted-foreground ml-3 shrink-0" />
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Show me stars with the coldest planets"
                  className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground px-3 py-2.5 text-sm"
                  data-testid="input-natural-search"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="mr-1.5 shrink-0"
                  disabled={!promptInput.trim() || searchMutation.isPending}
                  data-testid="button-natural-search"
                >
                  {searchMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      Search
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleExampleClick(q)}
                className="text-xs text-muted-foreground border border-border/50 rounded-md px-2.5 py-1 hover-elevate transition-colors"
                data-testid={`button-example-${q.slice(0, 10).replace(/\s/g, "-").toLowerCase()}`}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={handleRandomSystem}
              disabled={isRandomLoading}
              data-testid="button-random-home"
            >
              {isRandomLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Shuffle className="w-4 h-4 mr-2" />
              )}
              Random System
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/discover")}
              data-testid="button-discover-home"
            >
              <Compass className="w-4 h-4 mr-2" />
              Browse All
            </Button>
            <button
              onClick={() => setShowIdSearch(!showIdSearch)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              data-testid="button-toggle-id-search"
            >
              <Hash className="w-3 h-3" />
              Search by ID
            </button>
          </div>

          <AnimatePresence>
            {showIdSearch && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleIdSearch}
                className="overflow-hidden mt-4 max-w-xs mx-auto"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={kepidInput}
                    onChange={(e) => setKepidInput(e.target.value)}
                    placeholder="Kepler ID (e.g. 11442793)"
                    className="flex-1 bg-card border border-border/50 rounded-md px-3 py-1.5 text-sm font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
                    data-testid="input-kepid"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    disabled={!kepidInput.trim() || isNaN(Number(kepidInput))}
                    data-testid="button-search-id"
                  >
                    Go
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <AnimatePresence>
        {searchMutation.data && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-12 max-w-6xl mx-auto w-full"
          >
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Search className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold text-foreground" data-testid="text-search-summary">
                {searchMutation.data.summary}
              </h2>
              <Badge variant="secondary" className="text-xs" data-testid="text-search-count">
                {searchMutation.data.total} found
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => searchMutation.reset()}
                className="ml-auto"
                data-testid="button-clear-results"
              >
                Clear
              </Button>
            </div>
            {searchMutation.data.systems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {searchMutation.data.systems.map((system) => (
                  <Card
                    key={system.kepid}
                    className="hover-elevate active-elevate-2 cursor-pointer transition-all duration-200"
                    onClick={() => navigate(`/system/${system.kepid}`)}
                    data-testid={`card-result-${system.kepid}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Globe className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground text-sm truncate">
                            KepID {system.kepid}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {getSystemLabel({
                              planet_count: system.planet_count,
                              star_temp_raw: system.star_temp_raw,
                              star_size_raw: system.star_size_raw,
                              warmest_planet_temp_raw: system.warmest_planet_temp_raw,
                              largest_planet_raw: system.largest_planet_raw,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {system.planet_count}p
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {system.star_temp}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {system.largest_planet}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No systems matched your description. Try rephrasing your search.</p>
                </CardContent>
              </Card>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {searchMutation.isError && (
        <div className="px-4 pb-8 max-w-6xl mx-auto w-full">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Something went wrong with the search. Please try again.</p>
            </CardContent>
          </Card>
        </div>
      )}

      <section className="px-4 pb-12 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">System of the Day</h2>
          </div>
          {sotdLoading ? (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-md shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : sotd ? (
            <Card
              className="hover-elevate active-elevate-2 cursor-pointer border-primary/20"
              onClick={() => navigate(`/system/${sotd.kepid}`)}
              data-testid="card-system-of-day"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-md bg-gradient-to-br from-primary/20 to-chart-3/20 flex items-center justify-center shrink-0">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-foreground" data-testid="text-sotd-name">{sotd.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {sotd.planetCount} planet{sotd.planetCount !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-sotd-description">
                      {sotd.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </motion.div>
      </section>

      <section className="px-4 pb-8 max-w-6xl mx-auto w-full">
        <Card className="border-primary/10">
          <CardContent className="p-5 flex items-center gap-4 flex-wrap">
            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Telescope className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm mb-0.5">What is a Kepler ID?</h3>
              <p className="text-xs text-muted-foreground">Learn about the Kepler mission, how the data works, and what all the numbers mean.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/about")}
              data-testid="button-about-link"
            >
              Learn More
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="px-4 pb-20 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex items-center gap-2 mb-6"
        >
          <Sparkles className="w-4 h-4 text-chart-4" />
          <h2 className="text-lg font-semibold text-foreground">Featured Systems</h2>
          <span className="text-sm text-muted-foreground ml-1">
            Tap to explore
          </span>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURED_SYSTEMS.map((system) => (
            <motion.div key={system.kepid} variants={itemVariants}>
              <Card
                className="hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 group"
                onClick={() => handleFeaturedClick(system.kepid)}
                data-testid={`card-system-${system.kepid}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm" data-testid={`text-system-name-${system.kepid}`}>
                          {system.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          KepID {system.kepid}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {system.highlight}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {system.description}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: system.planetCount }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: `hsl(var(--chart-${(i % 5) + 1}))`,
                          opacity: 0.7 + (i * 0.05),
                        }}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">
                      {system.planetCount} planets
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <footer className="text-center py-8 px-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Data sourced from NASA Exoplanet Archive.
        </p>
      </footer>
    </div>
  );
}
