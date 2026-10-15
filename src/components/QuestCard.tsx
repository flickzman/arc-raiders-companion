import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { type Quest } from '../data/schemas';
import { getLocalized, getItemById, getPOIById, getMapById } from '../data/db';
import { Check, MapPin, Key, Target, Award, Sparkles, Lock, Split, Clock } from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest }) => {
  const { language, activeQuestIds, toggleActiveQuest } = usePlayerStore();
  const isActive = activeQuestIds.includes(quest.id);

  return (
    <div
      onClick={() => toggleActiveQuest(quest.id)}
      className={`group cursor-pointer rounded-xl border p-4 transition-all duration-200 select-none ${
        isActive
          ? 'bg-neutral-900/90 border-amber-500/70 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
          : 'bg-neutral-950/70 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/40'
      }`}
    >
      {/* Header: Checkbox + Title + Vendor */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Custom Tactical Checkbox */}
          <div
            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-all ${
              isActive
                ? 'bg-amber-500 text-neutral-950 font-black shadow-sm shadow-amber-500/30'
                : 'border border-neutral-700 bg-neutral-900 group-hover:border-neutral-600'
            }`}
          >
            {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>

          <div>
            <h3 className={`font-bold text-sm tracking-wide ${isActive ? 'text-amber-300' : 'text-neutral-200'}`}>
              {getLocalized(quest.title, language)}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-semibold">
                {quest.vendor}
              </span>
              {quest.requiredLevel && (
                <span className="text-[10px] font-mono text-neutral-400">
                  {language === 'es' ? 'Nv.' : 'Lv.'} {quest.requiredLevel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Active Indicator Badge */}
        {isActive && (
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
            {language === 'es' ? 'ACTIVA' : 'ACTIVE'}
          </span>
        )}
      </div>

      {/* Objectives Breakdown */}
      <div className="mt-3.5 space-y-2 pt-3 border-t border-neutral-800/70">
        <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
          {language === 'es' ? 'Objetivos de Incursión' : 'Raid Objectives'} ({quest.objectives.length})
        </div>

        <ul className="space-y-1.5">
          {quest.objectives.map((obj) => {
            const map = obj.mapId !== 'any' ? getMapById(obj.mapId) : null;
            const poi = obj.poiId ? getPOIById(obj.poiId) : null;
            const requiredItem = obj.requiredItemId ? getItemById(obj.requiredItemId) : null;
            const targetItem = obj.targetItemId ? getItemById(obj.targetItemId) : null;

            return (
              <li
                key={obj.id}
                className="text-xs text-neutral-300 bg-neutral-950/60 border border-neutral-800/50 rounded-lg p-2.5 space-y-1.5"
              >
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-500/80 font-mono text-xs">▸</span>
                  <span className="leading-snug">{getLocalized(obj.description, language)}</span>
                </div>

                {/* Badges: Map, POI, Items */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {/* Map / POI Badge */}
                  {poi ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-cyan-300 border border-cyan-800/40">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{getLocalized(poi.name, language)}</span>
                      {poi.dangerLevel === 'high' && (
                        <span className="text-red-400 font-bold" title={language === 'es' ? 'Alto Peligro' : 'High Hazard'}>!</span>
                      )}
                    </span>
                  ) : map ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                      <MapPin className="w-3 h-3 text-neutral-400" />
                      <span>{getLocalized(map.name, language)}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{language === 'es' ? 'Cualquier Sector' : 'Any Sector'}</span>
                    </span>
                  )}

                  {/* Required Item Badge */}
                  {requiredItem && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 font-semibold">
                      <Key className="w-3 h-3 text-amber-400" />
                      <span>{language === 'es' ? 'Llevar:' : 'Bring:'} {getLocalized(requiredItem.name, language)}</span>
                    </span>
                  )}

                  {/* Target Loot Badge */}
                  {targetItem && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40 font-semibold">
                      <Target className="w-3 h-3 text-purple-400" />
                      <span>
                        {language === 'es' ? 'Lootear:' : 'Loot:'} {getLocalized(targetItem.name, language)}
                        {obj.count && obj.count > 1 ? ` x${obj.count}` : ''}
                      </span>
                    </span>
                  )}

                  {/* Alternative POIs Badge (OR) */}
                  {obj.alternativePoiIds && obj.alternativePoiIds.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/40">
                      <Split className="w-3 h-3 text-amber-400" />
                      <span>
                        {language === 'es' ? 'Alternativas válidas (uno u otro)' : 'Alternative sites (one or other)'}
                      </span>
                    </span>
                  )}

                  {/* Sequential Dependency Badge (AND) */}
                  {obj.dependsOnObjectiveId && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40">
                      <Lock className="w-3 h-3 text-rose-400" />
                      <span>
                        {language === 'es' ? 'Secuencial (Requiere paso previo)' : 'Sequential (Requires prior step)'}
                      </span>
                    </span>
                  )}

                  {/* In One Round Badge */}
                  {obj.inOneRound && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>
                        {language === 'es' ? 'En 1 sola raid' : 'In 1 round'}
                      </span>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Rewards snippet */}
      {quest.rewards && (quest.rewards.xp || quest.rewards.currency) && (
        <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-800/50">
          <div className="flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>+{quest.rewards.xp} XP</span>
            <span>•</span>
            <span className="text-amber-300 font-bold">
              {quest.rewards.currency} {language === 'es' ? 'Créditos' : 'Credits'}
            </span>
          </div>
          {quest.rewards.items && quest.rewards.items.length > 0 && (
            <span className="text-[10px] text-neutral-400 truncate max-w-[140px]">
              {quest.rewards.items[0]}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
