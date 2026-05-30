import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { JUMP_TOKENS_PER_TILE } from '../data/event.js'
import { impact } from '../mobile/index.js'

// ============================================================
// Мини-игра «Прыжки по руинам».
// Механика: герой стоит на парящей плите. ЗАЖМИ экран — копится сила прыжка
// (полоска растёт). ОТПУСТИ — герой прыгает вперёд на дистанцию, пропорциональную
// заряду. Нужно «на глаз» рассчитать силу так, чтобы приземлиться на следующую
// плиту, а не в пропасть. Каждая пройденная плита = звёздная пыль.
// ============================================================

// Игровые константы (в "мировых" единицах = px по ширине поля 100%).
const FIELD_W = 360          // логическая ширина поля
const FIELD_H = 340          // логическая высота поля
const GROUND_Y = 232         // верх плиты (по Y)
const HERO_W = 26
const HERO_H = 34
const CHARGE_RATE = 150      // ед. дистанции в секунду заряда
const MAX_CHARGE = 230       // максимум дистанции прыжка
const MIN_CHARGE = 30
const JUMP_DURATION = 620    // мс полёта
const ARC_H = 96             // высота дуги прыжка
const PLATFORM_H = 22

// Декор фона в мировых координатах (генерится один раз). Звёзды + дальние острова.
const BG_STARS = (() => {
  const arr = []
  let seed = 99173
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  for (let i = 0; i < 90; i++) {
    arr.push([Math.round(rnd() * 3200), Math.round(rnd() * 200 + 8), +(rnd() * 1.3 + 0.5).toFixed(1), +(rnd() * 0.6 + 0.3).toFixed(2)])
  }
  return arr
})()
const FAR_ISLANDS = (() => {
  const arr = []
  let seed = 4242
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  for (let i = 0; i < 14; i++) {
    arr.push({ x: Math.round(i * 240 + rnd() * 120), y: Math.round(150 + rnd() * 70), s: +(0.5 + rnd() * 0.7).toFixed(2) })
  }
  return arr
})()

// Генерация следующей плиты: чем дальше, тем уже и дальше (сложнее).
function nextPlatform(prev, index) {
  const diff = Math.min(1, index / 18)
  const minGap = 70 + diff * 50
  const maxGap = 120 + diff * 70
  const gap = minGap + Math.random() * (maxGap - minGap)
  const minW = 70 - diff * 34
  const maxW = 110 - diff * 40
  const w = Math.max(34, minW + Math.random() * (maxW - minW))
  return { x: prev.x + prev.w + gap, w }
}

export default function EventJumpGame({ onExit }) {
  const attemptsLeft = useGameStore(s => s.eventJumpAttemptsLeft())
  const best = useGameStore(s => s.event?.jump?.best || 0)
  const startJump = useGameStore(s => s.eventStartJump)
  const finishJump = useGameStore(s => s.eventFinishJump)

  // phase: idle | playing | result
  const [phase, setPhase] = useState('idle')
  const [tiles, setTiles] = useState(0)
  const [result, setResult] = useState(null)

  // визуальные значения (для рендера) держим в state, физику — в ref
  const [chargePct, setChargePct] = useState(0)
  const [, force] = useState(0)
  const rerender = useCallback(() => force(n => n + 1), [])

  const game = useRef(null)   // мутабельное игровое состояние
  const raf = useRef(0)

  // Инициализация новой попытки
  const begin = useCallback(() => {
    const r = startJump()
    if (!r.ok) return
    const p0 = { x: 30, w: 90 }
    const p1 = nextPlatform(p0, 1)
    game.current = {
      platforms: [p0, p1],
      heroX: p0.x + p0.w / 2 - HERO_W / 2, // центр на первой плите
      curIndex: 0,
      camX: 0,
      charging: false,
      charge: 0,
      jumping: false,
      jumpT: 0,
      jumpFrom: 0,
      jumpDist: 0,
      heroY: 0,        // смещение вверх во время прыжка
      falling: false,
      fallV: 0,
      tiles: 0,
      lastTime: performance.now(),
      ended: false,
    }
    setTiles(0)
    setChargePct(0)
    setResult(null)
    setPhase('playing')
  }, [startJump])

  // Завершение попытки
  const end = useCallback((finalTiles) => {
    if (game.current) game.current.ended = true
    cancelAnimationFrame(raf.current)
    const r = finishJump(finalTiles)
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

      // заряд
      if (g.charging && !g.jumping && !g.falling) {
        g.charge = Math.min(MAX_CHARGE, g.charge + CHARGE_RATE * (dt / 1000))
        setChargePct(Math.round((g.charge / MAX_CHARGE) * 100))
      }

      // полёт
      if (g.jumping) {
        g.jumpT += dt
        const t = Math.min(1, g.jumpT / JUMP_DURATION)
        g.heroX = g.jumpFrom + g.jumpDist * t
        g.heroY = Math.sin(t * Math.PI) * ARC_H   // высота дуги
        if (t >= 1) {
          g.jumping = false
          g.heroY = 0
          // проверка приземления
          const cx = g.heroX + HERO_W / 2
          let landed = -1
          for (let i = 0; i < g.platforms.length; i++) {
            const p = g.platforms[i]
            if (cx >= p.x && cx <= p.x + p.w) { landed = i; break }
          }
          if (landed > g.curIndex) {
            // успех — встали на новую плиту
            g.curIndex = landed
            g.tiles += 1
            setTiles(g.tiles)
            impact('light')
            // подготовим ещё одну плиту вперёд
            while (g.platforms.length < g.curIndex + 3) {
              g.platforms.push(nextPlatform(g.platforms[g.platforms.length - 1], g.platforms.length))
            }
          } else if (landed === g.curIndex) {
            // приземлился на ту же плиту (недопрыг по центру) — это ок, не падаем
          } else {
            // мимо — падение
            g.falling = true
            g.fallV = 0
          }
        }
      }

      // падение в пропасть
      if (g.falling) {
        g.fallV += 0.9 * dt
        g.heroY -= g.fallV * (dt / 16)   // heroY отрицательный = вниз
        if (g.heroY < -FIELD_H) {
          end(g.tiles)
          return
        }
      }

      // камера: держим героя в левой трети
      const targetCam = Math.max(0, g.heroX - FIELD_W * 0.32)
      g.camX += (targetCam - g.camX) * Math.min(1, dt / 120)

      rerender()
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame((t) => {
      if (game.current) game.current.lastTime = t
      loop(t)
    })
    return () => cancelAnimationFrame(raf.current)
  }, [phase, end, rerender])

  // Управление: pointer down/up на поле
  const onDown = useCallback((e) => {
    e.preventDefault()
    const g = game.current
    if (!g || g.jumping || g.falling || g.ended) return
    g.charging = true
    g.charge = MIN_CHARGE
    setChargePct(Math.round((MIN_CHARGE / MAX_CHARGE) * 100))
  }, [])

  const onUp = useCallback((e) => {
    e?.preventDefault?.()
    const g = game.current
    if (!g || !g.charging || g.jumping || g.falling || g.ended) return
    g.charging = false
    g.jumping = true
    g.jumpT = 0
    g.jumpFrom = g.heroX
    g.jumpDist = g.charge
    setChargePct(0)
    impact('light')
  }, [])

  // cleanup
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const g = game.current

  return (
    <div className="ev-jump">
      {phase === 'idle' && (
        <div className="ev-jump-intro">
          <div className="ev-jump-illu"><Icon name="bolt" size={40} /></div>
          <h3>Прыжки по руинам</h3>
          <p className="ev-hint">
            Зажми поле — копится <b>сила прыжка</b>. Отпусти — герой прыгнет вперёд.
            Рассчитай силу так, чтобы приземлиться на плиту, а не в пропасть.
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
            <span className="ev-jump-tip">Зажми и отпусти</span>
          </div>

          <svg viewBox={`0 0 ${FIELD_W} ${FIELD_H}`} width="100%" height="100%" className="ev-jump-svg">
            <defs>
              <radialGradient id="jgGlow" cx="50%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="jgMoon" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fff7e0" />
                <stop offset="70%" stopColor="#ffe2a8" />
                <stop offset="100%" stopColor="#ffcf6e" stopOpacity="0.15" />
              </radialGradient>
              <linearGradient id="jgPlat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8a6cff" />
                <stop offset="100%" stopColor="#3a2a66" />
              </linearGradient>
              <linearGradient id="jgPlatCur" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9af5ff" />
                <stop offset="100%" stopColor="#4a8ad0" />
              </linearGradient>
              <linearGradient id="jgHero" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9af5ff" />
                <stop offset="100%" stopColor="#3aa6ff" />
              </linearGradient>
            </defs>

            {/* фон внутри поля — НЕ скроллится (параллакс): луна, туманность */}
            <rect x="0" y="0" width={FIELD_W} height={FIELD_H} fill="url(#jgGlow)" opacity="0.7" />
            <circle cx="300" cy="58" r="30" fill="url(#jgMoon)" />
            <circle cx="300" cy="58" r="20" fill="#fff7e0" opacity="0.9" />
            <ellipse cx="90" cy="80" rx="120" ry="40" fill="#a072ff" opacity="0.1" />
            <ellipse cx="260" cy="150" rx="150" ry="55" fill="#67d6ff" opacity="0.07" />

            {/* медленный параллакс-слой звёзд и дальних островов */}
            <g transform={`translate(${-((g?.camX || 0) * 0.25)},0)`}>
              {BG_STARS.map((s, i) => (
                <circle key={i} cx={s[0] % 1600} cy={s[1]} r={s[2]} fill="#fff" opacity={s[3]} />
              ))}
              {FAR_ISLANDS.map((fi, i) => (
                <g key={i} transform={`translate(${fi.x % 1600}, ${fi.y}) scale(${fi.s})`} opacity="0.35">
                  <path d="M0 0 L18 -14 L46 -14 L64 0 L44 24 L20 24 Z" fill="#2a1f4e" />
                </g>
              ))}
            </g>

            <g transform={`translate(${-(g?.camX || 0)},0)`}>
              {/* траектория-подсказка во время заряда */}
              {g && g.charging && !g.jumping && (() => {
                const dots = []
                const fromX = g.heroX + HERO_W / 2
                const fromY = GROUND_Y - HERO_H / 2 - (g.heroY || 0)
                for (let k = 1; k <= 7; k++) {
                  const tt = k / 8
                  const dx = fromX + g.charge * tt
                  const dy = fromY - Math.sin(tt * Math.PI) * ARC_H
                  dots.push(<circle key={k} cx={dx} cy={dy} r={2.4 - k * 0.12} fill="#9af5ff" opacity={0.85 - k * 0.08} />)
                }
                // отметка точки приземления
                const landX = fromX + g.charge
                dots.push(<g key="land"><circle cx={landX} cy={GROUND_Y - 2} r="6" fill="none" stroke="#ffd166" strokeWidth="1.6" opacity="0.8" /><circle cx={landX} cy={GROUND_Y - 2} r="2" fill="#ffd166" /></g>)
                return dots
              })()}

              {/* плиты */}
              {(g?.platforms || []).map((p, i) => {
                const isCur = i === g.curIndex
                return (
                  <g key={i}>
                    {/* свечение под текущей плитой */}
                    {isCur && <ellipse cx={p.x + p.w / 2} cy={GROUND_Y + PLATFORM_H} rx={p.w / 1.6} ry="16" fill="#67d6ff" opacity="0.25" />}
                    {/* парящий низ (объём) */}
                    <path d={`M${p.x} ${GROUND_Y + PLATFORM_H} L${p.x + p.w} ${GROUND_Y + PLATFORM_H} L${p.x + p.w - 14} ${GROUND_Y + PLATFORM_H + 26} L${p.x + 14} ${GROUND_Y + PLATFORM_H + 26} Z`}
                          fill="#1a1038" stroke="#0a0820" strokeWidth="1.5" />
                    {/* свисающие кристаллы */}
                    <path d={`M${p.x + p.w * 0.3} ${GROUND_Y + PLATFORM_H + 22} l-4 14 l4 4 l4 -4 Z`} fill="#7c5cff" opacity="0.8" />
                    <path d={`M${p.x + p.w * 0.7} ${GROUND_Y + PLATFORM_H + 18} l-3 10 l3 3 l3 -3 Z`} fill="#a072ff" opacity="0.7" />
                    {/* верхняя плита */}
                    <rect x={p.x} y={GROUND_Y} width={p.w} height={PLATFORM_H} rx="6"
                          fill={isCur ? 'url(#jgPlatCur)' : 'url(#jgPlat)'} stroke="#1a0f3a" strokeWidth="2" />
                    <rect x={p.x + 2} y={GROUND_Y + 1} width={p.w - 4} height="5" rx="3" fill="#fff" opacity="0.4" />
                    {/* руны на плите */}
                    <circle cx={p.x + p.w / 2} cy={GROUND_Y + 13} r="2.6" fill="#ffd166" opacity="0.9">
                      {isCur && <animate attributeName="opacity" values="0.5;1;0.5" dur="1.4s" repeatCount="indefinite" />}
                    </circle>
                    <path d={`M${p.x + p.w / 2 - 8} ${GROUND_Y + 13} h16`} stroke="#ffd166" strokeWidth="1" opacity="0.35" />
                  </g>
                )
              })}

              {/* герой */}
              {g && (() => {
                const inAir = g.jumping || g.falling
                const cx = g.heroX + HERO_W / 2
                const topY = GROUND_Y - HERO_H - (g.heroY || 0)
                const squash = g.charging ? 0.84 : 1   // приседание при заряде
                return (
                  <g>
                    {/* тень на плите */}
                    <ellipse cx={cx} cy={GROUND_Y + 4} rx={HERO_W / 2 * (inAir ? 0.6 : 1)} ry="4"
                             fill="#000" opacity={inAir ? 0.1 : 0.3} />
                    {/* аура заряда */}
                    {g.charging && (
                      <circle cx={cx} cy={topY + HERO_H / 2} r={18 + (chargePct / 100) * 14} fill="url(#jgGlow)" opacity="0.7">
                        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="0.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <g transform={`translate(${g.heroX}, ${topY}) scale(1, ${squash})`} style={{ transformOrigin: 'center bottom' }}>
                      <rect x="2" y="6" width={HERO_W - 4} height={HERO_H - 10} rx="7"
                            fill="url(#jgHero)" stroke="#1a5a9a" strokeWidth="2" />
                      <circle cx={HERO_W / 2} cy="6" r="7" fill="#ffe2a8" stroke="#7a4f0a" strokeWidth="1.5" />
                      {/* глаза-искорки */}
                      <circle cx={HERO_W / 2 - 2.4} cy="5.5" r="1" fill="#3a2a66" />
                      <circle cx={HERO_W / 2 + 2.4} cy="5.5" r="1" fill="#3a2a66" />
                      {/* плащ-огонёк */}
                      <path d={`M2 10 Q${inAir ? -8 : -4} ${g.charging ? 28 : 18} 4 ${HERO_H - 4}`} fill="none" stroke="#ff7a2a" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
                    </g>
                    {/* искры в полёте */}
                    {inAir && [0, 1, 2].map(k => (
                      <circle key={k} cx={cx - 6 - k * 5} cy={topY + HERO_H - k * 4} r={1.6 - k * 0.4} fill="#9af5ff" opacity={0.7 - k * 0.2} />
                    ))}
                  </g>
                )
              })()}
            </g>
          </svg>

          {/* индикатор заряда */}
          <div className="ev-charge">
            <div className="ev-charge-fill" style={{ width: chargePct + '%' }} />
          </div>
        </div>
      )}

      {phase === 'result' && result && (
        <div className="ev-jump-result">
          <div className={'ev-result-burst' + (result.tiles > 0 ? ' win' : '')} />
          <h3>{result.tiles > 0 ? 'Отличный забег!' : 'Сорвался в пропасть'}</h3>
          <div className="ev-result-big">{result.tiles}<span> плит</span></div>
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
