import React, { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import StatsModal from './StatsModal.jsx'
import { HERO_BONDS } from '../data/progression.js'

// Подробные описания каждой синергии — что и почему даёт.
const SYNERGY_INFO = {
  frontline: {
    title: 'Парный фронт',
    cond: '2 героя ближнего боя + 1 маг в отряде',
    bonus: '+10% урона всему отряду',
    why: 'Танки сдерживают строй, маг бьёт сверху — классическая прокачка урона связки.',
  },
  rainbow: {
    title: 'Радуга стихий',
    cond: '5 разных стихий в отряде (огонь / лёд / молния / яд / свет / тьма)',
    bonus: '+10% к общему урону',
    why: 'Универсальный состав: всегда найдёшь стихию против любого моба и босса.',
  },
  support_pact: {
    title: 'Союз поддержки',
    cond: '1 герой роли «Поддержка» при полном отряде из 5',
    bonus: '+5% к получаемому золоту',
    why: 'Поддержка — экономика отряда, она увеличивает добычу.',
  },
}

function infoFor(syn) {
  if (SYNERGY_INFO[syn.id]) return SYNERGY_INFO[syn.id]
  // Динамические синергии — kin_<role> и swarm_<element>
  if (syn.id.startsWith('kin_')) {
    const role = syn.id.replace('kin_', '')
    const map = { melee: 'ближнего боя', ranged: 'стрелков', mage: 'магов', support: 'поддержки' }
    return {
      title: 'Сплочённость',
      cond: `3+ героя ${map[role] || role} в отряде`,
      bonus: '+15% скорости атак отряду',
      why: 'Однородный отряд лучше срабатывается и атакует чаще.',
    }
  }
  if (syn.id.startsWith('swarm_')) {
    const el = syn.id.replace('swarm_', '')
    const ELS = { fire: 'огонь', ice: 'лёд', lightning: 'молния', poison: 'яд', light: 'свет', dark: 'тьма' }
    return {
      title: 'Стихийный рой',
      cond: `4+ героя одной стихии (${ELS[el] || el})`,
      bonus: '+12% урона стихией, +5% к шансу статус-эффекта',
      why: 'Концентрация одной стихии перегружает врага и быстрее накладывает ожог/заморозку/яд.',
    }
  }
  if (syn.id.startsWith('bond_')) {
    const bid = syn.id.replace('bond_', '')
    const def = HERO_BONDS.find(b => b.id === bid)
    if (def) {
      return {
        title: def.name,
        cond: `Связь героев: ${def.heroes.join(' + ')}`,
        bonus: def.desc,
        why: 'Связи героев — особые комбинации, которые срабатывают, если оба героя в отряде.',
      }
    }
  }
  return { title: syn.name || syn.id, cond: '', bonus: syn.desc || '', why: '' }
}

export default function SynergyStrip() {
  // подписки на состав чтобы пересчитываться при смене партии и звёзд
  useGameStore(s => s.party)
  useGameStore(s => s.heroStars)
  const syn = useGameStore(s => s.getSynergyBonuses())
  const autoUlt = useGameStore(s => !!s.settings?.autoUlt)
  const setSetting = useGameStore(s => s.setSetting)
  const toast = useGameStore(s => s._toast)
  const speedBoostUntil = useGameStore(s => s.boosts?.speedBoostUntil || 0)
  const speedBoostMult = useGameStore(s => s.boosts?.speedBoostMult || 2)
  const gems = useGameStore(s => s.gems)
  const buySpeedBoost = useGameStore(s => s.buySpeedBoost)

  // тикалка: пока буст активен — обновляем UI раз в секунду
  const [, forceTick] = useState(0)
  const speedActive = speedBoostUntil > Date.now()
  useEffect(() => {
    if (!speedActive) return
    const id = setInterval(() => forceTick(v => v + 1), 1000)
    return () => clearInterval(id)
  }, [speedActive, speedBoostUntil])

  function fmtLeft(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000))
    const m = Math.floor(s / 60)
    const sec = s % 60
    if (m > 0) return `${m}:${String(sec).padStart(2, '0')}`
    return `${sec}c`
  }

  const SPEED_COST = 200
  const SPEED_MULT = 2
  const SPEED_MS = 15 * 60 * 1000

  const [openSyn, setOpenSyn] = useState(null)
  const [openStats, setOpenStats] = useState(false)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [speedPos, setSpeedPos] = useState(null) // {top, right}
  const speedWrapRef = useRef(null)
  const speedPopRef = useRef(null)

  function toggleSpeed() {
    if (speedOpen) {
      setSpeedOpen(false)
      return
    }
    const btn = speedWrapRef.current
    if (btn) {
      const r = btn.getBoundingClientRect()
      // Привязываемся к правому краю кнопки, поповер выпадает вниз
      setSpeedPos({
        top: r.bottom + 8,
        right: Math.max(8, window.innerWidth - r.right),
      })
    }
    setSpeedOpen(true)
  }

  // Закрытие поповера по клику вне (поповер теперь рендерится в fixed,
  // поэтому проверяем И кнопку, И сам поповер)
  useEffect(() => {
    if (!speedOpen) return
    function onDocPointer(e) {
      const inBtn = speedWrapRef.current?.contains(e.target)
      const inPop = speedPopRef.current?.contains(e.target)
      if (!inBtn && !inPop) setSpeedOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointer)
    return () => document.removeEventListener('pointerdown', onDocPointer)
  }, [speedOpen])

  function buyWithGems() {
    const ok = buySpeedBoost?.('gems', { cost: SPEED_COST, mult: SPEED_MULT, durationMs: SPEED_MS })
    if (ok) setSpeedOpen(false)
  }
  function watchAd() {
    // Демо без реального SDK — просто включаем
    const ok = buySpeedBoost?.('ad', { mult: SPEED_MULT, durationMs: SPEED_MS })
    if (ok) setSpeedOpen(false)
  }

  // Долгий тап (~480ms) открывает модалку. Короткий тап тоже открывает —
  // в мобильной игре проще «тап = инфа», без долгого удержания.
  const holdRef = useRef(null)

  function onPress(s) {
    clearTimeout(holdRef.current)
    holdRef.current = setTimeout(() => setOpenSyn(s), 1)
  }
  function onCancel() {
    clearTimeout(holdRef.current)
  }

  return (
    <>
      <div className="synergy-strip">
        <button
          className="stats-btn"
          title="Все активные бонусы"
          onClick={() => setOpenStats(true)}
        >
          📊 Навыки
        </button>
        <button
          className={'auto-ult-btn' + (autoUlt ? ' on' : '')}
          title={autoUlt ? 'Авто-ульт включён' : 'Включить авто-ульт'}
          onClick={() => setSetting('autoUlt', !autoUlt)}
        >
          <span className={'auto-ult-ring' + (autoUlt ? ' spinning' : '')} aria-hidden />
          <span className="auto-ult-icon">⚡</span>
          <span className="auto-ult-label">Авто</span>
        </button>
        <div className="speed-btn-wrap" ref={speedWrapRef}>
          <button
            className={
              'auto-ult-btn speed-btn' +
              (speedOpen ? ' on' : '') +
              (speedActive ? ' active' : '')
            }
            title={speedActive
              ? `Скорость x${speedBoostMult} активна`
              : 'Ускорить бой'}
            onClick={toggleSpeed}
          >
            <span className="auto-ult-icon">🚀</span>
            <span className="auto-ult-label">
              {speedActive
                ? `x${speedBoostMult} · ${fmtLeft(speedBoostUntil - Date.now())}`
                : 'Скорость'}
            </span>
          </button>
        </div>
        {syn?.id?.map(s => (
          <button
            key={s.id}
            className="syn-chip"
            title={s.desc}
            onClick={() => setOpenSyn(s)}
            onPointerDown={() => onPress(s)}
            onPointerUp={onCancel}
            onPointerLeave={onCancel}
            onPointerCancel={onCancel}
          >
            ⚡ {s.name}
          </button>
        ))}
      </div>
      {openSyn && <SynergyModal syn={openSyn} onClose={() => setOpenSyn(null)} />}
      {openStats && <StatsModal onClose={() => setOpenStats(false)} />}
      {speedOpen && speedPos && (
        <div
          ref={speedPopRef}
          className="speed-pop"
          role="dialog"
          style={{ top: speedPos.top, right: speedPos.right }}
        >
          <div className="speed-pop-title">
            Ускорение боя ×{SPEED_MULT}
          </div>
          <div className="speed-pop-sub">
            {speedActive
              ? `Активно ещё ${fmtLeft(speedBoostUntil - Date.now())}`
              : `${SPEED_MS / 60000} минут`}
          </div>
          <button
            className="btn neon size-sm block"
            disabled={gems < SPEED_COST}
            onClick={buyWithGems}
          >
            💎 {SPEED_COST}
          </button>
          <button className="btn ghost size-sm block" onClick={watchAd}>
            📺 Реклама
          </button>
        </div>
      )}
    </>
  )
}

function SynergyModal({ syn, onClose }) {
  const info = infoFor(syn)
  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div className="syn-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn raid-info-close" onClick={onClose}><Icon name="close" size={16} /></button>
        <div className="syn-modal-tag">⚡ Синергия отряда</div>
        <div className="syn-modal-title">{info.title}</div>

        <div className="syn-modal-row">
          <span className="syn-modal-label">Условие</span>
          <span className="syn-modal-val">{info.cond || '—'}</span>
        </div>
        <div className="syn-modal-row">
          <span className="syn-modal-label">Бонус</span>
          <span className="syn-modal-val">{info.bonus}</span>
        </div>
        {info.why && (
          <div className="syn-modal-why">{info.why}</div>
        )}
      </div>
    </div>
  )
}
