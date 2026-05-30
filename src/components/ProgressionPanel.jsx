import React, { useState } from 'react'
import { Icon } from '../assets/Icon.jsx'
import { useGameStore } from '../store/useGameStore.js'
import ArtifactsPanel from './ArtifactsPanel.jsx'
import TalentsPanel from './TalentsPanel.jsx'
import PrestigePanel from './PrestigePanel.jsx'
import GearPanel from './GearPanel.jsx'

// Объединённый раздел "Прокачка": Артефакты + Таланты + Реинкарнация
// в трёх вкладках одной панели.
const TABS = [
  { id: 'artifacts', label: 'Артефакты' },
  { id: 'gear',      label: 'Снаряжение' },
  { id: 'talents',   label: 'Таланты' },
  { id: 'prestige',  label: 'Реинкарнация' },
]

export default function ProgressionPanel({ onClose, initialTab = 'artifacts' }) {
  const [tab, setTab] = useState(
    TABS.some(t => t.id === initialTab) ? initialTab : 'artifacts',
  )

  // Бейджи на табах
  const shards = useGameStore(s => s.artifactShards || 0)
  const tp = useGameStore(s => s.talentPoints || 0)
  const canPrestige = useGameStore(s => s.canPrestige())
  const prestigeCount = useGameStore(s => s.prestigeCount || 0)
  const bagSize = useGameStore(s => (s.gearBag || []).length)
  const ore = useGameStore(s => s.ore || 0)

  // Подзаголовок зависит от активной вкладки
  let sub = null
  if (tab === 'artifacts') {
    sub = <><Icon name="artifact" size={12} /> {shards} осколков</>
  } else if (tab === 'gear') {
    sub = <><Icon name="ore" size={12} /> {ore} · {bagSize} в сумке</>
  } else if (tab === 'talents') {
    sub = <>Очки талантов: {tp}</>
  } else if (tab === 'prestige') {
    sub = <>Реинкарнаций: {prestigeCount}</>
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Прокачка</h2>
        <span className="panel-sub">{sub}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="raid-tabs">
        {TABS.map(t => {
          let bubble = null
          if (t.id === 'artifacts' && shards > 0) bubble = <span className="bubble pale">{shards}</span>
          if (t.id === 'gear' && bagSize > 0)     bubble = <span className="bubble pale">{bagSize}</span>
          if (t.id === 'talents' && tp > 0)        bubble = <span className="bubble pale">{tp}</span>
          if (t.id === 'prestige' && canPrestige)  bubble = <span className="bubble">!</span>
          return (
            <button
              key={t.id}
              className={'raid-tab' + (tab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
            >
              {t.label}{bubble}
            </button>
          )
        })}
      </div>

      {tab === 'artifacts' && <ArtifactsPanel embedded onClose={onClose} />}
      {tab === 'gear'      && <GearPanel      embedded onClose={onClose} />}
      {tab === 'talents'   && <TalentsPanel   embedded onClose={onClose} />}
      {tab === 'prestige'  && <PrestigePanel  embedded onClose={onClose} />}
    </section>
  )
}
