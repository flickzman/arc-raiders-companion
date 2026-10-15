import { type GameMap, type POI, type Quest, type Objective } from '../../data/schemas';

export interface RouteObjectiveAssignment {
  quest: Quest;
  objective: Objective;
  chosenPoi: POI;
  alternativePois: POI[];
}

export interface RouteStep {
  poi: POI;
  type: 'spawn' | 'objective' | 'extraction';
  objectives: RouteObjectiveAssignment[];
  distanceFromPrevious: number;
  cumulativeDistance: number;
  bearing?: {
    degrees: number;
    cardinal: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
  };
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

function calculateBearing(
  from: { x: number; y: number },
  to: { x: number; y: number }
): { degrees: number; cardinal: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  let rad = Math.atan2(dx, -dy);
  let deg = Math.round((rad * 180) / Math.PI);
  if (deg < 0) deg += 360;

  const cardinals: ('N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW')[] = [
    'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW',
  ];
  const idx = Math.round(deg / 45) % 8;

  return { degrees: deg, cardinal: cardinals[idx] };
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
  mode: 'rat' | 'sweep',
  disabledExtractionIds: string[] = []
): OptimizedRoute {
  // 1. Encuentra punto de spawn
  const spawnPoi =
    map.pois.find((p) => p.id === spawnPoiId) ||
    map.pois.find((p) => p.isSpawnPoint) ||
    map.pois[0];

  // Filtrar extracciones disponibles
  const availableExtractions = map.pois
    .filter((p) => p.isExtractionPoint)
    .filter((p) => !disabledExtractionIds.includes(p.id));

  const extractions = availableExtractions.length > 0
    ? availableExtractions
    : map.pois.filter((p) => p.isExtractionPoint);

  const transitObjectives: { quest: Quest; objective: Objective }[] = [];

  // 2. Resolver alternativas (OR) para cada objetivo activo
  // Un objetivo puede tener un poiId y varios alternativePoiIds
  interface ResolvedObjective {
    quest: Quest;
    objective: Objective;
    chosenPoi: POI;
    alternativePois: POI[];
    dependsOnObjectiveId?: string;
  }

  const resolvedObjectives: ResolvedObjective[] = [];

  activeQuests.forEach((q) => {
    q.objectives.forEach((obj) => {
      if (obj.mapId === 'any') {
        transitObjectives.push({ quest: q, objective: obj });
        return;
      }

      // Candidatos válidos de POIs para este objetivo
      const candidateIds: string[] = [];
      if (obj.poiId) candidateIds.push(obj.poiId);
      if (obj.alternativePoiIds) {
        obj.alternativePoiIds.forEach((altId) => {
          if (!candidateIds.includes(altId)) candidateIds.push(altId);
        });
      }

      // Filtrar los que pertenecen a este mapa
      const candidatePois = candidateIds
        .map((id) => map.pois.find((p) => p.id === id))
        .filter((p): p is POI => !!p);

      if (candidatePois.length === 0) {
        return; // No pertenece a este mapa
      }

      if (candidatePois.length === 1) {
        resolvedObjectives.push({
          quest: q,
          objective: obj,
          chosenPoi: candidatePois[0],
          alternativePois: [],
          dependsOnObjectiveId: obj.dependsOnObjectiveId,
        });
      } else {
        // CASO OR / ALTERNATIVA: Evaluar cuál de los candidatos es más conveniente desde el spawn
        let bestCandidate = candidatePois[0];
        let minCost = Infinity;

        candidatePois.forEach((cand) => {
          const dist = calculateDistance(spawnPoi.coordinates, cand.coordinates);
          const danger = dangerScoreMap[cand.dangerLevel];
          const cost = mode === 'rat' ? dist * 0.4 + danger * 1.5 : dist * 1.0 + danger * 0.2;

          if (cost < minCost) {
            minCost = cost;
            bestCandidate = cand;
          }
        });

        const otherAlternatives = candidatePois.filter((p) => p.id !== bestCandidate.id);

        resolvedObjectives.push({
          quest: q,
          objective: obj,
          chosenPoi: bestCandidate,
          alternativePois: otherAlternatives,
          dependsOnObjectiveId: obj.dependsOnObjectiveId,
        });
      }
    });
  });

  // 3. Agrupar objetivos por su POI elegido
  interface PoiCluster {
    poi: POI;
    assignments: RouteObjectiveAssignment[];
    dependentOnObjIds: string[];
    providedObjIds: string[];
  }

  const clusterMap = new Map<string, PoiCluster>();

  resolvedObjectives.forEach((ro) => {
    const existing = clusterMap.get(ro.chosenPoi.id);
    const assignment: RouteObjectiveAssignment = {
      quest: ro.quest,
      objective: ro.objective,
      chosenPoi: ro.chosenPoi,
      alternativePois: ro.alternativePois,
    };

    if (existing) {
      existing.assignments.push(assignment);
      existing.providedObjIds.push(ro.objective.id);
      if (ro.dependsOnObjectiveId) {
        existing.dependentOnObjIds.push(ro.dependsOnObjectiveId);
      }
    } else {
      clusterMap.set(ro.chosenPoi.id, {
        poi: ro.chosenPoi,
        assignments: [assignment],
        providedObjIds: [ro.objective.id],
        dependentOnObjIds: ro.dependsOnObjectiveId ? [ro.dependsOnObjectiveId] : [],
      });
    }
  });

  const targetClusters = Array.from(clusterMap.values());
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
  const completedObjectiveSet = new Set<string>();

  if (mode === 'rat') {
    // MODO RATA:
    // Máximo 2 POIs seguros, respetando dependencias
    const available = targetClusters.map((cl) => {
      const dist = calculateDistance(spawnPoi.coordinates, cl.poi.coordinates);
      const danger = dangerScoreMap[cl.poi.dangerLevel];
      const cost = dist * 0.4 + danger * 1.5;
      return { ...cl, dist, cost };
    });

    available.sort((a, b) => a.cost - b.cost);

    const selectedForRat = available.slice(0, 2);
    const excludedForRat = available.slice(2);

    // Si el segundo seleccionado depende de un objetivo que no está en el primero, comprobar precedencia
    selectedForRat.sort((a, b) => {
      if (b.dependentOnObjIds.some((depId) => a.providedObjIds.includes(depId))) {
        return -1; // a debe ir primero
      }
      if (a.dependentOnObjIds.some((depId) => b.providedObjIds.includes(depId))) {
        return 1; // b debe ir primero
      }
      return a.cost - b.cost;
    });

    selectedForRat.forEach((entry) => {
      const dist = calculateDistance(currentPos, entry.poi.coordinates);
      const bearing = calculateBearing(currentPos, entry.poi.coordinates);
      cumulativeDist += dist;

      steps.push({
        poi: entry.poi,
        type: 'objective',
        objectives: entry.assignments,
        distanceFromPrevious: Math.round(dist),
        cumulativeDistance: Math.round(cumulativeDist),
        bearing,
      });

      currentPos = entry.poi.coordinates;
      entry.providedObjIds.forEach((id) => completedObjectiveSet.add(id));
    });

    // Descartados
    excludedForRat.forEach((entry) => {
      entry.assignments.forEach((asg) => {
        skippedObjectives.push({
          quest: asg.quest,
          objective: asg.objective,
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
    // Visita TODOS los POIs activos respetando estrictamente dependencias (CASO 1: AND Secuencial)
    const unvisited = [...targetClusters];

    while (unvisited.length > 0) {
      // Filtrar clusters elegibles (cuyas dependencias previas estén ya satisfechas)
      const eligible = unvisited.filter((cl) => {
        if (cl.dependentOnObjIds.length === 0) return true;
        // Solo es elegible si las dependencias que están en el mismo mapa ya se visitaron
        return cl.dependentOnObjIds.every(
          (depId) =>
            completedObjectiveSet.has(depId) ||
            !resolvedObjectives.some((ro) => ro.objective.id === depId)
        );
      });

      // Si por alguna razón circular ninguno es elegible, tomar el primero restante
      const candidates = eligible.length > 0 ? eligible : unvisited;

      let bestIndexInCandidates = 0;
      let minCost = Infinity;

      for (let i = 0; i < candidates.length; i++) {
        const item = candidates[i];
        const dist = calculateDistance(currentPos, item.poi.coordinates);
        const danger = dangerScoreMap[item.poi.dangerLevel];
        const cost = dist * 1.0 + danger * 0.15;

        if (cost < minCost) {
          minCost = cost;
          bestIndexInCandidates = i;
        }
      }

      const nextCluster = candidates[bestIndexInCandidates];
      const originalIdx = unvisited.findIndex((u) => u.poi.id === nextCluster.poi.id);
      unvisited.splice(originalIdx, 1);

      const dist = calculateDistance(currentPos, nextCluster.poi.coordinates);
      const bearing = calculateBearing(currentPos, nextCluster.poi.coordinates);
      cumulativeDist += dist;

      steps.push({
        poi: nextCluster.poi,
        type: 'objective',
        objectives: nextCluster.assignments,
        distanceFromPrevious: Math.round(dist),
        cumulativeDistance: Math.round(cumulativeDist),
        bearing,
      });

      currentPos = nextCluster.poi.coordinates;
      nextCluster.providedObjIds.forEach((id) => completedObjectiveSet.add(id));
    }
  }

  // Paso final: Extracción más cercana desde el último POI
  if (extractions.length > 0) {
    let bestExtract = extractions[0];
    let minExtractCost = Infinity;

    extractions.forEach((ext) => {
      const dist = calculateDistance(currentPos, ext.coordinates);
      const danger = dangerScoreMap[ext.dangerLevel];
      const cost = mode === 'rat' ? dist * 0.5 + danger * 1.0 : dist;

      if (cost < minExtractCost) {
        minExtractCost = cost;
        bestExtract = ext;
      }
    });

    const distToExtract = calculateDistance(currentPos, bestExtract.coordinates);
    const bearing = calculateBearing(currentPos, bestExtract.coordinates);
    cumulativeDist += distToExtract;

    steps.push({
      poi: bestExtract,
      type: 'extraction',
      objectives: [],
      distanceFromPrevious: Math.round(distToExtract),
      cumulativeDistance: Math.round(cumulativeDist),
      bearing,
    });
  }

  const hasHighDanger = steps.some((s) => s.poi.dangerLevel === 'high');
  const dangerRating = mode === 'rat' ? (hasHighDanger ? 'medium' : 'low') : hasHighDanger ? 'high' : 'medium';
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
