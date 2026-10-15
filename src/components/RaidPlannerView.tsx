import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { allMaps, allQuests, getLocalized, getPOIById } from '../data/db';
import { MapPin, Navigation, ShieldCheck, Zap, CheckCircle2, Circle } from 'lucide-react';

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

  const activeQuests = allQuests.filter((q) => activeQuestIds.includes(q.id));

  // Map clustering: count active objectives per map
  const mapCounts: Record<string, number> = {};
  allMaps.forEach((m) => {
    mapCounts[m.id] = 0;
  });

  activeQuests.forEach((q) => {
    q.objectives.forEach((obj) => {
      if (obj.mapId === 'any') {
        allMaps.forEach((m) => {
          mapCounts[m.id] = (mapCounts[m.id] || 0) + 1;
        });
      } else if (mapCounts[obj.mapId] !== undefined) {
        mapCounts[obj.mapId] += 1;
      }
    });
  });

  const selectedMap = allMaps.find((m) => m.id === selectedMapId) || allMaps[0];
  const spawnPoints = selectedMap.pois.filter((p) => p.isSpawnPoint);
  const extractionPoints = selectedMap.pois.filter((p) => p.isExtractionPoint);

  // Objectives for the selected map
  const currentMapObjectives = activeQuests.flatMap((q) =>
    q.objectives
      .filter((obj) => obj.mapId === selectedMap.id || obj.mapId === 'any')
      .map((obj) => ({ quest: q, objective: obj }))
  );

  return (
    <div className="space-y-6">
      {/* Map Selector & Synergy Clustering */}
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
                      count > 0
                        ? 'bg-amber-500 text-neutral-950'
                        : 'bg-neutral-800 text-neutral-500'
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

      {/* Dynamic Spawn Point & Route Profile Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spawn Point Selector ("He aparecido aquí") */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
              {language === 'es' ? '2. Punto de Aparición (Spawn)' : '2. Infiltration Spawn'}
            </h3>
          </div>
          <p className="text-[11px] text-neutral-400 font-mono mb-3">
            {language === 'es'
              ? 'Una vez dentro de la partida, marca dónde has aparecido para recalcular la ruta:'
              : 'Once in-raid, select your spawn point to recalculate navigation:'}
          </p>

          <div className="space-y-2">
            {spawnPoints.map((spawn) => {
              const isSpawnSelected = spawnPoiId === spawn.id;

              return (
                <button
                  key={spawn.id}
                  onClick={() => setSpawnPoiId(spawn.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-mono flex items-center justify-between transition-all ${
                    isSpawnSelected
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{getLocalized(spawn.name, language)}</span>
                  </span>
                  {isSpawnSelected && (
                    <span className="text-[10px] uppercase font-bold text-cyan-400">
                      {language === 'es' ? 'SPAWN ACTUAL' : 'ACTIVE SPAWN'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Route Mode (Rat vs Sweep) */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-100">
              {language === 'es' ? '3. Modo de Navegación Táctica' : '3. Tactical Route Profile'}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Rat Mode */}
            <button
              onClick={() => setRouteMode('rat')}
              className={`p-3 rounded-lg border text-left transition-all ${
                routeMode === 'rat'
                  ? 'bg-emerald-500/15 border-emerald-500/80 ring-1 ring-emerald-500/40 text-emerald-300'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{language === 'es' ? 'Modo Rata' : 'Rat Mode'}</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono leading-tight">
                {language === 'es'
                  ? 'Prioriza 1-2 objetivos cercanos a la extracción. Evita zonas de alto peligro.'
                  : 'Prioritizes 1-2 objectives near extracts. Avoids high danger hotspots.'}
              </p>
            </button>

            {/* Sweep Mode */}
            <button
              onClick={() => setRouteMode('sweep')}
              className={`p-3 rounded-lg border text-left transition-all ${
                routeMode === 'sweep'
                  ? 'bg-amber-500/15 border-amber-500/80 ring-1 ring-amber-500/40 text-amber-300'
                  : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>{language === 'es' ? 'Modo Barrido' : 'Sweep Mode'}</span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono leading-tight">
                {language === 'es'
                  ? 'Recorre todos los objetivos activos en el mapa para maximizar XP y recompensas.'
                  : 'Visits all active quest POIs to maximize XP & rewards in a single raid.'}
              </p>
            </button>
          </div>

          <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950/60 rounded p-2 border border-neutral-800">
            {language === 'es' ? 'Fórmula de coste:' : 'Cost function:'}{' '}
            <code className="text-amber-400">
              {routeMode === 'rat' ? 'Cost = 0.4·Dist + 1.0·Peligro' : 'Cost = 1.0·Dist + 0.1·Peligro'}
            </code>
          </div>
        </div>
      </div>

      {/* In-Raid Live Objectives Checklist */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-100">
              {language === 'es' ? 'Objetivos en este Mapa' : 'Sector Raid Objectives'} ({currentMapObjectives.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            {language === 'es' ? 'Toca para marcar como completado' : 'Tap to mark completed in-game'}
          </span>
        </div>

        {currentMapObjectives.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500 font-mono">
            {language === 'es'
              ? 'No tienes misiones activas en este mapa. Selecciona misiones en la pestaña anterior.'
              : 'No active quests in this sector. Choose quests in the previous tab.'}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60 mt-3">
            {currentMapObjectives.map(({ quest, objective }, idx) => {
              const poi = objective.poiId ? getPOIById(objective.poiId) : null;
              const isCompleted = completedObjectiveIds.includes(objective.id);

              return (
                <div
                  key={objective.id}
                  onClick={() => toggleCompletedObjective(objective.id)}
                  className={`py-3 px-2 flex items-start justify-between cursor-pointer rounded-lg transition-colors ${
                    isCompleted ? 'bg-neutral-950/60 opacity-50' : 'hover:bg-neutral-950/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-neutral-600 hover:text-amber-400" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                          #{idx + 1} {getLocalized(quest.title, language)}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          ({quest.vendor})
                        </span>
                      </div>
                      <div className={`text-xs ${isCompleted ? 'line-through text-neutral-400' : 'text-neutral-200'}`}>
                        {getLocalized(objective.description, language)}
                      </div>
                      {poi && (
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-cyan-300">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{getLocalized(poi.name, language)}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase ${
                            poi.dangerLevel === 'high' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {poi.dangerLevel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Extractions for this map */}
      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-4">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-2">
          {language === 'es' ? 'Zonas de Extracción en este Sector' : 'Available Extraction Zones'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {extractionPoints.map((ext) => (
            <div
              key={ext.id}
              className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs font-mono"
            >
              <span className="text-neutral-300">{getLocalized(ext.name, language)}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                {language === 'es' ? 'Extracción' : 'Extraction'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
