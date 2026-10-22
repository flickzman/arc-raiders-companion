import React, { useEffect, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { allQuests, allItems, allMaps, getLocalized } from '../data/db';
import { type MapId } from '../data/schemas';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from './ui/command';
import {
  MapPin,
  CheckCircle2,
  Circle,
  Camera,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface CommandBarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSelectMap?: (mapId: MapId | 'ALL') => void;
  onNavigateTab?: (tab: 'quests' | 'planner' | 'about') => void;
  onOpenCaptureModal?: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  setIsOpen,
  onSelectMap,
  onNavigateTab,
  onOpenCaptureModal,
}) => {
  const {
    language,
    activeQuestIds,
    toggleActiveQuest,
    customQuests,
    clearAllActiveQuests,
    setLanguage,
  } = usePlayerStore();

  const allAvailableQuests = useMemo(() => [...customQuests, ...allQuests], [customQuests]);

  // Global keyboard shortcut: Ctrl+K / Cmd+K or "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !isInputActive())) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    const isInputActive = () => {
      const activeEl = document.activeElement;
      return (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput
        placeholder={
          language === 'es'
            ? 'Escribe para buscar misiones, ítems, mapas o comandos (sub-10ms)...'
            : 'Type to search quests, salvage items, maps or commands (sub-10ms)...'
        }
      />
      <CommandList>
        <CommandEmpty>
          {language === 'es' ? 'No se encontraron resultados.' : 'No results found.'}
        </CommandEmpty>

        {/* Quests (Instant Toggle) */}
        <CommandGroup heading={language === 'es' ? 'Misiones (Pulsa Enter para activar/desactivar)' : 'Quests (Press Enter to toggle)'}>
          {allAvailableQuests.slice(0, 30).map((quest) => {
            const isActive = activeQuestIds.includes(quest.id);
            const title = getLocalized(quest.title, language);
            const mapObjective = quest.objectives[0]?.mapId;

            return (
              <CommandItem
                key={quest.id}
                value={`${title} ${quest.vendor} ${mapObjective || ''}`}
                onSelect={() => {
                  toggleActiveQuest(quest.id);
                }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  )}
                  <span className={`truncate font-medium ${isActive ? 'text-amber-300' : 'text-zinc-200'}`}>
                    {title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 shrink-0">
                    {quest.vendor}
                  </span>
                </div>
                <CommandShortcut>
                  {isActive ? (language === 'es' ? 'ACTIVA' : 'ACTIVE') : (language === 'es' ? 'Alternar' : 'Toggle')}
                </CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* Salvage / Items Quick Lookup */}
        <CommandGroup heading={language === 'es' ? 'Guía de Chatarra (¿Guardar o Vender?)' : 'Salvage & Item Lookup'}>
          {allItems.map((item) => {
            const isHideout = item.usedInUpgrades && item.usedInUpgrades.length > 0;
            const isQuest = item.usedInQuests && item.usedInQuests.length > 0;
            const isKeep = isHideout || isQuest;
            const name = getLocalized(item.name, language);

            return (
              <CommandItem
                key={item.id}
                value={`item ${name} ${item.category}`}
                onSelect={() => {
                  setIsOpen(false);
                  onNavigateTab?.('quests');
                }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className={`w-3.5 h-3.5 shrink-0 ${isKeep ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span className="truncate font-medium text-zinc-200">{name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                    {item.category}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isKeep
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {isKeep
                    ? (language === 'es' ? 'GUARDAR (Refugio/Misión)' : 'KEEP (Workshop/Quest)')
                    : `${item.sellValue || 0} Cr`}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* Maps Sector Filter */}
        <CommandGroup heading={language === 'es' ? 'Filtrar por Sector / Mapa' : 'Filter by Map / Sector'}>
          <CommandItem
            value="map all todos los sectores"
            onSelect={() => {
              onSelectMap?.('ALL');
              setIsOpen(false);
            }}
          >
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>{language === 'es' ? 'Todos los Sectores' : 'All Sectors'}</span>
          </CommandItem>
          {allMaps.map((map) => (
            <CommandItem
              key={map.id}
              value={`map ${getLocalized(map.name, language)}`}
              onSelect={() => {
                onSelectMap?.(map.id);
                setIsOpen(false);
              }}
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>{getLocalized(map.name, language)}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Tactical Actions */}
        <CommandGroup heading={language === 'es' ? 'Acciones Rápidas' : 'Quick Actions'}>
          <CommandItem
            value="scan ocr captura pantalla imagen"
            onSelect={() => {
              setIsOpen(false);
              onOpenCaptureModal?.();
            }}
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'es' ? 'Escanear Pantalla con OCR (Ctrl+V)' : 'Scan Screen with OCR (Ctrl+V)'}</span>
            <CommandShortcut>Ctrl+V</CommandShortcut>
          </CommandItem>

          <CommandItem
            value="clear active quests limpiar misiones activas"
            onSelect={() => {
              clearAllActiveQuests();
              setIsOpen(false);
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>{language === 'es' ? 'Deseleccionar todas las misiones activas' : 'Clear all active quests'}</span>
          </CommandItem>

          <CommandItem
            value="toggle language cambiar idioma espanol ingles"
            onSelect={() => {
              setLanguage(language === 'es' ? 'en' : 'es');
              setIsOpen(false);
            }}
          >
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            <span>{language === 'es' ? 'Switch to English' : 'Cambiar a Español'}</span>
            <CommandShortcut>{language.toUpperCase()}</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
