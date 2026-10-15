import React, { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { allQuests, allItems, getItemById, getLocalized } from '../data/db';
import { Backpack, Crosshair, Wrench, CheckCircle2, Circle, ChevronRight } from 'lucide-react';

export const LoadoutChecklist: React.FC = () => {
  const { language, activeQuestIds } = usePlayerStore();
  const [checkedBringIds, setCheckedBringIds] = useState<Record<string, boolean>>({});

  const toggleBringChecked = (itemId: string) => {
    setCheckedBringIds((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // 1. Gather all items to bring from active quests
  const activeQuests = allQuests.filter((q) => activeQuestIds.includes(q.id));

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

  // 3. Hideout critical items (items that must NOT be recycled)
  const hideoutItems = allItems.filter((i) => i.usedInUpgrades && i.usedInUpgrades.length > 0);

  return (
    <div className="space-y-6">
      {/* SECTION 1: STASH PREPARATION (WHAT TO BRING) */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Backpack className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-100">
                {language === 'es' ? 'Preparación de Alijo (Qué Llevar)' : 'Stash Prep (What to Bring)'}
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                {itemsToBring.length > 0
                  ? (language === 'es' ? 'Llaves y herramientas requeridas para tus misiones activas' : 'Required keys & tools for your active quests')
                  : (language === 'es' ? 'No necesitas llaves específicas para las misiones actuales' : 'No specific keys required for current quests')}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
            {itemsToBring.length} {language === 'es' ? 'ítems' : 'items'}
          </span>
        </div>

        {itemsToBring.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500 font-mono">
            {language === 'es' ? '✓ Tu mochila está lista. Ninguna misión activa requiere objetos de alijo.' : '✓ Loadout clear. No active quests require specific stash items.'}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60 mt-2">
            {itemsToBring.map((entry) => {
              const item = getItemById(entry.itemId);
              if (!item) return null;
              const isChecked = !!checkedBringIds[entry.itemId];

              return (
                <div
                  key={entry.itemId}
                  onClick={() => toggleBringChecked(entry.itemId)}
                  className={`py-2.5 flex items-center justify-between cursor-pointer rounded-lg px-2 transition-colors ${
                    isChecked ? 'bg-neutral-950/60 opacity-60' : 'hover:bg-neutral-950/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-neutral-600 hover:text-amber-400" />
                    )}
                    <div>
                      <div className={`text-xs font-semibold ${isChecked ? 'line-through text-neutral-400' : 'text-neutral-200'}`}>
                        {getLocalized(item.name, language)}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {language === 'es' ? 'Para:' : 'For:'} {entry.questTitles.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      x{entry.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: RAID TARGETS (WHAT TO LOOT) */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-100">
                {language === 'es' ? 'Objetivos de Loot (Qué Buscar en Raid)' : 'Raid Loot Targets (What to Extract)'}
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                {language === 'es' ? 'Objetos clave para completar y extraer' : 'Key quest items to find and extract safely'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-neutral-800 text-purple-400 border border-neutral-700">
            {itemsToLoot.length} {language === 'es' ? 'objetivos' : 'targets'}
          </span>
        </div>

        {itemsToLoot.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500 font-mono">
            {language === 'es' ? 'Selecciona misiones en la lista para ver el loot prioritario.' : 'Select active quests to reveal priority extraction items.'}
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60 mt-2">
            {itemsToLoot.map((entry) => {
              const item = getItemById(entry.itemId);
              if (!item) return null;

              return (
                <div key={entry.itemId} className="py-2.5 flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">
                        {getLocalized(item.name, language)}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {language === 'es' ? 'Misión:' : 'Quest:'} {entry.questTitles.join(', ')}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-800/40">
                    x{entry.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: HIDEOUT & WORKSHOP CRITICAL MATERIALS (DO NOT SELL) */}
      <div className="bg-neutral-900/80 border border-amber-900/40 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <span>{language === 'es' ? 'Guía de Refugio: ¡NO VENDER!' : 'Hideout Guide: DO NOT SELL!'}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 uppercase font-mono">
                  {language === 'es' ? 'Crítico' : 'Critical'}
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400 font-mono">
                {language === 'es' ? 'Materiales requeridos para mejorar tus bancos de trabajo y alijo' : 'Materials required for workshop stations & stash expansion'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {hideoutItems.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-950/70 border border-neutral-800/80 rounded-lg p-3 space-y-2 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-neutral-200">
                  {getLocalized(item.name, language)}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                  {item.category}
                </span>
              </div>

              {/* Station Upgrades List */}
              <div className="space-y-1">
                {item.usedInUpgrades.map((upg, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3 text-amber-500" />
                      <span>{getLocalized(upg.stationName, language)} (Nv. {upg.level})</span>
                    </span>
                    <span className="font-bold text-amber-300">x{upg.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
