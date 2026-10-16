import React, { useRef, useState, useCallback } from 'react';
import { type GameMap, type POI } from '../data/schemas';
import { type OptimizedRoute } from '../services/optimizer/raidOptimizer';
import { getLocalized } from '../data/db';
import { usePlayerStore } from '../store/usePlayerStore';
import { MapPin, Compass, ShieldAlert, Navigation } from 'lucide-react';

interface TacticalMapViewerProps {
  map: GameMap;
  route: OptimizedRoute;
  selectedPoi: POI | null;
  onSelectPoi: (poi: POI | null) => void;
  disabledExtractionIds: string[];
  onToggleExtraction: (poiId: string) => void;
  onSetSpawn: (poiId: string) => void;
}

export const TacticalMapViewer: React.FC<TacticalMapViewerProps> = ({
  map,
  route,
  selectedPoi,
  onSelectPoi,
  disabledExtractionIds,
  onToggleExtraction,
  onSetSpawn,
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

  // Objetivos de la ruta que coincidan con el POI seleccionado
  const selectedPoiObjectives = selectedPoi
    ? route.steps.find((s) => s.poi.id === selectedPoi.id)?.objectives || []
    : [];

  // ── Zoom / Pan ────────────────────────────────────────────────────────────
  const MIN_ZOOM = 0.8;
  const MAX_ZOOM = 4.0;
  const ZOOM_SENSITIVITY = 0.0012;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    setZoom((prevZoom) => {
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom + delta * prevZoom));
      const scale = nextZoom / prevZoom;
      setPan((prev) => ({
        x: cursorX - scale * (cursorX - prev.x),
        y: cursorY - scale * (cursorY - prev.y),
      }));
      return nextZoom;
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isPanning.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handlePointerUp = useCallback(() => { isPanning.current = false; }, []);


  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 overflow-hidden relative shadow-2xl space-y-4">
      {/* HUD Header */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-200">
            {language === 'es' ? 'Radar Táctico de Sector' : 'Tactical Sector Radar'} • {getLocalized(map.name, language)}
          </span>
        </div>

        {/* Legend */}
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

      {/* SVG Canvas — zoomable/pannable */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[3/2] bg-[#070b12] rounded-xl border border-neutral-800/80 overflow-hidden shadow-inner select-none cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Zoomable / pannable inner layer */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        >
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
          {/* Radar Concentric Rings */}
          <circle cx="300" cy="200" r="100" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 3" />
          <circle cx="300" cy="200" r="180" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="4 4" />
        </svg>

        {/* Sector Specific Topographic Features */}
        <svg viewBox="0 0 600 400" className="absolute inset-0 w-full h-full pointer-events-none">
          {map.id === 'dam_battlegrounds' && (
            <g opacity="0.4">
              {/* River Channel */}
              <path
                d="M 60,380 Q 180,240 320,260 T 580,120"
                fill="none"
                stroke="#0284c7"
                strokeWidth="28"
                strokeOpacity="0.3"
                strokeLinecap="round"
              />
              {/* Hydroponic Dome outline */}
              <circle cx="168" cy="140" r="45" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" />
              {/* Power Plant structure */}
              <rect x="270" y="130" width="60" height="60" fill="#334155" fillOpacity="0.3" stroke="#64748b" strokeWidth="1" />
            </g>
          )}

          {map.id === 'buried_city' && (
            <g opacity="0.4">
              {/* Highway overpass line */}
              <line x1="60" y1="60" x2="520" y2="100" stroke="#f59e0b" strokeWidth="3" strokeDasharray="8 6" />
              {/* Urban Building Blocks */}
              <rect x="230" y="130" width="70" height="60" fill="#334155" fillOpacity="0.4" stroke="#64748b" strokeWidth="1" />
              <rect x="340" y="110" width="80" height="70" fill="#334155" fillOpacity="0.4" stroke="#64748b" strokeWidth="1" />
              <rect x="180" y="230" width="90" height="70" fill="#334155" fillOpacity="0.4" stroke="#64748b" strokeWidth="1" />
              {/* Encroaching Sand Dune Silhouette */}
              <path d="M 0,380 Q 200,310 400,340 T 600,280 L 600,400 L 0,400 Z" fill="#d97706" fillOpacity="0.1" />
            </g>
          )}

          {map.id === 'the_spaceport' && (
            <g opacity="0.4">
              {/* Runway Airstrip */}
              <line x1="80" y1="320" x2="520" y2="320" stroke="#cbd5e1" strokeWidth="18" strokeOpacity="0.25" strokeLinecap="square" />
              <line x1="100" y1="320" x2="500" y2="320" stroke="#f8fafc" strokeWidth="1.5" strokeDasharray="16 12" strokeOpacity="0.5" />
              {/* Launchpad circle */}
              <circle cx="300" cy="180" r="50" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 4" />
              {/* Radar Dish arc */}
              <circle cx="420" cy="120" r="35" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 2" />
            </g>
          )}
        </svg>

        {/* Tactical Route Polyline */}
        <svg viewBox="0 0 600 400" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
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

        </div>{/* end zoomable inner layer */}

        {/* Compass Rose — outside zoom layer, fixed to container corner */}
        <div className="absolute top-3 right-3 z-40 bg-neutral-950/80 border border-neutral-800 px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>N ▲</span>
        </div>

        {/* Re-open zoomable inner layer for POI Nodes */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        >

        {/* POI Nodes */}
        {map.pois.map((poi) => {
          const inRoute = stepMap.get(poi.id);
          const isSelected = selectedPoi?.id === poi.id;
          const isBlocked = disabledExtractionIds.includes(poi.id);

          const leftPercent = `${poi.coordinates.x}%`;
          const topPercent = `${poi.coordinates.y}%`;

          let nodeColor = 'bg-neutral-800 text-neutral-400 border-neutral-700';
          let ringColor = '';

          if (isBlocked) {
            nodeColor = 'bg-red-950 text-red-500 border-red-800 line-through opacity-50';
          } else if (inRoute) {
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
              onClick={() => onSelectPoi(isSelected ? null : poi)}
              style={{ left: leftPercent, top: topPercent }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform ${
                isSelected ? 'scale-135 z-30' : inRoute ? 'z-20 hover:scale-115' : 'opacity-40 hover:opacity-90 z-10'
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
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-neutral-950/95 border border-neutral-700 px-2.5 py-1 rounded text-[10px] font-mono text-neutral-200 shadow-xl z-40">
                <div className="font-bold">{getLocalized(poi.name, language)}</div>
                <div className="text-[9px] text-neutral-400">
                  {poi.isSpawnPoint
                    ? (language === 'es' ? 'Punto de Infiltración' : 'Infiltration Point')
                    : poi.isExtractionPoint
                    ? (language === 'es' ? 'Punto de Extracción' : 'Extraction Site')
                    : (language === 'es'
                        ? `Peligro: ${poi.dangerLevel === 'high' ? 'ALTO' : poi.dangerLevel === 'medium' ? 'MEDIO' : 'BAJO'}`
                        : `Hazard: ${poi.dangerLevel.toUpperCase()}`)}
                </div>
              </div>
            </div>
          );
        })}
        </div>{/* end zoomable inner layer */}

        {/* Zoom Controls HUD (fixed to container, not zoomed) */}
        <div className="absolute bottom-2 right-2 z-50 flex flex-col gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(4.0, +(z + 0.25).toFixed(2))); }}
            className="w-7 h-7 rounded bg-neutral-900/90 border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 text-base font-mono flex items-center justify-center transition-colors"
            title={language === 'es' ? 'Acercar' : 'Zoom In'}
          >+</button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(0.8, +(z - 0.25).toFixed(2))); }}
            className="w-7 h-7 rounded bg-neutral-900/90 border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 text-base font-mono flex items-center justify-center transition-colors"
            title={language === 'es' ? 'Alejar' : 'Zoom Out'}
          >−</button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); resetView(); }}
            className="w-7 h-7 rounded bg-neutral-900/90 border border-neutral-700 text-neutral-400 hover:text-amber-400 hover:border-amber-700 text-[10px] font-mono flex items-center justify-center transition-colors"
            title={language === 'es' ? 'Restablecer vista' : 'Reset view'}
          >⌂</button>
        </div>

        {/* Zoom % indicator */}
        <div className="absolute bottom-2 left-2 z-50 text-[10px] font-mono text-neutral-500 bg-neutral-950/70 px-1.5 py-0.5 rounded pointer-events-none">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Selected POI Intel Drawer */}
      {selectedPoi && (
        <div className="bg-neutral-900/90 border border-neutral-700/80 rounded-xl p-3.5 space-y-2.5 transition-all animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <div>
                <h4 className="font-bold text-xs uppercase text-neutral-100">
                  {getLocalized(selectedPoi.name, language)}
                </h4>
                <p className="text-[10px] font-mono text-neutral-400">
                  {language === 'es' ? 'Sector:' : 'Sector:'} {getLocalized(map.name, language)} • (X: {selectedPoi.coordinates.x}%, Y: {selectedPoi.coordinates.y}%)
                </p>
              </div>
            </div>

            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                selectedPoi.dangerLevel === 'high'
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : selectedPoi.dangerLevel === 'medium'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {language === 'es'
                ? `Peligro ${selectedPoi.dangerLevel === 'high' ? 'Alto' : selectedPoi.dangerLevel === 'medium' ? 'Medio' : 'Bajo'}`
                : `Hazard ${selectedPoi.dangerLevel === 'high' ? 'High' : selectedPoi.dangerLevel === 'medium' ? 'Medium' : 'Low'}`}
            </span>
          </div>

          {/* Objectives at this POI */}
          {selectedPoiObjectives.length > 0 && (
            <div className="bg-neutral-950/80 rounded-lg p-2.5 space-y-1.5 border border-neutral-800">
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                {language === 'es' ? 'Objetivos en esta ubicación:' : 'Objectives at this location:'}
              </span>
              {selectedPoiObjectives.map(({ quest, objective }) => (
                <div key={objective.id} className="text-xs text-neutral-300 flex items-start gap-1.5">
                  <span className="text-amber-500 font-mono">▸</span>
                  <span>
                    <strong>[{quest.vendor}]</strong> {getLocalized(objective.description, language)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-800">
            {selectedPoi.isSpawnPoint && (
              <button
                onClick={() => onSetSpawn(selectedPoi.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-200 text-xs font-mono hover:bg-cyan-900/60 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>{language === 'es' ? 'Fijar como Spawn' : 'Set as Infiltration Point'}</span>
              </button>
            )}

            {selectedPoi.isExtractionPoint && (
              <button
                onClick={() => onToggleExtraction(selectedPoi.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                  disabledExtractionIds.includes(selectedPoi.id)
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-200 hover:bg-emerald-900'
                    : 'bg-red-950 border-red-800 text-red-200 hover:bg-red-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {disabledExtractionIds.includes(selectedPoi.id)
                    ? (language === 'es' ? 'Habilitar Extracción' : 'Enable Extraction')
                    : (language === 'es' ? 'Marcar Bloqueada / Inaccesible' : 'Mark as Blocked / Closed')}
                </span>
              </button>
            )}

            <button
              onClick={() => onSelectPoi(null)}
              className="text-xs text-neutral-400 hover:text-neutral-200 font-mono ml-auto py-1 px-2"
            >
              {language === 'es' ? 'Cerrar' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Legend & Telemetry stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-900">
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
              {route.dangerRating === 'high'
                ? (language === 'es' ? 'Alto' : 'High')
                : route.dangerRating === 'medium'
                ? (language === 'es' ? 'Medio' : 'Moderate')
                : (language === 'es' ? 'Bajo' : 'Low')}
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
