import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Sprite } from '../assets/sprites.jsx'

export default function StageInfo({ onOpenMap }) {
  const stage = useGameStore(s => s.stage)
  const wave = useGameStore(s => s.wave)
  const enemies = useGameStore(s => s.enemies)
  const targetIdx = useGameStore(s => s.targetIdx)
  const zoneName = useGameStore(s => s.getZoneName())
  const ng = useGameStore(s => s.ngLevel || 0)

  if (!enemies?.length) return null
  const target = enemies[Math.min(targetIdx, enemies.length - 1)]
  const totalMax = enemies.reduce((a, e) => a + e.maxHp, 0)
  const totalHp  = enemies.reduce((a, e) => a + Math.max(0, e.hp), 0)
  const pct = Math.max(0, Math.min(100, (totalHp / totalMax) * 100))
  const isBoss = enemies.some(e => e.isBoss)

  return (
    <div className="stage-info">
      <button
        type="button"
        className="stage-name stage-name-btn"
        onClick={onOpenMap}
        title="Открыть карту мира"
      >
        {ng > 0 && <span className="ng-tag">Виток {ng + 1}</span>}
        {zoneName} <span className="map-chevron">›</span>
      </button>
      <div className="stage-progress">
        <span className="wave">
          Волна {wave} / 10 · враги: {enemies.filter(e => e.hp > 0).length} / {enemies.length}
        </span>
        <div className="hp-wrap">
          <div className="hp-bar" style={{ width: pct + '%' }} />
          <span className="hp-text">{fmt(totalHp)} / {fmt(totalMax)}</span>
        </div>
        <span className={'enemy-name' + (isBoss ? ' boss' : '')}>
          <span className="sprite-wrap" style={{ width: 18, height: 18 }}>
            <Sprite name={target.sprite} size={18} />
          </span>
          {target.name}{isBoss ? ' (БОСС)' : ''}
        </span>
      </div>
    </div>
  )
}
