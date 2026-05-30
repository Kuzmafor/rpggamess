import React from 'react'

/**
 * Универсальный SVG-иконпак UI. Все иконки — viewBox 0 0 24 24,
 * принимают size, color (или используют currentColor).
 */
export function Icon({ name, size = 18, color, style, className }) {
  const map = ICONS[name]
  if (!map) return null
  const stroke = color || 'currentColor'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={'ui-icon ' + (className || '')}
      aria-hidden="true"
    >
      {map}
    </svg>
  )
}

const ICONS = {
  gold: (
    <>
      <defs>
        <radialGradient id="iconCoinG" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffe98a" />
          <stop offset="100%" stopColor="#e9a83a" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="9" fill="url(#iconCoinG)" stroke="#7a4f0a" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="5.4" fill="none" stroke="#7a4f0a" strokeWidth="1.2" />
      <path d="M9.6 12 H14.4" stroke="#7a4f0a" strokeWidth="1.4" />
      <path d="M12 9.6 V14.4" stroke="#7a4f0a" strokeWidth="1.4" />
    </>
  ),
  gem: (
    <>
      <defs>
        <linearGradient id="iconGemG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9af5ff" />
          <stop offset="100%" stopColor="#1a7adb" />
        </linearGradient>
      </defs>
      <path d="M12 3 L20 9 L12 21 L4 9 Z" fill="url(#iconGemG)" stroke="#0f3d6e" strokeWidth="1.2" />
      <path d="M4 9 L20 9" stroke="#0f3d6e" strokeWidth="1.2" />
      <path d="M8 9 L12 21 L16 9" stroke="#0f3d6e" strokeWidth="1.2" />
      <path d="M8 9 L12 3 L16 9" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
    </>
  ),
  scale: ( // dragon scale
    <>
      <defs>
        <linearGradient id="iconScaleG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5dffaa" />
          <stop offset="100%" stopColor="#1a8a4a" />
        </linearGradient>
      </defs>
      <path d="M12 3 C7 3 4 7 4 12 C4 17 7 21 12 21 C17 21 20 17 20 12 C20 7 17 3 12 3 Z"
            fill="url(#iconScaleG)" stroke="#0f4a2a" strokeWidth="1.2" />
      <path d="M12 5 C9 5 7 8 7 12" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" fill="none" />
    </>
  ),
  skull: (
    <>
      <path d="M5 11 C5 6.5 8 4 12 4 C16 4 19 6.5 19 11 V14 L17 16 V19 H15 V17 H13 V19 H11 V17 H9 V19 H7 V16 L5 14 Z"
            fill="#e7eaf2" stroke="#1d1f2a" strokeWidth="1.2" />
      <ellipse cx="9.5" cy="11.5" rx="1.8" ry="2.1" fill="#1d1f2a" />
      <ellipse cx="14.5" cy="11.5" rx="1.8" ry="2.1" fill="#1d1f2a" />
      <path d="M11 14 L12 16 L13 14" stroke="#1d1f2a" strokeWidth="1.2" fill="none" />
    </>
  ),
  rock: (
    <>
      <defs>
        <linearGradient id="iconRockG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a0a8b8" />
          <stop offset="100%" stopColor="#535c70" />
        </linearGradient>
      </defs>
      <path d="M5 18 L7 8 L12 5 L17 8 L19 18 Z" fill="url(#iconRockG)" stroke="#1f242e" strokeWidth="1.3" />
      <path d="M9 18 L11 11" stroke="#1f242e" strokeWidth="1" fill="none" />
      <path d="M12 5 L13 12 L17 8" stroke="#fff" strokeOpacity="0.4" strokeWidth="1" fill="none" />
    </>
  ),
  ore: (
    <>
      <defs>
        <linearGradient id="iconOreG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0a06a" />
          <stop offset="100%" stopColor="#5a3a18" />
        </linearGradient>
      </defs>
      <path d="M4 18 L6 9 L11 5 L18 8 L20 16 L15 21 L7 21 Z" fill="url(#iconOreG)" stroke="#2a1808" strokeWidth="1.4" />
      <circle cx="9"  cy="13" r="1.4" fill="#ffd166" />
      <circle cx="14" cy="11" r="1.2" fill="#ffe27a" />
      <circle cx="13" cy="16" r="1.0" fill="#ffd166" />
      <path d="M11 5 L12 11" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" />
    </>
  ),
  swords: (
    <>
      <path d="M5 4 L8 4 L17 13 L15 15 L4 6 Z" fill="#cdd5e1" stroke="#3a4053" strokeWidth="1.2" />
      <path d="M19 4 L16 4 L7 13 L9 15 L20 6 Z" fill="#cdd5e1" stroke="#3a4053" strokeWidth="1.2" />
      <circle cx="12" cy="13.5" r="1.6" fill="#ffd166" stroke="#7a4f0a" strokeWidth="1" />
    </>
  ),
  hero: (
    <>
      <path d="M12 3 L19 7 V13 C19 17 15 20 12 21 C9 20 5 17 5 13 V7 Z"
            fill="#9aa6c2" stroke="#1d2235" strokeWidth="1.3" />
      <path d="M9 11 H15 V13 L12 16 L9 13 Z" fill="#1d2235" />
      <circle cx="12" cy="9" r="1.4" fill="#ffd166" />
    </>
  ),
  sword: (
    <>
      <path d="M14 3 L21 3 L21 10 L11 20 L9 22 L7 20 L8 18 Z"
            fill="#dde4ef" stroke="#2b3142" strokeWidth="1.2" />
      <path d="M14 10 L21 3" stroke="#2b3142" strokeWidth="1" />
      <circle cx="9" cy="20" r="1.4" fill="#ffd166" stroke="#7a4f0a" strokeWidth="1" />
    </>
  ),
  dragon: (
    <>
      <defs>
        <linearGradient id="iconDragonG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5470" />
          <stop offset="100%" stopColor="#7a1a2c" />
        </linearGradient>
      </defs>
      <path d="M4 14 C4 10 7 7 11 7 C15 7 18 9 18 12 C18 14 16 16 13 16 L8 18 L9 16 C6 16 4 15 4 14 Z"
            fill="url(#iconDragonG)" stroke="#3a0a17" strokeWidth="1.2" />
      <circle cx="14" cy="11" r="1.1" fill="#fffacd" />
      <path d="M18 7 L20 5 L18 9 Z" fill="#3a0a17" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19 V5" />
      <path d="M4 19 H20" />
      <path d="M6 16 L10 11 L13 14 L19 7" />
      <circle cx="19" cy="7" r="1.4" fill="currentColor" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2 L4 14 H11 L9 22 L20 8 H13 Z" fill="#ffd166" stroke="#7a4f0a" strokeWidth="1.2" />
    </>
  ),
  plus: <path d="M12 5 V19 M5 12 H19" />,
  close: <path d="M6 6 L18 18 M18 6 L6 18" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11 V8 C8 5.8 9.8 4 12 4 C14.2 4 16 5.8 16 8 V11" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7 V12 L15 14" />
    </>
  ),
  check: <path d="M5 12 L10 17 L19 7" />,
  shield: (
    <>
      <path d="M12 3 L19 6 V12 C19 16 15 20 12 21 C9 20 5 16 5 12 V6 Z"
            fill="#3a8aff" fillOpacity="0.18" stroke="currentColor" />
      <path d="M9 12 L11 14 L15 10" stroke="currentColor" />
    </>
  ),
  flame: (
    <path d="M12 3 C13 6 16 8 16 12 C16 15 14 18 12 18 C10 18 8 15 8 12 C8 10 9 9 10 8 C10 10 11 11 12 11 C12 9 11 7 12 3 Z"
          fill="#ff7a2a" stroke="#7a2a0a" strokeWidth="1.2" />
  ),
  crown: (
    <path d="M3 18 H21 V20 H3 Z M5 8 L9 12 L12 6 L15 12 L19 8 L18 17 H6 Z"
          fill="#ffd166" stroke="#7a4f0a" strokeWidth="1.2" />
  ),
  // tabs
  tabBattle: (
    <>
      <path d="M5 4 L8 4 L17 13 L15 15 L4 6 Z" fill="currentColor" opacity="0.85" />
      <path d="M19 4 L16 4 L7 13 L9 15 L20 6 Z" fill="currentColor" opacity="0.85" />
    </>
  ),
  tabHeroes: (
    <>
      <circle cx="9" cy="9" r="3.5" fill="currentColor" />
      <path d="M3 20 C3 16 6 14 9 14 C12 14 15 16 15 20 Z" fill="currentColor" />
      <circle cx="17" cy="11" r="2.6" fill="currentColor" opacity="0.7" />
      <path d="M13 20 C13 17 15 15 17 15 C19 15 21 17 21 20 Z" fill="currentColor" opacity="0.7" />
    </>
  ),
  tabWeapons: (
    <>
      <path d="M14 3 L21 3 L21 10 L11 20 L9 22 L7 20 L8 18 Z" fill="currentColor" />
      <circle cx="9" cy="20" r="1.4" fill="#ffd166" />
    </>
  ),
  tabRaids: (
    <>
      <path d="M4 14 C4 10 7 7 11 7 C15 7 18 9 18 12 C18 14 16 16 13 16 L8 18 L9 16 C6 16 4 15 4 14 Z" fill="currentColor" />
      <circle cx="14" cy="11" r="1.1" fill="#0a0a14" />
    </>
  ),
  tabUpgrades: (
    <>
      <path d="M4 19 V5" stroke="currentColor" />
      <path d="M4 19 H20" stroke="currentColor" />
      <path d="M6 16 L10 11 L13 14 L19 7" stroke="currentColor" />
      <circle cx="19" cy="7" r="1.4" fill="currentColor" />
    </>
  ),

  // menu
  menu: (
    <>
      <path d="M4 7 H20" />
      <path d="M4 12 H20" />
      <path d="M4 17 H20" />
    </>
  ),
  dungeon: (
    <>
      <path d="M4 20 V10 L8 6 L12 10 L16 6 L20 10 V20 Z" fill="currentColor" opacity="0.6" />
      <rect x="10" y="14" width="4" height="6" fill="#0a0a14" />
      <rect x="6" y="11" width="2.4" height="2.4" fill="#0a0a14" />
      <rect x="15.6" y="11" width="2.4" height="2.4" fill="#0a0a14" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" opacity="0.18" stroke="currentColor" />
      <path d="M3 7 L12 13 L21 7" stroke="currentColor" />
    </>
  ),
  artifact: (
    <>
      <path d="M12 3 L19 8 V14 L12 21 L5 14 V8 Z" fill="currentColor" opacity="0.18" stroke="currentColor" />
      <path d="M9 12 L11 14 L15 10" stroke="currentColor" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M4.5 4.5 L6.6 6.6 M17.4 17.4 L19.5 19.5 M19.5 4.5 L17.4 6.6 M6.6 17.4 L4.5 19.5" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="1.5" fill="currentColor" opacity="0.18" stroke="currentColor" />
      <path d="M4 10 H20 V13 H4 Z" fill="currentColor" />
      <path d="M12 10 V20" stroke="currentColor" />
      <path d="M8 10 C6 10 5 8 7 7 C9 6 11 8 12 10 C13 8 15 6 17 7 C19 8 18 10 16 10" stroke="currentColor" fill="none" />
    </>
  ),
  // shop / chest
  shop: (
    <>
      <path d="M3 9 L5 5 H19 L21 9" fill="currentColor" opacity="0.4" stroke="currentColor" />
      <rect x="4" y="9" width="16" height="11" rx="1.5" fill="currentColor" opacity="0.18" stroke="currentColor" />
      <path d="M9 9 V20 M15 9 V20" stroke="currentColor" />
    </>
  ),
  chest: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="1.5" fill="currentColor" opacity="0.18" stroke="currentColor" />
      <path d="M4 9 C6 5 18 5 20 9" fill="currentColor" opacity="0.4" stroke="currentColor" />
      <rect x="11" y="13" width="2" height="4" fill="currentColor" />
      <rect x="10" y="13" width="4" height="1.5" fill="#0a0a14" />
    </>
  ),
  rocket: (
    <>
      <path d="M14 3 C18 7 18 12 14 16 L10 16 C6 12 6 7 10 3 Z" fill="currentColor" opacity="0.6" stroke="currentColor" />
      <circle cx="12" cy="9" r="1.6" fill="#fff" />
      <path d="M10 16 L8 20 H10 L11 17 Z M14 16 L16 20 H14 L13 17 Z" fill="currentColor" />
    </>
  ),
  exchange: (
    <>
      <path d="M4 8 H18 L15 5 M20 16 H6 L9 19" stroke="currentColor" />
    </>
  ),
  paw: (
    <>
      <ellipse cx="12" cy="15" rx="5" ry="4" fill="currentColor" opacity="0.85" />
      <circle cx="6.5" cy="9.5" r="2" fill="currentColor" />
      <circle cx="9.8" cy="6.5" r="2" fill="currentColor" />
      <circle cx="14.2" cy="6.5" r="2" fill="currentColor" />
      <circle cx="17.5" cy="9.5" r="2" fill="currentColor" />
    </>
  ),
  star: (
    <>
      <defs>
        <radialGradient id="iconStarG" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#dffaff" />
          <stop offset="100%" stopColor="#3aa6ff" />
        </radialGradient>
      </defs>
      <path d="M12 2.5 L14.7 9 L21.5 9.5 L16.3 14 L18 20.6 L12 16.8 L6 20.6 L7.7 14 L2.5 9.5 L9.3 9 Z"
            fill="url(#iconStarG)" stroke="#1a5a9a" strokeWidth="1.1" strokeLinejoin="round" />
    </>
  ),
}
