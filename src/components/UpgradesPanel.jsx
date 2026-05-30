import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'

export default function UpgradesPanel({ onClose }) {
  const gold = useGameStore(s => s.gold)
  const tapLevel = useGameStore(s => s.tapLevel)
  const passiveLevel = useGameStore(s => s.passiveLevel)
  const tapCost = useGameStore(s => s.upgradeTapCost())
  const passiveCost = useGameStore(s => s.upgradePassiveCost())
  const upTap = useGameStore(s => s.upgradeTap)
  const upPas = useGameStore(s => s.upgradePassive)
  const reset = useGameStore(s => s.hardReset)

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Прокачка</h2>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="upgrade-list">
        <div className="upgrade-row">
          <Icon name="bolt" size={28} />
          <div className="u-body">
            <div className="u-name">Сила удара</div>
            <div className="u-meta">Уровень {tapLevel}. Каждый уровень +1.6 к базовому урону.</div>
          </div>
          <button className="btn gold size-md" disabled={gold < tapCost} onClick={upTap}>
            <Icon name="gold" size={14} /> {fmt(tapCost)}
          </button>
        </div>

        <div className="upgrade-row">
          <Icon name="chart" size={28} />
          <div className="u-body">
            <div className="u-name">Пассивный DPS</div>
            <div className="u-meta">Уровень {passiveLevel}. Союзники бьют врагов без тапов.</div>
          </div>
          <button className="btn gold size-md" disabled={gold < passiveCost} onClick={upPas}>
            <Icon name="gold" size={14} /> {fmt(passiveCost)}
          </button>
        </div>

        <div className="upgrade-row danger">
          <Icon name="close" size={28} />
          <div className="u-body">
            <div className="u-name">Сброс прогресса</div>
            <div className="u-meta">Удалит сохранение и начнёт игру заново.</div>
          </div>
          <button
            className="btn danger size-md"
            onClick={() => { if (confirm('Точно сбросить прогресс?')) reset() }}
          >
            Сбросить
          </button>
        </div>
      </div>
    </section>
  )
}
