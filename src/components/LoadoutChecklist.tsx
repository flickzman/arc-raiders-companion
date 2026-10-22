import React, { useState, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { allQuests, getItemById, getLocalized } from '../data/db';
import { Backpack, Crosshair, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { SalvageItemList } from './SalvageItemList';
import { Badge } from './ui/badge';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export const LoadoutChecklist: React.FC = () => {
  const { language, activeQuestIds, customQuests } = usePlayerStore();
  const [checkedBringIds, setCheckedBringIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'prep' | 'salvage'>('prep');

  // Animation ref for list transitions
  const [bringListRef] = useAutoAnimate();
  const [lootListRef] = useAutoAnimate();

  const toggleBringChecked = (itemId: string) => {
    setCheckedBringIds((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // 1. Gather all items to bring from active quests
  const allAvailableQuests = useMemo(() => [...customQuests, ...allQuests], [customQuests]);
  const activeQuests = useMemo(
    () => allAvailableQuests.filter((q) => activeQuestIds.includes(q.id)),
    [allAvailableQuests, activeQuestIds]
  );

  const itemsToBringMap = new Map<string, { itemId: string; count: number; questTitles: string[] }>();
  activeQuests.forEach((q) => {
    q.itemsToBring.forEach((bring) => {
      const existing = itemsToBringMap.get(bring.itemId);
      const title = getLocalized(q.title, language);
      if (existing) {
        existing.count += bring.count;
        if (!existing.questTitles.includes(title)) existing.questTitles.push(title);
      } else {
        itemsToBringMap.set(bring.itemId, {
          itemId: bring.itemId,
          count: bring.count,
          questTitles: [title],
        });
      }
    });
  });
  const itemsToBring = Array.from(itemsToBringMap.values());

  // 2. Gather all loot target items to extract
  const itemsToLootMap = new Map<string, { itemId: string; count: number; questTitles: string[] }>();
  activeQuests.forEach((q) => {
    q.objectives.forEach((obj) => {
      if (obj.targetItemId) {
        const existing = itemsToLootMap.get(obj.targetItemId);
        const title = getLocalized(q.title, language);
        if (existing) {
          existing.count += obj.count || 1;
          if (!existing.questTitles.includes(title)) existing.questTitles.push(title);
        } else {
          itemsToLootMap.set(obj.targetItemId, {
            itemId: obj.targetItemId,
            count: obj.count || 1,
            questTitles: [title],
          });
        }
      }
    });
  });
  const itemsToLoot = Array.from(itemsToLootMap.values());

  return (
    <div className="space-y-4">
      {/* View Switcher Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'prep' | 'salvage')} className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="prep" className="gap-2">
            <Backpack className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'es' ? 'Mochila & Raid' : 'Raid Loadout'}</span>
            <Badge variant="amber" className="px-1.5 py-0 text-[10px]">
              {itemsToBring.length + itemsToLoot.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="salvage" className="gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'es' ? 'Guía de Chatarra' : 'Salvage & Items'}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: RAID PREPARATION & LOOT TARGETS */}
        <TabsContent value="prep" className="space-y-4 mt-3">
          {/* Section A: What to Bring into Raid */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Backpack className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-100">
                    {language === 'es' ? 'Qué Llevar a la Raid' : 'Loadout: What to Bring'}
                  </h3>
                </div>
              </div>
              <Badge variant="amber">
                {itemsToBring.length} {language === 'es' ? 'llaves/herramientas' : 'items'}
              </Badge>
            </div>

            {itemsToBring.length === 0 ? (
              <div className="py-5 text-center text-xs text-zinc-500 font-mono">
                {language === 'es'
                  ? '✓ Mochila despejada. Ninguna misión activa requiere llaves de alijo.'
                  : '✓ Loadout clear. No active quests require specific keys.'}
              </div>
            ) : (
              <div ref={bringListRef} className="space-y-1.5">
                {itemsToBring.map((entry) => {
                  const item = getItemById(entry.itemId);
                  if (!item) return null;
                  const isChecked = !!checkedBringIds[entry.itemId];

                  // Keep DOM node count under 6 elements:
                  // 1. root div
                  // 2. left div
                  // 3. check circle span / icon
                  // 4. name span
                  // 5. count badge span
                  return (
                    <div
                      key={entry.itemId}
                      onClick={() => toggleBringChecked(entry.itemId)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                        isChecked
                          ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400 opacity-60'
                          : 'bg-zinc-950/80 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-600 hover:text-amber-400 shrink-0" />
                        )}
                        <span className={`font-semibold truncate ${isChecked ? 'line-through text-zinc-400' : 'text-zinc-200'}`}>
                          {getLocalized(item.name, language)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                        x{entry.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section B: What to Extract from Raid */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Crosshair className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-100">
                    {language === 'es' ? 'Objetivos a Extraer' : 'Extraction Targets'}
                  </h3>
                </div>
              </div>
              <Badge variant="purple">
                {itemsToLoot.length} {language === 'es' ? 'objetivos' : 'targets'}
              </Badge>
            </div>

            {itemsToLoot.length === 0 ? (
              <div className="py-5 text-center text-xs text-zinc-500 font-mono">
                {language === 'es'
                  ? 'Activa misiones para ver el loot prioritario.'
                  : 'Select active quests to reveal extraction targets.'}
              </div>
            ) : (
              <div ref={lootListRef} className="space-y-1.5">
                {itemsToLoot.map((entry) => {
                  const item = getItemById(entry.itemId);
                  if (!item) return null;

                  // Keep DOM node count under 6 elements:
                  // 1. root div
                  // 2. left div
                  // 3. bullet span
                  // 4. name span
                  // 5. count badge span
                  return (
                    <div
                      key={entry.itemId}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                        <span className="font-semibold text-zinc-200 truncate">
                          {getLocalized(item.name, language)}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0">
                        x{entry.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: VIRTUALIZED SALVAGE & ITEM LIST */}
        <TabsContent value="salvage" className="mt-3">
          <SalvageItemList />
        </TabsContent>
      </Tabs>
    </div>
  );
};
