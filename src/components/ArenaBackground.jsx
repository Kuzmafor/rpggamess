import React from 'react'

/**
 * Параллакс-фон арены: небо + луна + звёзды,
 * силуэт дальних гор/леса, дальние ели, туман,
 * ближние лиственные деревья и трава с кустами.
 * Все слои бесшовно прокручиваются справа налево.
 */
export default function ArenaBackground() {
  return (
    <div className="arena-bg-scene" aria-hidden="true">
      <div className="sky">
        <div className="moon" />
        <div className="stars" />
      </div>

      <ParallaxLayer className="layer-mountains" duration={140}>
        <Mountains />
      </ParallaxLayer>

      <ParallaxLayer className="layer-trees-far" duration={90}>
        <FarPineRow />
      </ParallaxLayer>

      <ParallaxLayer className="layer-mist" duration={55}>
        <Mist />
      </ParallaxLayer>

      <ParallaxLayer className="layer-trees-mid" duration={40}>
        <MidTreeRow />
      </ParallaxLayer>

      <ParallaxLayer className="layer-trees-near" duration={26}>
        <NearTreeRow />
      </ParallaxLayer>

      <ParallaxLayer className="layer-ground" duration={18}>
        <Ground />
      </ParallaxLayer>
    </div>
  )
}

function ParallaxLayer({ children, className, duration }) {
  const style = { animationDuration: duration + 's' }
  return (
    <div className={'parallax-layer ' + className}>
      <div className="parallax-track" style={style}>
        <div className="parallax-tile">{children}</div>
        <div className="parallax-tile">{children}</div>
      </div>
    </div>
  )
}

/* ===== Дальний план: горы с гребнем леса ===== */
function Mountains() {
  return (
    <svg viewBox="0 0 1200 240" preserveAspectRatio="none" width="100%" height="100%">
      <defs>
        <linearGradient id="mtnG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1f4a" />
          <stop offset="100%" stopColor="#0a0d2a" />
        </linearGradient>
        <linearGradient id="mtnRidgeG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1735" />
          <stop offset="100%" stopColor="#070a20" />
        </linearGradient>
      </defs>
      <path
        d="M0 240 L0 150 L80 90 L150 130 L230 70 L330 130 L420 80 L520 140 L620 60 L720 130 L820 90 L920 140 L1020 70 L1120 130 L1200 100 L1200 240 Z"
        fill="url(#mtnG)"
      />
      {/* Тонкая кромка дальнего леса по горам */}
      <path
        d="M0 168
           L40 156 L80 168 L120 158 L160 170 L210 156 L260 172 L310 158 L360 172 L420 156 L470 170 L520 158
           L580 172 L640 156 L700 172 L760 156 L820 172 L880 156 L940 170 L1000 156 L1060 170 L1120 156
           L1200 168 L1200 240 L0 240 Z"
        fill="url(#mtnRidgeG)"
        opacity="0.95"
      />
    </svg>
  )
}

/* ===== Ряд дальних елей (силуэт) ===== */
function FarPineRow() {
  // Псевдослучайные параметры с детерминированной формулой.
  const trees = []
  let x = 0
  const baseY = 200
  while (x < 1200) {
    const h = 70 + ((x * 13) % 50)         // высота
    const w = 30 + ((x * 7) % 18)          // ширина основания
    const tilt = ((x * 17) % 6) - 3
    const tone = 12 + ((x * 5) % 12)       // оттенок зелёного
    const fill = `rgb(${tone},${tone + 22},${tone + 8})`
    trees.push(
      <PineTree key={x} x={x} y={baseY} h={h} w={w} tilt={tilt} fill={fill} />
    )
    x += 26 + ((x * 3) % 18)
  }
  return (
    <svg viewBox="0 0 1200 220" preserveAspectRatio="none" width="100%" height="100%">
      {trees}
    </svg>
  )
}

function PineTree({ x, y, h, w, tilt, fill }) {
  // конусообразное хвойное дерево из нескольких "юбок"
  const layers = 4
  const path = []
  for (let i = 0; i < layers; i++) {
    const t = i / layers
    const yTop = y - h + h * t * 0.55
    const yBot = y - h + h * (t * 0.55 + 0.5)
    const ww = w * (1 - t * 0.55)
    path.push(
      <path
        key={i}
        d={`M${x - ww / 2} ${yBot} L${x} ${yTop} L${x + ww / 2} ${yBot} Z`}
        fill={fill}
      />
    )
  }
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <rect x={x - 2} y={y - 6} width={4} height={8} fill="#0a0a14" />
      {path}
    </g>
  )
}

/* ===== Средний план: смешанный лес (ели + лиственные) ===== */
function MidTreeRow() {
  const trees = []
  let x = 20
  while (x < 1220) {
    const variant = (x * 7) % 5 // 0..4
    const h = 100 + ((x * 11) % 60)
    const w = 60 + ((x * 13) % 30)
    const tilt = ((x * 19) % 7) - 3
    if (variant === 0 || variant === 3) {
      trees.push(<MidPineTree key={x} x={x} y={210} h={h} w={w} tilt={tilt} />)
    } else {
      trees.push(<MidLeafTree key={x} x={x} y={210} h={h} w={w} tilt={tilt} />)
    }
    x += 70 + ((x * 5) % 50)
  }
  return (
    <svg viewBox="0 0 1200 240" preserveAspectRatio="none" width="100%" height="100%">
      {trees}
    </svg>
  )
}

function MidPineTree({ x, y, h, w, tilt }) {
  const layers = 5
  const items = []
  for (let i = 0; i < layers; i++) {
    const t = i / layers
    const yTop = y - h + h * t * 0.5
    const yBot = y - h + h * (t * 0.5 + 0.5)
    const ww = w * (1 - t * 0.55)
    items.push(
      <path
        key={i}
        d={`M${x - ww / 2} ${yBot} L${x} ${yTop} L${x + ww / 2} ${yBot} Z`}
        fill="#0f2418"
      />
    )
    items.push(
      <path
        key={'l' + i}
        d={`M${x - ww / 2 + 3} ${yBot - 3} L${x} ${yTop + 5} L${x + ww / 2 - 3} ${yBot - 3} Z`}
        fill="#1d3a25"
      />
    )
  }
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <rect x={x - 3} y={y - 8} width={6} height={10} fill="#0a0a14" />
      {items}
    </g>
  )
}

function MidLeafTree({ x, y, h, w, tilt }) {
  // ствол + ветви + органичная крона из нескольких пятен
  const trunk = (
    <g>
      <path
        d={`M${x - 4} ${y} Q${x - 6} ${y - h * 0.4} ${x - 2} ${y - h * 0.55} L${x + 2} ${y - h * 0.55} Q${x + 6} ${y - h * 0.4} ${x + 4} ${y} Z`}
        fill="#1a1108"
      />
      {/* ветки */}
      <path d={`M${x - 2} ${y - h * 0.5} Q${x - 14} ${y - h * 0.62} ${x - 22} ${y - h * 0.7}`} stroke="#1a1108" strokeWidth="2" fill="none" />
      <path d={`M${x + 2} ${y - h * 0.55} Q${x + 16} ${y - h * 0.66} ${x + 24} ${y - h * 0.74}`} stroke="#1a1108" strokeWidth="2" fill="none" />
    </g>
  )
  // 5 листовых пятен — "облачная" крона
  const cy = y - h * 0.78
  const cw = w * 0.45
  const ch = h * 0.32
  const blobs = [
    { dx: 0, dy: 0, rx: cw, ry: ch, fill: '#0e2614' },
    { dx: -cw * 0.7, dy: ch * 0.2, rx: cw * 0.7, ry: ch * 0.85, fill: '#163a1c' },
    { dx: cw * 0.7, dy: ch * 0.1, rx: cw * 0.75, ry: ch * 0.9, fill: '#0e2a16' },
    { dx: -cw * 0.2, dy: -ch * 0.55, rx: cw * 0.55, ry: ch * 0.65, fill: '#1c4524' },
    { dx: cw * 0.25, dy: -ch * 0.45, rx: cw * 0.6, ry: ch * 0.7, fill: '#0e2814' },
  ]
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      {trunk}
      {blobs.map((b, i) => (
        <ellipse key={i} cx={x + b.dx} cy={cy + b.dy} rx={b.rx} ry={b.ry} fill={b.fill} />
      ))}
      {/* лёгкий блик */}
      <ellipse cx={x - cw * 0.2} cy={cy - ch * 0.5} rx={cw * 0.18} ry={ch * 0.18} fill="rgba(255,255,255,0.06)" />
    </g>
  )
}

/* ===== Ближний план: крупные деревья + кусты ===== */
function NearTreeRow() {
  const trees = []
  let x = 0
  while (x < 1240) {
    const kind = (x * 11) % 7
    const h = 150 + ((x * 17) % 70)
    const w = 80 + ((x * 13) % 36)
    const tilt = ((x * 23) % 7) - 3
    if (kind === 1) {
      // кустарник
      trees.push(<Bush key={x} x={x} y={250} w={70 + ((x * 5) % 30)} h={36 + ((x * 3) % 14)} />)
      x += 90 + ((x * 7) % 40)
    } else if (kind === 4 || kind === 5) {
      trees.push(<NearPine key={x} x={x} y={250} h={h} w={w} tilt={tilt} />)
      x += 110 + ((x * 5) % 50)
    } else {
      trees.push(<NearLeafTree key={x} x={x} y={250} h={h} w={w} tilt={tilt} />)
      x += 140 + ((x * 5) % 70)
    }
  }
  return (
    <svg viewBox="0 0 1240 280" preserveAspectRatio="none" width="100%" height="100%">
      {trees}
    </svg>
  )
}

function NearPine({ x, y, h, w, tilt }) {
  const layers = 6
  const items = []
  for (let i = 0; i < layers; i++) {
    const t = i / layers
    const yTop = y - h + h * t * 0.5
    const yBot = y - h + h * (t * 0.5 + 0.5)
    const ww = w * (1 - t * 0.55)
    items.push(
      <path key={i}
        d={`M${x - ww / 2} ${yBot} L${x} ${yTop} L${x + ww / 2} ${yBot} Z`}
        fill="#0d2417" />
    )
    items.push(
      <path key={'h' + i}
        d={`M${x - ww / 2 + 4} ${yBot - 4} L${x} ${yTop + 6} L${x + ww / 2 - 4} ${yBot - 4} Z`}
        fill="#1f4a2a" />
    )
  }
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      <rect x={x - 4} y={y - 10} width={8} height={12} fill="#0a0a14" />
      {items}
    </g>
  )
}

function NearLeafTree({ x, y, h, w, tilt }) {
  const cy = y - h * 0.7
  const cw = w * 0.55
  const ch = h * 0.4
  // ствол с ветвями
  const trunk = (
    <g>
      <path
        d={`M${x - 6} ${y} Q${x - 9} ${y - h * 0.45} ${x - 3} ${y - h * 0.55} L${x + 3} ${y - h * 0.55} Q${x + 9} ${y - h * 0.45} ${x + 6} ${y} Z`}
        fill="#1a1108"
        stroke="#0a0805" strokeWidth="0.5"
      />
      <path d={`M${x - 3} ${y - h * 0.45} Q${x - 22} ${y - h * 0.55} ${x - 38} ${y - h * 0.62}`} stroke="#1a1108" strokeWidth="3" fill="none" />
      <path d={`M${x + 3} ${y - h * 0.5}  Q${x + 24} ${y - h * 0.6} ${x + 42} ${y - h * 0.66}`} stroke="#1a1108" strokeWidth="3" fill="none" />
      <path d={`M${x - 32} ${y - h * 0.6}  L${x - 40} ${y - h * 0.7}`} stroke="#1a1108" strokeWidth="2" fill="none" />
      <path d={`M${x + 36} ${y - h * 0.64} L${x + 46} ${y - h * 0.74}`} stroke="#1a1108" strokeWidth="2" fill="none" />
    </g>
  )
  const blobs = [
    { dx: 0, dy: 0, rx: cw, ry: ch, fill: '#0e2614' },
    { dx: -cw * 0.75, dy: ch * 0.2, rx: cw * 0.75, ry: ch * 0.9, fill: '#163a1c' },
    { dx: cw * 0.7, dy: ch * 0.05, rx: cw * 0.78, ry: ch * 0.92, fill: '#0e2a16' },
    { dx: -cw * 0.25, dy: -ch * 0.6, rx: cw * 0.55, ry: ch * 0.65, fill: '#1f4a26' },
    { dx: cw * 0.3, dy: -ch * 0.45, rx: cw * 0.6, ry: ch * 0.7, fill: '#0f2c17' },
    { dx: 0, dy: -ch * 0.85, rx: cw * 0.4, ry: ch * 0.45, fill: '#27542d' },
  ]
  // мелкие "листья" — точки для текстуры
  const dots = []
  for (let i = 0; i < 18; i++) {
    const angle = (i * 0.7) + (x % 2)
    const r = 0.7 + ((i + x) % 3) * 0.2
    const dx = Math.cos(angle) * cw * (0.6 + (i % 3) * 0.12)
    const dy = Math.sin(angle * 1.3) * ch * (0.5 + (i % 4) * 0.08)
    dots.push(<circle key={i} cx={x + dx} cy={cy + dy} r={r * 1.2} fill="rgba(110,200,120,0.18)" />)
  }
  return (
    <g transform={`rotate(${tilt} ${x} ${y})`}>
      {trunk}
      {blobs.map((b, i) => (
        <ellipse key={i} cx={x + b.dx} cy={cy + b.dy} rx={b.rx} ry={b.ry} fill={b.fill} />
      ))}
      {dots}
      {/* мягкий блик */}
      <ellipse cx={x - cw * 0.25} cy={cy - ch * 0.55} rx={cw * 0.22} ry={ch * 0.22} fill="rgba(255,255,255,0.07)" />
    </g>
  )
}

function Bush({ x, y, w, h }) {
  return (
    <g>
      <ellipse cx={x} cy={y - h * 0.5} rx={w * 0.5} ry={h * 0.55} fill="#0e2614" />
      <ellipse cx={x - w * 0.25} cy={y - h * 0.45} rx={w * 0.32} ry={h * 0.5} fill="#173a1c" />
      <ellipse cx={x + w * 0.22} cy={y - h * 0.5} rx={w * 0.3} ry={h * 0.55} fill="#0f2a16" />
      <ellipse cx={x - w * 0.05} cy={y - h * 0.85} rx={w * 0.2} ry={h * 0.3} fill="#1f4a26" />
    </g>
  )
}

/* ===== Туман ===== */
function Mist() {
  return (
    <svg viewBox="0 0 1200 100" preserveAspectRatio="none" width="100%" height="100%">
      <defs>
        <radialGradient id="mistG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#cdd5ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#cdd5ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[120, 360, 600, 840, 1080].map((cx, i) => (
        <ellipse key={i} cx={cx} cy={60 + (i % 2) * 10} rx={180 + (i % 3) * 30} ry={28} fill="url(#mistG)" />
      ))}
    </svg>
  )
}

/* ===== Земля + трава + камни ===== */
function Ground() {
  const blades = []
  for (let x = 0; x < 1200; x += 14) {
    const h = 4 + ((x * 7) % 7)
    const lean = ((x * 5) % 3) - 1
    blades.push(
      <path
        key={x}
        d={`M${x} 60 L${x + lean} ${60 - h} L${x + 2} 60 Z`}
        fill="#1c3a22"
      />
    )
  }
  // редкие яркие травинки
  const high = []
  for (let x = 6; x < 1200; x += 90) {
    const h = 8 + ((x * 3) % 4)
    high.push(<path key={'h' + x} d={`M${x} 60 L${x + 1} ${60 - h} L${x + 2} 60 Z`} fill="#2a6a36" />)
  }
  // камни и пни
  const stones = []
  for (let x = 80; x < 1200; x += 280) {
    stones.push(
      <g key={'s' + x}>
        <ellipse cx={x} cy={62} rx={16} ry={4} fill="#22262f" />
        <ellipse cx={x - 6} cy={59} rx={10} ry={6} fill="#2c333f" />
      </g>
    )
  }
  // одиночный пенёк
  const stumps = []
  for (let x = 200; x < 1200; x += 470) {
    stumps.push(
      <g key={'st' + x}>
        <ellipse cx={x} cy={56} rx={14} ry={4} fill="#2a1808" />
        <rect x={x - 12} y={50} width={24} height={8} fill="#3a2410" />
        <ellipse cx={x} cy={50} rx={12} ry={3} fill="#5a3a18" />
      </g>
    )
  }
  return (
    <svg viewBox="0 0 1200 80" preserveAspectRatio="none" width="100%" height="100%">
      <defs>
        <linearGradient id="groundG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d2a16" />
          <stop offset="100%" stopColor="#070d08" />
        </linearGradient>
      </defs>
      <rect x={0} y={50} width={1200} height={30} fill="url(#groundG)" />
      {blades}
      {high}
      {stones}
      {stumps}
    </svg>
  )
}
