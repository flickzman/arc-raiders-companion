import React, { useState, useMemo, useEffect } from 'react';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import type { GameMap, POI, Quest, Objective } from '../../data/types';
import type { OptimizedRoute } from '../../services/optimizer/raidOptimizer';
import { QuestTypeLogo } from './QuestTypeLogo';
import { getLocalized } from '../../data/db';
import { usePlayerStore } from '../../store/usePlayerStore';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Eye,
  EyeOff,
  Compass,
  MapPin,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Layers,
  Check,
  X,
  Navigation,
} from 'lucide-react';

export interface InteractiveMapProps {
  currentMap: GameMap;
  route?: OptimizedRoute;
  activeQuests: Quest[];
  completedObjectiveIds: string[];
  onToggleCompletedObjective: (objectiveId: string) => void;
  selectedPoi: POI | null;
  onSelectPoi: (poi: POI | null) => void;
  highlightedPoiId?: string | null;
  disabledExtractionIds?: string[];
  onToggleExtraction?: (poiId: string) => void;
  onSetSpawn?: (poiId: string) => void;
  className?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  currentMap,
  route,
  activeQuests,
  completedObjectiveIds,
  onToggleCompletedObjective,
  selectedPoi,
  onSelectPoi,
  highlightedPoiId,
  disabledExtractionIds = [],
  onToggleExtraction,
  onSetSpawn,
  className = '',
}) => {
  const { language } = usePlayerStore();

  // Current zoom scale (for inverse scaling of markers)
  const [scale, setScale] = useState<number>(1);

  // Filter toggle: only active quest POIs vs all POIs
  const [showOnlyActiveQuests, setShowOnlyActiveQuests] = useState<boolean>(false);

  // Dev Calibration Mode
  const [calibrationMode, setCalibrationMode] = useState<boolean>(false);
  const [lastCalibratedCoords, setLastCalibratedCoords] = useState<{ x: number; y: number } | null>(null);
  const [copiedCoordsToast, setCopiedCoordsToast] = useState<boolean>(false);

  // Image load state & error fallback
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Reset image error state whenever map changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [currentMap.id]);

  // Group active objectives by POI for the current map
  const poiObjectivesMap = useMemo(() => {
    const map = new Map<string, Array<{ quest: Quest; objective: Objective }>>();

    activeQuests.forEach((q) => {
      q.objectives.forEach((obj) => {
        const matchesMap = obj.mapId === currentMap.id || obj.mapId === 'any';
        if (!matchesMap) return;

        // Check primary poiId
        if (obj.poiId) {
          const list = map.get(obj.poiId) || [];
          list.push({ quest: q, objective: obj });
          map.set(obj.poiId, list);
        }

        // Check alternativePoiIds
        if (obj.alternativePoiIds && obj.alternativePoiIds.length > 0) {
          obj.alternativePoiIds.forEach((altId) => {
            const list = map.get(altId) || [];
            // Prevent duplicate entries for the same objective
            if (!list.some((item) => item.objective.id === obj.id)) {
              list.push({ quest: q, objective: obj });
              map.set(altId, list);
            }
          });
        }
      });
    });

    return map;
  }, [activeQuests, currentMap.id]);

  // Handle Dev Calibration click on map
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!calibrationMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const x = parseFloat(((clickX / rect.width) * 100).toFixed(2));
    const y = parseFloat(((clickY / rect.height) * 100).toFixed(2));

    const coordsObj = { x, y };
    setLastCalibratedCoords(coordsObj);

    // Copy formatted JSON to clipboard
    navigator.clipboard.writeText(JSON.stringify(coordsObj));
    setCopiedCoordsToast(true);
    setTimeout(() => setCopiedCoordsToast(false), 3000);
  };

  // Determine which POIs to render based on toggle
  const visiblePois = useMemo(() => {
    return currentMap.pois.filter((poi) => {
      const hasObjectives = (poiObjectivesMap.get(poi.id)?.length || 0) > 0;
      if (showOnlyActiveQuests) {
        // In active only mode, show POIs with active quests or vital tactical nodes (spawn / extract)
        return hasObjectives || poi.isSpawnPoint || poi.isExtractionPoint;
      }
      return true;
    });
  }, [currentMap.pois, poiObjectivesMap, showOnlyActiveQuests]);

  // Route step lookup for rendering step numbers or badges
  const stepMap = useMemo(() => {
    const sm = new Map<string, { stepNumber: number; type: 'spawn' | 'objective' | 'extraction' }>();
    if (route) {
      route.steps.forEach((step, idx) => {
        sm.set(step.poi.id, { stepNumber: idx, type: step.type });
      });
    }
    return sm;
  }, [route]);

  // Route polyline points
  const polylinePoints = useMemo(() => {
    if (!route || route.steps.length === 0) return '';
    return route.steps
      .map((s) => `${s.poi.coordinates.x * 10},${s.poi.coordinates.y * 10}`)
      .join(' ');
  }, [route]);

  // Objectives for the currently selected POI popup
  const selectedPoiObjectives = selectedPoi
    ? poiObjectivesMap.get(selectedPoi.id) || []
    : [];

  return (
    <div className={`bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col ${className}`}>
      {/* Tactical Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-900/90 border-b border-neutral-800 text-xs font-mono select-none">
        {/* Left: Map Title & Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400/50" />
          <span className="font-bold uppercase tracking-wider text-neutral-100">
            {getLocalized(currentMap.name, language)}
          </span>
          <span className="text-[10px] text-neutral-400 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
            {visiblePois.length} POIs
          </span>
          <span className="text-[10px] text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800">
            {Array.from(poiObjectivesMap.values()).flat().length} {language === 'es' ? 'Objs Activos' : 'Active Objs'}
          </span>
        </div>

        {/* Right: Controls & Toggles */}
        <div className="flex items-center gap-2">
          {/* Active Quests Filter Toggle */}
          <button
            onClick={() => setShowOnlyActiveQuests(!showOnlyActiveQuests)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              showOnlyActiveQuests
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
            title={
              showOnlyActiveQuests
                ? (language === 'es' ? 'Mostrando solo misiones activas' : 'Showing active quests only')
                : (language === 'es' ? 'Mostrando todos los POIs' : 'Showing all POIs')
            }
          >
            {showOnlyActiveQuests ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>
              {showOnlyActiveQuests
                ? (language === 'es' ? 'Solo Misiones' : 'Active Only')
                : (language === 'es' ? 'Todos los POIs' : 'All POIs')}
            </span>
          </button>

          {/* Dev Calibration Tool Toggle */}
          <button
            onClick={() => setCalibrationMode(!calibrationMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              calibrationMode
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-sm ring-1 ring-rose-500/40'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
            title="Herramienta de desarrollo para calibrar coordenadas de edificios sobre el mapa"
          >
            <Crosshair className={`w-3.5 h-3.5 ${calibrationMode ? 'text-rose-400 animate-spin' : ''}`} />
            <span>
              {calibrationMode
                ? (language === 'es' ? 'Calibrando (ON)' : 'Calibrating (ON)')
                : (language === 'es' ? 'Calibrar POIs' : 'Calibrate POIs')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Map Viewer Canvas with Zoom Pan Pinch */}
      <div className="relative w-full h-[540px] sm:h-[680px] bg-[#070b12] overflow-hidden select-none">
        <TransformWrapper
          initialScale={1}
          minScale={0.6}
          maxScale={4.5}
          centerOnInit
          smooth={true}
          wheel={{ step: 0.0015 }}
          pinch={{ step: 2 }}
          onTransform={(ref: ReactZoomPanPinchRef) => {
            setScale(ref.state.scale);
          }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Floating Zoom / Pan Controls Overlay */}
              <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5 bg-neutral-950/85 backdrop-blur border border-neutral-800 p-1.5 rounded-xl shadow-xl">
                <button
                  onClick={() => zoomIn(0.25)}
                  className="p-1.5 text-neutral-300 hover:text-cyan-300 hover:bg-neutral-800/80 rounded-lg transition-colors"
                  title={language === 'es' ? 'Acercar (+)' : 'Zoom In (+)'}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => zoomOut(0.25)}
                  className="p-1.5 text-neutral-300 hover:text-cyan-300 hover:bg-neutral-800/80 rounded-lg transition-colors"
                  title={language === 'es' ? 'Alejar (-)' : 'Zoom Out (-)'}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="h-px bg-neutral-800 my-0.5" />
                <button
                  onClick={() => resetTransform()}
                  className="p-1.5 text-neutral-300 hover:text-amber-300 hover:bg-neutral-800/80 rounded-lg transition-colors"
                  title={language === 'es' ? 'Centrar / Restablecer (1:1)' : 'Reset Zoom (1:1)'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Compass Rose */}
              <div className="absolute top-3 right-3 z-30 bg-neutral-950/85 backdrop-blur border border-neutral-800 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-mono text-neutral-300 shadow-xl pointer-events-none">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>N ▲</span>
              </div>

              {/* Calibration Banner (if active) */}
              {calibrationMode && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-rose-950/95 border border-rose-500/80 text-rose-200 px-3 py-1 rounded-full text-[11px] font-mono flex items-center gap-2 shadow-2xl animate-pulse">
                  <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {language === 'es'
                      ? 'Haz clic en cualquier punto del mapa para copiar X, Y'
                      : 'Click anywhere on map to copy X, Y'}
                  </span>
                </div>
              )}

              {/* Calibration Copied Toast */}
              {copiedCoordsToast && lastCalibratedCoords && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-neutral-950 border border-emerald-500 text-emerald-300 px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>
                    Copiado:{' '}
                    <strong>{`{ "x": ${lastCalibratedCoords.x}, "y": ${lastCalibratedCoords.y} }`}</strong>
                  </span>
                </div>
              )}

              {/* Pan/Zoom Area */}
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
              >
                <div
                  className="relative aspect-square w-full max-w-[1100px] flex items-center justify-center bg-black/40 shadow-2xl overflow-hidden rounded-lg"
                  onClick={handleMapClick}
                  style={{ cursor: calibrationMode ? 'crosshair' : undefined }}
                >
                  {/* Layer 1: Official PNG Map Image */}
                  {!imageError && currentMap.imageUrl ? (
                    <img
                      src={currentMap.imageUrl}
                      alt={getLocalized(currentMap.name, language)}
                      decoding="async"
                      className={`w-full h-full object-cover select-none pointer-events-none block transition-opacity duration-300 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        console.warn(`Could not load map image at ${currentMap.imageUrl}, using SVG fallback.`);
                        setImageError(true);
                      }}
                      draggable={false}
                    />
                  ) : null}

                  {/* Fallback Topographic Radar SVG Canvas (Shown if image is missing, errored, or still loading) */}
                  {(imageError || !imageLoaded) && (
                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                      <svg
                        viewBox="0 0 1000 1000"
                        className="w-full h-full bg-[#050811] text-cyan-500/20"
                      >
                        <defs>
                          {/* Grid Pattern */}
                          <pattern id="topoGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.8" />
                          </pattern>
                          <pattern id="topoSubGrid" width="250" height="250" patternUnits="userSpaceOnUse">
                            <rect width="250" height="250" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeOpacity="0.4" />
                          </pattern>
                        </defs>

                        {/* Topo background grids */}
                        <rect width="1000" height="1000" fill="url(#topoGrid)" />
                        <rect width="1000" height="1000" fill="url(#topoSubGrid)" />

                        {/* Concentric Radar Range Rings */}
                        <circle cx="500" cy="500" r="150" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 6" strokeOpacity="0.3" />
                        <circle cx="500" cy="500" r="300" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="8 6" strokeOpacity="0.3" />
                        <circle cx="500" cy="500" r="450" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="10 8" strokeOpacity="0.35" />

                        {/* Crosshair Axes */}
                        <line x1="0" y1="500" x2="1000" y2="500" stroke="#0284c7" strokeWidth="1.2" strokeOpacity="0.4" />
                        <line x1="500" y1="0" x2="500" y2="1000" stroke="#0284c7" strokeWidth="1.2" strokeOpacity="0.4" />

                        {/* Topo Radar Watermark */}
                        <text
                          x="500"
                          y="500"
                          fill="#38bdf8"
                          fillOpacity="0.08"
                          fontSize="54"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {currentMap.name.en.toUpperCase()} TOPOGRAPHY
                        </text>
                      </svg>
                    </div>
                  )}

                  {/* Layer 2: Tactical Route Polyline (1000x1000 coordinate space) */}
                  {polylinePoints && (
                    <svg
                      viewBox="0 0 1000 1000"
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    >
                      <defs>
                        <linearGradient id="tacticalRouteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>

                      {/* Route Path Glow */}
                      <polyline
                        points={polylinePoints}
                        fill="none"
                        stroke="url(#tacticalRouteGradient)"
                        strokeWidth="10"
                        strokeOpacity="0.35"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Animated Core Path */}
                      <polyline
                        points={polylinePoints}
                        fill="none"
                        stroke="url(#tacticalRouteGradient)"
                        strokeWidth="4"
                        strokeDasharray="12 8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}

                  {/* Layer 3: Calibration Pin (if placed) */}
                  {calibrationMode && lastCalibratedCoords && (
                    <div
                      className="absolute z-30 pointer-events-none"
                      style={{
                        left: `${lastCalibratedCoords.x}%`,
                        top: `${lastCalibratedCoords.y}%`,
                        transform: `translate(-50%, -50%) scale(${1 / scale})`,
                        transformOrigin: 'center center',
                      }}
                    >
                      <div className="w-6 h-6 rounded-full border-2 border-rose-400 bg-rose-500/40 flex items-center justify-center animate-ping" />
                      <div className="absolute inset-0 w-6 h-6 rounded-full border-2 border-rose-300 bg-rose-600 flex items-center justify-center text-[10px] text-white font-bold font-mono">
                        +
                      </div>
                    </div>
                  )}

                  {/* Layer 4: Tactical POI & Quest Markers with INVERSE SCALING */}
                  {visiblePois.map((poi) => {
                    const objectives = poiObjectivesMap.get(poi.id) || [];
                    const badgeCount = objectives.length;
                    const inRoute = stepMap.get(poi.id);
                    const isSelected = selectedPoi?.id === poi.id;
                    const isHighlighted = highlightedPoiId === poi.id || isSelected;
                    const isExtractionBlocked = disabledExtractionIds.includes(poi.id);

                    // Check if all active objectives at this POI are completed
                    const areAllObjectivesCompleted =
                      objectives.length > 0 &&
                      objectives.every((item) =>
                        completedObjectiveIds.includes(item.objective.id)
                      );

                    // Determine primary QuestType or LogoType for this POI
                    let logoType: 'combat' | 'extraction' | 'recon' | 'sabotage' | 'delivery' | 'locked_room' | 'extraction_point' | 'spawn_point' | 'generic' =
                      'generic';

                    if (poi.isExtractionPoint) {
                      logoType = 'extraction_point';
                    } else if (poi.isSpawnPoint) {
                      logoType = 'spawn_point';
                    } else if (objectives.length > 0) {
                      // Prefer the type of the first active incomplete objective
                      const incompleteObj = objectives.find(
                        (item) => !completedObjectiveIds.includes(item.objective.id)
                      );
                      const targetObj = incompleteObj ? incompleteObj.objective : objectives[0].objective;
                      logoType = targetObj.type || 'recon';
                    }

                    return (
                      <div
                        key={poi.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (calibrationMode) {
                            handleMapClick(e);
                            return;
                          }
                          onSelectPoi(isSelected ? null : poi);
                        }}
                        className={`absolute cursor-pointer transition-transform duration-100 ${
                          isSelected ? 'z-30' : inRoute ? 'z-20' : 'z-10'
                        }`}
                        style={{
                          left: `${poi.coordinates.x}%`,
                          top: `${poi.coordinates.y}%`,
                          // CRITICAL: Inverse scaling keeps logos at constant pixel size on screen
                          transform: `translate(-50%, -50%) scale(${1 / scale})`,
                          transformOrigin: 'center center',
                        }}
                      >
                        {/* Custom SVG Tactical Emblem */}
                        <div className="relative group">
                          <QuestTypeLogo
                            type={logoType}
                            size={isSelected ? 42 : inRoute ? 38 : 34}
                            isCompleted={areAllObjectivesCompleted}
                            isHighlighted={isHighlighted}
                            badgeCount={badgeCount > 1 ? badgeCount : undefined}
                            className={isExtractionBlocked ? 'opacity-40 grayscale line-through' : ''}
                          />

                          {/* Route Step Number Pin (if included in calculated route) */}
                          {inRoute && (
                            <div
                              className={`absolute -bottom-2 -left-1.5 px-1 py-0.2 rounded-full font-mono text-[9px] font-black shadow-md border ${
                                inRoute.type === 'spawn'
                                  ? 'bg-cyan-400 text-neutral-950 border-cyan-200'
                                  : inRoute.type === 'extraction'
                                  ? 'bg-purple-400 text-neutral-950 border-purple-200'
                                  : 'bg-amber-400 text-neutral-950 border-amber-200'
                              }`}
                            >
                              {inRoute.type === 'spawn'
                                ? 'S'
                                : inRoute.type === 'extraction'
                                ? 'E'
                                : inRoute.stepNumber}
                            </div>
                          )}

                          {/* Quick Tooltip on Hover */}
                          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-neutral-950/95 border border-neutral-700 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-neutral-200 shadow-2xl z-50">
                            <div className="font-bold text-neutral-100">
                              {getLocalized(poi.name, language)}
                            </div>
                            {objectives.length > 0 ? (
                              <div className="text-[9px] text-amber-300">
                                {objectives.length} {language === 'es' ? 'misión(es) activa(s)' : 'active quest(s)'}
                              </div>
                            ) : (
                              <div className="text-[9px] text-neutral-400">
                                {poi.isSpawnPoint
                                  ? (language === 'es' ? 'Punto de Infiltración' : 'Infiltration Point')
                                  : poi.isExtractionPoint
                                  ? (language === 'es' ? 'Zona de Extracción' : 'Extraction Point')
                                  : `Peligro: ${poi.dangerLevel.toUpperCase()}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Selected POI Intel Drawer & Interactive Objective Checklist */}
      {selectedPoi && (
        <div className="bg-neutral-900/95 border-t border-neutral-800 p-4 space-y-3 transition-all animate-in fade-in slide-in-from-bottom-2 select-text">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-black text-sm uppercase text-neutral-100 tracking-wide">
                  {getLocalized(selectedPoi.name, language)}
                </h4>
                <p className="text-[11px] font-mono text-neutral-400">
                  {getLocalized(currentMap.name, language)} • (X: {selectedPoi.coordinates.x}%, Y: {selectedPoi.coordinates.y}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  selectedPoi.dangerLevel === 'high'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : selectedPoi.dangerLevel === 'medium'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {language === 'es'
                  ? `Peligro ${selectedPoi.dangerLevel === 'high' ? 'Alto' : selectedPoi.dangerLevel === 'medium' ? 'Medio' : 'Bajo'}`
                  : `Hazard ${selectedPoi.dangerLevel.toUpperCase()}`}
              </span>

              <button
                onClick={() => onSelectPoi(null)}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                title="Cerrar panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Objectives Checklist at this POI */}
          {selectedPoiObjectives.length > 0 ? (
            <div className="bg-neutral-950/90 rounded-xl p-3 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800/80">
                <span className="text-[11px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{language === 'es' ? 'Objetivos Activos en esta Ubicación' : 'Active Objectives at Location'}</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {selectedPoiObjectives.filter((item) => completedObjectiveIds.includes(item.objective.id)).length} / {selectedPoiObjectives.length} {language === 'es' ? 'completados' : 'done'}
                </span>
              </div>

              <div className="space-y-2">
                {selectedPoiObjectives.map(({ quest, objective }) => {
                  const isDone = completedObjectiveIds.includes(objective.id);

                  return (
                    <div
                      key={objective.id}
                      onClick={() => onToggleCompletedObjective(objective.id)}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isDone
                          ? 'bg-neutral-900/40 border-neutral-800/60 opacity-60'
                          : 'bg-neutral-900 border-neutral-700/80 hover:border-amber-500/60'
                      }`}
                    >
                      <button className="mt-0.5 flex-shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-neutral-500 hover:text-amber-400" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/70 border border-amber-800 px-1.5 py-0.2 rounded">
                            {quest.vendor}
                          </span>
                          <span className={`text-xs font-bold ${isDone ? 'line-through text-neutral-400' : 'text-neutral-200'}`}>
                            {getLocalized(quest.title, language)}
                          </span>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isDone ? 'line-through text-neutral-500' : 'text-neutral-300'}`}>
                          {getLocalized(objective.description, language)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs font-mono text-neutral-400 italic">
              {language === 'es'
                ? 'No hay misiones activas asignadas directamente a este punto de interés.'
                : 'No active quest objectives assigned directly to this point of interest.'}
            </p>
          )}

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800">
            {selectedPoi.isSpawnPoint && onSetSpawn && (
              <button
                onClick={() => onSetSpawn(selectedPoi.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-200 text-xs font-mono hover:bg-cyan-900/60 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>{language === 'es' ? 'Fijar como Punto de Incursión (Spawn)' : 'Set as Ingress Spawn'}</span>
              </button>
            )}

            {selectedPoi.isExtractionPoint && onToggleExtraction && (
              <button
                onClick={() => onToggleExtraction(selectedPoi.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                  disabledExtractionIds.includes(selectedPoi.id)
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-200 hover:bg-emerald-900/60'
                    : 'bg-red-950 border-red-800 text-red-200 hover:bg-red-900/60'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {disabledExtractionIds.includes(selectedPoi.id)
                    ? (language === 'es' ? 'Habilitar esta Extracción' : 'Enable this Extraction')
                    : (language === 'es' ? 'Marcar Extracción Bloqueada' : 'Mark Extraction as Blocked')}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
