import React, { useState, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { allQuests, allMaps } from '../data/db';
import { type Vendor, type MapId } from '../data/schemas';
import { Search, X, Trash2, Filter, Camera, Plus, Sparkles } from 'lucide-react';

interface VendorSelectorProps {
  selectedVendor: Vendor | 'ALL';
  setSelectedVendor: (v: Vendor | 'ALL') => void;
  selectedMapFilter: MapId | 'ALL';
  setSelectedMapFilter: (m: MapId | 'ALL') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenCaptureModal?: () => void;
}

const vendors: { id: Vendor; role: { en: string; es: string } }[] = [
  { id: 'Tian Wen', role: { en: 'Scavenger & Recon', es: 'Chatarrero y Reconocimiento' } },
  { id: 'Shani', role: { en: 'Field Medic & Supplies', es: 'Médico de Campo y Suministros' } },
  { id: 'Lance', role: { en: 'Tactical Vanguard', es: 'Vanguardia Táctica' } },
  { id: 'Celeste', role: { en: 'Heavy ARC Hunter', es: 'Cazadora ARC Pesada' } },
  { id: 'Apollo', role: { en: 'Energy Grid Engineer', es: 'Ingeniero de Red Eléctrica' } },
  { id: 'Nomadic Envoys', role: { en: 'Nomadic Envoys', es: 'Enviados Nómadas' } },
  { id: 'Other', role: { en: 'Custom / Other', es: 'Personalizadas / Otros' } },
];

export const VendorSelector: React.FC<VendorSelectorProps> = ({
  selectedVendor,
  setSelectedVendor,
  selectedMapFilter,
  setSelectedMapFilter,
  searchQuery,
  setSearchQuery,
  onOpenCaptureModal,
}) => {
  const { language, activeQuestIds, clearAllActiveQuests, customQuests, addCustomQuest } =
    usePlayerStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVendor, setNewVendor] = useState<Vendor>('Other');
  const [newMap, setNewMap] = useState<MapId>('any');

  const allAvailableQuests = useMemo(() => [...customQuests, ...allQuests], [customQuests]);

  const getVendorActiveCount = (v: Vendor) => {
    return allAvailableQuests
      .filter((q) => q.vendor === v)
      .filter((q) => activeQuestIds.includes(q.id)).length;
  };

  const getMapQuestCount = (m: MapId) => {
    return allAvailableQuests.filter((q) =>
      q.objectives.some((obj) => obj.mapId === m || obj.mapId === 'any')
    ).length;
  };

  const handleQuickAdd = (title: string, vendor?: Vendor, map?: MapId) => {
    if (!title.trim()) return;
    addCustomQuest(
      title.trim(),
      vendor || (selectedVendor === 'ALL' ? 'Other' : selectedVendor),
      map || (selectedMapFilter === 'ALL' ? 'any' : selectedMapFilter)
    );
    setNewTitle('');
    setShowAddModal(false);
  };

  const hasExactMatch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return allAvailableQuests.some(
      (quest) =>
        quest.title.en.toLowerCase() === q ||
        (quest.title.es && quest.title.es.toLowerCase() === q)
    );
  }, [searchQuery, allAvailableQuests]);

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-4">
      {/* Search and Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'es'
                ? 'Buscar misión, objetivo, POI o ítem...'
                : 'Search quest, objective, POI or item...'
            }
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Map Filter Selector & Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Add Quest Button (Title Only) */}
          <button
            onClick={() => {
              setNewTitle(searchQuery.trim());
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold transition-all whitespace-nowrap shadow-sm shadow-emerald-500/5"
            title={language === 'es' ? 'Añadir misión solo con el título' : 'Add quest with title only'}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'es' ? 'Añadir' : 'Add'}</span>
          </button>

          {onOpenCaptureModal && (
            <button
              onClick={onOpenCaptureModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/20 text-amber-400 text-xs font-mono font-semibold transition-all whitespace-nowrap shadow-sm shadow-amber-500/5"
              title={
                language === 'es'
                  ? 'Pegar captura con Ctrl+V o escanear con cámara'
                  : 'Paste screenshot with Ctrl+V or scan with camera'
              }
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {language === 'es' ? 'OCR / Captura' : 'OCR / Capture'}
              </span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-neutral-900 text-amber-300 border border-neutral-700 font-mono hidden md:inline">
                Ctrl+V
              </span>
            </button>
          )}

          <Filter className="w-4 h-4 text-neutral-500 hidden sm:inline" />
          <select
            value={selectedMapFilter}
            onChange={(e) => setSelectedMapFilter(e.target.value as MapId | 'ALL')}
            className="bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-2 text-neutral-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">{language === 'es' ? 'Todos los Mapas' : 'All Maps'}</option>
            {allMaps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name[language === 'es' ? 'es' : 'en']}
              </option>
            ))}
            <option value="any">
              {language === 'es' ? 'Cualquier Sector' : 'Any Sector'}
            </option>
          </select>

          {/* Clear All Button */}
          {activeQuestIds.length > 0 && (
            <button
              onClick={clearAllActiveQuests}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-red-900/50 hover:bg-red-950/20 text-neutral-400 hover:text-red-400 text-xs transition-colors"
              title={language === 'es' ? 'Deseleccionar todas las misiones' : 'Clear all active quests'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{language === 'es' ? 'Limpiar' : 'Clear'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Instant 1-Click Add Banner when searching an unlisted title */}
      {searchQuery.trim().length > 0 && !hasExactMatch && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs font-mono animate-in fade-in">
          <span className="text-emerald-200 truncate mr-2">
            {language === 'es'
              ? `¿Misión nueva? Añade "${searchQuery.trim()}" con solo el título:`
              : `New quest? Add "${searchQuery.trim()}" with just the title:`}
          </span>
          <button
            onClick={() => {
              handleQuickAdd(searchQuery);
              setSearchQuery('');
            }}
            className="shrink-0 flex items-center gap-1 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold uppercase transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'es' ? '+ Añadir y Activar' : '+ Add & Activate'}</span>
          </button>
        </div>
      )}

      {/* Vendor Chips (10-second fast selection flow) */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2 flex items-center justify-between">
          <span>{language === 'es' ? 'Comerciantes / Facciones' : 'Vendors / Factions'}</span>
          <span className="text-amber-500/80 font-bold">
            {activeQuestIds.length} {language === 'es' ? 'activas seleccionadas' : 'active selected'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* ALL Chip */}
          <button
            onClick={() => setSelectedVendor('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedVendor === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/10'
                : 'bg-neutral-950/80 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            {language === 'es' ? 'Todos' : 'All'}
          </button>

          {/* Each Vendor Chip */}
          {vendors.map((v) => {
            const activeCount = getVendorActiveCount(v.id);
            const isSelected = selectedVendor === v.id;

            return (
              <button
                key={v.id}
                onClick={() => setSelectedVendor(isSelected ? 'ALL' : v.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/10'
                    : 'bg-neutral-950/80 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <span>{v.id}</span>
                {activeCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500 text-neutral-950 font-bold">
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Sector Chips (1-click fast sector filtering) */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2 flex items-center justify-between">
          <span>{language === 'es' ? 'Sectores / Mapas' : 'Sectors / Maps'}</span>
          <span className="text-cyan-400 font-mono text-[10px]">
            {selectedMapFilter === 'ALL'
              ? (language === 'es' ? 'Todos los sectores visibles' : 'All sectors visible')
              : `${allMaps.find((s) => s.id === selectedMapFilter)?.name[language === 'es' ? 'es' : 'en']}`}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* ALL Maps Chip */}
          <button
            onClick={() => setSelectedMapFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedMapFilter === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm shadow-cyan-500/10'
                : 'bg-neutral-950/80 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            {language === 'es' ? 'Todos los Mapas' : 'All Maps'}
          </button>

          {/* Each Sector Chip */}
          {allMaps.map((map) => {
            const count = getMapQuestCount(map.id);
            const isSelected = selectedMapFilter === map.id;

            return (
              <button
                key={map.id}
                onClick={() => setSelectedMapFilter(isSelected ? 'ALL' : map.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm shadow-cyan-500/10'
                    : 'bg-neutral-950/80 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <span>{map.name[language === 'es' ? 'es' : 'en']}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-cyan-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Add Quest Modal (Title Only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-100">
                  {language === 'es' ? 'Añadir Misión (Solo con Título)' : 'Add Quest (Title Only)'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-mono text-neutral-300 block mb-1 font-bold">
                  {language === 'es' ? 'Título de la Misión *' : 'Quest Title *'}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickAdd(newTitle, newVendor, newMap);
                  }}
                  placeholder={
                    language === 'es'
                      ? 'Ej: Reconocimiento del Búnker Subterráneo...'
                      : 'e.g. Underground Bunker Recon...'
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-neutral-400 block mb-1">
                    {language === 'es' ? 'Comerciante' : 'Vendor'}
                  </label>
                  <select
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value as Vendor)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-neutral-400 block mb-1">
                    {language === 'es' ? 'Sector / Mapa' : 'Sector / Map'}
                  </label>
                  <select
                    value={newMap}
                    onChange={(e) => setNewMap(e.target.value as MapId)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="any">{language === 'es' ? 'Cualquier Sector' : 'Any Sector'}</option>
                    {allMaps.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name[language === 'es' ? 'es' : 'en']}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg border border-neutral-800 text-xs font-mono text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                disabled={!newTitle.trim()}
                onClick={() => handleQuickAdd(newTitle, newVendor, newMap)}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 font-bold text-xs font-mono uppercase transition-all shadow-md shadow-emerald-500/20"
              >
                {language === 'es' ? '✓ Añadir y Activar' : '✓ Add & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
