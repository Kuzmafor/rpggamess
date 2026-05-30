import React, { useState } from 'react'
import { Icon } from '../assets/Icon.jsx'
import { useGameStore } from '../store/useGameStore.js'
import TowerPanel from './TowerPanel.jsx'
import DungeonPanel from './DungeonPanel.jsx'

// Объединённый раздел "Испытания": Башня + Подземелье в табах.
const TABS = [
  { id: 'tower',   label: 'Башня' },
  { id: 'dungeon', label: 'Подземелье' },
]

export default function ChallengesPanel({ onClose, initialTab = 'tower' }) {
  const [tab, setTab] = useState(
    TABS.some(t => t.id === initialTab) ? initialTab : 'tower',
  )

  const tower = useGameStore(s => s.tower || {})

  // Подзаголовок зависит от вкладки
  let sub = null
  if (tab === 'tower') {
    sub = <>Лучший: <b>{tower.bestFloor || 0}</b> · На неделе: <b>{tower.bestThisWeek || 0}</b></>
  } else if (tab === 'dungeon') {
    sub = 'Главы и стадии'
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Испытания</h2>
        <span className="panel-sub">{sub}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="raid-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={'raid-tab' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tower'   && <TowerPanel   embedded onClose={onClose} />}
      {tab === 'dungeon' && <DungeonPanel embedded onClose={onClose} />}
    </section>
  )
}
