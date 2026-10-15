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
import { Compass } from 'lucide-react';

export function App() {
  const { language } = usePlayerStore();
  const [currentTab, setCurrentTab] = useState<'quests' | 'planner' | 'about'>('quests');

  // Estado del Modal de Ingesta Visual (OCR / Visión IA)
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [pastedBlob, setPastedBlob] = useState<Blob | null>(null);

  // Listener global de pegado (Ctrl+V) para capturas de pantalla de Windows (Win+Shift+S)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
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

  // Filtros de búsqueda
  const [selectedVendor, setSelectedVendor] = useState<Vendor | 'ALL'>('ALL');
  const [selectedMapFilter, setSelectedMapFilter] = useState<MapId | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado reactivo de misiones
  const filteredQuests = useMemo(() => {
    return allQuests.filter((quest) => {
      // 1. Filtro por comerciante
      if (selectedVendor !== 'ALL' && quest.vendor !== selectedVendor) {
        return false;
      }

      // 2. Filtro por mapa
      if (selectedMapFilter !== 'ALL') {
        const hasObjectiveInMap = quest.objectives.some(
          (obj) => obj.mapId === selectedMapFilter || obj.mapId === 'any'
        );
        if (!hasObjectiveInMap) return false;
      }

      // 3. Filtro por búsqueda de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch =
          quest.title.en.toLowerCase().includes(q) ||
          (quest.title.es && quest.title.es.toLowerCase().includes(q));
        const vendorMatch = quest.vendor.toLowerCase().includes(q);
        const objMatch = quest.objectives.some(
          (obj) =>
            obj.description.en.toLowerCase().includes(q) ||
            (obj.description.es && obj.description.es.toLowerCase().includes(q))
        );
        if (!titleMatch && !vendorMatch && !objMatch) return false;
      }

      return true;
    });
  }, [selectedVendor, selectedMapFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCaptureModal={() => setIsCaptureModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'quests' && (
          <div className="space-y-6">
            {/* Top Filter and Search Bar */}
            <VendorSelector
              selectedVendor={selectedVendor}
              setSelectedVendor={setSelectedVendor}
              selectedMapFilter={selectedMapFilter}
              setSelectedMapFilter={setSelectedMapFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onOpenCaptureModal={() => setIsCaptureModalOpen(true)}
            />

            {/* Main 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Quest Cards List (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-100">
                      {language === 'es' ? 'Misiones Disponibles' : 'Available Quests'} ({filteredQuests.length})
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {language === 'es' ? 'Toca para activar/desactivar' : 'Tap to toggle active state'}
                  </span>
                </div>

                {filteredQuests.length === 0 ? (
                  <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-8 text-center space-y-2">
                    <p className="text-sm text-neutral-400 font-mono">
                      {language === 'es'
                        ? 'No se encontraron misiones con los filtros actuales.'
                        : 'No quests match the selected filters.'}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedVendor('ALL');
                        setSelectedMapFilter('ALL');
                        setSearchQuery('');
                      }}
                      className="text-xs text-amber-400 hover:underline font-mono"
                    >
                      {language === 'es' ? 'Restablecer filtros' : 'Reset filters'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQuests.map((quest) => (
                      <QuestCard key={quest.id} quest={quest} />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Loadout & Stash HUD (5 cols) */}
              <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
                <LoadoutChecklist />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'planner' && <RaidPlannerView />}

        {currentTab === 'about' && <AboutView />}
      </main>

      {/* Modal de Ingesta Visual */}
      <CaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => {
          setIsCaptureModalOpen(false);
          setPastedBlob(null);
        }}
        initialImageBlob={pastedBlob}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-4 px-6 text-center text-xs font-mono text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ARC Raiders Tactical Companion • GNU AGPLv3 License</span>
          <span>Open Source Project by Flickzman</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
