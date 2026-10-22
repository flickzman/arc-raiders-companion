import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ItemCard } from '../src/components/ItemCard';
import { allItems, allQuests } from '../src/data/db';
import { matchesQuestSearch } from '../src/services/search/questSearch';

describe('UI Refactor Performance Constraints & DOM Node Limits', () => {
  it('strictly enforces DOM nodes per item card under 6 elements', () => {
    const testItem = allItems[0];
    expect(testItem).toBeDefined();

    const html = renderToStaticMarkup(
      React.createElement(ItemCard, {
        item: testItem,
        statusText: 'KEEP (Quest)',
        statusVariant: 'keep',
        language: 'en',
      })
    );

    // Count every DOM element rendered in the item card (opening tags)
    // Matches: <div, <span, etc. but not closing </div
    const elementMatches = html.match(/<[a-z0-9]+(?=[\s>])/gi);
    const elementCount = elementMatches ? elementMatches.length : 0;

    // Strict constraint: "Keep DOM nodes per item card under 6 elements."
    expect(elementCount).toBeLessThan(6);
    expect(elementCount).toBe(5); // Specifically 1 root div + 1 wrapper div + 3 spans
  });

  it('guarantees sub-10ms search execution across the full quest database', () => {
    const searchQueries = [
      'buried city',
      'dam',
      'spaceport',
      'tian wen',
      'keycard',
      'power cell',
      'hotel',
      'hospital',
      'marea',
      'river tides',
    ];

    const startTime = performance.now();
    const ITERATIONS = 100;

    for (let i = 0; i < ITERATIONS; i++) {
      for (const query of searchQueries) {
        allQuests.filter((q) => matchesQuestSearch(q, query));
      }
    }

    const totalDuration = performance.now() - startTime;
    const avgDurationPerSearch = totalDuration / (ITERATIONS * searchQueries.length);

    // Sub-10ms requirement: Average duration per keyboard search filter
    expect(avgDurationPerSearch).toBeLessThan(10);
  });

  it('provides allItems with valid category and localized names for virtualized salvage rendering', () => {
    expect(allItems.length).toBeGreaterThan(0);
    allItems.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.name.en).toBeTruthy();
      expect(item.category).toBeTruthy();
    });
  });
});
