import { useState, useMemo, useEffect } from 'react';
import { usePlayerStore } from './store/usePlayerStore';
import { allQuests } from './data/db';
import { type Vendor, type MapId } from './data/schemas';
import { Navbar } from './components/Navbar';
import { VendorSelector } from './components/VendorSelector';
import { QuestCard } from './components/QuestCard';
import { LoadoutChecklist } from './components/LoadoutChecklist';
import { RaidPlannerView } from './components/RaidPlannerView';
import { AboutView } from './components/AboutView';
import { CaptureModal } from './components/CaptureModal';
import { CommandBar } from './components/CommandBar';
import { matchesQuestSearch } from './services/search/questSearch';
import { Compass } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export function App() {
  const { language, activeQuestIds, customQuests } = usePlayerStore();
  const [currentTab, setCurrentTab] = useState<'quests' | 'planner' | 'about'>('quests');

  // Command Bar & Visual Capture Modal States
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [pastedBlob, setPastedBlob] = useState<Blob | null>(null);

  // Animated quest list container
  const [questListRef] = useAutoAnimate();

  // Full pool of available quests
  const allAvailableQuests = useMemo(
    () => [...customQuests, ...allQuests],
    [customQuests]
  );

  // Global paste handler for screenshots (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.clipboardData && e.clipboardData.items) {
        for (const item of Array.from(e.clipboardData.items)) {
          if (item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            if (blob) {
              e.preventDefault();
              setPastedBlob(blob);
              setIsCaptureModalOpen(true);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Filter States
  const [selectedVendor, setSelectedVendor] = useState<Vendor | 'ALL'>('ALL');
  const [selectedMapFilter, setSelectedMapFilter] = useState<MapId | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Reactive Quest Filtering
  const filteredQuests = useMemo(() => {
    return allAvailableQuests.filter((quest) => {
      // 1. Active Only filter
      if (showActiveOnly && !activeQuestIds.includes(quest.id)) {
        return false;
      }

      // 2. Vendor filter
      if (selectedVendor !== 'ALL' && quest.vendor !== selectedVendor) {
        return false;
      }

      // 3. Map filter
      if (selectedMapFilter !== 'ALL') {
        const hasObjectiveInMap = quest.objectives.some(
          (obj) => obj.mapId === selectedMapFilter || obj.mapId === 'any'
        );
        if (!hasObjectiveInMap) return false;
      }

      // 4. Multi-criteria search
      if (searchQuery.trim()) {
        if (!matchesQuestSearch(quest, searchQuery)) return false;
      }

      return true;
    });
  }, [allAvailableQuests, activeQuestIds, showActiveOnly, selectedVendor, selectedMapFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCaptureModal={() => setIsCaptureModalOpen(true)}
        onOpenCommandBar={() => setIsCommandBarOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6">
        {currentTab === 'quests' && (
          <div className="space-y-4">
            {/* Top Quick Sector & Filter Bar */}
            <VendorSelector
              selectedVendor={selectedVendor}
              setSelectedVendor={setSelectedVendor}
              selectedMapFilter={selectedMapFilter}
              setSelectedMapFilter={setSelectedMapFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showActiveOnly={showActiveOnly}
              setShowActiveOnly={setShowActiveOnly}
              onOpenCommandBar={() => setIsCommandBarOpen(true)}
            />

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Streamlined Quest Cards List (7 cols) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-100">
                      {language === 'es' ? 'Misiones' : 'Quests'}{' '}
                      <span className="text-zinc-500 font-normal">({filteredQuests.length})</span>
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {language === 'es' ? '1 clic para activar/desactivar' : '1-click to toggle active status'}
                  </span>
                </div>

                {filteredQuests.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-3">
                    <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                      {language === 'es'
                        ? 'No se encontraron misiones con los filtros actuales.'
                        : 'No quests match the selected filters.'}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedVendor('ALL');
                        setSelectedMapFilter('ALL');
                        setSearchQuery('');
                        setShowActiveOnly(false);
                      }}
                      className="text-xs text-amber-400 hover:underline font-mono"
                    >
                      {language === 'es' ? 'Restablecer todos los filtros' : 'Reset all filters'}
                    </button>
                  </div>
                ) : (
                  <div ref={questListRef} className="space-y-2.5">
                    {filteredQuests.map((quest) => (
                      <QuestCard
                        key={quest.id}
                        quest={quest}
                        onSelectMap={(mapId) => setSelectedMapFilter(mapId)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Tactical Loadout & Salvage Guide (5 cols) */}
              <div className="lg:col-span-5 lg:sticky lg:top-16 space-y-4">
                <LoadoutChecklist />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'planner' && <RaidPlannerView />}

        {currentTab === 'about' && <AboutView />}
      </main>

      {/* Global Command Bar (cmdk) */}
      <CommandBar
        isOpen={isCommandBarOpen}
        setIsOpen={setIsCommandBarOpen}
        onSelectMap={(m) => setSelectedMapFilter(m)}
        onNavigateTab={(t) => setCurrentTab(t)}
        onOpenCaptureModal={() => setIsCaptureModalOpen(true)}
      />

      {/* OCR Visual Ingestion Modal */}
      <CaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => {
          setIsCaptureModalOpen(false);
          setPastedBlob(null);
        }}
        initialImageBlob={pastedBlob}
      />

      {/* Tactical Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-3 px-6 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RAPPO • Arc Raiders Tactical Companion</span>
          <span>Open Source AGPLv3 • Press <kbd className="text-zinc-400">Ctrl+K</kbd> for quick command search</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
