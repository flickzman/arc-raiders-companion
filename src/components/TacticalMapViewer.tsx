import React, { useState, useRef, useCallback } from 'react';
import { type GameMap, type POI } from '../data/schemas';
import { type OptimizedRoute } from '../services/optimizer/raidOptimizer';
import { getLocalized } from '../data/db';
import { usePlayerStore } from '../store/usePlayerStore';
import {
  MapPin,
  Compass,
  ShieldAlert,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Copy,
  Check,
  X,
} from 'lucide-react';

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

  // Estados de Zoom y Pan
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Modo Calibrador de Coordenadas
  const [isCalibratorMode, setIsCalibratorMode] = useState(false);
  const [calibratorPoint, setCalibratorPoint] = useState<{ x: number; y: number } | null>(null);
  const [copiedCoord, setCopiedCoord] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Mapear qué POIs forman parte de la ruta y su número de orden
  const stepMap = new Map<string, { stepNumber: number; type: 'spawn' | 'objective' | 'extraction' }>();
  route.steps.forEach((step, idx) => {
    stepMap.set(step.poi.id, { stepNumber: idx, type: step.type });
  });

  // Generar el camino SVG para las líneas de la ruta en espacio 0..1000
  const routePoints = route.steps.map((s) => `${s.poi.coordinates.x * 10},${s.poi.coordinates.y * 10}`);
  const polylinePoints = routePoints.join(' ');

  // Objetivos de la ruta que coincidan con el POI seleccionado
  const selectedPoiObjectives = selectedPoi
    ? route.steps.find((s) => s.poi.id === selectedPoi.id)?.objectives || []
    : [];

  // Gestión de Pan (arrastrar)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCalibratorMode) return;
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Click en Modo Calibrador para capturar porcentaje exacto de coordenadas (0..100%)
  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isCalibratorMode || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const rawPctX = (clickX / rect.width) * 100;
      const rawPctY = (clickY / rect.height) * 100;

      const roundedX = Math.round(Math.max(0, Math.min(100, rawPctX)) * 10) / 10;
      const roundedY = Math.round(Math.max(0, Math.min(100, rawPctY)) * 10) / 10;

      setCalibratorPoint({ x: roundedX, y: roundedY });
    },
    [isCalibratorMode]
  );

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleCopyCoord = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCoord(true);
    setTimeout(() => setCopiedCoord(false), 2000);
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 overflow-hidden relative shadow-2xl space-y-4">
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-neutral-800/80 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-neutral-200">
            {language === 'es' ? 'Sector Táctico Real' : 'Live Sector Radar'} • {getLocalized(map.name, language)}
          </span>
        </div>

        {/* Toolbar: Zoom controls & Calibrator toggle */}
        <div className="flex items-center gap-2">
          {/* Calibrator Toggle */}
          <button
            onClick={() => {
              setIsCalibratorMode(!isCalibratorMode);
              if (isCalibratorMode) setCalibratorPoint(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all ${
              isCalibratorMode
                ? 'bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title={language === 'es' ? 'Activar modo calibración de coordenadas' : 'Toggle coordinate calibrator'}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{language === 'es' ? 'Calibrador' : 'Calibrator'}</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
              className="p-1 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="px-1.5 text-[10px] font-mono text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
              title="Reset view"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
              className="p-1 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono pl-2">
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
      </div>

      {/* Main Map Canvas with Zoom & Pan */}
      <div
        className={`relative w-full aspect-[3/2] bg-[#070b12] rounded-xl border border-neutral-800/80 overflow-hidden shadow-inner select-none ${
          isCalibratorMode ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleMapClick}
      >
        <div
          ref={containerRef}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative w-full h-full"
        >
          {/* Real Official Game Map Image */}
          <img
            src={map.imageUrl}
            alt={getLocalized(map.name, language)}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none brightness-90 contrast-110"
            onError={(e) => {
              // Si la imagen no está disponible temporalmente, oculta la etiqueta para no romper el visor
              (e.target as HTMLElement).style.display = 'none';
            }}
          />

          {/* Subtle Tactical Radar Grid Overlay */}
          <svg
            viewBox="0 0 1000 1000"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
          >
            <defs>
              <pattern id="grid100" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="1000" height="1000" fill="url(#grid100)" />
          </svg>

          {/* Tactical Route Polyline (1000 x 1000 coordinate space) */}
          <svg viewBox="0 0 1000 1000" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>

            {route.steps.length > 1 && (
              <>
                {/* Outer Glow */}
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="8"
                  strokeOpacity="0.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Core Path with animated dash */}
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="3.5"
                  strokeDasharray="10 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
          </svg>

          {/* POI Nodes Overlay */}
          {map.pois.map((poi) => {
            const inRoute = stepMap.get(poi.id);
            const isSelected = selectedPoi?.id === poi.id;
            const isBlocked = disabledExtractionIds.includes(poi.id);

            const leftPercent = `${poi.coordinates.x}%`;
            const topPercent = `${poi.coordinates.y}%`;

            let nodeColor = 'bg-neutral-900/90 text-neutral-300 border-neutral-600 shadow-md';
            let ringColor = '';

            if (isBlocked) {
              nodeColor = 'bg-red-950 text-red-500 border-red-800 line-through opacity-50';
            } else if (inRoute) {
              if (inRoute.type === 'spawn') {
                nodeColor = 'bg-cyan-500 text-neutral-950 border-white font-black shadow-lg shadow-cyan-500/50';
                ringColor = 'ring-4 ring-cyan-500/30';
              } else if (inRoute.type === 'extraction') {
                nodeColor = 'bg-purple-500 text-neutral-950 border-white font-black shadow-lg shadow-purple-500/50';
                ringColor = 'ring-4 ring-purple-500/30';
              } else {
                nodeColor = 'bg-amber-500 text-neutral-950 border-white font-black shadow-lg shadow-amber-500/50';
                ringColor = 'ring-4 ring-amber-500/30';
              }
            } else if (poi.dangerLevel === 'high') {
              nodeColor = 'bg-red-950/90 text-red-400 border-red-700/80';
            }

            return (
              <div
                key={poi.id}
                onClick={(e) => {
                  if (isCalibratorMode) return;
                  e.stopPropagation();
                  onSelectPoi(isSelected ? null : poi);
                }}
                style={{ left: leftPercent, top: topPercent }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform ${
                  isSelected ? 'scale-125 z-30' : inRoute ? 'z-20 hover:scale-110' : 'opacity-70 hover:opacity-100 z-10'
                }`}
              >
                {/* Marker Circle */}
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 text-[10px] sm:text-[11px] font-mono transition-all ${nodeColor} ${ringColor}`}
                >
                  {inRoute ? (
                    inRoute.type === 'spawn' ? 'S' : inRoute.type === 'extraction' ? 'E' : inRoute.stepNumber
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </div>

                {/* Always visible minimal tag if in route */}
                {inRoute && (
                  <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-black/90 border border-neutral-700 text-[8px] font-mono text-neutral-200 whitespace-nowrap pointer-events-none">
                    {getLocalized(poi.name, language)}
                  </span>
                )}

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

          {/* Calibrator Active Pin when clicking in calibrator mode */}
          {calibratorPoint && (
            <div
              style={{ left: `${calibratorPoint.x}%`, top: `${calibratorPoint.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-bounce"
            >
              <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-neutral-950 shadow-2xl font-bold">
                <Crosshair className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Compass Rose */}
        <div className="absolute top-3 right-3 bg-neutral-950/80 border border-neutral-800 px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>N ▲</span>
        </div>

        {/* Calibrator Mode Floating Banner */}
        {isCalibratorMode && (
          <div className="absolute top-3 left-3 bg-neutral-950/95 border border-amber-500/80 rounded-xl p-2.5 shadow-2xl z-40 max-w-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                <span>{language === 'es' ? 'Modo Calibración Activo' : 'Calibrator Active'}</span>
              </span>
              <button
                onClick={() => {
                  setIsCalibratorMode(false);
                  setCalibratorPoint(null);
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] font-mono text-neutral-300">
              {language === 'es'
                ? 'Haz clic sobre el mapa para obtener el porcentaje exacto (X, Y) de cualquier zona:'
                : 'Click anywhere on the map to pinpoint exact coordinates:'}
            </p>

            {calibratorPoint ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 space-y-1.5">
                <div className="text-xs font-mono text-cyan-300 font-bold">
                  X: {calibratorPoint.x}% | Y: {calibratorPoint.y}%
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      handleCopyCoord(`"coordinates": { "x": ${calibratorPoint.x}, "y": ${calibratorPoint.y} }`)
                    }
                    className="flex-1 py-1 rounded bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] font-mono uppercase flex items-center justify-center gap-1"
                  >
                    {copiedCoord ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCoord ? '✓ Copiado' : 'Copiar Coordenada'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-amber-400/80 italic">
                {language === 'es' ? 'Esperando clic en el mapa...' : 'Waiting for map click...'}
              </div>
            )}
          </div>
        )}
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
