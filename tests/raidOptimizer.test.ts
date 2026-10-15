import { describe, it, expect } from 'vitest';
import { optimizeRaidRoute } from '../src/services/optimizer/raidOptimizer';
import { allMaps, allQuests } from '../src/data/db';

describe('Raid Route Optimizer: Rat vs Sweep Mode and Phase 2 Features', () => {
  const damMap = allMaps.find((m) => m.id === 'dam_battlegrounds')!;
  const spawnPoiId = 'dam_south_swamp';

  it('Modo Rata should cap at max 2 safe POIs and skip high danger objectives', () => {
    const route = optimizeRaidRoute(damMap, allQuests, spawnPoiId, 'rat');

    expect(route.steps[0].type).toBe('spawn');
    expect(route.steps[0].poi.id).toBe('dam_south_swamp');

    const lastStep = route.steps[route.steps.length - 1];
    expect(lastStep.type).toBe('extraction');
    expect(lastStep.poi.isExtractionPoint).toBe(true);

    const objectiveSteps = route.steps.filter((s) => s.type === 'objective');
    expect(objectiveSteps.length).toBeLessThanOrEqual(2);

    expect(route.skippedObjectives.length).toBeGreaterThan(0);
    route.skippedObjectives.forEach((skipped) => {
      expect(skipped.reason.es).toBeDefined();
      expect(skipped.reason.en).toBeDefined();
    });
  });

  it('Modo Barrido should include all active POIs in the sector without skipping', () => {
    const route = optimizeRaidRoute(damMap, allQuests, spawnPoiId, 'sweep');

    expect(route.steps[0].type).toBe('spawn');

    const lastStep = route.steps[route.steps.length - 1];
    expect(lastStep.type).toBe('extraction');

    expect(route.skippedObjectives.length).toBe(0);

    const objectiveSteps = route.steps.filter((s) => s.type === 'objective');
    expect(objectiveSteps.length).toBeGreaterThan(2);
  });

  it('should calculate compass bearings for all navigation waypoints', () => {
    const route = optimizeRaidRoute(damMap, allQuests, spawnPoiId, 'sweep');

    for (let i = 1; i < route.steps.length; i++) {
      const step = route.steps[i];
      expect(step.bearing).toBeDefined();
      expect(step.bearing!.degrees).toBeGreaterThanOrEqual(0);
      expect(step.bearing!.degrees).toBeLessThan(360);
      expect(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']).toContain(step.bearing!.cardinal);
    }
  });

  it('should reroute to an alternative extraction if the closest is marked disabled', () => {
    const standardRoute = optimizeRaidRoute(damMap, allQuests, spawnPoiId, 'rat');
    const firstExtractId = standardRoute.steps[standardRoute.steps.length - 1].poi.id;

    const rerouted = optimizeRaidRoute(damMap, allQuests, spawnPoiId, 'rat', [firstExtractId]);
    const newExtractId = rerouted.steps[rerouted.steps.length - 1].poi.id;

    expect(newExtractId).not.toBe(firstExtractId);
    expect(rerouted.steps[rerouted.steps.length - 1].poi.isExtractionPoint).toBe(true);
  });

  it('CASO OR (Alternativas): should pick the closest alternative POI and avoid visiting the other', () => {
    // Off The Radar tiene alternativas: dam_south_swamp O dam_north_ridge
    const offTheRadarQuest = allQuests.filter((q) => q.id === 'quest_off_the_radar');

    // 1. Spawneando en South Swamp: debe elegir South Swamp
    const routeSouth = optimizeRaidRoute(damMap, offTheRadarQuest, 'dam_south_swamp', 'sweep');
    const poiIdsSouth = routeSouth.steps.map((s) => s.poi.id);
    expect(poiIdsSouth).toContain('dam_south_swamp');
    expect(poiIdsSouth).not.toContain('dam_north_ridge');

    // 2. Spawneando en North Ridge: debe elegir North Ridge
    const routeNorth = optimizeRaidRoute(damMap, offTheRadarQuest, 'dam_north_ridge', 'sweep');
    const poiIdsNorth = routeNorth.steps.map((s) => s.poi.id);
    expect(poiIdsNorth).toContain('dam_north_ridge');
    expect(poiIdsNorth).not.toContain('dam_south_swamp');
  });

  it('CASO AND (Secuencial): should strictly visit predecessor before dependent objective', () => {
    // Hatch Repairs: obj_hatch_1 (dam_south_swamp) -> obj_hatch_2 (dam_controlled_access, depende de 1)
    const hatchQuest = allQuests.filter((q) => q.id === 'quest_hatch_repairs');

    // Spawneamos en North Ridge (lejos de ambos)
    const route = optimizeRaidRoute(damMap, hatchQuest, 'dam_north_ridge', 'sweep');
    const poiSequence = route.steps.map((s) => s.poi.id);

    const step1Index = poiSequence.indexOf('dam_south_swamp');
    const step2Index = poiSequence.indexOf('dam_controlled_access');

    expect(step1Index).toBeGreaterThan(-1);
    expect(step2Index).toBeGreaterThan(-1);
    // El paso 1 DEBE visitarse antes del paso 2
    expect(step1Index).toBeLessThan(step2Index);
  });
});
