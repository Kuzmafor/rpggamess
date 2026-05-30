import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'
import { MODIFIER_INFO } from '../data/tower.js'
import { TOWER_BUFFS } from '../data/towerChests.js'

export default function TowerHud() {
  const tower = useGameStore(s => s.tower || {})
  const exit = useGameStore(s => s.exitTower)
  const mods = useGameStore(s => s.getTowerModifiers())
  const pickChest = useGameStore(s => s.applyTowerChestPick)
  if (!tower.run) return null

  const ps = tower.powerShards || 0
  const checkpoint = tower.checkpoint || 1
  const buffs = tower.run.buffs || []
  const chest = tower.run.pendingChest

  return (
    <>
      <div className="tower-hud">
        <div className="tower-hud-row">
          <div className="tower-hud-floor">
            <Icon name="bolt" size={14} />
            <span>Этаж <b>{tower.floor}</b></span>
          </div>
          <div className="tower-hud-stats">
            <span title="Частицы силы">✦ {fmt(ps)}</span>
            <span title="Чек-поинт">⛳ {checkpoint}</span>
          </div>
          <button className="btn ghost size-sm" onClick={exit}>Выйти</button>
        </div>
        {(mods.length > 0 || buffs.length > 0) && (
          <div className="tower-hud-mods">
            {mods.map(id => (
              <span key={id} className="tower-mod-chip" title={MODIFIER_INFO[id]?.desc}>
                ⚠ {MODIFIER_INFO[id]?.name || id}
              </span>
            ))}
            {buffs.map((b, i) => (
              <span key={i} className="tower-buff-chip" title={b.desc}>
                ✦ {b.name}
              </span>
            ))}
          </div>
        )}
      </div>
      {chest && <ChestPicker options={chest} onPick={pickChest} />}
    </>
  )
}

function ChestPicker({ options, onPick }) {
  return (
    <div className="reveal-overlay">
      <div className="chest-picker" onClick={(e) => e.stopPropagation()}>
        <div className="syn-modal-tag">🎁 Сундук этажа</div>
        <div className="syn-modal-title">Выбери один бонус</div>
        <div className="chest-list">
          {options.map(opt => (
            <button
              key={opt.id}
              className="chest-opt"
              onClick={() => onPick(opt.id)}
            >
              <div className="chest-opt-name">{opt.name}</div>
              <div className="chest-opt-desc">{opt.desc}</div>
            </button>
          ))}
        </div>
        <div className="hint">Бонус действует до конца забега. Выйдешь — баффы пропадут, чек-поинт сохранится.</div>
      </div>
    </div>
  )
}
