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

    // Todos los pasos posteriores al spawn deben tener rumbo calculado
    for (let i = 1; i < route.steps.length; i++) {
      const step = route.steps[i];
      expect(step.bearing).toBeDefined();
      expect(step.bearing!.degrees).toBeGreaterThanOrEqual(0);
      expect(step.bearing!.degrees).toBeLessThan(360);
      expect(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']).toContain(step.bearing!.cardinal);
    }
  });

  it('should reroute to an alternative extraction if the closest is marked disabled', () => {
    // Primera ruta sin filtros
    const standardRoute = optimizeRaidRoute(damMap, allQuests, spawnPoiId, 'rat');
    const firstExtractId = standardRoute.steps[standardRoute.steps.length - 1].poi.id;

    // Deshabilitar esa extracción específica
    const rerouted = optimizeRaidRoute(damMap, allQuests, spawnPoiId, 'rat', [firstExtractId]);
    const newExtractId = rerouted.steps[rerouted.steps.length - 1].poi.id;

    // La nueva extracción debe ser diferente y válida
    expect(newExtractId).not.toBe(firstExtractId);
    expect(rerouted.steps[rerouted.steps.length - 1].poi.isExtractionPoint).toBe(true);
  });
});
