import React from 'react'

/**
 * Мини-арт-сцены для глав подземелья. Каждая — это компактный SVG,
 * стилизованный как нарисованный PNG-фон. Используются как иконка-плитка
 * в DungeonPanel (вместо одинокого спрайта).
 */

const VB = '0 0 200 130' // широкая плитка под обложку

function Frame({ children }) {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <radialGradient id="dsVignette" cx="50%" cy="40%" r="65%">
          <stop offset="60%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>
      </defs>
      {children}
      <rect x="0" y="0" width="200" height="130" fill="url(#dsVignette)" />
    </svg>
  )
}

/* 1) Замшелые катакомбы — лесной грот, мшистые камни, синяя ночь */
function ChapterScene1() {
  return (
    <Frame>
      <defs>
        <linearGradient id="ds1Sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1340" />
          <stop offset="100%" stopColor="#0a0f30" />
        </linearGradient>
        <linearGradient id="ds1Stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#314064" />
          <stop offset="100%" stopColor="#0e1428" />
        </linearGradient>
        <linearGradient id="ds1Moss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a8c4a" />
          <stop offset="100%" stopColor="#143a18" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="130" fill="url(#ds1Sky)" />
      {/* луна */}
      <circle cx="160" cy="32" r="14" fill="#fff7d9" opacity="0.95" />
      <circle cx="160" cy="32" r="20" fill="#ffd166" opacity="0.18" />
      {/* холмы */}
      <path d="M0 110 L40 78 L80 102 L120 70 L160 100 L200 80 L200 130 L0 130 Z" fill="#0d1b3a" />
      {/* ёлки */}
      {[18, 52, 96, 132, 176].map((x, i) => (
        <g key={i}>
          <path d={`M${x} 80 L${x - 8} 100 L${x + 8} 100 Z`} fill="#0e2614" />
          <path d={`M${x} 88 L${x - 10} 108 L${x + 10} 108 Z`} fill="#163a1c" />
          <rect x={x - 1} y="108" width="2" height="3" fill="#0a0a14" />
        </g>
      ))}
      {/* арка катакомб */}
      <path d="M50 130 L50 96 Q100 56 150 96 L150 130 Z" fill="url(#ds1Stone)" stroke="#0a0a14" strokeWidth="1" />
      {/* мох */}
      <path d="M50 96 Q100 60 150 96" fill="none" stroke="url(#ds1Moss)" strokeWidth="3" />
      {/* свечение внутри арки */}
      <ellipse cx="100" cy="120" rx="36" ry="14" fill="#fff7d9" opacity="0.10" />
    </Frame>
  )
}

/* 2) Колодец костей — кладбище, кости и зелёное свечение */
function ChapterScene2() {
  return (
    <Frame>
      <defs>
        <linearGradient id="ds2Sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0e2a" />
          <stop offset="100%" stopColor="#1a0e30" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="130" fill="url(#ds2Sky)" />
      {/* зелёное свечение */}
      <ellipse cx="100" cy="100" rx="120" ry="40" fill="#67d6a0" opacity="0.22" />
      {/* надгробия */}
      {[30, 70, 110, 150].map((x, i) => (
        <g key={i}>
          <path d={`M${x - 12} 130 L${x - 12} 90 Q${x} 76 ${x + 12} 90 L${x + 12} 130 Z`} fill="#3a4360" />
          <rect x={x - 12} y="116" width="24" height="14" fill="#2a3050" />
          <path d={`M${x - 6} 96 H${x + 6} M${x} 92 V104`} stroke="#0a0a14" strokeWidth="1.5" />
        </g>
      ))}
      {/* кости */}
      <g transform="translate(40 116) rotate(-15)">
        <rect x="-12" y="-2" width="24" height="4" rx="2" fill="#dcd8c6" />
        <circle cx="-12" cy="0" r="3" fill="#dcd8c6" />
        <circle cx="12" cy="0" r="3" fill="#dcd8c6" />
      </g>
      <g transform="translate(160 122) rotate(20)">
        <rect x="-10" y="-2" width="20" height="4" rx="2" fill="#dcd8c6" />
        <circle cx="-10" cy="0" r="2.5" fill="#dcd8c6" />
        <circle cx="10" cy="0" r="2.5" fill="#dcd8c6" />
      </g>
      {/* колодец */}
      <ellipse cx="100" cy="118" rx="28" ry="6" fill="#0a0a14" />
      <path d="M76 116 V104 H124 V116 Z" fill="#3a4360" stroke="#0a0a14" />
      <rect x="86" y="78" width="28" height="6" fill="#2a3050" />
      <ellipse cx="100" cy="108" rx="22" ry="4" fill="#2a6a4a" opacity="0.6" />
    </Frame>
  )
}

/* 3) Лесной голем — древние камни и древо */
function ChapterScene3() {
  return (
    <Frame>
      <defs>
        <linearGradient id="ds3Sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c2a1e" />
          <stop offset="100%" stopColor="#06101a" />
        </linearGradient>
        <linearGradient id="ds3Tree" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#143a1e" />
          <stop offset="100%" stopColor="#0a1a0e" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="130" fill="url(#ds3Sky)" />
      {/* солнце сквозь листву */}
      <ellipse cx="160" cy="40" rx="22" ry="14" fill="#ffd166" opacity="0.18" />
      {/* силуэты деревьев */}
      <g>
        <ellipse cx="40" cy="60" rx="34" ry="36" fill="url(#ds3Tree)" />
        <ellipse cx="20" cy="62" rx="20" ry="22" fill="#1a3a22" />
        <rect x="36" y="92" width="6" height="22" fill="#1a1108" />
        <ellipse cx="170" cy="58" rx="32" ry="34" fill="url(#ds3Tree)" />
        <ellipse cx="186" cy="62" rx="18" ry="22" fill="#1a3a22" />
        <rect x="166" y="90" width="6" height="22" fill="#1a1108" />
      </g>
      {/* дольмен */}
      <g>
        <rect x="76" y="92" width="14" height="34" fill="#3a4360" />
        <rect x="110" y="92" width="14" height="34" fill="#3a4360" />
        <rect x="68" y="80" width="64" height="14" rx="2" fill="#5a6480" />
        {/* руны */}
        <path d="M82 110 L88 116 M88 110 L82 116" stroke="#67d6ff" strokeWidth="1.6" />
        <path d="M114 108 L120 114 M120 108 L114 114" stroke="#67d6ff" strokeWidth="1.6" />
      </g>
      {/* трава */}
      {[10, 30, 60, 90, 120, 150, 180].map((x, i) => (
        <path key={i} d={`M${x} 130 L${x + 2} 122 L${x + 4} 130 Z`} fill="#1a3a22" />
      ))}
    </Frame>
  )
}

/* 4) Огненный демон — лава, огонь, тёмный замок */
function ChapterScene4() {
  return (
    <Frame>
      <defs>
        <linearGradient id="ds4Sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a0a18" />
          <stop offset="100%" stopColor="#1a0a08" />
        </linearGradient>
        <linearGradient id="ds4Lava" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd166" />
          <stop offset="60%" stopColor="#ff7a2a" />
          <stop offset="100%" stopColor="#a02216" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="200" height="130" fill="url(#ds4Sky)" />
      {/* зарево */}
      <ellipse cx="100" cy="120" rx="160" ry="40" fill="#ff5a1f" opacity="0.30" />
      {/* силуэт замка */}
      <path d="M30 130 L30 80 L42 80 L42 70 L52 70 L52 80 L70 80 L70 64 L82 64 L82 80 L100 80 L100 70 L114 70 L114 80 L130 80 L130 64 L142 64 L142 80 L160 80 L160 130 Z" fill="#1a0a14" stroke="#0a0a14" strokeWidth="1" />
      {/* окна горят */}
      {[44, 66, 92, 118, 144].map((x, i) => (
        <rect key={i} x={x} y="92" width="6" height="10" fill="#ffd166" opacity="0.85" />
      ))}
      {/* лава река */}
      <path d="M0 124 Q40 116 80 124 Q120 132 160 122 Q190 116 200 122 L200 130 L0 130 Z" fill="url(#ds4Lava)" />
      {/* искры */}
      {[20, 60, 110, 150, 180].map((x, i) => (
        <circle key={i} cx={x} cy={108 - (i % 2) * 6} r="1.2" fill="#ffe27a" />
      ))}
    </Frame>
  )
}

/* 5) Чертоги Морока — фиолетовый храм с туманом и звёздами */
function ChapterScene5() {
  return (
    <Frame>
      <defs>
        <linearGradient id="ds5Sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0a30" />
          <stop offset="100%" stopColor="#0a0612" />
        </linearGradient>
        <radialGradient id="ds5Glow" cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor="#a072ff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a072ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="200" height="130" fill="url(#ds5Sky)" />
      {/* звёзды */}
      {[
        [16, 14], [40, 22], [62, 10], [84, 26], [108, 18],
        [132, 30], [156, 14], [184, 26], [70, 40], [180, 44],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={(i % 3) * 0.4 + 0.6} fill="#fff" opacity={0.7 - (i % 4) * 0.1} />
      ))}
      {/* свечение по центру */}
      <rect x="0" y="40" width="200" height="90" fill="url(#ds5Glow)" />
      {/* колонны храма */}
      {[60, 100, 140].map((x, i) => (
        <g key={i}>
          <rect x={x - 8} y="56" width="16" height="60" fill="#3a2052" stroke="#1a0a30" />
          <path d={`M${x - 14} 56 L${x + 14} 56 L${x + 12} 50 L${x - 12} 50 Z`} fill="#5a3a8a" />
          <rect x={x - 6} y="58" width="12" height="56" fill="#2a1042" />
        </g>
      ))}
      {/* туман */}
      <ellipse cx="100" cy="120" rx="120" ry="14" fill="#cdd5ff" opacity="0.18" />
      {/* луна */}
      <circle cx="100" cy="36" r="10" fill="#cfd8ff" opacity="0.95" />
      <circle cx="100" cy="36" r="14" fill="#a072ff" opacity="0.25" />
    </Frame>
  )
}

const SCENES = {
  1: ChapterScene1,
  2: ChapterScene2,
  3: ChapterScene3,
  4: ChapterScene4,
  5: ChapterScene5,
}

const SCENE_LIST = [ChapterScene1, ChapterScene2, ChapterScene3, ChapterScene4, ChapterScene5]

export function ChapterScene({ chapterId, className, style }) {
  // Для глав за пределами 1..5 — циклически повторяем сцены по mod, чтобы у всех был фон.
  const direct = SCENES[chapterId]
  const C = direct || SCENE_LIST[((chapterId - 1) % SCENE_LIST.length + SCENE_LIST.length) % SCENE_LIST.length]
  return (
    <div className={'chapter-scene ' + (className || '')} style={style}>
      <C />
    </div>
  )
}
