import React from 'react';
import { type GameMap, type POI } from '../data/schemas';
import { type OptimizedRoute } from '../services/optimizer/raidOptimizer';
import { getLocalized } from '../data/db';
import { usePlayerStore } from '../store/usePlayerStore';

interface TacticalMapViewerProps {
  map: GameMap;
  route: OptimizedRoute;
  selectedPoiId?: string | null;
  onSelectPoi?: (poi: POI) => void;
}

export const TacticalMapViewer: React.FC<TacticalMapViewerProps> = ({
  map,
  route,
  selectedPoiId,
  onSelectPoi,
}) => {
  const { language } = usePlayerStore();

  // Mapear qué POIs forman parte de la ruta y su número de orden
  const stepMap = new Map<string, { stepNumber: number; type: 'spawn' | 'objective' | 'extraction' }>();
  route.steps.forEach((step, idx) => {
    stepMap.set(step.poi.id, { stepNumber: idx, type: step.type });
  });

  // Generar el camino SVG para las líneas de la ruta
  const routePoints = route.steps.map((s) => `${s.poi.coordinates.x * 6},${s.poi.coordinates.y * 4}`);
  const polylinePoints = routePoints.join(' ');

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 overflow-hidden relative shadow-2xl">
      {/* HUD Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-200">
            {language === 'es' ? 'Radar Táctico de Sector' : 'Tactical Sector Radar'} • {getLocalized(map.name, language)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Spawn</span>
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{language === 'es' ? 'Objetivo' : 'Objective'}</span>
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>{language === 'es' ? 'Extracción' : 'Extraction'}</span>
          </span>
        </div>
      </div>

      {/* SVG Canvas (600 x 400 coordinate space) */}
      <div className="relative w-full aspect-[3/2] bg-[#070b12] rounded-xl border border-neutral-800/80 overflow-hidden shadow-inner select-none">
        {/* Radar Background Grid */}
        <svg
          viewBox="0 0 600 400"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="600" height="400" fill="url(#grid)" />
          {/* Radar Circles */}
          <circle cx="300" cy="200" r="100" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" />
          <circle cx="300" cy="200" r="180" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="4 4" />
        </svg>

        {/* Tactical Route Polyline */}
        <svg viewBox="0 0 600 400" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
            </marker>
          </defs>

          {/* Polyline Route */}
          {route.steps.length > 1 && (
            <>
              {/* Outer Glow */}
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="6"
                strokeOpacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Core Path with animated dash */}
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>

        {/* POI Nodes */}
        {map.pois.map((poi) => {
          const inRoute = stepMap.get(poi.id);
          const isSelected = selectedPoiId === poi.id;

          // Coordenadas absolutas en el SVG 600x400
          const leftPercent = `${poi.coordinates.x}%`;
          const topPercent = `${poi.coordinates.y}%`;

          let nodeColor = 'bg-neutral-800 text-neutral-400 border-neutral-700';
          let ringColor = '';

          if (inRoute) {
            if (inRoute.type === 'spawn') {
              nodeColor = 'bg-cyan-500 text-neutral-950 border-cyan-300 font-black shadow-lg shadow-cyan-500/50';
              ringColor = 'ring-4 ring-cyan-500/20';
            } else if (inRoute.type === 'extraction') {
              nodeColor = 'bg-purple-500 text-neutral-950 border-purple-300 font-black shadow-lg shadow-purple-500/50';
              ringColor = 'ring-4 ring-purple-500/20';
            } else {
              nodeColor = 'bg-amber-500 text-neutral-950 border-amber-300 font-black shadow-lg shadow-amber-500/50';
              ringColor = 'ring-4 ring-amber-500/20';
            }
          } else if (poi.dangerLevel === 'high') {
            nodeColor = 'bg-red-950/80 text-red-400 border-red-800/60 opacity-60';
          }

          return (
            <div
              key={poi.id}
              onClick={() => onSelectPoi?.(poi)}
              style={{ left: leftPercent, top: topPercent }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform ${
                isSelected ? 'scale-125 z-30' : inRoute ? 'z-20 hover:scale-115' : 'opacity-40 hover:opacity-90 z-10'
              }`}
            >
              {/* Marker Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-[11px] font-mono transition-all ${nodeColor} ${ringColor}`}
              >
                {inRoute ? (
                  inRoute.type === 'spawn' ? 'S' : inRoute.type === 'extraction' ? 'E' : inRoute.stepNumber
                ) : (
                  <span className="w-2 h-2 rounded-full bg-current" />
                )}
              </div>

              {/* Tooltip on Hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-neutral-950/95 border border-neutral-700 px-2 py-1 rounded text-[10px] font-mono text-neutral-200 shadow-xl z-40">
                <div className="font-bold">{getLocalized(poi.name, language)}</div>
                <div className="text-[9px] text-neutral-400">
                  {poi.isSpawnPoint
                    ? 'Infiltración'
                    : poi.isExtractionPoint
                    ? 'Punto de Extracción'
                    : `Peligro: ${poi.dangerLevel.toUpperCase()}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Telemetry stats */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-900">
        <div className="flex items-center gap-4">
          <span>
            {language === 'es' ? 'Distancia Estimada:' : 'Estimated Dist:'}{' '}
            <strong className="text-amber-400">{route.totalDistance}m</strong>
          </span>
          <span>
            {language === 'es' ? 'Tiempo Estimado:' : 'Est. Duration:'}{' '}
            <strong className="text-cyan-400">~{route.estimatedDurationMinutes} min</strong>
          </span>
          <span>
            {language === 'es' ? 'Riesgo Global:' : 'Threat Level:'}{' '}
            <strong
              className={`uppercase font-bold ${
                route.dangerRating === 'high'
                  ? 'text-red-400'
                  : route.dangerRating === 'medium'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {route.dangerRating}
            </strong>
          </span>
        </div>

        <span className="text-[10px] text-neutral-500">
          {route.mode === 'rat'
            ? (language === 'es' ? 'Perfil: Máxima Supervivencia' : 'Profile: Maximum Survival')
            : (language === 'es' ? 'Perfil: Limpieza Total (XP)' : 'Profile: Full Map Sweep')}
        </span>
      </div>
    </div>
  );
};
