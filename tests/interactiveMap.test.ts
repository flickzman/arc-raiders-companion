import { describe, it, expect } from 'vitest';
import { allMaps } from '../src/data/db';
import { QuestTypeSchema, MapIdSchema } from '../src/data/schemas';

describe('Official Maps & Interactive Map Data', () => {
  it('should include all 8 official ARC Raiders maps', () => {
    const expectedMapIds = [
      'dam_battlegrounds',
      'buried_city',
      'the_spaceport',
      'the_blue_gate',
      'riven_tides',
      'stella_montis',
      'pendola_pass',
      'practice_range',
    ];

    expect(allMaps.length).toBe(8);

    const mapIds = allMaps.map((m) => m.id);
    expectedMapIds.forEach((expectedId) => {
      expect(mapIds).toContain(expectedId);
    });
  });

  it('should verify every map has a valid imageUrl and essential tactical points', () => {
    for (const map of allMaps) {
      expect(map.imageUrl).toBeDefined();
      expect(map.imageUrl).toMatch(/^\/maps\/[a-z_]+\.png$/);

      // Verify spawn and extraction points exist
      const spawns = map.pois.filter((p) => p.isSpawnPoint);
      const extractions = map.pois.filter((p) => p.isExtractionPoint);

      expect(spawns.length, `Map ${map.id} must have at least 1 spawn point`).toBeGreaterThan(0);
      expect(extractions.length, `Map ${map.id} must have at least 1 extraction point`).toBeGreaterThan(0);

      // Verify all POI coordinates are normalized percentages [0, 100]
      for (const poi of map.pois) {
        expect(poi.coordinates.x).toBeGreaterThanOrEqual(0);
        expect(poi.coordinates.x).toBeLessThanOrEqual(100);
        expect(poi.coordinates.y).toBeGreaterThanOrEqual(0);
        expect(poi.coordinates.y).toBeLessThanOrEqual(100);
      }
    }
  });

  it('should validate all QuestType enum categories', () => {
    const validTypes = ['combat', 'extraction', 'recon', 'sabotage', 'delivery', 'locked_room'];

    validTypes.forEach((t) => {
      const parsed = QuestTypeSchema.safeParse(t);
      expect(parsed.success).toBe(true);
    });

    const invalid = QuestTypeSchema.safeParse('unsupported_type');
    expect(invalid.success).toBe(false);
  });

  it('should validate all 8 MapId enum values plus any', () => {
    const validMaps = [
      'dam_battlegrounds',
      'buried_city',
      'the_spaceport',
      'the_blue_gate',
      'riven_tides',
      'stella_montis',
      'pendola_pass',
      'practice_range',
      'any',
    ];

    validMaps.forEach((m) => {
      const parsed = MapIdSchema.safeParse(m);
      expect(parsed.success).toBe(true);
    });
  });
});
