import { z } from "zod";

export const planetDataSchema = z.object({
  planet_number: z.number(),
  orbit: z.string(),
  size: z.string(),
  temperature: z.string(),
  sunlight_received: z.string(),
  transit_duration: z.string(),
  transit_depth: z.string(),
  detection_snr: z.number(),
  impact_parameter: z.number(),
  interesting_features: z.array(z.string()),
});

export const keplerSystemDataSchema = z.object({
  star_system: z.string(),
  number_of_planets: z.number(),
  star_temperature: z.string(),
  star_size: z.string(),
  star_mass: z.string().nullable(),
  star_age: z.string().nullable(),
  ra_dec: z.string(),
  potential_planets: z.array(planetDataSchema),
  system_note: z.string().nullable(),
  discovery_date: z.string(),
  last_update: z.string(),
  smart_summary: z.string(),
});

export type PlanetData = z.infer<typeof planetDataSchema>;
export type KeplerSystemData = z.infer<typeof keplerSystemDataSchema>;
