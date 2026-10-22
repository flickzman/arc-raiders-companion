import React, { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { type Quest, type MapId } from '../data/schemas';
import { getLocalized, getItemById, getPOIById, getMapById } from '../data/db';
import {
  Check,
  MapPin,
  Key,
  Target,
  Sparkles,
  Clock,
  Trash2,
  Radio,
} from 'lucide-react';

interface QuestCardProps {
  quest: Quest;
  onSelectMap?: (mapId: MapId) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onSelectMap }) => {
  const { language, activeQuestIds, toggleActiveQuest, deleteCustomQuest } = usePlayerStore();
  const isActive = activeQuestIds.includes(quest.id);
  const isCustom = quest.id.startsWith('custom_');
  const [showComms, setShowComms] = useState(false);

  return (
    <div
      onClick={() => toggleActiveQuest(quest.id)}
      className={`group cursor-pointer rounded-xl border p-3.5 transition-all duration-150 select-none ${
        isActive
          ? 'bg-zinc-900 border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
      }`}
    >
      {/* Header: Status Checkbox + Title + Vendor + Active Pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {/* Tactical Active Toggle Box */}
          <div
            className={`mt-0.5 w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 transition-all ${
              isActive
                ? 'bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/30'
                : 'border border-zinc-700 bg-zinc-950 group-hover:border-zinc-600'
            }`}
          >
            {isActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`font-bold text-sm tracking-tight truncate ${
                  isActive ? 'text-amber-300' : 'text-zinc-100'
                }`}
              >
                {getLocalized(quest.title, language)}
              </h3>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold shrink-0">
                {quest.vendor}
              </span>
              {isCustom && (
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-700/60 font-semibold shrink-0">
                  {language === 'es' ? 'Custom' : 'Custom'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top-Right Badges & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {quest.description && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowComms(!showComms);
              }}
              className={`p-1 rounded text-[11px] font-mono transition-colors ${
                showComms
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              }`}
              title={language === 'es' ? 'Ver mensaje de radio' : 'Toggle radio comms'}
            >
              <Radio className="w-3.5 h-3.5" />
            </button>
          )}

          {isCustom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteCustomQuest(quest.id);
              }}
              className="p-1 rounded hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 transition-colors"
              title={language === 'es' ? 'Eliminar' : 'Delete'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {isActive ? (
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {language === 'es' ? 'ACTIVA' : 'ACTIVE'}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800/80">
              {language === 'es' ? 'Inactiva' : 'Standby'}
            </span>
          )}
        </div>
      </div>

      {/* Optional Radio Comms Lore (Collapsible to prevent visual clutter) */}
      {showComms && quest.description && (
        <div className="mt-2.5 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 font-mono italic">
          "{getLocalized(quest.description, language)}"
        </div>
      )}

      {/* Objectives Checklist: Scannable under 5 seconds */}
      <div className="mt-2.5 space-y-1.5 pt-2 border-t border-zinc-800/60">
        {quest.objectives.map((obj) => {
          const map = obj.mapId !== 'any' ? getMapById(obj.mapId) : null;
          const poi = obj.poiId ? getPOIById(obj.poiId) : null;
          const requiredItem = obj.requiredItemId ? getItemById(obj.requiredItemId) : null;
          const targetItem = obj.targetItemId ? getItemById(obj.targetItemId) : null;

          return (
            <div
              key={obj.id}
              className="text-xs text-zinc-300 bg-zinc-950/40 border border-zinc-850 rounded-lg p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              {/* Objective Description */}
              <div className="flex items-start gap-1.5 min-w-0">
                <span className="text-amber-500/80 font-mono text-xs shrink-0">▸</span>
                <span className="leading-snug truncate sm:whitespace-normal">
                  {getLocalized(obj.description, language)}
                </span>
              </div>

              {/* Badges: Map, Required Item, Target Loot */}
              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {/* Sector / POI Badge */}
                {poi ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMap?.(obj.mapId);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-cyan-300 border border-cyan-800/40 hover:border-cyan-400 hover:text-cyan-200 transition-all cursor-pointer"
                    title={language === 'es' ? 'Filtrar este sector' : 'Filter this sector'}
                  >
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span className="truncate max-w-[120px]">{getLocalized(poi.name, language)}</span>
                  </button>
                ) : map ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMap?.(obj.mapId);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-cyan-500 hover:text-cyan-300 transition-all cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-zinc-500" />
                    <span>{getLocalized(map.name, language)}</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{language === 'es' ? 'Cualquier Sector' : 'Any Sector'}</span>
                  </span>
                )}

                {/* Key / Tool Required Badge */}
                {requiredItem && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                    <Key className="w-3 h-3 text-amber-400" />
                    <span>{getLocalized(requiredItem.name, language)}</span>
                  </span>
                )}

                {/* Target Loot to Extract Badge */}
                {targetItem && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                    <Target className="w-3 h-3 text-purple-400" />
                    <span>
                      {getLocalized(targetItem.name, language)}
                      {obj.count && obj.count > 1 ? ` x${obj.count}` : ''}
                    </span>
                  </span>
                )}

                {/* In One Round restriction */}
                {obj.inOneRound && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>1 Raid</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rewards Strip */}
      {quest.rewards && (quest.rewards.xp || quest.rewards.currency) && (
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1.5 border-t border-zinc-800/50">
          <div className="flex items-center gap-2">
            <span>+{quest.rewards.xp || 0} XP</span>
            <span>•</span>
            <span className="text-amber-300 font-bold">
              {quest.rewards.currency || 0} {language === 'es' ? 'Créditos' : 'Credits'}
            </span>
          </div>
          {quest.rewards.items && quest.rewards.items.length > 0 && (
            <span className="text-[10px] text-zinc-400 truncate max-w-[160px]">
              🎁 {quest.rewards.items[0]}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
