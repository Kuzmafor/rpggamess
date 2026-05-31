import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { JUMP_TOKENS_PER_TILE } from '../data/event.js'
import { impact } from '../mobile/index.js'

// ============================================================
// Мини-игра «Мост по руинам» (редизайн).
// Механика «моста»: герой стоит на краю парящей плиты. ЗАЖМИ экран — из края
// растёт каменный мост. ОТПУСТИ — мост падает вперёд. Если конец моста попал
// на следующую плиту — герой переходит по нему. Перелёт/недолёт — падение.
// Попал точно в центральную руну плиты — «идеально» (двойная пыль).
// Каждая пройденная плита = звёздная пыль. Идеальные приземления — бонус.
// ============================================================

const FIELD_W = 360
const FIELD_H = 440
const DECK_Y = 250          // верхняя поверхность плит (по Y)
const HERO_W = 24
const HERO_H = 32
const GROW_RATE = 175       // скорость роста моста (px/сек)
const MAX_BRIDGE = 360      // максимальная длина моста
const FALL_DUR = 280        // мс падения моста
const WALK_SPEED = 150      // px/сек ходьбы героя по мосту
const PERFECT_HALF = 9      //半 ширина зоны "идеально" (px)

// Параллакс-звёзды фона (генерится один раз).
const BG_STARS = (() => {
  const arr = []
  let seed = 99173
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  for (let i = 0; i < 70; i++) {
    arr.push([Math.round(rnd() * 1600), Math.round(rnd() * 230 + 8), +(rnd() * 1.4 + 0.5).toFixed(1), +(rnd() * 0.6 + 0.3).toFixed(2)])
  }
  return arr
})()

// Генерация следующей плиты: с прогрессом дальше и уже.
function nextPlatform(prev, index) {
  const diff = Math.min(1, index / 20)
  const minGap = 64 + diff * 60
  const maxGap = 120 + diff * 80
  const gap = minGap + Math.random() * (maxGap - minGap)
  const minW = 64 - diff * 30
  const maxW = 104 - diff * 40
  const w = Math.max(32, minW + Math.random() * (maxW - minW))
  return { x: prev.x + prev.w + gap, w }
}

export default function EventJumpGame({ onExit }) {
  const attemptsLeft = useGameStore(s => s.eventJumpAttemptsLeft())
  const best = useGameStore(s => s.event?.jump?.best || 0)
  const startJump = useGameStore(s => s.eventStartJump)
  const finishJump = useGameStore(s => s.eventFinishJump)

  const [phase, setPhase] = useState('idle')   // idle | playing | result
  const [tiles, setTiles] = useState(0)
  const [perfects, setPerfects] = useState(0)
  const [result, setResult] = useState(null)
  const [flash, setFlash] = useState(false)     // вспышка "Идеально!"
  const [, force] = useState(0)
  const rerender = useCallback(() => force(n => n + 1), [])

  const game = useRef(null)
  const raf = useRef(0)

  const begin = useCallback(() => {
    const r = startJump()
    if (!r.ok) return
    const p0 = { x: 20, w: 84 }
    const p1 = nextPlatform(p0, 1)
    game.current = {
      platforms: [p0, p1],
      curIndex: 0,
      heroX: p0.x + p0.w - 12 - HERO_W,  // герой у правого края плиты
      camX: 0,
      // мост
      bridgeLen: 0,
      growing: false,
      state: 'ready',   // ready | growing | falling | walking | turning | dead
      fallT: 0,
      walkDone: 0,
      // результат текущего перехода
      pendingLanded: -1,
      pendingPerfect: false,
      fellX: 0,         // куда падать если промах
      tiles: 0,
      perfects: 0,
      heroFallY: 0,
      lastTime: performance.now(),
      ended: false,
    }
    setTiles(0); setPerfects(0); setResult(null); setFlash(false)
    setPhase('playing')
  }, [startJump])

  const end = useCallback((g) => {
    if (g) g.ended = true
    cancelAnimationFrame(raf.current)
    const r = finishJump(g?.tiles || 0, g?.perfects || 0)
    setResult(r)
    setPhase('result')
  }, [finishJump])

  // Игровой цикл
  useEffect(() => {
    if (phase !== 'playing') return
    const loop = (now) => {
      const g = game.current
      if (!g || g.ended) return
      const dt = Math.min(48, now - g.lastTime)
      g.lastTime = now
      const ds = dt / 1000

      const curEnd = g.platforms[g.curIndex].x + g.platforms[g.curIndex].w
      const bridgeBaseX = curEnd  // мост растёт от правого края текущей плиты

      if (g.state === 'growing') {
        g.bridgeLen = Math.min(MAX_BRIDGE, g.bridgeLen + GROW_RATE * ds)
      }

      if (g.state === 'falling') {
        g.fallT += dt
        // мост поворачивается на 90° — визуально через bridgeAngle
        if (g.fallT >= FALL_DUR) {
          g.state = 'walking'
          g.walkDone = 0
          // вычислить точку конца моста и проверить попадание
          const tipX = bridgeBaseX + g.bridgeLen
          const next = g.platforms[g.curIndex + 1]
          if (next && tipX >= next.x && tipX <= next.x + next.w) {
            g.pendingLanded = g.curIndex + 1
            const center = next.x + next.w / 2
            g.pendingPerfect = Math.abs(tipX - center) <= PERFECT_HALF
          } else {
            g.pendingLanded = -1
            g.pendingPerfect = false
            g.fellX = tipX
          }
        }
      }

      if (g.state === 'walking') {
        g.walkDone += WALK_SPEED * ds
        const targetX = g.pendingLanded >= 0
          ? (g.platforms[g.pendingLanded].x + g.platforms[g.pendingLanded].w / 2 - HERO_W / 2)
          : (g.fellX - HERO_W / 2)            // дошёл до конца моста (в пустоту)
        const startX = g.platforms[g.curIndex].x + g.platforms[g.curIndex].w - 12 - HERO_W
        const dist = targetX - startX
        const walked = Math.min(Math.abs(dist), g.walkDone)
        g.heroX = startX + Math.sign(dist) * walked
        if (g.walkDone >= Math.abs(dist)) {
          if (g.pendingLanded >= 0) {
            // успех
            g.curIndex = g.pendingLanded
            g.tiles += 1
            setTiles(g.tiles)
            if (g.pendingPerfect) {
              g.perfects += 1
              setPerfects(g.perfects)
              setFlash(true)
              setTimeout(() => setFlash(false), 650)
              impact('medium')
            } else {
              impact('light')
            }
            // готовим следующие плиты
            while (g.platforms.length < g.curIndex + 3) {
              g.platforms.push(nextPlatform(g.platforms[g.platforms.length - 1], g.platforms.length))
            }
            g.bridgeLen = 0
            g.state = 'turning'
            g.turnT = 0
          } else {
            // промах — падаем с конца моста
            g.state = 'dead'
            g.heroFallY = 0
          }
        }
      }

      if (g.state === 'turning') {
        // плавный доводчик камеры к новой плите, затем готовность
        g.turnT = (g.turnT || 0) + dt
        if (g.turnT > 180) g.state = 'ready'
      }

      if (g.state === 'dead') {
        g.heroFallY += (200 + g.heroFallY * 3) * ds
        if (g.heroFallY > FIELD_H) { end(g); return }
      }

      // камера: текущая плита у левой трети
      const focus = g.platforms[g.curIndex].x
      const targetCam = Math.max(0, focus - FIELD_W * 0.22)
      g.camX += (targetCam - g.camX) * Math.min(1, dt / 140)

      rerender()
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame((t) => {
      if (game.current) game.current.lastTime = t
      loop(t)
    })
    return () => cancelAnimationFrame(raf.current)
  }, [phase, end, rerender])

  const onDown = useCallback((e) => {
    e.preventDefault()
    const g = game.current
    if (!g || g.state !== 'ready' || g.ended) return
    g.state = 'growing'
    g.bridgeLen = 0
  }, [])

  const onUp = useCallback((e) => {
    e?.preventDefault?.()
    const g = game.current
    if (!g || g.state !== 'growing' || g.ended) return
    g.state = 'falling'
    g.fallT = 0
    impact('light')
  }, [])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const g = game.current

  return (
    <div className="ev-jump">
      {phase === 'idle' && (
        <div className="ev-jump-intro">
          <div className="ev-jump-illu"><Icon name="bolt" size={40} /></div>
          <h3>Мост по руинам</h3>
          <p className="ev-hint">
            Зажми поле — из края плиты растёт <b>каменный мост</b>. Отпусти — мост
            упадёт вперёд. Дотянись точно до следующей плиты, а попадёшь в её
            центр — получишь <b>двойную пыль</b> за идеальный переход.
          </p>
          <div className="ev-jump-stat">
            <span><Icon name="star" size={14} /> +{JUMP_TOKENS_PER_TILE} пыли за плиту</span>
            <span>Рекорд: <b>{best}</b></span>
          </div>
          <button className="btn gold size-lg block" disabled={attemptsLeft <= 0} onClick={begin}>
            {attemptsLeft > 0 ? `Начать (попыток: ${attemptsLeft})` : 'Попытки на сегодня кончились'}
          </button>
          <button className="btn ghost size-md block" onClick={onExit}>Назад</button>
        </div>
      )}

      {phase === 'playing' && (
        <div
          className="ev-jump-field"
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          onPointerCancel={onUp}
        >
          <div className="ev-jump-hud">
            <span className="ev-jump-tiles"><Icon name="star" size={14} /> {tiles}</span>
            {perfects > 0 && <span className="ev-jump-perfect">★ {perfects}</span>}
            <span className="ev-jump-tip">Зажми и отпусти</span>
          </div>

          {flash && <div className="ev-jump-flash">ИДЕАЛЬНО!</div>}

          <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} width="100%" height="100%" className="ev-jump-svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="jgSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a1346" />
                <stop offset="55%" stopColor="#2a1f5e" />
                <stop offset="100%" stopColor="#4a2d6e" />
              </linearGradient>
              <radialGradient id="jgSun" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff3c8" />
                <stop offset="55%" stopColor="#ffcf6e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ff9a3a" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="jgDeck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7e63d6" />
                <stop offset="100%" stopColor="#4a3a8a" />
              </linearGradient>
              <linearGradient id="jgDeckCur" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7ef0ff" />
                <stop offset="100%" stopColor="#3a8ad0" />
              </linearGradient>
              <linearGradient id="jgBridge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffd27a" />
                <stop offset="100%" stopColor="#b9762a" />
              </linearGradient>
              <linearGradient id="jgHero" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9af5ff" />
                <stop offset="100%" stopColor="#3aa6ff" />
              </linearGradient>
            </defs>

            {/* небо */}
            <rect x="0" y="0" width={FIELD_W} height={FIELD_H} fill="url(#jgSky)" />
            {/* большое солнце-портал внизу */}
            <circle cx={FIELD_W / 2} cy={FIELD_H - 20} r="120" fill="url(#jgSun)" />
            <circle cx={FIELD_W / 2} cy={FIELD_H - 20} r="58" fill="#fff3c8" opacity="0.9" />

            {/* параллакс-звёзды */}
            <g transform={`translate(${-((g?.camX || 0) * 0.2)},0)`}>
              {BG_STARS.map((s, i) => (
                <circle key={i} cx={s[0] % 1500} cy={s[1]} r={s[2]} fill="#fff" opacity={s[3]} />
              ))}
            </g>

            {/* игровой слой со скроллом камеры */}
            <g transform={`translate(${-(g?.camX || 0)},0)`}>
              {/* плиты */}
              {(g?.platforms || []).map((p, i) => {
                const isCur = i === g.curIndex
                const cx = p.x + p.w / 2
                return (
                  <g key={i}>
                    {isCur && <ellipse cx={cx} cy={DECK_Y + 6} rx={p.w / 1.5} ry="14" fill="#7ef0ff" opacity="0.22" />}
                    {/* парящее основание */}
                    <path d={`M${p.x} ${DECK_Y + 18} L${p.x + p.w} ${DECK_Y + 18} L${p.x + p.w - 16} ${DECK_Y + 18 + 70} L${p.x + 16} ${DECK_Y + 18 + 70} Z`}
                          fill="#171034" stroke="#0c0822" strokeWidth="1.5" />
                    {/* свисающие кристаллы */}
                    <path d={`M${p.x + p.w * 0.32} ${DECK_Y + 84} l-4 16 l4 5 l4 -5 Z`} fill="#7c5cff" opacity="0.8" />
                    <path d={`M${p.x + p.w * 0.68} ${DECK_Y + 80} l-3 12 l3 4 l3 -4 Z`} fill="#a072ff" opacity="0.7" />
                    {/* верхняя поверхность */}
                    <rect x={p.x} y={DECK_Y} width={p.w} height="18" rx="5"
                          fill={isCur ? 'url(#jgDeckCur)' : 'url(#jgDeck)'} stroke="#160d36" strokeWidth="2" />
                    <rect x={p.x + 2} y={DECK_Y + 1} width={p.w - 4} height="4" rx="2" fill="#fff" opacity="0.35" />
                    {/* центральная руна-цель (зона "идеально") */}
                    <circle cx={cx} cy={DECK_Y + 9} r="3" fill="#ffd166" opacity="0.95">
                      <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <rect x={cx - PERFECT_HALF} y={DECK_Y} width={PERFECT_HALF * 2} height="18" rx="3"
                          fill="none" stroke="#ffd166" strokeWidth="0.8" opacity="0.35" />
                  </g>
                )
              })}

              {/* мост */}
              {g && (() => {
                const cur = g.platforms[g.curIndex]
                const baseX = cur.x + cur.w
                const baseY = DECK_Y
                let angle = 0
                if (g.state === 'falling') angle = Math.min(90, (g.fallT / FALL_DUR) * 90)
                else if (g.state === 'growing' || g.state === 'ready') angle = 0
                else angle = 90
                if (g.bridgeLen <= 0) return null
                // мост рисуем как вертикальный (растёт вверх), затем поворачиваем
                return (
                  <g transform={`translate(${baseX}, ${baseY}) rotate(${angle - 90})`} style={{ transformOrigin: '0 0' }}>
                    {/* при angle=0 (growing) — торчит вверх; angle=90 — лежит вправо */}
                    <rect x="0" y="-5" width={g.bridgeLen} height="9" rx="2" fill="url(#jgBridge)" stroke="#5a3a12" strokeWidth="1.5" />
                    <rect x="0" y="-5" width={g.bridgeLen} height="3" rx="1.5" fill="#fff" opacity="0.3" />
                  </g>
                )
              })()}

              {/* герой */}
              {g && (() => {
                const dead = g.state === 'dead'
                const cx = g.heroX + HERO_W / 2
                const topY = DECK_Y - HERO_H + (dead ? g.heroFallY : 0)
                const charging = g.state === 'growing'
                const squash = charging ? 0.9 : 1
                return (
                  <g>
                    {!dead && <ellipse cx={cx} cy={DECK_Y + 2} rx={HERO_W / 2} ry="3.5" fill="#000" opacity="0.3" />}
                    <g transform={`translate(${g.heroX}, ${topY}) scale(1, ${squash})`} style={{ transformOrigin: 'center bottom' }}>
                      <rect x="2" y="6" width={HERO_W - 4} height={HERO_H - 10} rx="6"
                            fill="url(#jgHero)" stroke="#1a5a9a" strokeWidth="2" />
                      <circle cx={HERO_W / 2} cy="6" r="6.5" fill="#ffe2a8" stroke="#7a4f0a" strokeWidth="1.5" />
                      <circle cx={HERO_W / 2 - 2.2} cy="5.5" r="1" fill="#3a2a66" />
                      <circle cx={HERO_W / 2 + 2.2} cy="5.5" r="1" fill="#3a2a66" />
                      <path d={`M2 10 Q-4 ${charging ? 26 : 18} 4 ${HERO_H - 4}`} fill="none" stroke="#ff7a2a" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
                    </g>
                  </g>
                )
              })()}
            </g>
          </svg>

          {/* индикатор силы (для наглядности роста моста) */}
          <div className="ev-charge">
            <div className="ev-charge-fill" style={{ width: (g ? Math.round((g.bridgeLen / MAX_BRIDGE) * 100) : 0) + '%' }} />
          </div>
        </div>
      )}

      {phase === 'result' && result && (
        <div className="ev-jump-result">
          <div className={'ev-result-burst' + (result.tiles > 0 ? ' win' : '')} />
          <h3>{result.tiles > 0 ? 'Отличный забег!' : 'Сорвался в пропасть'}</h3>
          <div className="ev-result-big">{result.tiles}<span> плит</span></div>
          {result.perfects > 0 && <div className="ev-result-perfect">★ Идеальных: {result.perfects}</div>}
          {result.newBest && result.tiles > 0 && <div className="ev-result-best">Новый рекорд!</div>}
          <div className="ev-result-rewards">
            <div className="srew shards">
              <Icon name="star" size={18} />
              <div className="srew-meta"><span className="srew-num">+{result.tokens}</span><span className="srew-name">Звёздная пыль</span></div>
            </div>
            <div className="srew gold">
              <Icon name="gold" size={18} />
              <div className="srew-meta"><span className="srew-num">+{result.gold}</span><span className="srew-name">Золото</span></div>
            </div>
          </div>
          {attemptsLeft > 0
            ? <button className="btn gold size-lg block" onClick={begin}>Ещё раз (осталось: {attemptsLeft})</button>
            : <div className="ev-hint center">Попытки на сегодня кончились. Возвращайтесь завтра!</div>}
          <button className="btn ghost size-md block" onClick={onExit}>Назад к фестивалю</button>
        </div>
      )}
    </div>
  )
}
