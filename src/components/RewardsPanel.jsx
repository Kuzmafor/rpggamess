import React, { useState } from 'react'
import { Icon } from '../assets/Icon.jsx'
import { useGameStore } from '../store/useGameStore.js'
import EventPanel from './EventPanel.jsx'
import BattlePassPanel from './BattlePassPanel.jsx'
import CalendarPanel from './CalendarPanel.jsx'

// Объединённый раздел «Награды»: Событие + Battle Pass + Календарь в табах.
const TABS = [
  { id: 'event',      label: 'Событие' },
  { id: 'battlepass', label: 'Battle Pass' },
  { id: 'calendar',   label: 'Календарь' },
]

export default function RewardsPanel({ onClose, initialTab = 'event' }) {
  const [tab, setTab] = useState(
    TABS.some(t => t.id === initialTab) ? initialTab : 'event',
  )

  // бейджи-индикаторы на табах
  const eventAlert = useGameStore(s => {
    try {
      const ms = s.eventMilestones?.() || []
      if (ms.some(m => m.canClaim)) return true
      if ((s.eventSlotFreeLeft?.() || 0) > 0) return true
      if ((s.eventJumpAttemptsLeft?.() || 0) > 0) return true
      return false
    } catch { return false }
  })
  const bpUnclaimed = useGameStore(s => {
    const bp = s.bp || {}
    const lvl = bp.level || 0
    if (!lvl) return 0
    let c = 0
    for (let i = 1; i <= lvl; i++) {
      if (!(bp.claimedFree || []).includes(i)) c++
      if (bp.premium && !(bp.claimedPremium || []).includes(i)) c++
    }
    return c
  })
  const calClaim = useGameStore(s => s.canClaimToday())

  const alerts = { event: eventAlert, battlepass: bpUnclaimed > 0, calendar: calClaim }

  return (
    <section className="panel rewards-panel">
      <div className="panel-head">
        <h2>Награды</h2>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="raid-tabs rewards-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={'raid-tab' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {alerts[t.id] && <span className="tab-dot" />}
          </button>
        ))}
      </div>

      <div className="rewards-body">
        {tab === 'event'      && <EventPanel      embedded onClose={onClose} />}
        {tab === 'battlepass' && <BattlePassPanel embedded onClose={onClose} />}
        {tab === 'calendar'   && <CalendarPanel   embedded onClose={onClose} />}
      </div>
    </section>
  )
}
