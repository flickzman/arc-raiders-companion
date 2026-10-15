import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { GameMapSchema, GameItemSchema, QuestSchema } from '../src/data/schemas';

import mapsData from '../src/data/maps.json';
import itemsData from '../src/data/items.json';
import questsData from '../src/data/quests.json';

describe('Data Integrity & Schema Validation', () => {
  it('should validate maps.json against GameMapSchema', () => {
    const result = z.array(GameMapSchema).safeParse(mapsData);
    expect(result.success).toBe(true);
  });

  it('should validate items.json against GameItemSchema', () => {
    const result = z.array(GameItemSchema).safeParse(itemsData);
    expect(result.success).toBe(true);
  });

  it('should validate quests.json against QuestSchema', () => {
    const result = z.array(QuestSchema).safeParse(questsData);
    expect(result.success).toBe(true);
  });

  it('should guarantee referential integrity across maps, items and quests', () => {
    const maps = z.array(GameMapSchema).parse(mapsData);
    const items = z.array(GameItemSchema).parse(itemsData);
    const quests = z.array(QuestSchema).parse(questsData);

    // Map of all POI IDs
    const allPoiIds = new Set<string>();
    maps.forEach((m) => {
      m.pois.forEach((poi) => allPoiIds.add(poi.id));
    });

    // Set of all Item IDs
    const allItemIds = new Set<string>(items.map((i) => i.id));

    // Set of all Quest IDs
    const allQuestIds = new Set<string>(quests.map((q) => q.id));

    // 1. Verify every objective poiId exists in maps
    for (const quest of quests) {
      for (const obj of quest.objectives) {
        if (obj.poiId) {
          expect(
            allPoiIds.has(obj.poiId),
            `Objective "${obj.id}" in quest "${quest.id}" references unknown poiId: "${obj.poiId}"`
          ).toBe(true);
        }

        // 2. Verify requiredItemId exists
        if (obj.requiredItemId) {
          expect(
            allItemIds.has(obj.requiredItemId),
            `Objective "${obj.id}" in quest "${quest.id}" references unknown requiredItemId: "${obj.requiredItemId}"`
          ).toBe(true);
        }

        // 3. Verify targetItemId exists
        if (obj.targetItemId) {
          expect(
            allItemIds.has(obj.targetItemId),
            `Objective "${obj.id}" in quest "${quest.id}" references unknown targetItemId: "${obj.targetItemId}"`
          ).toBe(true);
        }
      }

      // 4. Verify itemsToBring exist
      for (const bringItem of quest.itemsToBring) {
        expect(
          allItemIds.has(bringItem.itemId),
          `Quest "${quest.id}" itemsToBring references unknown itemId: "${bringItem.itemId}"`
        ).toBe(true);
      }
    }

    // 5. Verify items usedInQuests reference existing quests
    for (const item of items) {
      for (const questId of item.usedInQuests) {
        expect(
          allQuestIds.has(questId),
          `Item "${item.id}" usedInQuests references unknown questId: "${questId}"`
        ).toBe(true);
      }
    }
  });
});
