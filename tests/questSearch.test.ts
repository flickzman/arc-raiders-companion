import { describe, it, expect } from 'vitest';
import { matchesQuestSearch } from '../src/services/search/questSearch';
import { allQuests } from '../src/data/db';

describe('Intelligent Quest Search & Map Aliases', () => {
  it('should find Riven Tides quests when searching with typo / variation "river tides"', () => {
    const results = allQuests.filter((q) => matchesQuestSearch(q, 'river tides'));
    expect(results.length).toBeGreaterThan(0);

    const batteningDown = results.find((q) => q.title.en === 'Battening Down');
    expect(batteningDown).toBeDefined();
    expect(batteningDown?.objectives.some((o) => o.mapId === 'riven_tides')).toBe(true);
  });

  it('should find Riven Tides quests when searching "Riven Tides" or "marea"', () => {
    const resultsEn = allQuests.filter((q) => matchesQuestSearch(q, 'Riven Tides'));
    expect(resultsEn.length).toBeGreaterThan(0);

    const resultsEs = allQuests.filter((q) => matchesQuestSearch(q, 'marea'));
    expect(resultsEs.length).toBeGreaterThan(0);
  });

  it('should find Dam Battlegrounds quests when searching "dam" or "presa"', () => {
    const resultsDam = allQuests.filter((q) => matchesQuestSearch(q, 'dam'));
    expect(resultsDam.length).toBeGreaterThan(0);
    expect(resultsDam.some((q) => q.id === 'quest_off_the_radar')).toBe(true);

    const resultsPresa = allQuests.filter((q) => matchesQuestSearch(q, 'presa'));
    expect(resultsPresa.length).toBeGreaterThan(0);
  });

  it('should find Spaceport quests when searching "spaceport" or "puerto espacial"', () => {
    const results = allQuests.filter((q) => matchesQuestSearch(q, 'spaceport'));
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((q) => q.objectives.some((o) => o.mapId === 'the_spaceport'))).toBe(true);
  });

  it('should find quests by narrative introductory dialogue', () => {
    // Battening Down dialogue mentions "seawalls at Riven Tides"
    const results = allQuests.filter((q) => matchesQuestSearch(q, 'seawalls'));
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((q) => q.title.en === 'Battening Down')).toBe(true);
  });

  it('should find quests by specific item rewards', () => {
    const results = allQuests.filter((q) => matchesQuestSearch(q, 'Hotel Keycard No. 107'));
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((q) => q.title.en === 'Battening Down')).toBe(true);
  });
});
