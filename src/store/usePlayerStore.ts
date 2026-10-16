import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Quest, type Vendor, type MapId } from '../data/schemas';

export interface PlayerState {
  language: 'es' | 'en';
  activeQuestIds: string[];
  completedQuestIds: string[];
  completedObjectiveIds: string[];
  trackedItemIds: string[];

  // Misiones personalizadas (añadidas dinámicamente solo con título)
  customQuests: Quest[];
  
  // Planificador de Incursión
  selectedMapId: string | null;
  spawnPoiId: string | null;
  routeMode: 'rat' | 'sweep';

  // Visión por IA (opcional)
  geminiApiKey: string;

  // Acciones
  setLanguage: (lang: 'es' | 'en') => void;
  setGeminiApiKey: (key: string) => void;
  toggleActiveQuest: (questId: string) => void;
  addActiveQuests: (questIds: string[]) => void;
  addCustomQuest: (title: string, vendor?: Vendor, mapId?: MapId) => Quest;
  deleteCustomQuest: (questId: string) => void;
  toggleCompletedObjective: (objectiveId: string) => void;
  resetRaidObjectives: () => void;
  markQuestCompleted: (questId: string) => void;
  unmarkQuestCompleted: (questId: string) => void;
  setSelectedMapId: (mapId: string | null) => void;
  setSpawnPoiId: (poiId: string | null) => void;
  setRouteMode: (mode: 'rat' | 'sweep') => void;
  toggleTrackedItem: (itemId: string) => void;
  clearAllActiveQuests: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      language: 'en',
      activeQuestIds: ['quest_rising_tide', 'quest_what_we_left'], // Sample active quests by default
      completedQuestIds: [],
      completedObjectiveIds: [],
      trackedItemIds: [],
      customQuests: [],

      selectedMapId: 'dam_battlegrounds',
      spawnPoiId: 'dam_south_swamp',
      routeMode: 'rat',
      geminiApiKey: '',

      setLanguage: (language) => set({ language }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),

      toggleActiveQuest: (questId) =>
        set((state) => {
          const exists = state.activeQuestIds.includes(questId);
          return {
            activeQuestIds: exists
              ? state.activeQuestIds.filter((id) => id !== questId)
              : [...state.activeQuestIds, questId],
          };
        }),

      addActiveQuests: (questIds) =>
        set((state) => ({
          activeQuestIds: Array.from(new Set([...state.activeQuestIds, ...questIds])),
        })),

      addCustomQuest: (title: string, vendor: Vendor = 'Other', mapId: MapId = 'any') => {
        const cleanTitle = title.trim();
        const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newQuest: Quest = {
          id,
          title: {
            en: cleanTitle,
            es: cleanTitle,
          },
          vendor: vendor || 'Other',
          requiredLevel: 1,
          objectives: [
            {
              id: `${id}_obj_1`,
              description: {
                en: cleanTitle,
                es: cleanTitle,
              },
              type: 'recon',
              completed: false,
              mapId: mapId || 'any',
              alternativePoiIds: [],
              inOneRound: false,
              count: 1,
            },
          ],
          itemsToBring: [],
          rewards: {
            currency: 2000,
            xp: 500,
            items: ['Intel Cache'],
          },
        };

        set((state) => ({
          customQuests: [newQuest, ...state.customQuests],
          activeQuestIds: Array.from(new Set([id, ...state.activeQuestIds])),
        }));

        return newQuest;
      },

      deleteCustomQuest: (questId: string) =>
        set((state) => ({
          customQuests: state.customQuests.filter((q) => q.id !== questId),
          activeQuestIds: state.activeQuestIds.filter((id) => id !== questId),
          completedQuestIds: state.completedQuestIds.filter((id) => id !== questId),
        })),

      toggleCompletedObjective: (objectiveId) =>
        set((state) => {
          const exists = state.completedObjectiveIds.includes(objectiveId);
          return {
            completedObjectiveIds: exists
              ? state.completedObjectiveIds.filter((id) => id !== objectiveId)
              : [...state.completedObjectiveIds, objectiveId],
          };
        }),

      resetRaidObjectives: () => set({ completedObjectiveIds: [] }),

      markQuestCompleted: (questId) =>
        set((state) => ({
          activeQuestIds: state.activeQuestIds.filter((id) => id !== questId),
          completedQuestIds: Array.from(new Set([...state.completedQuestIds, questId])),
        })),

      unmarkQuestCompleted: (questId) =>
        set((state) => ({
          completedQuestIds: state.completedQuestIds.filter((id) => id !== questId),
        })),

      setSelectedMapId: (selectedMapId) => set({ selectedMapId, spawnPoiId: null }),

      setSpawnPoiId: (spawnPoiId) => set({ spawnPoiId }),

      setRouteMode: (routeMode) => set({ routeMode }),

      toggleTrackedItem: (itemId) =>
        set((state) => {
          const exists = state.trackedItemIds.includes(itemId);
          return {
            trackedItemIds: exists
              ? state.trackedItemIds.filter((id) => id !== itemId)
              : [...state.trackedItemIds, itemId],
          };
        }),

      clearAllActiveQuests: () => set({ activeQuestIds: [] }),
    }),
    {
      name: 'arc_companion_player_state_v1',
    }
  )
);
