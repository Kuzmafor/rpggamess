import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'
import EventScene from '../assets/EventScene.jsx'
import EventJumpGame from './EventJumpGame.jsx'
import EventSlotMachine from './EventSlotMachine.jsx'
import { EVENT_NAME, EVENT_DESC } from '../data/event.js'

function fmtLeft(ms) {
  if (ms <= 0) return 'завершено'
  const totalMin = Math.floor(ms / 60000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d}д ${h}ч`
  if (h > 0) return `${h}ч ${m}м`
  return `${m}м`
}

// Вкладка-обзор: трек наград + переход к активностям.
function Overview({ onGo }) {
  const status = useGameStore(s => s.eventStatus())
  const milestones = useGameStore(s => s.eventMilestones())
  const claim = useGameStore(s => s.eventClaimMilestone)
  const jumpBest = useGameStore(s => s.event?.jump?.best || 0)
  const freeLeft = useGameStore(s => s.eventSlotFreeLeft())
  const jumpLeft = useGameStore(s => s.eventJumpAttemptsLeft())
  const [popup, setPopup] = useState(null)

  function handleClaim(idx) {
    const r = claim(idx)
    if (r.ok) setPopup(r)
  }

  // прогресс к следующему незабранному порогу
  const total = status.totalTokens
  const nextM = milestones.find(m => !m.reached) || milestones[milestones.length - 1]
  const prevNeed = (() => {
    const reachedNeeds = milestones.filter(m => m.reached).map(m => m.need)
    return reachedNeeds.length ? Math.max(...reachedNeeds) : 0
  })()
  const span = Math.max(1, nextM.need - prevNeed)
  const pct = Math.max(0, Math.min(100, ((total - prevNeed) / span) * 100))

  return (
    <div className="ev-overview">
      <div className="ev-banner">
        <div className="ev-banner-glow" />
        <h2 className="ev-title">{EVENT_NAME}</h2>
        <p className="ev-desc">{EVENT_DESC}</p>
        <div className="ev-timer"><Icon name="clock" size={14} /> До конца: <b>{fmtLeft(status.msLeft)}</b></div>
        <div className="ev-tokens-big">
          <Icon name="star" size={22} />
          <span>{fmt(status.tokens)}</span>
          <small>звёздной пыли</small>
        </div>
      </div>

      {/* активности */}
      <div className="ev-activities">
        <button className="ev-act-card jump" onClick={() => onGo('jump')}>
          <div className="ev-act-icon"><Icon name="bolt" size={26} /></div>
          <div className="ev-act-meta">
            <span className="ev-act-name">Прыжки по руинам</span>
            <span className="ev-act-sub">Рекорд: {jumpBest} · попыток: {jumpLeft}</span>
          </div>
          <span className="ev-act-arrow">›</span>
        </button>
        <button className="ev-act-card slot" onClick={() => onGo('slot')}>
          <div className="ev-act-icon"><Icon name="star" size={26} /></div>
          <div className="ev-act-meta">
            <span className="ev-act-name">Звёздный автомат</span>
            <span className="ev-act-sub">{freeLeft > 0 ? 'Есть бесплатная прокрутка!' : 'За пыль или гемы'}</span>
          </div>
          <span className="ev-act-arrow">›</span>
        </button>
      </div>

      {/* трек наград */}
      <div className="ev-track-head">
        <span>Награды фестиваля</span>
        <span className="ev-track-prog">{fmt(total)} / {fmt(nextM.need)}</span>
      </div>
      <div className="ev-track-bar"><div className="ev-track-fill" style={{ width: pct + '%' }} /></div>

      <div className="ev-milestones">
        {milestones.map(m => (
          <div key={m.idx} className={'ev-ms' + (m.reached ? ' reached' : '') + (m.claimed ? ' claimed' : '')}>
            <div className="ev-ms-need"><Icon name="star" size={12} /> {fmt(m.need)}</div>
            <div className="ev-ms-label">{m.label}</div>
            <div className="ev-ms-rewards">
              {m.reward.gold ? <span><Icon name="gold" size={11} /> {fmt(m.reward.gold)}</span> : null}
              {m.reward.gems ? <span><Icon name="gem" size={11} /> {m.reward.gems}</span> : null}
              {m.reward.ore ? <span><Icon name="ore" size={11} /> {m.reward.ore}</span> : null}
              {m.reward.shards ? <span><Icon name="artifact" size={11} /> {m.reward.shards}</span> : null}
              {m.reward.eggs ? <span><Icon name="paw" size={11} /> {m.reward.eggs}</span> : null}
              {m.reward.gear ? <span><Icon name="sword" size={11} /> {m.reward.gear}</span> : null}
              {m.reward.hero ? <span><Icon name="hero" size={11} /> герой</span> : null}
            </div>
            <button
              className={'btn size-sm ev-ms-btn' + (m.canClaim ? ' gold' : '')}
              disabled={!m.canClaim}
              onClick={() => handleClaim(m.idx)}
            >
              {m.claimed ? <Icon name="check" size={14} /> : m.reached ? 'Забрать' : <Icon name="lock" size={14} />}
            </button>
          </div>
        ))}
      </div>

      {popup && (
        <div className="reveal-overlay" onClick={() => setPopup(null)}>
          <div className="summary-card rarity-legendary" onClick={(e) => e.stopPropagation()}>
            <div className="reveal-burst" />
            <div className="reveal-ttl">{popup.label}</div>
            <div className="summary-rewards">
              {popup.granted.gold ? <div className="srew gold"><Icon name="gold" size={18} /><div className="srew-meta"><span className="srew-num">+{fmt(popup.granted.gold)}</span><span className="srew-name">Золото</span></div></div> : null}
              {popup.granted.gems ? <div className="srew gear"><Icon name="gem" size={18} /><div className="srew-meta"><span className="srew-num">+{popup.granted.gems}</span><span className="srew-name">Гемы</span></div></div> : null}
              {popup.granted.ore ? <div className="srew ore"><Icon name="ore" size={18} /><div className="srew-meta"><span className="srew-num">+{popup.granted.ore}</span><span className="srew-name">Руда</span></div></div> : null}
              {popup.granted.shards ? <div className="srew shards"><Icon name="artifact" size={18} /><div className="srew-meta"><span className="srew-num">+{popup.granted.shards}</span><span className="srew-name">Осколки</span></div></div> : null}
              {popup.granted.hero ? <div className="srew gear"><span style={{ fontSize: 22 }}>{popup.granted.hero.icon}</span><div className="srew-meta"><span className="srew-num">{popup.granted.dup ? 'дубль' : 'новый'}</span><span className="srew-name">{popup.granted.hero.name}</span></div></div> : null}
            </div>
            <button className="btn gold size-md block" onClick={() => setPopup(null)}>Принять</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function EventPanel({ onClose, embedded = false }) {
  const [view, setView] = useState('overview') // overview | jump | slot
  const ensureEvent = useGameStore(s => s._ensureEvent)

  useEffect(() => { ensureEvent() }, [ensureEvent])

  if (embedded) {
    return (
      <div className="event-embed">
        <EventScene variant={view} />
        <div className="event-body">
          {view === 'overview' && <Overview onGo={setView} />}
          {view === 'jump' && <EventJumpGame onExit={() => setView('overview')} />}
          {view === 'slot' && <EventSlotMachine onExit={() => setView('overview')} />}
        </div>
      </div>
    )
  }

  return (
    <section className="panel event-panel">
      <EventScene variant={view} />
      <div className="panel-head event-head">
        <h2>Событие</h2>
        <span className="panel-sub">Лимит 7 дней</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="event-body">
        {view === 'overview' && <Overview onGo={setView} />}
        {view === 'jump' && <EventJumpGame onExit={() => setView('overview')} />}
        {view === 'slot' && <EventSlotMachine onExit={() => setView('overview')} />}
      </div>
    </section>
  )
}
