import React from 'react'

// Красивая SVG-миниатюра сундука для карточек магазина.
// Параметры:
//   variant — 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'treasure' | 'boss' | 'premium'
//   size    — px (квадрат)
//
// Стили — никаких внешних ассетов, всё SVG: дерево с золотыми/серебряными
// поясами, замок-камень с цветом редкости, мягкий свет из-под крышки.
const PRESETS = {
  common: {
    body1: '#5b4324', body2: '#2b1d0e',
    metal1: '#cdd3e2', metal2: '#7e8aa0',
    gem: '#c8cee8', gemGlow: 'rgba(200,206,232,0.55)',
    ring: 'rgba(200,206,232,0.45)',
  },
  rare: {
    body1: '#1d3f5f', body2: '#0a1a2c',
    metal1: '#9bdcff', metal2: '#3576a0',
    gem: '#67d6ff', gemGlow: 'rgba(103,214,255,0.65)',
    ring: 'rgba(103,214,255,0.55)',
  },
  epic: {
    body1: '#3a1f5f', body2: '#180a30',
    metal1: '#cfb3ff', metal2: '#6a4ad6',
    gem: '#a072ff', gemGlow: 'rgba(160,114,255,0.7)',
    ring: 'rgba(160,114,255,0.6)',
  },
  legendary: {
    body1: '#5a3a0c', body2: '#1f1305',
    metal1: '#ffe27a', metal2: '#b97515',
    gem: '#ffd166', gemGlow: 'rgba(255,209,102,0.85)',
    ring: 'rgba(255,209,102,0.75)',
  },
  mythic: {
    body1: '#5a1a0c', body2: '#220a08',
    metal1: '#ffb37a', metal2: '#c0481a',
    gem: '#ff7a2a', gemGlow: 'rgba(255,122,42,0.85)',
    ring: 'rgba(255,122,42,0.7)',
  },
  premium: {
    body1: '#5a3a0c', body2: '#1f1305',
    metal1: '#ffe27a', metal2: '#b97515',
    gem: '#ffd166', gemGlow: 'rgba(255,209,102,0.95)',
    ring: 'rgba(255,209,102,0.9)',
  },
  treasure: {
    body1: '#3a2410', body2: '#1a1108',
    metal1: '#ffd166', metal2: '#7a4f0a',
    gem: '#ffe27a', gemGlow: 'rgba(255,226,122,0.85)',
    ring: 'rgba(255,209,102,0.7)',
  },
  boss: {
    body1: '#4a0d22', body2: '#1a0510',
    metal1: '#ff8aa0', metal2: '#a02244',
    gem: '#ff5470', gemGlow: 'rgba(255,84,112,0.9)',
    ring: 'rgba(255,84,112,0.7)',
  },
}

let _uid = 0
function nextId() { return `c${++_uid}` }

export default function ChestArt({ variant = 'common', size = 88, glow = true, open = false }) {
  const p = PRESETS[variant] || PRESETS.common
  const id = React.useMemo(nextId, [])
  const gBody = `bod_${id}`
  const gMetal = `met_${id}`
  const gInside = `ins_${id}`
  const gShine = `sh_${id}`

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{ display: 'block', filter: glow ? `drop-shadow(0 8px 14px rgba(0,0,0,0.55))` : 'none' }}
    >
      <defs>
        <linearGradient id={gBody} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.body1} />
          <stop offset="100%" stopColor={p.body2} />
        </linearGradient>
        <linearGradient id={gMetal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.metal1} />
          <stop offset="100%" stopColor={p.metal2} />
        </linearGradient>
        <radialGradient id={gInside} cx="50%" cy="20%" r="60%">
          <stop offset="0%" stopColor={p.gem} stopOpacity="0.95" />
          <stop offset="100%" stopColor={p.body2} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={gShine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* мягкое свечение под сундуком */}
      {glow && (
        <ellipse cx="100" cy="178" rx="78" ry="10" fill="#000" opacity="0.55" />
      )}
      {glow && (
        <ellipse cx="100" cy="100" rx="92" ry="62" fill={p.gemGlow} opacity="0.18" />
      )}

      {/* Тело */}
      <g>
        <rect x="28" y="92" width="144" height="78" rx="14" fill={`url(#${gBody})`} stroke="#0a0805" strokeWidth="3" />
        {/* металлические пояса */}
        <rect x="28" y="100" width="144" height="6" fill={`url(#${gMetal})`} opacity="0.85" />
        <rect x="28" y="158" width="144" height="6" fill={`url(#${gMetal})`} opacity="0.85" />
        {/* боковые накладки */}
        <rect x="34" y="100" width="6" height="64" fill={`url(#${gMetal})`} opacity="0.9" />
        <rect x="160" y="100" width="6" height="64" fill={`url(#${gMetal})`} opacity="0.9" />
        {/* окантовка цвета редкости */}
        <rect x="28" y="92" width="144" height="78" rx="14" fill="none" stroke={p.ring} strokeWidth="2" />

        {/* Внутренний свет, если "открыт" */}
        {open && (
          <rect x="34" y="98" width="132" height="20" rx="3" fill={`url(#${gInside})`} opacity="0.95" />
        )}
      </g>

      {/* Крышка */}
      <g style={{ transformOrigin: '100px 92px', transform: open ? 'rotate(-32deg)' : 'rotate(0deg)', transition: 'transform 350ms cubic-bezier(.2,.7,.2,1.4)' }}>
        <path
          d="M28 92 Q28 56 100 56 Q172 56 172 92 L172 96 L28 96 Z"
          fill={`url(#${gBody})`}
          stroke="#0a0805"
          strokeWidth="3"
        />
        {/* блик */}
        <path
          d="M40 84 Q56 64 100 62 Q140 62 158 80"
          fill="none"
          stroke={`url(#${gShine})`}
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* металлическая обводка крышки */}
        <path
          d="M28 92 Q28 56 100 56 Q172 56 172 92"
          fill="none"
          stroke={p.ring}
          strokeWidth="2"
        />
      </g>

      {/* Замок-камень */}
      <g>
        <rect x="86" y="100" width="28" height="32" rx="4" fill={`url(#${gMetal})`} stroke="#0a0805" strokeWidth="1.6" />
        {/* камень */}
        <circle cx="100" cy="116" r="7" fill={p.gem} stroke="#0a0805" strokeWidth="1.2" />
        <circle cx="100" cy="116" r="10" fill="none" stroke={p.gemGlow} strokeWidth="2" opacity="0.85" />
        {/* блик на камне */}
        <circle cx="97" cy="113" r="2.2" fill="#ffffff" opacity="0.85" />
      </g>

      {/* искры по углам для премиум-вариантов */}
      {(variant === 'legendary' || variant === 'premium' || variant === 'mythic') && (
        <g opacity="0.85">
          <circle cx="46" cy="62" r="2" fill="#ffffff" />
          <circle cx="158" cy="68" r="1.6" fill="#ffffff" />
          <circle cx="50" cy="50" r="1.2" fill="#ffffff" opacity="0.7" />
          <circle cx="154" cy="48" r="1" fill="#ffffff" opacity="0.7" />
        </g>
      )}
    </svg>
  )
}
