import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'

export default function TopBar({ onMenu }) {
  const gold = useGameStore(s => s.gold)
  const gems = useGameStore(s => s.gems)
  const unread = useGameStore(s => s.mail.filter(m => !m.claimed).length)

  return (
    <header className="topbar">
      <div className="resource">
        <Icon name="gold" size={14} /><span className="r-num">{fmt(gold)}</span>
      </div>
      <div className="resource">
        <Icon name="gem" size={14} /><span className="r-num">{fmt(gems)}</span>
      </div>

      <button className="burger-btn" onClick={onMenu} aria-label="Меню">
        <Icon name="menu" size={18} />
        {unread > 0 && <span className="bubble small">{unread}</span>}
      </button>
    </header>
  )
}
