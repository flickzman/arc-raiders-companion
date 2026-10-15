import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { allQuests } from '../data/db';
import { type Vendor, type MapId } from '../data/schemas';
import { Search, X, Trash2, Filter, Camera } from 'lucide-react';

interface VendorSelectorProps {
  selectedVendor: Vendor | 'ALL';
  setSelectedVendor: (v: Vendor | 'ALL') => void;
  selectedMapFilter: MapId | 'ALL';
  setSelectedMapFilter: (m: MapId | 'ALL') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenCaptureModal?: () => void;
}

const vendors: { id: Vendor; role: { en: string; es: string } }[] = [
  { id: 'Tian Wen', role: { en: 'Scavenger & Recon', es: 'Chatarrero y Reconocimiento' } },
  { id: 'Shani', role: { en: 'Field Medic & Supplies', es: 'Médico de Campo y Suministros' } },
  { id: 'Lance', role: { en: 'Tactical Vanguard', es: 'Vanguardia Táctica' } },
  { id: 'Celeste', role: { en: 'Heavy ARC Hunter', es: 'Cazadora ARC Pesada' } },
  { id: 'Apollo', role: { en: 'Energy Grid Engineer', es: 'Ingeniero de Red Eléctrica' } },
];

export const VendorSelector: React.FC<VendorSelectorProps> = ({
  selectedVendor,
  setSelectedVendor,
  selectedMapFilter,
  setSelectedMapFilter,
  searchQuery,
  setSearchQuery,
  onOpenCaptureModal,
}) => {
  const { language, activeQuestIds, clearAllActiveQuests } = usePlayerStore();

  const getVendorActiveCount = (v: Vendor) => {
    return allQuests
      .filter((q) => q.vendor === v)
      .filter((q) => activeQuestIds.includes(q.id)).length;
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-4">
      {/* Search and Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'es'
                ? 'Buscar misión, objetivo, POI o ítem...'
                : 'Search quest, objective, POI or item...'
            }
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Map Filter Selector & OCR Trigger */}
        <div className="flex items-center gap-2">
          {onOpenCaptureModal && (
            <button
              onClick={onOpenCaptureModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/20 text-amber-400 text-xs font-mono font-semibold transition-all whitespace-nowrap shadow-sm shadow-amber-500/5"
              title={
                language === 'es'
                  ? 'Pegar captura con Ctrl+V o escanear con cámara'
                  : 'Paste screenshot with Ctrl+V or scan with camera'
              }
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {language === 'es' ? 'OCR / Captura' : 'OCR / Capture'}
              </span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-neutral-900 text-amber-300 border border-neutral-700 font-mono hidden md:inline">
                Ctrl+V
              </span>
            </button>
          )}

          <Filter className="w-4 h-4 text-neutral-500 hidden sm:inline" />
          <select
            value={selectedMapFilter}
            onChange={(e) => setSelectedMapFilter(e.target.value as MapId | 'ALL')}
            className="bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-2.5 py-2 text-neutral-300 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">{language === 'es' ? 'Todos los Mapas' : 'All Maps'}</option>
            <option value="dam_battlegrounds">
              {language === 'es' ? 'Presa de Batalla' : 'Dam Battlegrounds'}
            </option>
            <option value="buried_city">
              {language === 'es' ? 'Ciudad Enterrada' : 'Buried City'}
            </option>
            <option value="the_spaceport">
              {language === 'es' ? 'El Puerto Espacial' : 'The Spaceport'}
            </option>
            <option value="any">
              {language === 'es' ? 'Cualquier Sector' : 'Any Sector'}
            </option>
          </select>

          {/* Clear All Button */}
          {activeQuestIds.length > 0 && (
            <button
              onClick={clearAllActiveQuests}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-red-900/50 hover:bg-red-950/20 text-neutral-400 hover:text-red-400 text-xs transition-colors"
              title={language === 'es' ? 'Deseleccionar todas las misiones' : 'Clear all active quests'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{language === 'es' ? 'Limpiar' : 'Clear'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Vendor Chips (10-second fast selection flow) */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2 flex items-center justify-between">
          <span>{language === 'es' ? 'Comerciantes / Facciones' : 'Vendors / Factions'}</span>
          <span className="text-amber-500/80 font-bold">
            {activeQuestIds.length} {language === 'es' ? 'activas seleccionadas' : 'active selected'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* ALL Chip */}
          <button
            onClick={() => setSelectedVendor('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedVendor === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/10'
                : 'bg-neutral-950/80 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            {language === 'es' ? 'Todos' : 'All'}
          </button>

          {/* Each Vendor Chip */}
          {vendors.map((v) => {
            const activeCount = getVendorActiveCount(v.id);
            const isSelected = selectedVendor === v.id;

            return (
              <button
                key={v.id}
                onClick={() => setSelectedVendor(isSelected ? 'ALL' : v.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/10'
                    : 'bg-neutral-950/80 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <span>{v.id}</span>
                {activeCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500 text-neutral-950 font-bold">
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
