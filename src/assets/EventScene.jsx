import React from 'react'

/**
 * Фоновые сцены события «Фестиваль Звездопада».
 * У каждой страницы события — свой подходящий фон:
 *   - 'overview' : парящий храм под звездопадом (общий обзор / трек наград)
 *   - 'jump'     : небесная тропа из парящих островов (мини-игра прыжков)
 *   - 'slot'     : золотое сокровищное хранилище (звёздный автомат)
 *
 * Рендерится как absolute-слой за контентом панели.
 */
export default function EventScene({ variant = 'overview' }) {
  return (
    <div className={'event-scene ev-bg-' + variant} aria-hidden="true">
      <svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
        {variant === 'jump' ? <JumpScene />
          : variant === 'slot' ? <SlotScene />
          : <OverviewScene />}
      </svg>
    </div>
  )
}

// ===== Утилита: детерминированные звёзды =====
function makeStars(count, seed0, maxY = 360) {
  const arr = []
  let seed = seed0
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  for (let i = 0; i < count; i++) {
    arr.push([
      Math.round(rnd() * 400),
      Math.round(rnd() * maxY),
      +(rnd() * 1.4 + 0.5).toFixed(1),
      +(rnd() * 0.6 + 0.3).toFixed(2),
    ])
  }
  return arr
}

function Stars({ list }) {
  return list.map((s, i) => (
    <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} fill="#fff" opacity={s[3]}>
      <animate attributeName="opacity" values={`${s[3]};${s[3] * 0.3};${s[3]}`} dur={`${2 + (i % 5)}s`} repeatCount="indefinite" />
    </circle>
  ))
}

function Meteors({ list, color = '#9af5ff' }) {
  return list.map((m, i) => (
    <g key={i} opacity="0.9">
      <line x1={m.x} y1={m.y} x2={m.x - m.len} y2={m.y - m.len * 0.5}
            stroke={color} strokeWidth="2" strokeLinecap="round">
        <animate attributeName="opacity" values="0;1;0" dur={`${m.dur}s`} begin={`${m.delay}s`} repeatCount="indefinite" />
      </line>
      <circle cx={m.x} cy={m.y} r="2.4" fill="#fff">
        <animate attributeName="opacity" values="0;1;0" dur={`${m.dur}s`} begin={`${m.delay}s`} repeatCount="indefinite" />
      </circle>
    </g>
  ))
}

const OVERVIEW_STARS = makeStars(70, 1337)
const JUMP_STARS = makeStars(80, 8821)
const SLOT_STARS = makeStars(40, 5150, 240)

const METEORS = [
  { x: 140, y: 90,  len: 60, dur: 4.5, delay: 0.5 },
  { x: 250, y: 60,  len: 80, dur: 6,   delay: 2 },
  { x: 330, y: 200, len: 50, dur: 5,   delay: 3.5 },
  { x: 90,  y: 230, len: 70, dur: 7,   delay: 1.2 },
  { x: 200, y: 150, len: 55, dur: 5.5, delay: 4.2 },
]

// ============================================================
// Сцена «Обзор» — парящий храм под звездопадом (фиолетовая ночь)
// ============================================================
function OverviewScene() {
  return (
    <>
      <defs>
        <linearGradient id="ovSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0b3a" />
          <stop offset="45%" stopColor="#190f4a" />
          <stop offset="100%" stopColor="#0a0820" />
        </linearGradient>
        <radialGradient id="ovGlow" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#7c5cff" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ovMoon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7e0" />
          <stop offset="70%" stopColor="#ffe2a8" />
          <stop offset="100%" stopColor="#ffcf6e" stopOpacity="0.2" />
        </radialGradient>
        <linearGradient id="ovRock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2a66" />
          <stop offset="100%" stopColor="#140e2e" />
        </linearGradient>
        <linearGradient id="ovTemple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cdb6ff" />
          <stop offset="100%" stopColor="#6a4aa8" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="700" fill="url(#ovSky)" />
      <rect x="0" y="0" width="400" height="700" fill="url(#ovGlow)" />

      <Stars list={OVERVIEW_STARS} />

      {/* луна */}
      <circle cx="300" cy="120" r="46" fill="url(#ovMoon)" />
      <circle cx="300" cy="120" r="34" fill="#fff7e0" opacity="0.95" />
      <circle cx="288" cy="112" r="6" fill="#f0d9a8" opacity="0.5" />
      <circle cx="312" cy="130" r="4" fill="#f0d9a8" opacity="0.4" />

      {/* туманность */}
      <ellipse cx="120" cy="170" rx="150" ry="60" fill="#a072ff" opacity="0.12" />
      <ellipse cx="260" cy="240" rx="180" ry="70" fill="#67d6ff" opacity="0.08" />

      <Meteors list={METEORS} />

      {/* парящие скалы с храмом */}
      <g>
        <path d="M120 470 L150 410 L260 410 L290 470 L250 540 L160 540 Z" fill="url(#ovRock)" stroke="#0a0820" strokeWidth="2" />
        <path d="M150 410 L160 540 L120 470 Z" fill="#241a48" opacity="0.7" />
        <rect x="150" y="356" width="14" height="56" fill="url(#ovTemple)" />
        <rect x="186" y="356" width="14" height="56" fill="url(#ovTemple)" />
        <rect x="222" y="356" width="14" height="56" fill="url(#ovTemple)" />
        <rect x="248" y="356" width="14" height="56" fill="url(#ovTemple)" />
        <path d="M138 356 L274 356 L256 332 L156 332 Z" fill="#bda6f0" />
        <path d="M206 300 L286 332 L126 332 Z" fill="#d8c6ff" stroke="#6a4aa8" strokeWidth="1.5" />
        <ellipse cx="206" cy="356" rx="70" ry="14" fill="#ffd166" opacity="0.25" />
        <circle cx="206" cy="320" r="8" fill="#fff7d9">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* малые парящие острова */}
      <g opacity="0.85">
        <path d="M40 520 L60 496 L96 496 L112 520 L86 552 L62 552 Z" fill="url(#ovRock)" />
        <path d="M300 560 L320 540 L356 540 L372 564 L344 596 L320 596 Z" fill="url(#ovRock)" />
      </g>

      {/* нижнее золотое зарево */}
      <ellipse cx="200" cy="700" rx="260" ry="120" fill="#ff7a2a" opacity="0.18" />
      <ellipse cx="200" cy="700" rx="160" ry="80" fill="#ffd166" opacity="0.12" />
    </>
  )
}

// ============================================================
// Сцена «Прыжки» — небесная тропа: рассветное небо, парящие острова, облака
// ============================================================
function JumpScene() {
  return (
    <>
      <defs>
        <linearGradient id="jpSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15103e" />
          <stop offset="50%" stopColor="#2a2a6e" />
          <stop offset="78%" stopColor="#5a4aa0" />
          <stop offset="100%" stopColor="#ffb98a" />
        </linearGradient>
        <radialGradient id="jpSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7e0" />
          <stop offset="55%" stopColor="#ffd98a" />
          <stop offset="100%" stopColor="#ff9a5a" stopOpacity="0.15" />
        </radialGradient>
        <linearGradient id="jpIsland" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7fd6a0" />
          <stop offset="22%" stopColor="#4a9a6a" />
          <stop offset="100%" stopColor="#3a2a55" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="700" fill="url(#jpSky)" />

      {/* верхние звёзды (ещё ночь наверху) */}
      <Stars list={JUMP_STARS} />

      {/* рассветное солнце у горизонта */}
      <circle cx="200" cy="560" r="120" fill="url(#jpSun)" />
      <circle cx="200" cy="585" r="60" fill="#fff2cf" opacity="0.85" />

      {/* облака */}
      <g opacity="0.85">
        <Cloud x={70} y={300} s={1.1} o={0.5} />
        <Cloud x={300} y={250} s={0.9} o={0.4} />
        <Cloud x={210} y={400} s={1.4} o={0.45} />
        <Cloud x={40} y={470} s={1.0} o={0.5} />
        <Cloud x={330} y={500} s={1.2} o={0.5} />
      </g>

      {/* парящие острова — «тропа в небе», уходящая вдаль */}
      <SkyIsland x={90}  y={250} w={70}  h={26} />
      <SkyIsland x={250} y={210} w={56}  h={20} />
      <SkyIsland x={170} y={330} w={96}  h={34} />
      <SkyIsland x={310} y={360} w={62}  h={22} />
      <SkyIsland x={30}  y={400} w={80}  h={28} />

      {/* лёгкие пёрышки/искры ветра */}
      {WIND.map((w, i) => (
        <circle key={i} cx={w.x} cy={w.y} r={w.r} fill="#fff" opacity={w.o}>
          <animate attributeName="cx" values={`${w.x};${w.x + 30};${w.x}`} dur={`${4 + i}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </>
  )
}

function Cloud({ x, y, s = 1, o = 0.5 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <ellipse cx="0" cy="0" rx="34" ry="14" fill="#cdd5ff" />
      <ellipse cx="24" cy="4" rx="26" ry="11" fill="#cdd5ff" />
      <ellipse cx="-22" cy="4" rx="22" ry="10" fill="#cdd5ff" />
    </g>
  )
}

function SkyIsland({ x, y, w, h }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* свечение снизу */}
      <ellipse cx={w / 2} cy={h} rx={w / 1.5} ry={h / 1.4} fill="#9af5ff" opacity="0.12" />
      {/* трава-верх */}
      <ellipse cx={w / 2} cy="0" rx={w / 2} ry={h * 0.4} fill="url(#jpIsland)" />
      <rect x="0" y="0" width={w} height={h * 0.4} fill="url(#jpIsland)" />
      {/* скальный низ-конус */}
      <path d={`M0 ${h * 0.4} L${w} ${h * 0.4} L${w * 0.62} ${h + 22} L${w * 0.38} ${h + 22} Z`} fill="url(#jpIsland)" />
      {/* блик травы */}
      <ellipse cx={w / 2} cy={-1} rx={w / 2.4} ry={h * 0.3} fill="#9bf0bc" opacity="0.5" />
      {/* свисающая лоза */}
      <path d={`M${w * 0.3} ${h + 8} q4 12 -2 22`} stroke="#4a9a6a" strokeWidth="2" fill="none" opacity="0.7" />
    </g>
  )
}

const WIND = [
  { x: 60,  y: 340, r: 1.6, o: 0.6 },
  { x: 280, y: 300, r: 1.3, o: 0.5 },
  { x: 180, y: 280, r: 1.8, o: 0.55 },
  { x: 330, y: 420, r: 1.2, o: 0.45 },
]

// ============================================================
// Сцена «Автомат» — золотое сокровищное хранилище: тёплый свет, монеты, самоцветы
// ============================================================
function SlotScene() {
  return (
    <>
      <defs>
        <linearGradient id="slWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1a10" />
          <stop offset="55%" stopColor="#3a2412" />
          <stop offset="100%" stopColor="#160d08" />
        </linearGradient>
        <radialGradient id="slGlow" cx="50%" cy="32%" r="58%">
          <stop offset="0%" stopColor="#ffd166" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#ff7a2a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ff7a2a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="slGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe98a" />
          <stop offset="100%" stopColor="#c8881a" />
        </linearGradient>
        <linearGradient id="slPillar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6a4418" />
          <stop offset="50%" stopColor="#a06a28" />
          <stop offset="100%" stopColor="#5a3812" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="700" fill="url(#slWall)" />
      <rect x="0" y="0" width="400" height="700" fill="url(#slGlow)" />

      {/* колонны хранилища по бокам */}
      <rect x="6" y="40" width="34" height="640" rx="6" fill="url(#slPillar)" opacity="0.9" />
      <rect x="360" y="40" width="34" height="640" rx="6" fill="url(#slPillar)" opacity="0.9" />
      {/* кирпичные швы на колоннах */}
      {[90, 160, 230, 300, 370, 440, 510, 580].map((cy, i) => (
        <g key={i} opacity="0.4">
          <line x1="6" y1={cy} x2="40" y2={cy} stroke="#160d08" strokeWidth="2" />
          <line x1="360" y1={cy} x2="394" y2={cy} stroke="#160d08" strokeWidth="2" />
        </g>
      ))}

      {/* арка-свод сверху */}
      <path d="M0 70 Q200 -10 400 70 L400 40 L0 40 Z" fill="#160d08" opacity="0.8" />
      <path d="M30 64 Q200 6 370 64" fill="none" stroke="#a06a28" strokeWidth="3" opacity="0.6" />

      {/* висячие фонари */}
      <Lantern x={70} y={110} />
      <Lantern x={330} y={130} />

      {/* мерцающие самоцветы на стене */}
      {GEMS.map((g, i) => (
        <g key={i} transform={`translate(${g.x} ${g.y})`}>
          <path d="M0 -5 L5 0 L0 8 L-5 0 Z" fill={g.c} opacity="0.85">
            <animate attributeName="opacity" values="0.4;0.95;0.4" dur={`${2.4 + (i % 4) * 0.6}s`} repeatCount="indefinite" />
          </path>
        </g>
      ))}

      <Stars list={SLOT_STARS} />

      {/* куча сокровищ внизу */}
      <g>
        <ellipse cx="200" cy="660" rx="220" ry="80" fill="url(#slGold)" opacity="0.9" />
        <ellipse cx="200" cy="648" rx="180" ry="60" fill="#ffe98a" opacity="0.55" />
        {/* монетки */}
        {COINS.map((c, i) => (
          <g key={i} transform={`translate(${c.x} ${c.y})`}>
            <ellipse cx="0" cy="0" rx={c.r} ry={c.r * 0.7} fill="url(#slGold)" stroke="#7a4f0a" strokeWidth="1" />
            <line x1={-c.r * 0.5} y1="0" x2={c.r * 0.5} y2="0" stroke="#7a4f0a" strokeWidth="0.8" opacity="0.6" />
          </g>
        ))}
        {/* кубок */}
        <g transform="translate(120 600)">
          <path d="M-14 0 Q-16 22 0 26 Q16 22 14 0 Z" fill="url(#slGold)" stroke="#7a4f0a" strokeWidth="1.5" />
          <rect x="-3" y="26" width="6" height="12" fill="#c8881a" />
          <rect x="-12" y="38" width="24" height="5" rx="2" fill="url(#slGold)" stroke="#7a4f0a" strokeWidth="1" />
        </g>
      </g>

      {/* пылинки золота в воздухе */}
      {DUST.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#ffe98a" opacity={d.o}>
          <animate attributeName="cy" values={`${d.y};${d.y - 20};${d.y}`} dur={`${5 + i}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values={`${d.o};${d.o * 0.3};${d.o}`} dur={`${5 + i}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </>
  )
}

function Lantern({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1="0" y1="-60" x2="0" y2="0" stroke="#5a3812" strokeWidth="2" />
      <path d="M-10 0 L10 0 L7 22 L-7 22 Z" fill="#6a4418" stroke="#3a2412" strokeWidth="1.5" />
      <rect x="-6" y="3" width="12" height="16" rx="2" fill="#ffd166" opacity="0.9">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.6s" repeatCount="indefinite" />
      </rect>
      <ellipse cx="0" cy="11" rx="26" ry="30" fill="#ffd166" opacity="0.12" />
    </g>
  )
}

const GEMS = [
  { x: 120, y: 180, c: '#67d6ff' }, { x: 280, y: 210, c: '#a072ff' },
  { x: 200, y: 150, c: '#ff5470' }, { x: 90,  y: 260, c: '#4ade80' },
  { x: 320, y: 280, c: '#ff7a2a' }, { x: 240, y: 320, c: '#67d6ff' },
]

const COINS = (() => {
  const arr = []
  let seed = 7777
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  for (let i = 0; i < 26; i++) {
    arr.push({ x: 60 + rnd() * 280, y: 600 + rnd() * 70, r: 6 + rnd() * 6 })
  }
  return arr
})()

const DUST = [
  { x: 110, y: 380, r: 1.6, o: 0.7 }, { x: 250, y: 420, r: 1.3, o: 0.6 },
  { x: 180, y: 340, r: 1.9, o: 0.65 }, { x: 300, y: 460, r: 1.2, o: 0.55 },
  { x: 70,  y: 440, r: 1.5, o: 0.6 },
]
