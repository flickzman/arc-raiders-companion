import { describe, it, expect } from 'vitest';
import { matchQuestsFromText } from '../src/services/ocr/fuzzyMatcher';

describe('OCR Fuzzy Matching Service', () => {
  it('matches quests with exact English titles', () => {
    const ocrText = 'Off The Radar\nContract from Celeste';
    const matches = matchQuestsFromText(ocrText);
    
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].quest.id).toBe('quest_off_the_radar');
    expect(matches[0].confidence).toBeGreaterThanOrEqual(70);
  });

  it('matches quests with exact Spanish titles', () => {
    const ocrText = 'Misión: Reparación de Escotillas\nComerciante: Shani';
    const matches = matchQuestsFromText(ocrText);
    
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].quest.id).toBe('quest_hatch_repairs');
  });

  it('tolerates OCR noise, typos, and number substitutions (leetspeak)', () => {
    // OCR often confuses 'O' with '0', 'i' with '1', 'E' with '3'
    const noisyText = '0ff Th3 Radar\nCeleste';
    const matches = matchQuestsFromText(noisyText);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m) => m.quest.id === 'quest_off_the_radar')).toBe(true);
  });

  it('extracts multiple distinct quests from a multi-line screen dump', () => {
    const multiQuestOcrDump = `
      CURRENT CONTRACTS
      -----------------
      1. Off The Radar - Celeste
      2. Hatch Repairs - Shani
      3. A Rising Tide - Lance
      ACTIVE RAIDS
    `;
    const matches = matchQuestsFromText(multiQuestOcrDump);
    const matchedIds = matches.map((m) => m.quest.id);

    expect(matchedIds).toContain('quest_off_the_radar');
    expect(matchedIds).toContain('quest_hatch_repairs');
    expect(matchedIds).toContain('quest_rising_tide');
  });

  it('ignores irrelevant strings or random noise', () => {
    const randomNoise = 'xyz 12345 !!! ???? Lorem Ipsum dolor sit amet';
    const matches = matchQuestsFromText(randomNoise);

    expect(matches.length).toBe(0);
  });
});
