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

  it('correctly detects 10 collapsed quests from Arc Raiders logbook screen capture', () => {
    const collapsedLogbookDump = `
      LOGBOOK - ACTIVE CONTRACTS
      [x] Off The Radar - Celeste (0/1)
      [ ] A Balanced Harvest - Celeste
      [ ] Hatch Repairs (0/1)
      [x] A Rising Tide - Lance [TRACKED]
      [ ] A Bad Feeling
      > Spreading The Word
      [ ] The Old Ways (0/1)
      [x] Eyes In The Sky
      [ ] Industrial Espionage
      [ ] Buried Treasures (0/1)
    `;
    const matches = matchQuestsFromText(collapsedLogbookDump);
    const matchedIds = matches.map((m) => m.quest.id);

    expect(matchedIds).toContain('quest_off_the_radar');
    expect(matchedIds).toContain('quest_a_balanced_harvest');
    expect(matchedIds).toContain('quest_hatch_repairs');
    expect(matchedIds).toContain('quest_rising_tide');
    expect(matchedIds).toContain('quest_a_bad_feeling');
    expect(matches.length).toBeGreaterThanOrEqual(5);
  });

  it('matches all quests from user actual screenshot OCR dump', () => {
    const userScreenshotDump = `
QUESTS
> A DISTRACT AND DESTROY ARC ENEMIES
> {© SIZING THINGS UP
> +r, REDUCED TO RUBBLE
> f%7 TO THE SKIES
> €) CELESTE'S CHILDHOOD DRAWINGS
> © BOARDING THE FRIGATE
> €) MEDICAL MERCHANDISE
>» +1; CLAMORING FOR ATTENTION
    `;
    const matches = matchQuestsFromText(userScreenshotDump);
    const matchedIds = matches.map((m) => m.quest.id);

    console.log('Matches with matchedText:', matches.map(m => `${m.quest.title.en} (${m.confidence}%) -> "${m.matchedText}"`));

    expect(matchedIds).toContain('quest_distract_and_destroy_arc_enemies');
    expect(matchedIds).toContain('quest_sizing_things_up_118');
    expect(matchedIds).toContain('quest_reduced_to_rubble');
    expect(matchedIds).toContain('quest_to_the_skies_124');
    expect(matchedIds).toContain('quest_celeste_s_childhood_drawings_120');
    expect(matchedIds).toContain('quest_boarding_the_frigate_123');
    expect(matchedIds).toContain('quest_medical_merchandise');
    expect(matchedIds).toContain('quest_clamoring_for_attention_135');
    expect(matches.length).toBe(8);
  });

  it('matches all quests from Spanish game screen capture', () => {
    const spanishScreenshotDump = `
MISIONES
> {© TOMANDO MEDIDAS
> +r, REDUCIDO A ESCOMBROS
> f%7 HACIA EL CIELO
> €) DIBUJOS DE INFANCIA DE CELESTE
> © ABORDAR LA FRAGATA
> €) MERCANCÍA MÉDICA
>» +1; CLAMANDO POR ATENCIÓN
    `;
    const matches = matchQuestsFromText(spanishScreenshotDump);
    const matchedIds = matches.map((m) => m.quest.id);

    console.log('Detected from Spanish dump:', matches.map(m => `${m.quest.title.es} (${m.confidence}%)`));

    expect(matchedIds).toContain('quest_sizing_things_up_118');
    expect(matchedIds).toContain('quest_reduced_to_rubble');
    expect(matchedIds).toContain('quest_to_the_skies_124');
    expect(matchedIds).toContain('quest_celeste_s_childhood_drawings_120');
    expect(matchedIds).toContain('quest_boarding_the_frigate_123');
    expect(matchedIds).toContain('quest_medical_merchandise');
    expect(matchedIds).toContain('quest_clamoring_for_attention_135');
    expect(matches.length).toBe(7);
  });
});
