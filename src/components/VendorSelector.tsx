import React, { useState, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { allQuests, allMaps } from '../data/db';
import { type Vendor, type MapId } from '../data/schemas';
import { Search, X, Plus, Layers, MapPin, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useAutoAnimate } from '@formkit/auto-animate/react';

interface VendorSelectorProps {
  selectedVendor: Vendor | 'ALL';
  setSelectedVendor: (v: Vendor | 'ALL') => void;
  selectedMapFilter: MapId | 'ALL';
  setSelectedMapFilter: (m: MapId | 'ALL') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showActiveOnly: boolean;
  setShowActiveOnly: (val: boolean) => void;
  onOpenCommandBar: () => void;
}

const vendors: { id: Vendor; name: string }[] = [
  { id: 'Tian Wen', name: 'Tian Wen' },
  { id: 'Shani', name: 'Shani' },
  { id: 'Lance', name: 'Lance' },
  { id: 'Celeste', name: 'Celeste' },
  { id: 'Apollo', name: 'Apollo' },
  { id: 'Nomadic Envoys', name: 'Nomadic' },
  { id: 'Other', name: 'Other' },
];

export const VendorSelector: React.FC<VendorSelectorProps> = ({
  selectedVendor,
  setSelectedVendor,
  selectedMapFilter,
  setSelectedMapFilter,
  searchQuery,
  setSearchQuery,
  showActiveOnly,
  setShowActiveOnly,
  onOpenCommandBar,
}) => {
  const { language, activeQuestIds, customQuests, addCustomQuest } =
    usePlayerStore();

  const [filterPillsRef] = useAutoAnimate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVendor, setNewVendor] = useState<Vendor>('Other');
  const [newMap, setNewMap] = useState<MapId>('any');

  const allAvailableQuests = useMemo(() => [...customQuests, ...allQuests], [customQuests]);

  // Compute map quest counts
  const mapCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts['ALL'] = allAvailableQuests.length;

    allMaps.forEach((m) => {
      counts[m.id] = allAvailableQuests.filter((q) =>
        q.objectives.some((obj) => obj.mapId === m.id || obj.mapId === 'any')
      ).length;
    });

    counts['any'] = allAvailableQuests.filter((q) =>
      q.objectives.every((obj) => obj.mapId === 'any')
    ).length;

    return counts;
  }, [allAvailableQuests]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addCustomQuest(newTitle.trim(), newVendor, newMap);
    setNewTitle('');
    setShowAddModal(false);
  };

  const hasActiveFilters =
    selectedVendor !== 'ALL' || selectedMapFilter !== 'ALL' || searchQuery.trim() !== '' || showActiveOnly;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-3">
      {/* 1. Fast Search and Global Command Shortcut Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'es'
                ? 'Buscar misión por nombre, mapa o ítem...'
                : 'Search quest, objective, map or item...'
            }
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-16 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onOpenCommandBar}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 hidden sm:inline-block"
              title="Open Command Palette (Ctrl+K)"
            >
              Ctrl+K
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold font-mono transition-colors ${
              showActiveOnly
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                : 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{language === 'es' ? 'Solo Activas' : 'Active Only'}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                showActiveOnly ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {activeQuestIds.length}
            </span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs font-mono transition-colors"
            title={language === 'es' ? 'Añadir misión personalizada' : 'Add custom quest'}
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{language === 'es' ? 'Misión' : 'Quest'}</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedVendor('ALL');
                setSelectedMapFilter('ALL');
                setSearchQuery('');
                setShowActiveOnly(false);
              }}
              className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
              title={language === 'es' ? 'Limpiar filtros' : 'Reset filters'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Instant Map/Sector Quick Pills (Solves the 18-quest clutter problem) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold px-0.5">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-zinc-400" />
            {language === 'es' ? 'Sectores / Mapas de Incursión' : 'Raid Sectors / Maps'}
          </span>
          {selectedMapFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedMapFilter('ALL')}
              className="text-amber-400 hover:underline"
            >
              {language === 'es' ? 'Ver todos' : 'Show all'}
            </button>
          )}
        </div>

        <div ref={filterPillsRef} className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
          <button
            onClick={() => setSelectedMapFilter('ALL')}
            className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
              selectedMapFilter === 'ALL'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {language === 'es' ? 'Todos los Sectores' : 'All Sectors'} ({mapCounts['ALL'] || 0})
          </button>

          {allMaps.map((map) => {
            const count = mapCounts[map.id] || 0;
            const isSelected = selectedMapFilter === map.id;
            return (
              <button
                key={map.id}
                onClick={() => setSelectedMapFilter(map.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/50'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span>{map.name.en}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Vendor Filter Chips */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-[11px] font-mono pt-0.5">
        <span className="text-zinc-500 text-[10px] uppercase font-semibold mr-1 shrink-0">
          {language === 'es' ? 'Comerciante:' : 'Vendor:'}
        </span>
        <button
          onClick={() => setSelectedVendor('ALL')}
          className={`px-2 py-0.5 rounded text-[10px] transition-colors shrink-0 ${
            selectedVendor === 'ALL'
              ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {language === 'es' ? 'Todos' : 'All'}
        </button>
        {vendors.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelectedVendor(v.id)}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors shrink-0 ${
              selectedVendor === v.id
                ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>

      {/* Modal: Quick Add Custom Quest using shadcn Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-zinc-100">
              {language === 'es' ? 'Añadir Misión Personalizada' : 'Add Custom Quest'}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              {language === 'es'
                ? 'Agrega una misión rápida que no aparezca en la base de datos oficial.'
                : 'Quickly track any custom or newly released quest.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickAdd} className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                {language === 'es' ? 'Título de la Misión' : 'Quest Title'}
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Scavenge Medical Vault"
                autoFocus
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  {language === 'es' ? 'Comerciante' : 'Vendor'}
                </label>
                <select
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value as Vendor)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                  {language === 'es' ? 'Sector / Mapa' : 'Sector / Map'}
                </label>
                <select
                  value={newMap}
                  onChange={(e) => setNewMap(e.target.value as MapId)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="any">Any Sector</option>
                  {allMaps.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs font-mono transition-colors disabled:opacity-50"
              >
                {language === 'es' ? 'Crear Misión' : 'Create Quest'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
