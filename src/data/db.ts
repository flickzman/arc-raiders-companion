import { z } from 'zod';
import {
  GameMapSchema,
  GameItemSchema,
  QuestSchema,
  type GameMap,
  type GameItem,
  type Quest,
  type POI,
  type LocalizedString,
} from './schemas';

import mapsRaw from './maps.json';
import itemsRaw from './items.json';
import questsRaw from './quests.json';

export const allMaps: GameMap[] = z.array(GameMapSchema).parse(mapsRaw);
export const allItems: GameItem[] = z.array(GameItemSchema).parse(itemsRaw);
export const allQuests: Quest[] = z.array(QuestSchema).parse(questsRaw);

export function getLocalized(obj: LocalizedString | undefined, lang: 'es' | 'en'): string {
  if (!obj) return '';
  if (lang === 'es' && obj.es) return obj.es;
  return obj.en || '';
}

export function getQuestById(id: string): Quest | undefined {
  return allQuests.find((q) => q.id === id);
}

export function getItemById(id: string): GameItem | undefined {
  return allItems.find((i) => i.id === id);
}

export function getMapById(id: string): GameMap | undefined {
  return allMaps.find((m) => m.id === id);
}

export function getPOIById(poiId: string): POI | undefined {
  for (const m of allMaps) {
    const found = m.pois.find((p) => p.id === poiId);
    if (found) return found;
  }
  return undefined;
}
