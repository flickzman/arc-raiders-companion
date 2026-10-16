import { type Quest, type MapId } from '../../data/schemas';
import { getMapById, getItemById, getPOIById } from '../../data/db';

export const MAP_ALIASES: Record<string, MapId> = {
  'river tides': 'riven_tides',
  'riven tides': 'riven_tides',
  'river': 'riven_tides',
  'riven': 'riven_tides',
  'marea': 'riven_tides',
  'mareas': 'riven_tides',
  'mareas rasgadas': 'riven_tides',
  'dam battlegrounds': 'dam_battlegrounds',
  'dam': 'dam_battlegrounds',
  'presa': 'dam_battlegrounds',
  'presa de batalla': 'dam_battlegrounds',
  'battlegrounds': 'dam_battlegrounds',
  'the spaceport': 'the_spaceport',
  'spaceport': 'the_spaceport',
  'puerto espacial': 'the_spaceport',
  'el puerto espacial': 'the_spaceport',
  'space port': 'the_spaceport',
  'buried city': 'buried_city',
  'ciudad enterrada': 'buried_city',
  'the blue gate': 'the_blue_gate',
  'blue gate': 'the_blue_gate',
  'puerta azul': 'the_blue_gate',
  'la puerta azul': 'the_blue_gate',
  'stella montis': 'stella_montis',
  'stella': 'stella_montis',
  'pendola pass': 'pendola_pass',
  'pendola': 'pendola_pass',
  'paso pendola': 'pendola_pass',
  'paso péndola': 'pendola_pass',
  'practice range': 'practice_range',
  'campo de tiro': 'practice_range',
};

/**
 * Multi-criteria search evaluator for quests
 * Checks:
 * - English and Spanish title
 * - Narrative introduction dialog (quest.description)
 * - Objective descriptions
 * - Vendor name
 * - Map aliases and localized map names
 * - Linked POI names
 * - Associated required/target/reward items
 */
export function matchesQuestSearch(quest: Quest, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  // 1. Title match
  if (
    quest.title.en.toLowerCase().includes(q) ||
    (quest.title.es && quest.title.es.toLowerCase().includes(q))
  ) {
    return true;
  }

  // 2. Narrative introduction description
  if (
    quest.description &&
    (quest.description.en.toLowerCase().includes(q) ||
      (quest.description.es && quest.description.es.toLowerCase().includes(q)))
  ) {
    return true;
  }

  // 3. Vendor / Faction
  if (quest.vendor.toLowerCase().includes(q)) {
    return true;
  }

  // 4. Objective descriptions
  const objMatch = quest.objectives.some(
    (obj) =>
      obj.description.en.toLowerCase().includes(q) ||
      (obj.description.es && obj.description.es.toLowerCase().includes(q))
  );
  if (objMatch) return true;

  // 5. Map alias or localized map name match
  for (const [alias, mapId] of Object.entries(MAP_ALIASES)) {
    if (q === alias || q.includes(alias) || (q.length >= 4 && alias.includes(q))) {
      const hasMap = quest.objectives.some(
        (obj) => obj.mapId === mapId || obj.mapId === 'any'
      );
      if (hasMap) return true;
    }
  }

  const mapNameMatch = quest.objectives.some((obj) => {
    if (obj.mapId === 'any') return false;
    const map = getMapById(obj.mapId);
    if (!map) return false;
    return (
      map.name.en.toLowerCase().includes(q) ||
      (map.name.es && map.name.es.toLowerCase().includes(q)) ||
      obj.mapId.toLowerCase().includes(q)
    );
  });
  if (mapNameMatch) return true;

  // 6. POI names
  const poiMatch = quest.objectives.some((obj) => {
    if (obj.poiId) {
      const poi = getPOIById(obj.poiId);
      if (
        poi &&
        (poi.name.en.toLowerCase().includes(q) ||
          (poi.name.es && poi.name.es.toLowerCase().includes(q)))
      ) {
        return true;
      }
    }
    if (obj.alternativePoiIds) {
      for (const altId of obj.alternativePoiIds) {
        const altPoi = getPOIById(altId);
        if (
          altPoi &&
          (altPoi.name.en.toLowerCase().includes(q) ||
            (altPoi.name.es && altPoi.name.es.toLowerCase().includes(q)))
        ) {
          return true;
        }
      }
    }
    return false;
  });
  if (poiMatch) return true;

  // 7. Items (bring, target, required, rewards)
  const itemMatch =
    quest.itemsToBring.some((it) => {
      const item = getItemById(it.itemId);
      if (!item) return false;
      return (
        item.name.en.toLowerCase().includes(q) ||
        (item.name.es && item.name.es.toLowerCase().includes(q))
      );
    }) ||
    quest.objectives.some((obj) => {
      if (obj.requiredItemId) {
        const item = getItemById(obj.requiredItemId);
        if (
          item &&
          (item.name.en.toLowerCase().includes(q) ||
            (item.name.es && item.name.es.toLowerCase().includes(q)))
        ) {
          return true;
        }
      }
      if (obj.targetItemId) {
        const item = getItemById(obj.targetItemId);
        if (
          item &&
          (item.name.en.toLowerCase().includes(q) ||
            (item.name.es && item.name.es.toLowerCase().includes(q)))
        ) {
          return true;
        }
      }
      return false;
    }) ||
    (quest.rewards?.items &&
      quest.rewards.items.some((it) => it.toLowerCase().includes(q)));

  if (itemMatch) return true;

  return false;
}
