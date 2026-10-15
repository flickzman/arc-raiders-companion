import { z } from 'zod';

export const LocalizedStringSchema = z.object({
  en: z.string(),
  es: z.string().optional(),
});

export const MapIdSchema = z.enum([
  'dam_battlegrounds',
  'buried_city',
  'the_spaceport',
  'the_blue_gate',
  'stella_montis',
  'pendola_pass',
  'riven_tides',
  'any',
]);

export const VendorSchema = z.enum([
  'Tian Wen',
  'Shani',
  'Lance',
  'Celeste',
  'Apollo',
  'Other',
]);

export const ObjectiveSchema = z.object({
  id: z.string(),
  description: LocalizedStringSchema,
  mapId: MapIdSchema.default('any'),
  poiId: z.string().optional(),
  alternativePoiIds: z.array(z.string()).default([]), // [OR / Alternativa]: cualquiera de estos POIs es válido (uno u otro)
  dependsOnObjectiveId: z.string().optional(),         // [AND / Secuencial]: ID del paso que debe completarse antes
  inOneRound: z.boolean().default(false),             // [Restricción]: debe realizarse en una única incursión
  requiredItemId: z.string().optional(),
  targetItemId: z.string().optional(),
  count: z.number().default(1),
});

export const QuestSchema = z.object({
  id: z.string(),
  title: LocalizedStringSchema,
  vendor: VendorSchema,
  requiredLevel: z.number().optional(),
  objectives: z.array(ObjectiveSchema),
  itemsToBring: z.array(z.object({
    itemId: z.string(),
    count: z.number().default(1),
    optional: z.boolean().default(false),
  })).default([]),
  rewards: z.object({
    xp: z.number().optional(),
    currency: z.number().optional(),
    items: z.array(z.string()).default([]),
  }).default({}),
});

export const POISchema = z.object({
  id: z.string(),
  name: LocalizedStringSchema,
  mapId: MapIdSchema,
  coordinates: z.object({
    x: z.number(), // Porcentaje 0-100 en el mapa
    y: z.number(), // Porcentaje 0-100 en el mapa
  }),
  dangerLevel: z.enum(['low', 'medium', 'high']),
  isExtractionPoint: z.boolean().default(false),
  isSpawnPoint: z.boolean().default(false),
});

export const GameMapSchema = z.object({
  id: MapIdSchema,
  name: LocalizedStringSchema,
  description: LocalizedStringSchema.optional(),
  pois: z.array(POISchema),
});

export const GameItemSchema = z.object({
  id: z.string(),
  name: LocalizedStringSchema,
  category: z.enum(['Key', 'Consumable', 'Material', 'Weapon', 'Ammo', 'Tech', 'Valuable']),
  description: LocalizedStringSchema.optional(),
  usedInQuests: z.array(z.string()).default([]),
  usedInUpgrades: z.array(z.object({
    stationId: z.string(),
    stationName: LocalizedStringSchema,
    level: z.number(),
    count: z.number(),
  })).default([]),
  sellValue: z.number().optional(),
});

// Inferencias de tipos TypeScript
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
export type MapId = z.infer<typeof MapIdSchema>;
export type Vendor = z.infer<typeof VendorSchema>;
export type Objective = z.infer<typeof ObjectiveSchema>;
export type Quest = z.infer<typeof QuestSchema>;
export type POI = z.infer<typeof POISchema>;
export type GameMap = z.infer<typeof GameMapSchema>;
export type GameItem = z.infer<typeof GameItemSchema>;
