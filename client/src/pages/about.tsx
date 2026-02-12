import { Link } from "wouter";
import { motion } from "framer-motion";
import { Telescope, Satellite, Database, Hash, Globe, ArrowRight, Thermometer, Ruler, Clock, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <div className="flex items-center gap-2 mb-4">
          <Telescope className="w-5 h-5 text-primary" />
          <Badge variant="secondary" className="text-xs">Learn</Badge>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3" data-testid="text-about-title">
          About the Kepler Mission
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Everything you need to know about NASA's planet-hunting telescope, the data it collected, and how to use this explorer.
        </p>
      </motion.div>

      <div className="space-y-8">
        <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Satellite className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground" data-testid="text-section-mission">The Kepler Space Telescope</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  The Kepler Space Telescope was a NASA spacecraft launched on March 7, 2009 with a single, focused mission: to survey a portion of our region of the Milky Way galaxy and discover Earth-size planets in or near the habitable zone of their host stars.
                </p>
                <p>
                  For over nine years, Kepler stared at a patch of sky in the constellations Cygnus and Lyra, continuously monitoring the brightness of over 150,000 stars. It watched for tiny dips in starlight caused by planets passing in front of their stars, a detection method called the transit method.
                </p>
                <p>
                  By the time the mission ended in October 2018, Kepler had discovered over 2,600 confirmed exoplanets and thousands more candidates. It fundamentally changed our understanding of how common planets are in the universe, revealing that there are more planets than stars in our galaxy.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-md bg-chart-3/10 flex items-center justify-center shrink-0">
                  <Hash className="w-5 h-5 text-chart-3" />
                </div>
                <h2 className="text-xl font-semibold text-foreground" data-testid="text-section-kepid">What is a Kepler ID?</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Every star observed by the Kepler telescope was assigned a unique identification number called a <span className="text-foreground font-medium">Kepler ID</span> (or KepID). This is simply a catalog number, like a library card for a star. For example, the star Kepler-90 has the Kepler ID <span className="font-mono text-foreground">11442793</span>.
                </p>
                <p>
                  When you search by Kepler ID in this explorer, you are looking up a specific star and all the planets discovered orbiting it. The ID itself doesn't carry any physical meaning; it is just a reference number in NASA's Kepler Input Catalog (KIC), which was created before the mission launched to identify every star in Kepler's field of view.
                </p>
                <p>
                  Some well-known systems have friendly names (like Kepler-11, Kepler-62, or Kepler-90), but the underlying Kepler ID is what connects them to all the scientific data in NASA's archive.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-md bg-chart-2/10 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-chart-2" />
                </div>
                <h2 className="text-xl font-semibold text-foreground" data-testid="text-section-data">Understanding the Data</h2>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  The data in this explorer comes directly from NASA's Exoplanet Archive, specifically the Q1-Q17 DR25 Threshold Crossing Events (TCE) table. Here is what the key measurements mean:
                </p>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium mb-0.5">Star Temperature (K)</p>
                      <p>The surface temperature of the host star, measured in Kelvin. Our Sun is about 5,780 K. Hotter stars appear blue-white; cooler stars appear red.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium mb-0.5">Planet Radius (Earth Radii)</p>
                      <p>How large the planet is compared to Earth. A value of 1.0 means Earth-sized. Jupiter is about 11.2 Earth radii. Values above 15 indicate gas giants larger than Jupiter.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Thermometer className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium mb-0.5">Equilibrium Temperature (K)</p>
                      <p>An estimate of how warm a planet's surface would be, ignoring any atmosphere. Earth's equilibrium temperature is about 255 K. Planets in the habitable zone typically fall between 200-310 K. Above 500 K, conditions become extremely harsh.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium mb-0.5">Orbital Period (Days)</p>
                      <p>How long it takes the planet to complete one orbit around its star. Earth's orbital period is 365 days. Many Kepler planets have very short periods (under 10 days), meaning they are extremely close to their stars.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium mb-0.5">Star Radius (Solar Radii)</p>
                      <p>The size of the host star compared to our Sun. A value of 1.0 means Sun-sized. Red dwarf stars can be as small as 0.1, while giant stars can exceed 10 solar radii.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-md bg-chart-4/10 flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-chart-4" />
                </div>
                <h2 className="text-xl font-semibold text-foreground" data-testid="text-section-uses">How You Can Use This Data</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  This explorer makes NASA's Kepler data accessible to everyone, not just scientists. Here are some things you can do:
                </p>
                <ul className="space-y-2 ml-1">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span><span className="text-foreground font-medium">Search in plain English</span> for the types of planets that interest you, like "habitable Earth-sized worlds" or "giant planets hotter than 1000 Kelvin."</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span><span className="text-foreground font-medium">Compare systems</span> side by side to see how different planetary architectures stack up against each other.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span><span className="text-foreground font-medium">Explore statistics</span> to understand the big picture, like how many planets fall in different size or temperature ranges.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span><span className="text-foreground font-medium">Save favorites</span> to build your own collection of interesting systems worth revisiting.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span><span className="text-foreground font-medium">Learn about exoplanet science</span> by exploring real data from a real NASA mission, visualized in an approachable way.</span>
                  </li>
                </ul>
                <p>
                  All data is pulled live from NASA's Exoplanet Archive, so you are always looking at real, peer-reviewed scientific measurements.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex items-center justify-center gap-3 pt-4 pb-8 flex-wrap"
        >
          <Link href="/">
            <Button data-testid="button-back-home">
              <Telescope className="w-4 h-4 mr-2" />
              Start Exploring
            </Button>
          </Link>
          <Link href="/discover">
            <Button variant="outline" data-testid="button-go-discover">
              Browse Systems
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
