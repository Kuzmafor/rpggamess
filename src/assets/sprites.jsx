import React from 'react'

/**
 * SVG-спрайты сущностей в "png-стиле": герои, враги, боссы, оружие.
 * Все приёмные viewBox 0 0 64 64. Используются как inline-SVG —
 * чёткое отображение на любом DPI.
 */

function S({ children, vb = '0 0 64 64', size = 64, style, className }) {
  return (
    <svg
      viewBox={vb}
      width={size}
      height={size}
      style={style}
      className={'sprite ' + (className || '')}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/* ===== Палитры/градиенты переиспользуемые ===== */
const GRAD = (
  <defs>
    <linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#e8edf5" />
      <stop offset="100%" stopColor="#7d869c" />
    </linearGradient>
    <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ffe98a" />
      <stop offset="100%" stopColor="#c98a1a" />
    </linearGradient>
    <linearGradient id="gFire" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ffd166" />
      <stop offset="60%" stopColor="#ff7a2a" />
      <stop offset="100%" stopColor="#a02216" />
    </linearGradient>
    <linearGradient id="gIce" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#cdf3ff" />
      <stop offset="100%" stopColor="#3a8ad6" />
    </linearGradient>
    <linearGradient id="gShadow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#42306b" />
      <stop offset="100%" stopColor="#0a0612" />
    </linearGradient>
    <linearGradient id="gNature" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#7be281" />
      <stop offset="100%" stopColor="#1a6a3a" />
    </linearGradient>
    <radialGradient id="gGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#ffd166" stopOpacity="0.7" />
      <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
    </radialGradient>
  </defs>
)

/* ============== ВРАГИ ============== */

function GoblinSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="56" rx="18" ry="3" fill="#000" opacity="0.35" />
      <path d="M16 36 C16 22 24 14 32 14 C40 14 48 22 48 36 C48 46 41 52 32 52 C23 52 16 46 16 36 Z"
            fill="#7bbf52" stroke="#163a14" strokeWidth="2" />
      {/* уши */}
      <path d="M16 30 L8 24 L14 36 Z" fill="#7bbf52" stroke="#163a14" strokeWidth="2" />
      <path d="M48 30 L56 24 L50 36 Z" fill="#7bbf52" stroke="#163a14" strokeWidth="2" />
      {/* глаза */}
      <ellipse cx="25" cy="34" rx="4" ry="3.5" fill="#fff" />
      <ellipse cx="39" cy="34" rx="4" ry="3.5" fill="#fff" />
      <circle cx="26" cy="35" r="1.6" fill="#000" />
      <circle cx="40" cy="35" r="1.6" fill="#000" />
      {/* зубы и рот */}
      <path d="M24 42 H40 V46 L36 48 L32 46 L28 48 L24 46 Z" fill="#1a1a1a" />
      <path d="M28 46 V48 M36 46 V48" stroke="#fff" strokeWidth="1.4" />
      {/* блики */}
      <path d="M24 22 C28 18 36 18 40 22" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" fill="none" />
    </S>
  )
}

function SkeletonSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="58" rx="16" ry="3" fill="#000" opacity="0.35" />
      <path d="M14 32 C14 18 22 10 32 10 C42 10 50 18 50 32 V40 L46 44 V52 H42 V48 H38 V52 H34 V48 H30 V52 H26 V48 H22 V52 H18 V44 L14 40 Z"
            fill="#eef0f6" stroke="#1a1a1a" strokeWidth="2" />
      <ellipse cx="25" cy="32" rx="4" ry="5" fill="#0a0a14" />
      <ellipse cx="39" cy="32" rx="4" ry="5" fill="#0a0a14" />
      <circle cx="25" cy="32" r="0.8" fill="#ff5577" />
      <circle cx="39" cy="32" r="0.8" fill="#ff5577" />
      <path d="M28 42 L32 45 L36 42" stroke="#1a1a1a" strokeWidth="1.4" fill="none" />
    </S>
  )
}

function OrcSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="58" rx="20" ry="3" fill="#000" opacity="0.35" />
      <path d="M12 36 C12 22 22 12 32 12 C42 12 52 22 52 36 C52 48 44 54 32 54 C20 54 12 48 12 36 Z"
            fill="#5a8842" stroke="#0e2410" strokeWidth="2" />
      {/* шрам */}
      <path d="M22 24 L30 28" stroke="#0e2410" strokeWidth="1.6" />
      {/* глаза */}
      <ellipse cx="25" cy="34" rx="3.6" ry="3" fill="#ffd166" />
      <ellipse cx="39" cy="34" rx="3.6" ry="3" fill="#ffd166" />
      <circle cx="26" cy="34" r="1.4" fill="#1a1a1a" />
      <circle cx="40" cy="34" r="1.4" fill="#1a1a1a" />
      {/* клыки */}
      <path d="M27 44 L29 50 L31 44 Z" fill="#fff" stroke="#0e2410" />
      <path d="M33 44 L35 50 L37 44 Z" fill="#fff" stroke="#0e2410" />
      {/* шипы шлема */}
      <path d="M16 14 L20 6 L24 14 M40 14 L44 6 L48 14" stroke="#0e2410" strokeWidth="2" fill="#3a3a3a" />
    </S>
  )
}

function WolfSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="58" rx="18" ry="3" fill="#000" opacity="0.35" />
      <path d="M12 22 L22 14 L32 22 L42 14 L52 22 L52 40 C52 50 44 54 32 54 C20 54 12 50 12 40 Z"
            fill="#8a93a8" stroke="#1d2235" strokeWidth="2" />
      <path d="M14 24 L20 18 L24 26 Z" fill="#1d2235" />
      <path d="M50 24 L44 18 L40 26 Z" fill="#1d2235" />
      <path d="M22 36 L32 42 L42 36" stroke="#1d2235" strokeWidth="2" fill="#fff" />
      <ellipse cx="24" cy="32" rx="3.4" ry="2.6" fill="#ffd166" />
      <ellipse cx="40" cy="32" rx="3.4" ry="2.6" fill="#ffd166" />
      <circle cx="25" cy="32" r="1.3" fill="#0a0a14" />
      <circle cx="41" cy="32" r="1.3" fill="#0a0a14" />
      <path d="M30 42 L32 46 L34 42" stroke="#1d2235" strokeWidth="1.4" />
    </S>
  )
}

function GhostSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="58" rx="14" ry="2.5" fill="#000" opacity="0.25" />
      <path d="M14 32 C14 20 22 12 32 12 C42 12 50 20 50 32 V52 L46 48 L42 52 L38 48 L34 52 L30 48 L26 52 L22 48 L18 52 L14 48 Z"
            fill="#dfe4ff" stroke="#3a3f70" strokeWidth="2" opacity="0.92" />
      <ellipse cx="26" cy="32" rx="3" ry="4" fill="#1d2235" />
      <ellipse cx="38" cy="32" rx="3" ry="4" fill="#1d2235" />
      <ellipse cx="32" cy="42" rx="3" ry="2" fill="#1d2235" />
    </S>
  )
}

function KoboldSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="58" rx="16" ry="3" fill="#000" opacity="0.35" />
      <path d="M16 36 C16 22 24 14 32 14 C40 14 48 22 48 36 C48 46 41 52 32 52 C23 52 16 46 16 36 Z"
            fill="#c8975a" stroke="#3a200a" strokeWidth="2" />
      <path d="M14 14 L22 10 L24 18 Z M50 14 L42 10 L40 18 Z" fill="#c8975a" stroke="#3a200a" strokeWidth="2" />
      <ellipse cx="25" cy="32" rx="3.6" ry="3" fill="#ffd166" />
      <ellipse cx="39" cy="32" rx="3.6" ry="3" fill="#ffd166" />
      <circle cx="26" cy="33" r="1.4" fill="#1a1a1a" />
      <circle cx="40" cy="33" r="1.4" fill="#1a1a1a" />
      <path d="M26 42 L32 46 L38 42" stroke="#3a200a" strokeWidth="2" fill="#fff" />
    </S>
  )
}

function DarkMageSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="58" rx="18" ry="3" fill="#000" opacity="0.35" />
      <path d="M16 50 L20 24 L26 14 L32 6 L38 14 L44 24 L48 50 Z"
            fill="url(#gShadow)" stroke="#1a0a30" strokeWidth="2" />
      <ellipse cx="32" cy="38" rx="14" ry="10" fill="#3a2052" stroke="#1a0a30" strokeWidth="2" />
      <ellipse cx="26" cy="38" rx="3" ry="2.4" fill="#ffd166" />
      <ellipse cx="38" cy="38" rx="3" ry="2.4" fill="#ffd166" />
      <circle cx="26" cy="38" r="1.2" fill="#0a0a14" />
      <circle cx="38" cy="38" r="1.2" fill="#0a0a14" />
    </S>
  )
}

function ZombieSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="58" rx="18" ry="3" fill="#000" opacity="0.35" />
      <path d="M14 36 C14 22 22 14 32 14 C42 14 50 22 50 36 C50 46 43 52 32 52 C21 52 14 46 14 36 Z"
            fill="#7ec07a" stroke="#143a18" strokeWidth="2" />
      <path d="M22 22 L30 28 M40 22 L34 28" stroke="#143a18" strokeWidth="1.6" />
      <ellipse cx="25" cy="34" rx="3.6" ry="3" fill="#fff" />
      <ellipse cx="39" cy="34" rx="3.6" ry="3" fill="#fff" />
      <circle cx="25" cy="34" r="1.3" fill="#a01616" />
      <circle cx="39" cy="34" r="1.3" fill="#a01616" />
      <path d="M22 44 H42 L40 48 H24 Z" fill="#143a18" />
      <path d="M27 44 V48 M32 44 V48 M37 44 V48" stroke="#fff" strokeWidth="1.2" />
    </S>
  )
}

function ImpSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="58" rx="14" ry="2.5" fill="#000" opacity="0.35" />
      <path d="M16 36 C16 24 22 16 32 16 C42 16 48 24 48 36 C48 46 42 52 32 52 C22 52 16 46 16 36 Z"
            fill="#d24a4a" stroke="#3a0a0a" strokeWidth="2" />
      <path d="M18 18 L14 6 L24 16 Z M46 18 L50 6 L40 16 Z" fill="#d24a4a" stroke="#3a0a0a" strokeWidth="2" />
      <ellipse cx="25" cy="33" rx="3.4" ry="2.6" fill="#ffd166" />
      <ellipse cx="39" cy="33" rx="3.4" ry="2.6" fill="#ffd166" />
      <circle cx="26" cy="33" r="1.4" fill="#1a1a1a" />
      <circle cx="40" cy="33" r="1.4" fill="#1a1a1a" />
      <path d="M26 42 L32 46 L38 42" stroke="#3a0a0a" strokeWidth="2" fill="#1a1a1a" />
    </S>
  )
}

function ImpThrowerSprite({ size }) { return <ImpSprite size={size} /> }

/* ============== БОССЫ ============== */

function BossTrollSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="60" rx="22" ry="3" fill="#000" opacity="0.45" />
      <path d="M8 38 C8 22 18 12 32 12 C46 12 56 22 56 38 C56 50 48 56 32 56 C16 56 8 50 8 38 Z"
            fill="#5b8f4a" stroke="#0a2010" strokeWidth="2.5" />
      <path d="M14 14 L20 4 L24 14 M40 14 L44 4 L50 14" stroke="#0a2010" strokeWidth="2" fill="#3a3a3a" />
      <ellipse cx="24" cy="34" rx="4" ry="3" fill="#ffd166" />
      <ellipse cx="40" cy="34" rx="4" ry="3" fill="#ffd166" />
      <circle cx="25" cy="34" r="1.6" fill="#0a0a14" />
      <circle cx="41" cy="34" r="1.6" fill="#0a0a14" />
      <path d="M22 46 L26 52 L30 46 M34 46 L38 52 L42 46" fill="#fff" stroke="#0a2010" strokeWidth="1.4" />
      <path d="M22 24 L30 28" stroke="#0a2010" strokeWidth="1.6" />
    </S>
  )
}

function BossGolemSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="60" rx="22" ry="3" fill="#000" opacity="0.45" />
      <path d="M10 38 L14 12 L24 8 L40 8 L50 12 L54 38 L48 56 L16 56 Z"
            fill="url(#gMetal)" stroke="#1a1f30" strokeWidth="2.5" />
      <path d="M22 22 L42 22 L40 30 L24 30 Z" fill="#ffd166" stroke="#7a4f0a" strokeWidth="1.6" />
      <circle cx="26" cy="26" r="2.2" fill="#0a0a14" />
      <circle cx="38" cy="26" r="2.2" fill="#0a0a14" />
      <path d="M22 40 L42 40 L38 50 L26 50 Z" fill="#1f2a44" stroke="#1a1f30" strokeWidth="1.6" />
      <path d="M28 50 L32 56 L36 50" stroke="#fff" strokeOpacity="0.4" />
    </S>
  )
}

function BossSkullKingSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="60" rx="20" ry="3" fill="#000" opacity="0.45" />
      <path d="M10 30 C10 16 18 8 32 8 C46 8 54 16 54 30 V40 L48 46 V54 H44 V48 H40 V54 H36 V48 H32 V54 H28 V48 H24 V54 H20 V46 L14 40 Z"
            fill="#eef0f6" stroke="#1a1a1a" strokeWidth="2.5" />
      {/* корона */}
      <path d="M14 12 L20 4 L24 10 L32 2 L40 10 L44 4 L50 12 L46 18 H18 Z" fill="url(#gGold)" stroke="#7a4f0a" strokeWidth="2" />
      <ellipse cx="25" cy="32" rx="4" ry="5.2" fill="#0a0a14" />
      <ellipse cx="39" cy="32" rx="4" ry="5.2" fill="#0a0a14" />
      <circle cx="25" cy="32" r="1" fill="#ff5577" />
      <circle cx="39" cy="32" r="1" fill="#ff5577" />
      <path d="M28 44 L32 48 L36 44" stroke="#1a1a1a" strokeWidth="1.6" />
    </S>
  )
}

function BossFireDemonSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="60" rx="22" ry="3" fill="#000" opacity="0.45" />
      <circle cx="32" cy="34" r="22" fill="url(#gGlow)" />
      <path d="M10 36 C10 22 18 12 32 12 C46 12 54 22 54 36 C54 48 46 54 32 54 C18 54 10 48 10 36 Z"
            fill="url(#gFire)" stroke="#3a0a0a" strokeWidth="2.5" />
      <path d="M14 12 L18 2 L26 12 M38 12 L46 2 L50 12" stroke="#3a0a0a" strokeWidth="2.5" fill="url(#gFire)" />
      <ellipse cx="24" cy="34" rx="4" ry="3" fill="#fff" />
      <ellipse cx="40" cy="34" rx="4" ry="3" fill="#fff" />
      <circle cx="25" cy="34" r="1.4" fill="#0a0a14" />
      <circle cx="41" cy="34" r="1.4" fill="#0a0a14" />
      <path d="M22 44 H42 L38 50 L34 46 L30 50 L26 46 Z" fill="#3a0a0a" />
    </S>
  )
}

function BossIceHydraSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="60" rx="22" ry="3" fill="#000" opacity="0.4" />
      <path d="M16 56 C12 48 16 36 24 32 C18 24 22 14 30 14 C36 14 36 22 32 26 C38 22 46 26 46 34 C46 38 42 42 38 42 C46 44 50 50 48 56 Z"
            fill="url(#gIce)" stroke="#0a4a78" strokeWidth="2.5" />
      <ellipse cx="28" cy="22" rx="2.4" ry="2" fill="#0a0a14" />
      <ellipse cx="40" cy="34" rx="2.4" ry="2" fill="#0a0a14" />
      <path d="M26 26 L24 22 M42 38 L46 36" stroke="#fff" strokeWidth="1.2" />
    </S>
  )
}

function BossStormTitanSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="60" rx="22" ry="3" fill="#000" opacity="0.45" />
      <path d="M16 56 L18 24 L24 14 L40 14 L46 24 L48 56 Z"
            fill="#3a4a78" stroke="#0a1a3a" strokeWidth="2.5" />
      <path d="M22 26 L42 26 L40 34 L24 34 Z" fill="#ffd166" stroke="#7a4f0a" />
      <path d="M28 22 L32 12 L34 20 L40 10 L36 22 Z" fill="#ffd166" stroke="#7a4f0a" />
      <circle cx="27" cy="30" r="1.6" fill="#0a0a14" />
      <circle cx="37" cy="30" r="1.6" fill="#0a0a14" />
    </S>
  )
}

function BossShadowArchonSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="60" rx="22" ry="3" fill="#000" opacity="0.5" />
      <path d="M14 56 L18 18 L24 8 L40 8 L46 18 L50 56 Z" fill="url(#gShadow)" stroke="#0a0612" strokeWidth="2.5" />
      <path d="M20 18 L32 10 L44 18" stroke="#7c5cff" strokeWidth="2" fill="none" />
      <ellipse cx="26" cy="34" rx="3.4" ry="3" fill="#ff7a2a" />
      <ellipse cx="38" cy="34" rx="3.4" ry="3" fill="#ff7a2a" />
      <circle cx="26" cy="34" r="1.2" fill="#fff" />
      <circle cx="38" cy="34" r="1.2" fill="#fff" />
    </S>
  )
}

/* ============== ГЕРОИ — обобщённые портреты ============== */

function HeroPortrait({ size, palette }) {
  const p = HERO_PALETTES[palette] || HERO_PALETTES.melee
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="58" rx="18" ry="3" fill="#000" opacity="0.35" />
      {/* шлем/капюшон */}
      <path d="M14 36 C14 22 22 12 32 12 C42 12 50 22 50 36 V44 L42 50 V54 H22 V50 L14 44 Z"
            fill={p.cap} stroke={p.stroke} strokeWidth="2" />
      {/* лицо */}
      <ellipse cx="32" cy="38" rx="14" ry="11" fill={p.skin} stroke={p.stroke} strokeWidth="2" />
      {/* глаза */}
      <ellipse cx="26" cy="38" rx="2.2" ry="2.6" fill="#fff" />
      <ellipse cx="38" cy="38" rx="2.2" ry="2.6" fill="#fff" />
      <circle cx="26" cy="38" r="1.1" fill="#0a0a14" />
      <circle cx="38" cy="38" r="1.1" fill="#0a0a14" />
      {/* акцент роли */}
      <path d={p.accent} fill={p.acc} stroke={p.stroke} strokeWidth="1.6" />
    </S>
  )
}

const HERO_PALETTES = {
  melee:   { cap: '#3a4a78', stroke: '#0a1a3a', skin: '#f1c4a3', acc: '#ffd166',
             accent: 'M22 14 L32 8 L42 14 L40 18 L32 14 L24 18 Z' },
  ranged:  { cap: '#2f6a4a', stroke: '#0a3a18', skin: '#f1c4a3', acc: '#7be281',
             accent: 'M16 22 L26 18 L24 26 Z M48 22 L38 18 L40 26 Z' },
  mage:    { cap: '#5a3a8a', stroke: '#1a0a30', skin: '#f1c4a3', acc: '#a072ff',
             accent: 'M24 12 L32 2 L40 12 L36 18 L32 8 L28 18 Z' },
  support: { cap: '#7a3a3a', stroke: '#3a0a0a', skin: '#f1c4a3', acc: '#ff7a2a',
             accent: 'M22 18 H42 V22 L32 28 L22 22 Z' },
}

/* ============== ОРУЖИЕ ============== */

function WeaponWoodSprite({ size }) {
  return (
    <S size={size}>
      <path d="M44 8 L56 8 L56 20 L26 50 L18 56 L14 52 L20 44 Z"
            fill="#a8794a" stroke="#3a2010" strokeWidth="2" />
      <circle cx="20" cy="46" r="3" fill="#ffd166" stroke="#7a4f0a" />
    </S>
  )
}
function WeaponSteelSprite({ size }) {
  return (
    <S size={size}>
      <path d="M44 6 L58 6 L58 20 L24 54 L16 58 L12 54 L18 46 Z"
            fill="url(#gMetal)" stroke="#1a1f30" strokeWidth="2" />
      {GRAD}
      <circle cx="18" cy="48" r="3" fill="#ffd166" stroke="#7a4f0a" />
    </S>
  )
}
function WeaponSilverSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <path d="M44 4 L60 4 L60 20 L24 56 L16 60 L10 54 L16 46 Z"
            fill="#dfe6f0" stroke="#3a4a78" strokeWidth="2" />
      <path d="M48 8 L56 8 L56 16" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" fill="none" />
      <circle cx="18" cy="50" r="3" fill="#3a4a78" />
    </S>
  )
}
function WeaponFireSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <path d="M44 4 L60 4 L60 20 L24 56 L16 60 L10 54 L16 46 Z"
            fill="url(#gFire)" stroke="#3a0a0a" strokeWidth="2" />
      <path d="M48 8 L56 8 L56 16" stroke="#ffd166" strokeWidth="2" fill="none" />
      <path d="M30 30 C26 32 28 38 32 40 C28 38 22 36 24 32 Z" fill="#ffd166" />
    </S>
  )
}
function WeaponIceSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <path d="M44 4 L60 4 L60 20 L24 56 L16 60 L10 54 L16 46 Z"
            fill="url(#gIce)" stroke="#0a4a78" strokeWidth="2" />
      <path d="M28 28 L36 36 M40 24 L48 32" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />
    </S>
  )
}
function WeaponStormSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <path d="M44 4 L60 4 L60 20 L24 56 L16 60 L10 54 L16 46 Z"
            fill="#3a4a78" stroke="#0a1a3a" strokeWidth="2" />
      <path d="M30 22 L36 14 L34 22 L40 18 L34 30" stroke="#ffd166" strokeWidth="2" fill="none" />
    </S>
  )
}
function WeaponShadowSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <path d="M44 4 L60 4 L60 20 L24 56 L16 60 L10 54 L16 46 Z"
            fill="url(#gShadow)" stroke="#0a0612" strokeWidth="2" />
      <path d="M28 30 L40 18" stroke="#a072ff" strokeWidth="2" />
    </S>
  )
}
function WeaponFateSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <path d="M44 4 L60 4 L60 20 L24 56 L16 60 L10 54 L16 46 Z"
            fill="url(#gGold)" stroke="#7a4f0a" strokeWidth="2" />
      <path d="M48 8 L56 8 L56 16" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" fill="none" />
      <path d="M30 26 L34 30 L38 26 L36 22 L34 28 L32 22 Z" fill="#fff" />
    </S>
  )
}

/* ============== РЕЙДЫ ============== */

function RaidDragonSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <ellipse cx="32" cy="58" rx="22" ry="3" fill="#000" opacity="0.4" />
      <path d="M8 38 C8 26 14 18 26 18 C36 18 42 22 46 28 C50 24 56 24 58 28 C56 30 52 30 50 32 C52 38 50 46 38 50 L18 52 L22 46 C12 44 8 42 8 38 Z"
            fill="url(#gFire)" stroke="#3a0a0a" strokeWidth="2.5" />
      <ellipse cx="42" cy="32" rx="2.4" ry="2.8" fill="#fff" />
      <circle cx="42" cy="32" r="1.2" fill="#0a0a14" />
      <path d="M48 22 L54 12" stroke="#3a0a0a" strokeWidth="2" />
    </S>
  )
}

function RaidLichSprite({ size }) {
  return (
    <S size={size}>
      {GRAD}
      <path d="M16 60 L18 22 L24 14 L40 14 L46 22 L48 60 Z" fill="url(#gShadow)" stroke="#0a0612" strokeWidth="2" />
      <path d="M14 8 L20 2 L26 8 L32 -2 L38 8 L44 2 L50 8 L46 16 H18 Z" fill="url(#gGold)" stroke="#7a4f0a" />
      <ellipse cx="32" cy="34" rx="14" ry="11" fill="#eef0f6" stroke="#1a1a1a" strokeWidth="2" />
      <ellipse cx="26" cy="34" rx="3" ry="4" fill="#0a0a14" />
      <ellipse cx="38" cy="34" rx="3" ry="4" fill="#0a0a14" />
      <circle cx="26" cy="34" r="1" fill="#7c5cff" />
      <circle cx="38" cy="34" r="1" fill="#7c5cff" />
    </S>
  )
}

function RaidGolemSprite({ size }) { return <BossGolemSprite size={size} /> }

/* ============== Регистр имён ============== */

const REGISTRY = {
  // мобы
  goblin: GoblinSprite,
  skeleton: SkeletonSprite,
  orc: OrcSprite,
  wolf: WolfSprite,
  ghost: GhostSprite,
  kobold: KoboldSprite,
  darkmage: DarkMageSprite,
  zombie: ZombieSprite,
  imp: ImpSprite,
  imp_thrower: ImpThrowerSprite,

  // боссы
  boss_troll: BossTrollSprite,
  boss_golem: BossGolemSprite,
  boss_skullking: BossSkullKingSprite,
  boss_firedemon: BossFireDemonSprite,
  boss_icehydra: BossIceHydraSprite,
  boss_stormtitan: BossStormTitanSprite,
  boss_shadowarchon: BossShadowArchonSprite,

  // оружие
  w_wood: WeaponWoodSprite,
  w_steel: WeaponSteelSprite,
  w_silver: WeaponSilverSprite,
  w_fire: WeaponFireSprite,
  w_ice: WeaponIceSprite,
  w_storm: WeaponStormSprite,
  w_shadow: WeaponShadowSprite,
  w_fate: WeaponFateSprite,

  // рейды
  raid_dragon: RaidDragonSprite,
  raid_lich: RaidLichSprite,
  raid_golem: RaidGolemSprite,
}

export function Sprite({ name, size = 64, style, className }) {
  const C = REGISTRY[name]
  if (!C) {
    // fallback: точка
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
        <circle cx="32" cy="32" r="14" fill="#444a66" />
      </svg>
    )
  }
  return (
    <span className={'sprite-wrap ' + (className || '')} style={style}>
      <C size={size} />
    </span>
  )
}

export function Hero({ role = 'melee', size = 56, style, className }) {
  return (
    <span className={'sprite-wrap ' + (className || '')} style={style}>
      <HeroPortrait size={size} palette={role} />
    </span>
  )
}
