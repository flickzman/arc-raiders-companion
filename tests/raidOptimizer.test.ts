import { describe, it, expect } from 'vitest';
import { optimizeRaidRoute } from '../src/services/optimizer/raidOptimizer';
import { allMaps, allQuests } from '../src/data/db';

describe('Raid Route Optimizer: Rat vs Sweep Mode', () => {
  const damMap = allMaps.find((m) => m.id === 'dam_battlegrounds')!;
  const spawnPoiId = 'dam_south_swamp';

  it('Modo Rata should cap at max 2 safe POIs and skip high danger objectives', () => {
    // Todas las misiones activas
    const route = optimizeRaidRoute(damMap, allQuests, spawnPoiId, 'rat');

    // Debe empezar en Spawn
    expect(route.steps[0].type).toBe('spawn');
    expect(route.steps[0].poi.id).toBe('dam_south_swamp');

    // Debe terminar en una Extracción
    const lastStep = route.steps[route.steps.length - 1];
    expect(lastStep.type).toBe('extraction');
    expect(lastStep.poi.isExtractionPoint).toBe(true);

    // En modo rata no debe hacer más de 2 POIs intermedios de objetivo
    const objectiveSteps = route.steps.filter((s) => s.type === 'objective');
    expect(objectiveSteps.length).toBeLessThanOrEqual(2);

    // Debe haber omitido objetivos por seguridad
    expect(route.skippedObjectives.length).toBeGreaterThan(0);

    // Cada objetivo omitido debe tener un motivo explicativo
    route.skippedObjectives.forEach((skipped) => {
      expect(skipped.reason.es).toBeDefined();
      expect(skipped.reason.en).toBeDefined();
    });
  });

  it('Modo Barrido should include all active POIs in the sector without skipping', () => {
    // Todas las misiones activas
    const route = optimizeRaidRoute(damMap, allQuests, spawnPoiId, 'sweep');

    // Debe empezar en Spawn
    expect(route.steps[0].type).toBe('spawn');

    // Debe terminar en Extracción
    const lastStep = route.steps[route.steps.length - 1];
    expect(lastStep.type).toBe('extraction');

    // En modo barrido NO debe descartar objetivos
    expect(route.skippedObjectives.length).toBe(0);

    // Debe visitar más POIs que el modo rata
    const objectiveSteps = route.steps.filter((s) => s.type === 'objective');
    expect(objectiveSteps.length).toBeGreaterThan(2);
  });
});
