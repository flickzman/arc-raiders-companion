import React from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { Shield, MapPin, CheckSquare, Globe, Info, Camera } from 'lucide-react';

interface NavbarProps {
  currentTab: 'quests' | 'planner' | 'about';
  setCurrentTab: (tab: 'quests' | 'planner' | 'about') => void;
  onOpenCaptureModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenCaptureModal }) => {
  const { language, setLanguage, activeQuestIds } = usePlayerStore();

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-black tracking-wider">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-widest text-neutral-100 text-sm uppercase">ARC COMPANION</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700">
                AGPLv3
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono tracking-tight">
              {language === 'es' ? 'Planificador Táctico de Incursiones' : 'Tactical Raid & Quest Companion'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentTab('quests')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              currentTab === 'quests'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'es' ? 'Misiones & Alijo' : 'Quests & Loadout'}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              currentTab === 'quests' ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-800 text-neutral-300'
            }`}>
              {activeQuestIds.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('planner')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              currentTab === 'planner'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-bold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'es' ? 'Raid Planner' : 'Raid Planner'}</span>
          </button>

          {/* OCR / Scan Action Button */}
          <button
            onClick={onOpenCaptureModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-850 text-neutral-300 text-xs font-mono transition-all"
            title={language === 'es' ? 'Escanear pantalla / Pegar con Ctrl+V' : 'Scan screen / Paste with Ctrl+V'}
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{language === 'es' ? 'Escanear' : 'Scan'}</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-neutral-800 text-amber-400 font-mono hidden lg:inline">
              Ctrl+V
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('about')}
            className={`p-1.5 rounded-lg text-xs transition-all ${
              currentTab === 'about'
                ? 'bg-neutral-800 text-amber-400'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
            title="Acerca del proyecto"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Language Toggle */}
          <div className="h-4 w-px bg-neutral-800 mx-1" />
          <button
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs font-mono font-bold uppercase transition-colors"
            title="Cambiar idioma / Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            <span>{language.toUpperCase()}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
