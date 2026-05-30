import React from 'react'

// Красивые SVG-арты питомцев. Каждый — стилизованный «чиби»-компаньон
// с мягкими градиентами, бликами и тенью. Без внешних ассетов.
//
// Использование: <PetArt art="fox" size={88} />

let _uid = 0
const nid = () => `p${++_uid}`

function Defs({ id, c1, c2, glow }) {
  return (
    <defs>
      <radialGradient id={`body_${id}`} cx="50%" cy="35%" r="70%">
        <stop offset="0%" stopColor={c1} />
        <stop offset="100%" stopColor={c2} />
      </radialGradient>
      <radialGradient id={`glow_${id}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={glow} stopOpacity="0.55" />
        <stop offset="100%" stopColor={glow} stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

// Универсальные глаза + блик
function Face({ cx = 50, cy = 52, gap = 10, r = 4 }) {
  return (
    <g>
      <circle cx={cx - gap} cy={cy} r={r} fill="#1a1430" />
      <circle cx={cx + gap} cy={cy} r={r} fill="#1a1430" />
      <circle cx={cx - gap + 1.4} cy={cy - 1.4} r={r * 0.4} fill="#fff" />
      <circle cx={cx + gap + 1.4} cy={cy - 1.4} r={r * 0.4} fill="#fff" />
    </g>
  )
}

function Shadow() {
  return <ellipse cx="50" cy="92" rx="26" ry="6" fill="#000" opacity="0.45" />
}

const ART = {
  // Искрёныш — шарик молнии
  spark: (id) => (
    <>
      <circle cx="50" cy="50" r="46" fill={`url(#glow_${id})`} />
      <Shadow />
      <circle cx="50" cy="54" r="26" fill={`url(#body_${id})`} stroke="#0a0a14" strokeWidth="2" />
      <path d="M52 30 L44 52 H52 L46 70 L62 46 H53 Z" fill="#fff" opacity="0.85" />
      <Face cy="56" />
    </>
  ),
  // Златохвост — монетка с ушами
  coin: (id) => (
    <>
      <circle cx="50" cy="50" r="46" fill={`url(#glow_${id})`} />
      <Shadow />
      <circle cx="50" cy="52" r="28" fill={`url(#body_${id})`} stroke="#7a4f0a" strokeWidth="3" />
      <circle cx="50" cy="52" r="22" fill="none" stroke="#fff3c0" strokeWidth="1.5" opacity="0.6" />
      <text x="50" y="60" fontSize="22" fontWeight="900" textAnchor="middle" fill="#7a4f0a">$</text>
      <Face cy="44" gap="8" r="3" />
    </>
  ),
  // Камешек
  rock: (id) => (
    <>
      <circle cx="50" cy="50" r="46" fill={`url(#glow_${id})`} />
      <Shadow />
      <path d="M28 60 L34 38 L58 32 L72 50 L66 72 L38 74 Z" fill={`url(#body_${id})`} stroke="#0a0a14" strokeWidth="2" />
      <Face cx="52" cy="54" />
    </>
  ),
  // Лис-огонёк
  fox: (id) => (
    <>
      <circle cx="50" cy="50" r="46" fill={`url(#glow_${id})`} />
      <Shadow />
      <path d="M30 36 L40 50 L26 52 Z" fill={`url(#body_${id})`} />
      <path d="M70 36 L60 50 L74 52 Z" fill={`url(#body_${id})`} />
      <circle cx="50" cy="56" r="24" fill={`url(#body_${id})`} stroke="#0a0a14" strokeWidth="2" />
      <path d="M50 64 L44 60 H56 Z" fill="#fff" opacity="0.85" />
      <Face cy="54" />
    </>
  ),
  // Морозко
  frost: (id) => (
    <>
      <circle cx="50" cy="50" r="46" fill={`url(#glow_${id})`} />
      <Shadow />
      <circle cx="50" cy="54" r="26" fill={`url(#body_${id})`} stroke="#0a0a14" strokeWidth="2" />
      <g stroke="#fff" strokeWidth="2" opacity="0.8">
        <path d="M50 30 V44 M44 34 L50 40 L56 34" />
      </g>
      <Face cy="56" />
    </>
  ),
  // Златодрейк
  drakeg: (id) => (
    <>
      <circle cx="50" cy="50" r="46" fill={`url(#glow_${id})`} />
      <Shadow />
      <path d="M24 54 Q20 40 32 42 Q30 30 44 36" fill={`url(#body_${id})`} opacity="0.85" />
      <ellipse cx="54" cy="56" rx="26" ry="22" fill={`url(#body_${id})`} stroke="#0a0a14" strokeWidth="2" />
      <path d="M70 44 L82 40 L76 52 Z" fill={`url(#body_${id})`} />
      <Face cx="58" cy="54" />
    </>
  ),
  // Громокрыл
  bird: (id) => (
    <>
      <circle cx="50" cy="50" r="48" fill={`url(#glow_${id})`} />
      <Shadow />
      <path d="M20 50 Q34 34 46 50 Z" fill={`url(#body_${id})`} />
      <path d="M80 50 Q66 34 54 50 Z" fill={`url(#body_${id})`} />
      <circle cx="50" cy="54" r="22" fill={`url(#body_${id})`} stroke="#0a0a14" strokeWidth="2" />
      <path d="M50 60 L46 64 H54 Z" fill="#ffd166" />
      <Face cy="52" />
    </>
  ),
  // Тенекот
  cat: (id) => (
    <>
      <circle cx="50" cy="50" r="46" fill={`url(#glow_${id})`} />
      <Shadow />
      <path d="M34 34 L42 48 L28 48 Z" fill={`url(#body_${id})`} />
      <path d="M66 34 L58 48 L72 48 Z" fill={`url(#body_${id})`} />
      <ellipse cx="50" cy="58" rx="25" ry="23" fill={`url(#body_${id})`} stroke="#0a0a14" strokeWidth="2" />
      <g stroke="#fff" strokeWidth="1.2" opacity="0.6">
        <path d="M30 58 H40 M30 62 H40 M60 58 H70 M60 62 H70" />
      </g>
      <Face cy="54" />
    </>
  ),
  // Самоцветный слизень
  slug: (id) => (
    <>
      <circle cx="50" cy="50" r="46" fill={`url(#glow_${id})`} />
      <Shadow />
      <path d="M22 70 Q24 50 46 50 Q70 50 76 66 Q78 76 50 76 Q26 78 22 70 Z" fill={`url(#body_${id})`} stroke="#0a0a14" strokeWidth="2" />
      <path d="M58 50 L62 40 M66 52 L72 44" stroke={`url(#body_${id})`} strokeWidth="4" strokeLinecap="round" />
      <path d="M50 58 L56 64 L50 70 L44 64 Z" fill="#fff" opacity="0.7" />
      <Face cx="44" cy="62" gap="7" r="3" />
    </>
  ),
  // Фениксёнок
  phoenix: (id) => (
    <>
      <circle cx="50" cy="50" r="48" fill={`url(#glow_${id})`} />
      <Shadow />
      <path d="M50 18 Q40 34 50 42 Q60 34 50 18 Z" fill="#ffd166" />
      <path d="M22 52 Q34 38 46 52 Z" fill={`url(#body_${id})`} />
      <path d="M78 52 Q66 38 54 52 Z" fill={`url(#body_${id})`} />
      <circle cx="50" cy="56" r="22" fill={`url(#body_${id})`} stroke="#7a2a0a" strokeWidth="2" />
      <path d="M50 62 L46 66 H54 Z" fill="#ffe27a" />
      <Face cy="54" />
    </>
  ),
  // Небесный дух
  celest: (id) => (
    <>
      <circle cx="50" cy="50" r="48" fill={`url(#glow_${id})`} />
      <Shadow />
      <ellipse cx="50" cy="30" rx="16" ry="4" fill="#fff7d9" opacity="0.7" />
      <circle cx="50" cy="56" r="24" fill={`url(#body_${id})`} stroke="#0a0a14" strokeWidth="2" />
      <g fill="#fff" opacity="0.8">
        <circle cx="30" cy="40" r="1.6" />
        <circle cx="72" cy="44" r="1.4" />
        <circle cx="68" cy="30" r="1.2" />
      </g>
      <Face cy="56" />
    </>
  ),
  // Дракоша
  dragon: (id) => (
    <>
      <circle cx="50" cy="50" r="48" fill={`url(#glow_${id})`} />
      <Shadow />
      <path d="M34 30 L40 44 L30 46 Z" fill={`url(#body_${id})`} />
      <path d="M66 30 L60 44 L70 46 Z" fill={`url(#body_${id})`} />
      <path d="M18 56 Q14 42 28 46" fill={`url(#body_${id})`} opacity="0.85" />
      <ellipse cx="52" cy="58" rx="26" ry="23" fill={`url(#body_${id})`} stroke="#0a0a14" strokeWidth="2" />
      <path d="M40 70 Q52 78 64 70" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.5" />
      <Face cx="52" cy="54" />
    </>
  ),
}

// Цвета корпуса по виду
const COLORS = {
  spark:   ['#9fe1ff', '#3a7bd5', '#67d6ff'],
  coin:    ['#ffe27a', '#d99a18', '#ffd166'],
  rock:    ['#b6a98c', '#6b5d44', '#cdbf9e'],
  fox:     ['#ff9a5a', '#d9531a', '#ff7a2a'],
  frost:   ['#cfeeff', '#5aa0d5', '#9fe1ff'],
  drakeg:  ['#ffe27a', '#b97515', '#ffd166'],
  bird:    ['#b6c2ff', '#5a6ad5', '#8a9bff'],
  cat:     ['#caa8ff', '#6a3ad6', '#a072ff'],
  slug:    ['#a0ffd0', '#2ad58a', '#67ffb0'],
  phoenix: ['#ff9a5a', '#d9301a', '#ff5a2a'],
  celest:  ['#fff7d9', '#c9a0ff', '#e8d0ff'],
  dragon:  ['#9affc0', '#1aa05a', '#4ade80'],
}

export default function PetArt({ art = 'spark', size = 88 }) {
  const id = React.useMemo(nid, [])
  const draw = ART[art] || ART.spark
  const [c1, c2, glow] = COLORS[art] || COLORS.spark
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <Defs id={id} c1={c1} c2={c2} glow={glow} />
      {draw(id)}
    </svg>
  )
}
