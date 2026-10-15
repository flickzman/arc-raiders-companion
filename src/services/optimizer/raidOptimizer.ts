import { type GameMap, type POI, type Quest, type Objective } from '../../data/schemas';

export interface RouteStep {
  poi: POI;
  type: 'spawn' | 'objective' | 'extraction';
  objectives: { quest: Quest; objective: Objective }[];
  distanceFromPrevious: number;
  cumulativeDistance: number;
}

export interface SkippedObjective {
  quest: Quest;
  objective: Objective;
  poi?: POI;
  reason: { en: string; es: string };
}

export interface OptimizedRoute {
  steps: RouteStep[];
  skippedObjectives: SkippedObjective[];
  transitObjectives: { quest: Quest; objective: Objective }[];
  totalDistance: number;
  dangerRating: 'low' | 'medium' | 'high';
  estimatedDurationMinutes: number;
  mode: 'rat' | 'sweep';
}

function calculateDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const dangerScoreMap = {
  low: 5,
  medium: 25,
  high: 60,
};

export function optimizeRaidRoute(
  map: GameMap,
  activeQuests: Quest[],
  spawnPoiId: string | null,
  mode: 'rat' | 'sweep'
): OptimizedRoute {
  // 1. Encuentra punto de spawn
  const spawnPoi =
    map.pois.find((p) => p.id === spawnPoiId) ||
    map.pois.find((p) => p.isSpawnPoint) ||
    map.pois[0];

  const extractions = map.pois.filter((p) => p.isExtractionPoint);

  // 2. Filtrar objetivos de este mapa
  const relevantObjectives: { quest: Quest; objective: Objective; poi?: POI }[] = [];
  const transitObjectives: { quest: Quest; objective: Objective }[] = [];

  activeQuests.forEach((q) => {
    q.objectives.forEach((obj) => {
      if (obj.mapId === 'any') {
        transitObjectives.push({ quest: q, objective: obj });
      } else if (obj.mapId === map.id) {
        const poi = obj.poiId ? map.pois.find((p) => p.id === obj.poiId) : undefined;
        relevantObjectives.push({ quest: q, objective: obj, poi });
      }
    });
  });

  // Agrupar objetivos con POI válido
  const poiObjectivesMap = new Map<string, { poi: POI; objectives: { quest: Quest; objective: Objective }[] }>();

  relevantObjectives.forEach((item) => {
    if (item.poi) {
      const existing = poiObjectivesMap.get(item.poi.id);
      if (existing) {
        existing.objectives.push({ quest: item.quest, objective: item.objective });
      } else {
        poiObjectivesMap.set(item.poi.id, {
          poi: item.poi,
          objectives: [{ quest: item.quest, objective: item.objective }],
        });
      }
    } else {
      transitObjectives.push({ quest: item.quest, objective: item.objective });
    }
  });

  const targetPois = Array.from(poiObjectivesMap.values());
  const steps: RouteStep[] = [];
  const skippedObjectives: SkippedObjective[] = [];

  // Paso inicial: Spawn
  steps.push({
    poi: spawnPoi,
    type: 'spawn',
    objectives: [],
    distanceFromPrevious: 0,
    cumulativeDistance: 0,
  });

  let currentPos = spawnPoi.coordinates;
  let cumulativeDist = 0;

  if (mode === 'rat') {
    // MODO RATA:
    // Máximo 2 POIs más seguros y cercanos.
    // Penalización severa a POIs con peligro 'high'.
    const scoredPois = targetPois.map((item) => {
      const dist = calculateDistance(spawnPoi.coordinates, item.poi.coordinates);
      const danger = dangerScoreMap[item.poi.dangerLevel];
      // Fórmula Modo Rata: peso brutal al peligro
      const cost = dist * 0.4 + danger * 1.5;
      return { ...item, dist, cost };
    });

    // Ordenar por menor coste
    scoredPois.sort((a, b) => a.cost - b.cost);

    // Tomar máximo 2 POIs que no sean 'high' salvo que no haya alternativa
    const selectedForRat = scoredPois.slice(0, 2);
    const excludedForRat = scoredPois.slice(2);

    // Si alguno seleccionado es 'high' y hay más de 1, advertir o filtrar
    selectedForRat.forEach((entry) => {
      const dist = calculateDistance(currentPos, entry.poi.coordinates);
      cumulativeDist += dist;
      steps.push({
        poi: entry.poi,
        type: 'objective',
        objectives: entry.objectives,
        distanceFromPrevious: Math.round(dist),
        cumulativeDistance: Math.round(cumulativeDist),
      });
      currentPos = entry.poi.coordinates;
    });

    // Registrar los objetivos omitidos por seguridad
    excludedForRat.forEach((entry) => {
      entry.objectives.forEach((obj) => {
        skippedObjectives.push({
          quest: obj.quest,
          objective: obj.objective,
          poi: entry.poi,
          reason: {
            es: entry.poi.dangerLevel === 'high'
              ? `Omitido en Modo Rata por alto peligro (${entry.poi.dangerLevel.toUpperCase()}). Hazlo en otra raid.`
              : `Omitido en Modo Rata para asegurar extracción rápida (distancia: ${Math.round(entry.dist)}m).`,
            en: entry.poi.dangerLevel === 'high'
              ? `Skipped in Rat Mode due to high hazard (${entry.poi.dangerLevel.toUpperCase()}). Leave for another drop.`
              : `Skipped in Rat Mode to ensure fast extraction (distance: ${Math.round(entry.dist)}m).`,
          },
        });
      });
    });
  } else {
    // MODO BARRIDO:
    // Visita TODOS los POIs activos resolviendo una ruta continua (Nearest Neighbor TSP)
    const unvisited = [...targetPois];

    while (unvisited.length > 0) {
      let bestIndex = 0;
      let minCost = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const item = unvisited[i];
        const dist = calculateDistance(currentPos, item.poi.coordinates);
        const danger = dangerScoreMap[item.poi.dangerLevel];
        // En Modo Barrido prima la distancia para minimizar caminata
        const cost = dist * 1.0 + danger * 0.15;

        if (cost < minCost) {
          minCost = cost;
          bestIndex = i;
        }
      }

      const next = unvisited.splice(bestIndex, 1)[0];
      const dist = calculateDistance(currentPos, next.poi.coordinates);
      cumulativeDist += dist;

      steps.push({
        poi: next.poi,
        type: 'objective',
        objectives: next.objectives,
        distanceFromPrevious: Math.round(dist),
        cumulativeDistance: Math.round(cumulativeDist),
      });

      currentPos = next.poi.coordinates;
    }
  }

  // Paso final: Extracción más cercana desde el último POI
  if (extractions.length > 0) {
    let bestExtract = extractions[0];
    let minExtractCost = Infinity;

    extractions.forEach((ext) => {
      const dist = calculateDistance(currentPos, ext.coordinates);
      const danger = dangerScoreMap[ext.dangerLevel];
      // En Modo Rata busca la extracción más segura
      const cost = mode === 'rat' ? dist * 0.5 + danger * 1.0 : dist;

      if (cost < minExtractCost) {
        minExtractCost = cost;
        bestExtract = ext;
      }
    });

    const distToExtract = calculateDistance(currentPos, bestExtract.coordinates);
    cumulativeDist += distToExtract;

    steps.push({
      poi: bestExtract,
      type: 'extraction',
      objectives: [],
      distanceFromPrevious: Math.round(distToExtract),
      cumulativeDistance: Math.round(cumulativeDist),
    });
  }

  // Peligro general de la ruta
  const hasHighDanger = steps.some((s) => s.poi.dangerLevel === 'high');
  const dangerRating = mode === 'rat' ? (hasHighDanger ? 'medium' : 'low') : hasHighDanger ? 'high' : 'medium';

  // Duración estimada (ej: 100m ~ 3 min de combate y sigilo)
  const estimatedDurationMinutes = Math.max(5, Math.round(cumulativeDist * 0.12) + steps.length * 2);

  return {
    steps,
    skippedObjectives,
    transitObjectives,
    totalDistance: Math.round(cumulativeDist),
    dangerRating,
    estimatedDurationMinutes,
    mode,
  };
}
