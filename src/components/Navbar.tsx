import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Shield, MapPin, CheckSquare, Globe, Info, Camera, Search } from 'lucide-react';

interface NavbarProps {
  currentTab: 'quests' | 'planner' | 'about';
  setCurrentTab: (tab: 'quests' | 'planner' | 'about') => void;
  onOpenCaptureModal: () => void;
  onOpenCommandBar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCaptureModal,
  onOpenCommandBar,
}) => {
  const { language, setLanguage, activeQuestIds } = usePlayerStore();

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-widest text-zinc-100 text-sm uppercase">RAPPO</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                ARC COMPANION
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono tracking-tight hidden sm:block">
              {language === 'es' ? 'Planificador Táctico de Incursiones' : 'Tactical Raid & Stash Companion'}
            </p>
          </div>
        </div>

        {/* Global Quick Command Bar Trigger (Sub-10ms) */}
        <button
          onClick={onOpenCommandBar}
          className="flex-1 max-w-sm hidden sm:flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-xs font-mono transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-500" />
            <span>{language === 'es' ? 'Buscar misiones, ítems...' : 'Quick search quests, items...'}</span>
          </div>
          <kbd className="text-[10px] bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentTab('quests')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              currentTab === 'quests'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'es' ? 'Misiones & Alijo' : 'Quests & Stash'}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                currentTab === 'quests' ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {activeQuestIds.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('planner')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              currentTab === 'planner'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'es' ? 'Raid Planner' : 'Raid Planner'}</span>
          </button>

          {/* OCR / Scan Action Button */}
          <button
            onClick={onOpenCaptureModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-850 text-zinc-300 text-xs font-mono transition-all"
            title={language === 'es' ? 'Escanear pantalla / Pegar con Ctrl+V' : 'Scan screen / Paste with Ctrl+V'}
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{language === 'es' ? 'Escanear' : 'Scan'}</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-800 text-amber-400 font-mono hidden lg:inline">
              Ctrl+V
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('about')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              currentTab === 'about'
                ? 'bg-zinc-800 text-amber-400'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
            title="Info & About"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Language Toggle */}
          <div className="h-4 w-px bg-zinc-800 mx-1" />
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-mono font-bold uppercase transition-colors"
            title="Cambiar idioma / Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>{language.toUpperCase()}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
