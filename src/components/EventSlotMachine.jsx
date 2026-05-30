import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'
import * as audio from '../audio/engine.js'
import {
  SLOT_ITEMS, SLOT_COST_TOKENS, SLOT_GEM_COST, SLOT_FREE_PER_DAY,
} from '../data/event.js'

// ============================================================
// «Звёздный автомат» — анимированный дроп-автомат.
// Колесо прокручивается (лента иконок едет вниз), замедляется и
// останавливается на выпавшем призе. Затем показывается карточка награды.
// Оплата: 1 бесплатная прокрутка в день, далее звёздная пыль или гемы.
// ============================================================

const RARITY_COLOR = {
  common: '#c8cee8', rare: '#67d6ff', epic: '#a072ff', legendary: '#ffd166', mythic: '#ff7a2a',
}

// Построить длинную ленту иконок, заканчивающуюся на нужном итоге.
function buildReel(finalId, length = 36) {
  const ids = SLOT_ITEMS.map(i => i.id)
  const reel = []
  for (let i = 0; i < length - 1; i++) {
    reel.push(ids[Math.floor(Math.random() * ids.length)])
  }
  reel.push(finalId) // последний — выигрышный
  return reel
}

function ItemCell({ id, win }) {
  const def = SLOT_ITEMS.find(i => i.id === id) || SLOT_ITEMS[0]
  return (
    <div className={'slot-cell' + (win ? ' win' : '')} style={{ '--c': def.color }}>
      <span className="slot-cell-shine" />
      <Icon name={def.icon} size={38} />
      <span className="slot-cell-lbl">{def.label}</span>
    </div>
  )
}

// Рамка с бегущими лампочками вокруг окна автомата.
function MarqueeLights({ running }) {
  // Распределяем лампы по периметру прямоугольника (в %).
  const perSide = 7
  const bulbs = []
  let idx = 0
  // top edge (лево→право)
  for (let i = 0; i < perSide; i++) bulbs.push({ x: (i / (perSide - 1)) * 100, y: 0, i: idx++ })
  // right edge (верх→низ)
  for (let i = 1; i < perSide; i++) bulbs.push({ x: 100, y: (i / (perSide - 1)) * 100, i: idx++ })
  // bottom edge (право→лево)
  for (let i = 1; i < perSide; i++) bulbs.push({ x: 100 - (i / (perSide - 1)) * 100, y: 100, i: idx++ })
  // left edge (низ→верх)
  for (let i = 1; i < perSide - 1; i++) bulbs.push({ x: 0, y: 100 - (i / (perSide - 1)) * 100, i: idx++ })
  const N = bulbs.length
  return (
    <div className={'slot-bulbs' + (running ? ' running' : '')} aria-hidden="true">
      {bulbs.map(b => (
        <span
          key={b.i}
          className="slot-bulb"
          style={{ left: b.x + '%', top: b.y + '%', '--i': b.i, '--n': N }}
        />
      ))}
    </div>
  )
}

export default function EventSlotMachine({ onExit }) {
  const tokens = useGameStore(s => s.event?.tokens || 0)
  const gems = useGameStore(s => s.gems)
  const freeLeft = useGameStore(s => s.eventSlotFreeLeft())
  const spin = useGameStore(s => s.eventSpinSlot)

  const [reel, setReel] = useState(() => buildReel('gold'))
  const [spinning, setSpinning] = useState(false)
  const [offset, setOffset] = useState(0)      // px смещение ленты
  const [prize, setPrize] = useState(null)
  const [landed, setLanded] = useState(false)  // вспышка/тряска при остановке
  const [winColor, setWinColor] = useState('#ffd166')
  const trackRef = useRef(null)
  const CELL = 92                                // высота ячейки (px) — синхр. с CSS
  const finalIdxRef = useRef(-1)

  const doSpin = useCallback((pay) => {
    if (spinning) return
    const res = spin(pay)
    if (!res.ok) {
      useGameStore.getState()._toast?.(
        pay === 'gems' ? 'Недостаточно гемов' :
        pay === 'tokens' ? 'Недостаточно звёздной пыли' :
        'Бесплатная прокрутка использована'
      )
      return
    }
    setPrize(null)
    setLanded(false)
    const newReel = buildReel(res.itemId)
    setReel(newReel)
    setSpinning(true)
    const def = SLOT_ITEMS.find(i => i.id === res.itemId)
    setWinColor(def?.color || '#ffd166')

    // анимация: лента уезжает так, чтобы последняя ячейка оказалась в окне.
    const finalIndex = newReel.length - 1
    finalIdxRef.current = finalIndex
    // окно показывает 3 ячейки; целимся серединой окна на финальную
    const target = (finalIndex - 1) * CELL
    // старт с небольшого «отскока» вверх
    setOffset(0)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOffset(target))
    })

    // по окончании transition (см. CSS ~2.6s) — вспышка + показать награду
    window.clearTimeout(doSpin._t)
    window.clearTimeout(doSpin._t2)
    doSpin._t = window.setTimeout(() => {
      setSpinning(false)
      setLanded(true)            // подсветка выигрышной ячейки + тряска
      audio.sfxFanfare?.()
    }, 2650)
    doSpin._t2 = window.setTimeout(() => {
      setPrize(res)
    }, 3150)
  }, [spin, spinning])

  useEffect(() => () => { window.clearTimeout(doSpin._t); window.clearTimeout(doSpin._t2) }, [doSpin])

  return (
    <div className="ev-slot">
      <div className="ev-slot-head">
        <h3>Звёздный автомат</h3>
        <p className="ev-hint">Крути колесо — выпадают ресурсы, гемы, снаряжение и, с малым шансом, герои.</p>
      </div>

      {/* окно автомата */}
      <div
        className={'slot-machine' + (spinning ? ' spinning' : '') + (landed ? ' landed' : '')}
        style={{ '--win': winColor }}
      >
        <MarqueeLights running={spinning} />
        <div className="slot-window">
          <div className="slot-frame-glow" />
          <div
            className="slot-track"
            ref={trackRef}
            style={{
              transform: `translateY(${-offset}px)`,
              transition: spinning ? 'transform 2.6s cubic-bezier(0.12, 0.7, 0.1, 1)' : 'none',
            }}
          >
            {reel.map((id, i) => (
              <ItemCell key={i} id={id} win={landed && i === finalIdxRef.current} />
            ))}
          </div>
          <div className="slot-marker" />
          {landed && <div className="slot-flash" />}
          {landed && (
            <div className="slot-rays">
              {Array.from({ length: 12 }).map((_, i) => <span key={i} style={{ '--r': i }} />)}
            </div>
          )}
        </div>
      </div>

      {/* призовая таблица (мелко) */}
      <div className="slot-odds">
        {SLOT_ITEMS.map(it => (
          <span key={it.id} className="slot-odd" style={{ '--c': it.color }}>
            <Icon name={it.icon} size={12} /> {it.label}
          </span>
        ))}
      </div>

      {/* кнопки прокрутки */}
      <div className="slot-actions">
        <button
          className="btn good size-md"
          disabled={spinning || freeLeft <= 0}
          onClick={() => doSpin('free')}
        >
          {freeLeft > 0 ? `Бесплатно (${freeLeft})` : 'Нет бесплатных'}
        </button>
        <button
          className="btn size-md"
          disabled={spinning || tokens < SLOT_COST_TOKENS}
          onClick={() => doSpin('tokens')}
        >
          <Icon name="star" size={14} /> {SLOT_COST_TOKENS}
        </button>
        <button
          className="btn gem size-md"
          disabled={spinning || gems < SLOT_GEM_COST}
          onClick={() => doSpin('gems')}
        >
          <Icon name="gem" size={14} /> {SLOT_GEM_COST}
        </button>
      </div>

      <button className="btn ghost size-md block" onClick={onExit}>Назад к фестивалю</button>

      {/* карточка приза */}
      {prize && (
        <div className="reveal-overlay" onClick={() => setPrize(null)}>
          <div
            className={'summary-card rarity-' + (prize.rarity || 'epic')}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reveal-burst" />
            <div className="reveal-ttl">Выигрыш!</div>
            <PrizeBody prize={prize} />
            <button className="btn gold size-md block" onClick={() => setPrize(null)}>Забрать</button>
          </div>
        </div>
      )}
    </div>
  )
}

function PrizeBody({ prize }) {
  if (prize.kind === 'hero' && prize.hero) {
    return (
      <>
        <div className="reveal-rarity" style={{ color: RARITY_COLOR[prize.hero.rarity] }}>
          {prize.dup ? 'Дубликат героя → осколки' : 'Новый герой!'}
        </div>
        <div className="ev-prize-hero">
          <div className="ev-prize-emoji">{prize.hero.icon}</div>
          <div className="ev-prize-name">{prize.hero.name}</div>
        </div>
      </>
    )
  }
  if (prize.kind === 'gear' && prize.gearItem) {
    const it = prize.gearItem
    return (
      <>
        <div className="reveal-rarity" style={{ color: RARITY_COLOR[it.rarity] }}>Снаряжение</div>
        <div className="ev-prize-hero">
          <div className="ev-prize-emoji"><Icon name="sword" size={40} /></div>
          <div className="ev-prize-name">{it.catalogName || (it.slot + ' · ' + it.rarity)}</div>
        </div>
      </>
    )
  }
  // числовые
  const label = prize.label || 'Награда'
  return (
    <div className="summary-rewards">
      <div className="srew gold">
        <Icon name={prize.icon} size={18} />
        <div className="srew-meta">
          <span className="srew-num">+{fmt(prize.amount || 0)}</span>
          <span className="srew-name">{label}</span>
        </div>
      </div>
    </div>
  )
}
