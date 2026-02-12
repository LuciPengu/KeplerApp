import { useLocation } from "wouter";
import {
  Heart,
  Globe,
  Telescope,
  Trash2,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorites, useCompareList } from "@/lib/favorites";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Favorites() {
  const [, navigate] = useLocation();
  const { favorites, removeFavorite } = useFavorites();
  const { addToCompare, isInCompare, compareList } = useCompareList();

  if (favorites.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            Favorites
          </h1>
        </motion.div>
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No Favorites Yet</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Explore star systems and click the heart icon to save your favorites here.
            </p>
            <Button variant="outline" onClick={() => navigate("/discover")} data-testid="button-fav-browse">
              <Telescope className="w-4 h-4 mr-2" />
              Discover Systems
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 relative z-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            Favorites
          </h1>
          <p className="text-sm text-muted-foreground">
            {favorites.length} saved system{favorites.length !== 1 ? "s" : ""}
          </p>
        </div>
        {compareList.length >= 2 && (
          <Button variant="outline" onClick={() => navigate("/compare")} data-testid="button-fav-compare">
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Compare ({compareList.length})
          </Button>
        )}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-16"
      >
        <AnimatePresence>
          {favorites.map((fav) => (
            <motion.div key={fav.kepid} variants={itemVariants} layout>
              <Card
                className="hover-elevate active-elevate-2 cursor-pointer group"
                onClick={() => navigate(`/system/${fav.kepid}`)}
                data-testid={`card-favorite-${fav.kepid}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{fav.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          KepID {fav.kepid}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(fav.kepid);
                      }}
                      data-testid={`button-remove-fav-${fav.kepid}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Remove
                    </Button>
                    {!isInCompare(fav.kepid) && compareList.length < 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCompare(fav.kepid);
                        }}
                        data-testid={`button-compare-fav-${fav.kepid}`}
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />
                        Compare
                      </Button>
                    )}
                    {isInCompare(fav.kepid) && (
                      <Badge variant="secondary" className="text-xs">In Compare</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
