import React from 'react'
import { Icon } from '../assets/Icon.jsx'

const TABS = [
  { id: 'battle',   icon: 'tabBattle',   label: 'Бой' },
  { id: 'heroes',   icon: 'tabHeroes',   label: 'Герои' },
  { id: 'weapons',  icon: 'tabWeapons',  label: 'Оружие' },
  { id: 'raids',    icon: 'tabRaids',    label: 'Рейды' },
  { id: 'pets',     icon: 'paw',         label: 'Питомцы' },
]

export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="bottombar">
      {TABS.map(t => (
        <button
          key={t.id}
          className={'tab-btn' + (tab === t.id ? ' active' : '')}
          onClick={() => setTab(t.id)}
        >
          <Icon name={t.icon} size={22} />
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
