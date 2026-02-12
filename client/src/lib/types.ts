export type { PlanetData, KeplerSystemData } from "@shared/schema";

export interface FeaturedSystem {
  kepid: number;
  name: string;
  description: string;
  planetCount: number;
  highlight: string;
}

export interface BrowseSystem {
  kepid: number;
  planet_count: number;
  star_temp: string;
  star_size: string;
  warmest_planet_temp: string;
  largest_planet: string;
  star_temp_raw?: number;
  star_size_raw?: number;
  warmest_planet_temp_raw?: number;
  largest_planet_raw?: number;
}

export interface BrowseResponse {
  systems: BrowseSystem[];
  page: number;
  hasMore: boolean;
  total?: number;
}

export interface SystemOfDay {
  kepid: number;
  name: string;
  description: string;
  planetCount: number;
  starTemp?: number;
  starSize?: number;
}

export interface StatsData {
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

export interface CompareSystem {
  kepid: number;
  name: string;
  planetCount: number;
  starTemp: number;
  starSize: number;
  starMass: number | null;
  planets: {
    number: number;
    size: number;
    temp: number;
    period: number;
    sunlight: number;
  }[];
}

export interface CompareResponse {
  systems: CompareSystem[];
}

export interface FavoriteSystem {
  kepid: number;
  name: string;
  addedAt: number;
}

export interface NaturalSearchResult {
  summary: string;
  params: Record<string, unknown>;
  systems: (BrowseSystem & {
    star_temp_raw?: number;
    star_size_raw?: number;
    warmest_planet_temp_raw?: number;
    largest_planet_raw?: number;
  })[];
  total: number;
  hasMore: boolean;
}
