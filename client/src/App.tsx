import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { StarField } from "@/components/star-field";
import { Telescope, Compass, BarChart3, Heart, ArrowLeftRight, Info } from "lucide-react";
import { Link, useRoute } from "wouter";
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import StarSystem from "@/pages/star-system";
import Stats from "@/pages/stats";
import Favorites from "@/pages/favorites";
import Compare from "@/pages/compare";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";

function NavLink({ href, icon: Icon, label, testId }: { href: string; icon: typeof Compass; label: string; testId: string }) {
  const [isActive] = useRoute(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 no-underline text-sm transition-colors ${
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
      data-testid={testId}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Link>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/discover" component={Discover} />
      <Route path="/stats" component={Stats} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/compare" component={Compare} />
      <Route path="/system/:kepid" component={StarSystem} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="relative min-h-screen bg-background">
            <StarField />
            <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 px-4 py-2.5">
                <div className="flex items-center gap-4 flex-wrap">
                  <Link href="/" className="flex items-center gap-2 no-underline" data-testid="link-home">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                      <Telescope className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground text-sm tracking-tight">
                      Kepler Explorer
                    </span>
                  </Link>
                  <NavLink href="/discover" icon={Compass} label="Discover" testId="link-discover" />
                  <NavLink href="/stats" icon={BarChart3} label="Stats" testId="link-stats" />
                  <NavLink href="/favorites" icon={Heart} label="Favorites" testId="link-favorites" />
                  <NavLink href="/compare" icon={ArrowLeftRight} label="Compare" testId="link-compare" />
                  <NavLink href="/about" icon={Info} label="About" testId="link-about" />
                </div>
                <ThemeToggle />
              </div>
            </header>
            <main className="relative z-10">
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
