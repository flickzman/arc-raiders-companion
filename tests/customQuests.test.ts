import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { matchQuestsFromText } from '../src/services/ocr/fuzzyMatcher';
import { QuestSchema } from '../src/data/schemas';

describe('Custom Quest by Title Feature', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      customQuests: [],
      activeQuestIds: [],
    });
  });

  it('adds a custom quest with just the title and validates against QuestSchema', () => {
    const store = usePlayerStore.getState();
    const customQuest = store.addCustomQuest('Infiltrar Laboratorio Secreto');

    expect(customQuest).toBeDefined();
    expect(customQuest.id).toMatch(/^custom_/);
    expect(customQuest.title.en).toBe('Infiltrar Laboratorio Secreto');
    expect(customQuest.title.es).toBe('Infiltrar Laboratorio Secreto');
    expect(customQuest.vendor).toBe('Other');
    expect(customQuest.objectives.length).toBe(1);
    expect(customQuest.objectives[0].mapId).toBe('any');

    // Validar esquema Zod
    const validation = QuestSchema.safeParse(customQuest);
    expect(validation.success).toBe(true);

    // Verificar que se añadió a customQuests y a activeQuestIds
    const updatedState = usePlayerStore.getState();
    expect(updatedState.customQuests.some((q) => q.id === customQuest.id)).toBe(true);
    expect(updatedState.activeQuestIds).toContain(customQuest.id);
  });

  it('allows specifying vendor and mapId when adding with title', () => {
    const store = usePlayerStore.getState();
    const customQuest = store.addCustomQuest(
      'Hackear Terminal de Lanzadera',
      'Apollo',
      'the_spaceport'
    );

    expect(customQuest.vendor).toBe('Apollo');
    expect(customQuest.objectives[0].mapId).toBe('the_spaceport');
  });

  it('deletes a custom quest cleanly from customQuests and activeQuestIds', () => {
    const store = usePlayerStore.getState();
    const customQuest = store.addCustomQuest('Misión Temporal a Borrar');

    expect(usePlayerStore.getState().customQuests.length).toBe(1);
    expect(usePlayerStore.getState().activeQuestIds).toContain(customQuest.id);

    store.deleteCustomQuest(customQuest.id);

    expect(usePlayerStore.getState().customQuests.length).toBe(0);
    expect(usePlayerStore.getState().activeQuestIds).not.toContain(customQuest.id);
  });

  it('allows OCR fuzzy matcher to detect newly added custom quests', () => {
    const store = usePlayerStore.getState();
    const customQuest = store.addCustomQuest('Protocolo Omega');

    const matches = matchQuestsFromText('Misión detectada: Protocolo Omega', [customQuest]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].quest.id).toBe(customQuest.id);
    expect(matches[0].confidence).toBeGreaterThanOrEqual(80);
  });
});
