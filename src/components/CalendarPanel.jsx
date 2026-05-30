import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { CALENDAR_REWARDS, CALENDAR_DAYS } from '../data/calendar.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'

export default function CalendarPanel({ onClose, embedded = false }) {
  const streak = useGameStore(s => s.loginCalendar?.streak || 0)
  const claimable = useGameStore(s => s.canClaimToday())
  const claim = useGameStore(s => s.claimCalendarDay)
  const next = useGameStore(s => s.nextCalendarDay())
  const [popup, setPopup] = useState(null)

  function handleClaim() {
    const r = claim()
    if (r.ok) setPopup(r.def)
  }

  const body = (
    <div className="cal-body">
      <div className="cal-controls">
        <div className="cal-tip">
          {claimable
            ? <>Сегодняшняя награда: <b>День {next}</b></>
            : streak >= CALENDAR_DAYS
              ? <>Календарь полностью пройден!</>
              : <>Возвращайтесь завтра за следующей наградой</>
          }
        </div>
        <button className="btn gold size-md" disabled={!claimable} onClick={handleClaim}>
          Забрать
        </button>
      </div>

      <div className="cal-grid">
        {CALENDAR_REWARDS.map(d => {
          const claimed = d.day <= streak
          const isToday = claimable && d.day === next
          const isFinal = d.day === CALENDAR_DAYS
          const isMilestone = d.milestone === 'epic' || isFinal
          return (
            <div
              key={d.day}
              className={'cal-cell' + (claimed ? ' claimed' : '') + (isToday ? ' today' : '') + (isMilestone ? ' big' : '') + (isFinal ? ' legendary' : '')}
            >
              <div className="cal-day">День {d.day}</div>
              <div className="cal-icon">
                {isFinal
                  ? <Icon name="chest" size={28} />
                  : isMilestone
                    ? <Icon name="gift" size={24} />
                    : <Icon name="gold" size={20} />}
              </div>
              <div className="cal-rewards">
                {d.gold ? <span><Icon name="gold" size={10} /> {fmt(d.gold)}</span> : null}
                {d.gems ? <span><Icon name="gem" size={10} /> {d.gems}</span> : null}
                {d.shards ? <span><Icon name="artifact" size={10} /> {d.shards}</span> : null}
                {d.ore ? <span><Icon name="ore" size={10} /> {d.ore}</span> : null}
              </div>
              {claimed && <div className="cal-mark"><Icon name="check" size={12} /></div>}
            </div>
          )
        })}
      </div>

      <div className="hint">Награды приходят в Почту. Заберите их там, чтобы прибавить к ресурсам.</div>
    </div>
  )

  const popupEl = popup && (
    <div className="reveal-overlay" onClick={() => setPopup(null)}>
      <div className={'summary-card rarity-' + (popup.day === CALENDAR_DAYS ? 'legendary' : 'epic')} onClick={(e) => e.stopPropagation()}>
        <div className="reveal-burst" />
        <div className="reveal-ttl">День {popup.day}</div>
        <div className="reveal-rarity">{popup.label}</div>
        <div className="summary-rewards">
          {popup.gold ? <div className="srew gold"><Icon name="gold" size={18} /><div className="srew-meta"><span className="srew-num">+{fmt(popup.gold)}</span><span className="srew-name">Золото</span></div></div> : null}
          {popup.ore ? <div className="srew ore"><Icon name="ore" size={18} /><div className="srew-meta"><span className="srew-num">+{popup.ore}</span><span className="srew-name">Руда</span></div></div> : null}
          {popup.shards ? <div className="srew shards"><Icon name="artifact" size={18} /><div className="srew-meta"><span className="srew-num">+{popup.shards}</span><span className="srew-name">Осколки</span></div></div> : null}
        </div>
        <button className="btn gold size-md block" onClick={() => setPopup(null)}>Принять</button>
      </div>
    </div>
  )

  if (embedded) {
    return (
      <>
        <div className="cal-embed-sub">Стрик: <b>{streak}</b> / {CALENDAR_DAYS}</div>
        {body}
        {popupEl}
      </>
    )
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Календарь логинов</h2>
        <span className="panel-sub">Стрик: {streak} / {CALENDAR_DAYS}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>
      {body}
      {popupEl}
    </section>
  )
}
