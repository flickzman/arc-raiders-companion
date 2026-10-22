import React, { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePlayerStore } from '../store/usePlayerStore';
import { allItems, allQuests, getLocalized } from '../data/db';
import { type GameItem } from '../data/schemas';
import { ItemCard } from './ItemCard';
import { Search, ShieldCheck, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';

export const SalvageItemList: React.FC = () => {
  const { language, activeQuestIds, customQuests } = usePlayerStore();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'keep' | 'salvage' | 'keys' | 'materials' | 'tech'>('all');
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);

  // Pool of all quests
  const allAvailableQuests = useMemo(() => [...customQuests, ...allQuests], [customQuests]);
  const activeQuests = useMemo(
    () => allAvailableQuests.filter((q) => activeQuestIds.includes(q.id)),
    [allAvailableQuests, activeQuestIds]
  );

  // Track active quest requirements
  const activeQuestNeededItemIds = useMemo(() => {
    const ids = new Set<string>();
    activeQuests.forEach((q) => {
      q.itemsToBring.forEach((b) => ids.add(b.itemId));
      q.objectives.forEach((obj) => {
        if (obj.requiredItemId) ids.add(obj.requiredItemId);
        if (obj.targetItemId) ids.add(obj.targetItemId);
      });
    });
    return ids;
  }, [activeQuests]);

  // Compute status for an item
  const getItemStatus = (item: GameItem) => {
    const isNeededForActiveQuest = activeQuestNeededItemIds.has(item.id);
    const isNeededForHideout = item.usedInUpgrades && item.usedInUpgrades.length > 0;

    if (isNeededForActiveQuest) {
      return {
        text: language === 'es' ? 'KEEP (Misión)' : 'KEEP (Quest)',
        variant: 'keep' as const,
        isKeep: true,
      };
    }
    if (isNeededForHideout) {
      const upgrade = item.usedInUpgrades[0];
      const station = getLocalized(upgrade.stationName, language);
      return {
        text: language === 'es' ? `KEEP (Refugio)` : `KEEP (${station})`,
        variant: 'keep' as const,
        isKeep: true,
      };
    }
    return {
      text: `${item.sellValue || 0} Cr`,
      variant: 'salvage' as const,
      isKeep: false,
    };
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // 1. Search query
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const nameEn = item.name.en.toLowerCase();
        const nameEs = (item.name.es || '').toLowerCase();
        const descEn = (item.description?.en || '').toLowerCase();
        const descEs = (item.description?.es || '').toLowerCase();
        const category = item.category.toLowerCase();

        if (
          !nameEn.includes(query) &&
          !nameEs.includes(query) &&
          !descEn.includes(query) &&
          !descEs.includes(query) &&
          !category.includes(query)
        ) {
          return false;
        }
      }

      // 2. Filter mode
      const status = getItemStatus(item);
      if (filterMode === 'keep') return status.isKeep;
      if (filterMode === 'salvage') return !status.isKeep;
      if (filterMode === 'keys') return item.category === 'Key';
      if (filterMode === 'materials') return item.category === 'Material';
      if (filterMode === 'tech') return item.category === 'Tech';

      return true;
    });
  }, [search, filterMode, activeQuestNeededItemIds, language]);

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44, // 44px estimated row height
    overscan: 5,
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-100">
            {language === 'es' ? 'Guía de Chatarra (¿Guardar o Vender?)' : 'Salvage & Loot Guide (Keep or Sell?)'}
          </h2>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          {filteredItems.length} {language === 'es' ? 'ítems' : 'items'}
        </span>
      </div>

      {/* Instant Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            language === 'es'
              ? 'Buscar ítem por nombre o categoría...'
              : 'Search item to check if safe to scrap...'
          }
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
            filterMode === 'all'
              ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700'
              : 'bg-zinc-950 text-zinc-400 border border-zinc-850 hover:text-zinc-200'
          }`}
        >
          {language === 'es' ? 'Todos' : 'All'}
        </button>
        <button
          onClick={() => setFilterMode('keep')}
          className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
            filterMode === 'keep'
              ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
              : 'bg-zinc-950 text-zinc-400 border border-zinc-850 hover:text-emerald-400'
          }`}
        >
          {language === 'es' ? '✓ Guardar (KEEP)' : '✓ Keep'}
        </button>
        <button
          onClick={() => setFilterMode('salvage')}
          className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
            filterMode === 'salvage'
              ? 'bg-zinc-800 text-zinc-200 font-bold border border-zinc-700'
              : 'bg-zinc-950 text-zinc-400 border border-zinc-850 hover:text-zinc-200'
          }`}
        >
          {language === 'es' ? 'Vender (Cr)' : 'Sell (Cr)'}
        </button>
        <button
          onClick={() => setFilterMode('keys')}
          className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
            filterMode === 'keys'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
              : 'bg-zinc-950 text-zinc-400 border border-zinc-850 hover:text-amber-400'
          }`}
        >
          {language === 'es' ? 'Llaves' : 'Keys'}
        </button>
        <button
          onClick={() => setFilterMode('materials')}
          className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
            filterMode === 'materials'
              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
              : 'bg-zinc-950 text-zinc-400 border border-zinc-850 hover:text-cyan-400'
          }`}
        >
          {language === 'es' ? 'Materiales' : 'Materials'}
        </button>
      </div>

      {/* Virtualized Container */}
      <div
        ref={parentRef}
        className="h-[360px] overflow-auto scrollbar-thin border border-zinc-800/80 rounded-lg bg-zinc-950 p-1"
      >
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 font-mono">
            {language === 'es'
              ? 'No se encontraron objetos con este filtro.'
              : 'No items match current filter.'}
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = filteredItems[virtualRow.index];
              const status = getItemStatus(item);

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    padding: '2px 0',
                  }}
                >
                  <ItemCard
                    item={item}
                    statusText={status.text}
                    statusVariant={status.variant}
                    language={language}
                    onClick={() => setSelectedItem(item)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick In-Depth Details Dialog when clicking an item */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant={getItemStatus(selectedItem).isKeep ? 'emerald' : 'secondary'}>
                  {getItemStatus(selectedItem).text}
                </Badge>
                <Badge variant="outline">{selectedItem.category}</Badge>
              </div>
              <DialogTitle className="text-base font-bold text-zinc-100 pt-1">
                {getLocalized(selectedItem.name, language)}
              </DialogTitle>
              {selectedItem.description && (
                <DialogDescription className="text-xs text-zinc-400 font-sans">
                  {getLocalized(selectedItem.description, language)}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              {/* Station Upgrades */}
              {selectedItem.usedInUpgrades && selectedItem.usedInUpgrades.length > 0 && (
                <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 space-y-1.5">
                  <span className="font-mono text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    {language === 'es' ? 'Mejoras de Refugio Requeridas' : 'Required Station Upgrades'}
                  </span>
                  <div className="space-y-1">
                    {selectedItem.usedInUpgrades.map((u, i) => (
                      <div key={i} className="flex items-center justify-between font-mono text-zinc-300">
                        <span>
                          {getLocalized(u.stationName, language)} (Lv. {u.level})
                        </span>
                        <span className="text-amber-300 font-bold">x{u.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quests */}
              {selectedItem.usedInQuests && selectedItem.usedInQuests.length > 0 && (
                <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800 space-y-1.5">
                  <span className="font-mono text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                    {language === 'es' ? 'Misiones Vinculadas' : 'Linked Quests'}
                  </span>
                  <div className="font-mono text-zinc-300 text-[11px]">
                    {selectedItem.usedInQuests.join(', ')}
                  </div>
                </div>
              )}

              {/* Sell Price */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 font-mono">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                  {language === 'es' ? 'Valor de venta a comerciantes' : 'Vendor Salvage Value'}
                </span>
                <span className="font-bold text-zinc-200">{selectedItem.sellValue || 0} Credits</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
