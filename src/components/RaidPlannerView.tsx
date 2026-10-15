import React, { useMemo, useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { allMaps, allQuests, getLocalized } from '../data/db';
import { type POI } from '../data/schemas';
import { optimizeRaidRoute } from '../services/optimizer/raidOptimizer';
import { TacticalMapViewer } from './TacticalMapViewer';
import {
  MapPin,
  Navigation,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Circle,
  AlertTriangle,
  LogOut,
  Info,
} from 'lucide-react';

export const RaidPlannerView: React.FC = () => {
  const {
    language,
    activeQuestIds,
    selectedMapId,
    setSelectedMapId,
    spawnPoiId,
    setSpawnPoiId,
    routeMode,
    setRouteMode,
    completedObjectiveIds,
    toggleCompletedObjective,
  } = usePlayerStore();

  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);

  const activeQuests = useMemo(
    () => allQuests.filter((q) => activeQuestIds.includes(q.id)),
    [activeQuestIds]
  );

  // Map clustering: contar objetivos activos por sector
  const mapCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allMaps.forEach((m) => (counts[m.id] = 0));

    activeQuests.forEach((q) => {
      q.objectives.forEach((obj) => {
        if (obj.mapId === 'any') {
          allMaps.forEach((m) => (counts[m.id] = (counts[m.id] || 0) + 1));
        } else if (counts[obj.mapId] !== undefined) {
          counts[obj.mapId] += 1;
        }
      });
    });
    return counts;
  }, [activeQuests]);

  const selectedMap = allMaps.find((m) => m.id === selectedMapId) || allMaps[0];
  const spawnPoints = selectedMap.pois.filter((p) => p.isSpawnPoint);

  // Calcular ruta táctica optimizada
  const optimizedRoute = useMemo(() => {
    return optimizeRaidRoute(selectedMap, activeQuests, spawnPoiId, routeMode);
  }, [selectedMap, activeQuests, spawnPoiId, routeMode]);

  return (
    <div className="space-y-6">
      {/* 1. Selector de Sector y Sinergia */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-100">
              {language === 'es' ? '1. Selecciona Mapa de Incursión' : '1. Select Raid Sector'}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            {language === 'es' ? 'Clustering de Sinergia' : 'Synergy Clustering'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {allMaps.map((map) => {
            const count = mapCounts[map.id] || 0;
            const isSelected = selectedMap.id === map.id;

            return (
              <button
                key={map.id}
                onClick={() => setSelectedMapId(map.id)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/80 ring-1 ring-amber-500/40 shadow-sm'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-bold text-xs uppercase ${isSelected ? 'text-amber-300' : 'text-neutral-200'}`}>
                    {getLocalized(map.name, language)}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                      count > 0 ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {count} {language === 'es' ? 'objs' : 'objs'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                  {getLocalized(map.description, language)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Configuración Táctica: Spawn y Perfil de Incursión */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spawn Point Selector ("He aparecido aquí") */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
              {language === 'es' ? '2. Punto de Infiltración (Spawn)' : '2. Infiltration Spawn'}
            </h3>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono mb-3">
            {language === 'es'
              ? 'Marca dónde has aparecido para calcular la ruta óptima desde ese punto:'
              : 'Select your spawn point to route directly from where you drop:'}
          </p>

          <div className="space-y-2">
            {spawnPoints.map((spawn) => {
              const isSpawnSelected = (spawnPoiId || spawnPoints[0]?.id) === spawn.id;

              return (
                <button
                  key={spawn.id}
                  onClick={() => setSpawnPoiId(spawn.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition-all ${
                    isSpawnSelected
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold shadow-sm shadow-cyan-500/20'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>{getLocalized(spawn.name, language)}</span>
                  </span>
                  {isSpawnSelected && (
                    <span className="text-[10px] uppercase font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                      {language === 'es' ? 'SPAWN ACTUAL' : 'CURRENT SPAWN'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tactical Navigation Profile (Rat vs Sweep) */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
              {language === 'es' ? '3. Perfil de Ruta Táctica' : '3. Tactical Route Profile'}
            </h3>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono mb-3">
            {language === 'es'
              ? 'Elige cómo pondera el algoritmo la supervivencia contra la codicia de XP:'
              : 'Select whether the algorithm prioritizes extraction safety or maximum loot:'}
          </p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Rat Mode */}
            <button
              onClick={() => setRouteMode('rat')}
              className={`p-3 rounded-lg border text-left transition-all ${
                routeMode === 'rat'
                  ? 'bg-emerald-500/15 border-emerald-500/90 ring-2 ring-emerald-500/30 text-emerald-300 shadow-md'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{language === 'es' ? 'Modo Rata' : 'Rat Mode'}</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono leading-tight">
                {language === 'es'
                  ? 'Completa 1-2 objetivos cercanos y seguros. Evita zonas calientes y asegura la extracción rápida.'
                  : 'Complete 1-2 safe nearby objectives. Avoid hotzones and secure rapid extraction.'}
              </p>
            </button>

            {/* Sweep Mode */}
            <button
              onClick={() => setRouteMode('sweep')}
              className={`p-3 rounded-lg border text-left transition-all ${
                routeMode === 'sweep'
                  ? 'bg-amber-500/15 border-amber-500/90 ring-2 ring-amber-500/30 text-amber-300 shadow-md'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{language === 'es' ? 'Modo Barrido' : 'Sweep Mode'}</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono leading-tight">
                {language === 'es'
                  ? 'Recorre todos los objetivos activos en el mapa (TSP) para maximizar recompensas en 1 sola raid.'
                  : 'Hits all active quest POIs across the map to maximize progression in 1 raid.'}
              </p>
            </button>
          </div>

          <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950/60 rounded p-2 border border-neutral-800 flex items-center justify-between">
            <span>{language === 'es' ? 'Comportamiento actual:' : 'Current logic:'}</span>
            <span className="font-bold text-amber-300">
              {routeMode === 'rat'
                ? (language === 'es' ? 'Filtra objetivos de alto peligro y limita a 2 POIs' : 'Filters high hazard POIs & caps at 2 POIs')
                : (language === 'es' ? 'Traza circuito completo por todos los POIs' : 'Routes full circuit through all active POIs')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Mapa Radar Táctico Interactivo */}
      <TacticalMapViewer
        map={selectedMap}
        route={optimizedRoute}
        selectedPoiId={selectedPoi?.id}
        onSelectPoi={setSelectedPoi}
      />

      {/* 4. Plan de Vuelo Táctico (Ruta Paso a Paso) */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-100">
              {language === 'es' ? 'Plan de Vuelo Táctico (Ruta Calculada)' : 'Tactical Flight Plan (Calculated Route)'}
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
            {optimizedRoute.steps.length} {language === 'es' ? 'Puntos de Ruta' : 'Waypoints'}
          </span>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {optimizedRoute.steps.map((step, idx) => {
            const isSpawn = step.type === 'spawn';
            const isExtract = step.type === 'extraction';

            return (
              <div
                key={`${step.poi.id}-${idx}`}
                className={`p-3.5 rounded-xl border transition-all ${
                  isSpawn
                    ? 'bg-cyan-950/30 border-cyan-800/60'
                    : isExtract
                    ? 'bg-purple-950/30 border-purple-800/60'
                    : 'bg-neutral-950/70 border-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Step Number Circle */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        isSpawn
                          ? 'bg-cyan-500 text-neutral-950'
                          : isExtract
                          ? 'bg-purple-500 text-neutral-950'
                          : 'bg-amber-500 text-neutral-950'
                      }`}
                    >
                      {isSpawn ? 'S' : isExtract ? 'E' : idx}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs uppercase text-neutral-100">
                          {getLocalized(step.poi.name, language)}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
                            isSpawn
                              ? 'bg-cyan-900 text-cyan-200'
                              : isExtract
                              ? 'bg-purple-900 text-purple-200'
                              : step.poi.dangerLevel === 'high'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {isSpawn
                            ? (language === 'es' ? 'Infiltración' : 'Infiltration')
                            : isExtract
                            ? (language === 'es' ? 'Extracción' : 'Extraction')
                            : (language === 'es'
                                ? `Peligro ${step.poi.dangerLevel === 'high' ? 'Alto' : step.poi.dangerLevel === 'medium' ? 'Medio' : 'Bajo'}`
                                : `Hazard ${step.poi.dangerLevel === 'high' ? 'High' : step.poi.dangerLevel === 'medium' ? 'Medium' : 'Low'}`)}
                        </span>
                      </div>

                      {/* Distance telemetry */}
                      <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                        {idx === 0
                          ? (language === 'es' ? 'Punto de partida' : 'Starting infiltration')
                          : `+${step.distanceFromPrevious}m (${language === 'es' ? 'Acumulado:' : 'Total:'} ${step.cumulativeDistance}m)`}
                      </p>
                    </div>
                  </div>

                  {isExtract && (
                    <span className="text-[10px] font-mono font-bold uppercase text-purple-400 flex items-center gap-1 bg-purple-950 px-2 py-1 rounded border border-purple-800">
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{language === 'es' ? '¡Salida Segura!' : 'Safe Exit!'}</span>
                    </span>
                  )}
                </div>

                {/* Objectives attached to this step */}
                {step.objectives.length > 0 && (
                  <div className="mt-3 pl-10 space-y-2 border-t border-neutral-800/60 pt-2.5">
                    {step.objectives.map(({ quest, objective }) => {
                      const isDone = completedObjectiveIds.includes(objective.id);

                      return (
                        <div
                          key={objective.id}
                          onClick={() => toggleCompletedObjective(objective.id)}
                          className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                            isDone ? 'bg-neutral-900/60 opacity-50' : 'bg-neutral-900/90 hover:bg-neutral-800/80'
                          }`}
                        >
                          <button className="mt-0.5">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-neutral-500 hover:text-amber-400" />
                            )}
                          </button>
                          <div className="flex-1">
                            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase mr-2">
                              [{quest.vendor}] {getLocalized(quest.title, language)}:
                            </span>
                            <span className={`text-xs ${isDone ? 'line-through text-neutral-400' : 'text-neutral-200'}`}>
                              {getLocalized(objective.description, language)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Objetivos Omitidos por Seguridad en Modo Rata (DIFFERENTIATOR) */}
      {routeMode === 'rat' && optimizedRoute.skippedObjectives.length > 0 && (
        <div className="bg-neutral-900/80 border border-amber-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-neutral-800">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
              {language === 'es'
                ? 'Objetivos Descartados por Seguridad en Modo Rata'
                : 'Objectives Skipped for Safety in Rat Mode'} ({optimizedRoute.skippedObjectives.length})
            </h3>
          </div>

          <p className="text-[11px] font-mono text-neutral-400 my-2">
            {language === 'es'
              ? 'El Modo Rata te recomienda NO intentar estos objetivos en esta incursión para garantizar que salgas con vida:'
              : 'Rat Mode intentionally excludes these objectives from this drop to guarantee safe survival:'}
          </p>

          <div className="space-y-2 mt-2">
            {optimizedRoute.skippedObjectives.map(({ quest, objective, reason }) => (
              <div
                key={objective.id}
                className="p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="text-neutral-400">[{quest.vendor}]</span>{' '}
                  <span className="font-bold text-neutral-200">{getLocalized(quest.title, language)}:</span>{' '}
                  <span className="text-neutral-300">{getLocalized(objective.description, language)}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-900 whitespace-nowrap">
                  {getLocalized(reason, language)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Objetivos en Tránsito (Cualquier Sector) */}
      {optimizedRoute.transitObjectives.length > 0 && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 text-xs font-mono text-neutral-300">
          <div className="flex items-center gap-2 font-bold uppercase text-cyan-400 mb-2">
            <Info className="w-4 h-4" />
            <span>{language === 'es' ? 'Objetivos Pasivos / En Tránsito' : 'Passive In-Transit Objectives'}</span>
          </div>
          <p className="text-[11px] text-neutral-400 mb-2">
            {language === 'es'
              ? 'Estos objetivos no tienen un POI fijo y pueden completarse mientras te desplazas por el mapa:'
              : 'These objectives do not require a fixed POI and can be progressed on-the-go:'}
          </p>
          <ul className="space-y-1 list-disc pl-5 text-[11px] text-neutral-300">
            {optimizedRoute.transitObjectives.map(({ quest, objective }) => (
              <li key={objective.id}>
                <strong>[{quest.vendor}] {getLocalized(quest.title, language)}:</strong>{' '}
                {getLocalized(objective.description, language)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
