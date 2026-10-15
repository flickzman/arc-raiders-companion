import React from 'react';
import type { QuestType } from '../../data/types';

export type LogoType = QuestType | 'extraction_point' | 'spawn_point' | 'generic';

export interface QuestTypeLogoProps {
  type: LogoType;
  size?: number;
  isCompleted?: boolean;
  isHighlighted?: boolean;
  badgeCount?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

export const QuestTypeLogo: React.FC<QuestTypeLogoProps> = ({
  type,
  size = 36,
  isCompleted = false,
  isHighlighted = false,
  badgeCount,
  className = '',
  onClick,
  title,
}) => {
  // Configuration per type
  const getConfig = () => {
    switch (type) {
      case 'combat':
        return {
          primaryColor: '#ef4444', // Crimson Red
          secondaryColor: '#7f1d1d',
          glowColor: 'rgba(239, 68, 68, 0.45)',
          label: 'Combate / ARC Hunt',
        };
      case 'extraction':
        return {
          primaryColor: '#f59e0b', // Amber / Gold
          secondaryColor: '#78350f',
          glowColor: 'rgba(245, 158, 11, 0.45)',
          label: 'Extracción / Recuperación',
        };
      case 'recon':
        return {
          primaryColor: '#06b6d4', // Electric Cyan
          secondaryColor: '#164e63',
          glowColor: 'rgba(6, 182, 212, 0.45)',
          label: 'Reconocimiento / Escaneo',
        };
      case 'sabotage':
        return {
          primaryColor: '#f97316', // Neon Orange
          secondaryColor: '#7c2d12',
          glowColor: 'rgba(249, 115, 22, 0.45)',
          label: 'Sabotaje / Terminal',
        };
      case 'delivery':
        return {
          primaryColor: '#10b981', // Emerald Green
          secondaryColor: '#064e3b',
          glowColor: 'rgba(16, 185, 129, 0.45)',
          label: 'Entrega / Baliza',
        };
      case 'locked_room':
        return {
          primaryColor: '#a855f7', // Violet
          secondaryColor: '#581c87',
          glowColor: 'rgba(168, 85, 247, 0.45)',
          label: 'Sala Bloqueada / Llave',
        };
      case 'extraction_point':
        return {
          primaryColor: '#22c55e', // Bright Lime / Green
          secondaryColor: '#14532d',
          glowColor: 'rgba(34, 197, 94, 0.55)',
          label: 'Zona de Extracción',
        };
      case 'spawn_point':
        return {
          primaryColor: '#38bdf8', // Sky Blue
          secondaryColor: '#0c4a6e',
          glowColor: 'rgba(56, 189, 248, 0.4)',
          label: 'Punto de Incursión',
        };
      default:
        return {
          primaryColor: '#94a3b8',
          secondaryColor: '#1e293b',
          glowColor: 'rgba(148, 163, 184, 0.3)',
          label: 'Punto de Interés',
        };
    }
  };

  const config = getConfig();

  // Render internal vector iconography
  const renderIconBody = () => {
    switch (type) {
      case 'combat':
        return (
          <g>
            {/* Tactical Hexagon Outer Frame */}
            <polygon
              points="24,4 41,14 41,34 24,44 7,34 7,14"
              fill={config.secondaryColor}
              fillOpacity="0.85"
              stroke={config.primaryColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Crosshair Lines */}
            <line x1="24" y1="12" x2="24" y2="18" stroke={config.primaryColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="24" y1="30" x2="24" y2="36" stroke={config.primaryColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="24" x2="18" y2="24" stroke={config.primaryColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="30" y1="24" x2="36" y2="24" stroke={config.primaryColor} strokeWidth="2" strokeLinecap="round" />
            {/* Concentric Reticle Ring & Center Pip */}
            <circle cx="24" cy="24" r="8" fill="none" stroke={config.primaryColor} strokeWidth="1.75" strokeDasharray="3 2" />
            <circle cx="24" cy="24" r="2.5" fill={config.primaryColor} />
          </g>
        );

      case 'extraction':
        return (
          <g>
            {/* Tactical Rhombus / Diamond */}
            <polygon
              points="24,4 43,24 24,44 5,24"
              fill={config.secondaryColor}
              fillOpacity="0.85"
              stroke={config.primaryColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Extraction Cargo Pod Base */}
            <rect
              x="17"
              y="23"
              width="14"
              height="10"
              rx="1.5"
              fill="none"
              stroke={config.primaryColor}
              strokeWidth="1.8"
            />
            {/* Ascending Chevron / Arrow Vector */}
            <path
              d="M24 10 L17 18 H21 V22 H27 V18 H31 Z"
              fill={config.primaryColor}
            />
          </g>
        );

      case 'recon':
        return (
          <g>
            {/* Segmented Radar Circle Frame */}
            <circle
              cx="24"
              cy="24"
              r="19"
              fill={config.secondaryColor}
              fillOpacity="0.85"
              stroke={config.primaryColor}
              strokeWidth="2.5"
            />
            {/* Segmented Dashed Arc */}
            <circle
              cx="24"
              cy="24"
              r="14"
              fill="none"
              stroke={config.primaryColor}
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            {/* Concentric Scanner Core */}
            <circle cx="24" cy="24" r="8" fill="none" stroke={config.primaryColor} strokeWidth="1.2" />
            <circle cx="24" cy="24" r="3" fill={config.primaryColor} />
            {/* Radar Sweep Line */}
            <line
              x1="24"
              y1="24"
              x2="34"
              y2="14"
              stroke={config.primaryColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        );

      case 'sabotage':
        return (
          <g>
            {/* Inverted Warning Triangle */}
            <polygon
              points="5,9 43,9 24,43"
              fill={config.secondaryColor}
              fillOpacity="0.85"
              stroke={config.primaryColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* EMP Lightning Bolt / Disruption Vector */}
            <path
              d="M25 13 L17 25 H24 L21 37 L31 23 H25 Z"
              fill={config.primaryColor}
              stroke={config.secondaryColor}
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </g>
        );

      case 'delivery':
        return (
          <g>
            {/* Beveled Square Shield Frame */}
            <polygon
              points="10,6 38,6 43,11 43,35 38,42 10,42 5,35 5,11"
              fill={config.secondaryColor}
              fillOpacity="0.85"
              stroke={config.primaryColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Package Outline */}
            <rect
              x="15"
              y="18"
              width="18"
              height="15"
              rx="2"
              fill="none"
              stroke={config.primaryColor}
              strokeWidth="1.8"
            />
            {/* Downward Deposit Vector Arrow */}
            <path
              d="M24 30 L19 23 H22 V15 H26 V23 H29 Z"
              fill={config.primaryColor}
            />
          </g>
        );

      case 'locked_room':
        return (
          <g>
            {/* Armored Octagon Frame */}
            <polygon
              points="15,5 33,5 43,15 43,33 33,43 15,43 5,33 5,15"
              fill={config.secondaryColor}
              fillOpacity="0.85"
              stroke={config.primaryColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Keycard / Padlock Shackle */}
            <path
              d="M18 20 V15 A6 6 0 0 1 30 15 V20"
              fill="none"
              stroke={config.primaryColor}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Keycard Body */}
            <rect
              x="14"
              y="20"
              width="20"
              height="15"
              rx="2.5"
              fill={config.primaryColor}
              fillOpacity="0.3"
              stroke={config.primaryColor}
              strokeWidth="2"
            />
            {/* Keyhole */}
            <circle cx="24" cy="26" r="2" fill={config.primaryColor} />
            <line x1="24" y1="27" x2="24" y2="31" stroke={config.primaryColor} strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'extraction_point':
        return (
          <g>
            {/* Military Extraction Beacon Circle Background */}
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="#064e3b"
              fillOpacity="0.9"
              stroke="#22c55e"
              strokeWidth="2.5"
            />
            {/* Dual Upward Chevrons (^^) */}
            <path
              d="M14 26 L24 16 L34 26"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 19 L24 9 L34 19"
              fill="none"
              stroke="#86efac"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Flare Base Platform */}
            <path
              d="M17 33 H31 M20 37 H28"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        );

      case 'spawn_point':
        return (
          <g>
            {/* Spawn Point Diamond */}
            <polygon
              points="24,4 42,24 24,44 6,24"
              fill="#0c4a6e"
              fillOpacity="0.9"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Downward Drop Ingress Vector */}
            <circle cx="24" cy="15" r="4" fill="#38bdf8" />
            <path
              d="M24 35 L17 24 H21 V20 H27 V24 H31 Z"
              fill="#38bdf8"
            />
          </g>
        );

      default:
        return (
          <g>
            <circle cx="24" cy="24" r="18" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" />
            <circle cx="24" cy="24" r="6" fill="#94a3b8" />
          </g>
        );
    }
  };

  const isExtractionFlare = type === 'extraction_point';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none cursor-pointer transition-transform duration-150 hover:scale-110 ${
        isCompleted ? 'opacity-40 grayscale' : 'opacity-100'
      } ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      title={title || config.label}
    >
      {/* Animated Ping Ring if Highlighted */}
      {isHighlighted && !isCompleted && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-75 pointer-events-none"
          style={{
            backgroundColor: config.primaryColor,
            boxShadow: `0 0 16px ${config.glowColor}`,
          }}
        />
      )}

      {/* Subtle pulse for active extraction beacons */}
      {isExtractionFlare && !isCompleted && !isHighlighted && (
        <span className="absolute inset-0 rounded-full animate-pulse opacity-40 bg-emerald-500 pointer-events-none" />
      )}

      {/* Main Tactical Emblem SVG */}
      <svg
        viewBox="0 0 48 48"
        className={`w-full h-full drop-shadow-md filter ${
          isHighlighted ? 'ring-4 ring-amber-400 rounded-full' : ''
        }`}
        style={{
          filter: isCompleted
            ? 'grayscale(100%)'
            : `drop-shadow(0px 2px 6px ${config.glowColor})`,
        }}
      >
        {renderIconBody()}
      </svg>

      {/* Completed Checkmark Overlay Badge */}
      {isCompleted && (
        <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 border border-emerald-300 shadow-md flex items-center justify-center w-4 h-4 text-[10px] font-bold">
          ✓
        </div>
      )}

      {/* Multi-Quest Badge Count (if 2+ quests point to the same POI) */}
      {badgeCount && badgeCount > 1 && !isCompleted && (
        <div
          className="absolute -top-1 -right-1 bg-amber-500 text-black font-black rounded-full px-1 py-0.2 border border-amber-300 shadow-lg flex items-center justify-center min-w-[18px] h-[18px] text-[11px] leading-none"
          title={`${badgeCount} objetivos activos en esta localización`}
        >
          {badgeCount}
        </div>
      )}
    </div>
  );
};
