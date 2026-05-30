import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { ZONES, ZONE_BOSSES } from '../data/enemies.js'
import { Sprite } from '../assets/sprites.jsx'
import { Icon } from '../assets/Icon.jsx'

/**
 * Карта мира — 20 зон плитками. Открывается по нажатию на надпись зоны.
 *
 * Состояния:
 *  - cleared: текущая зона больше — значит пройдена
 *  - current: текущая зона — анимированная подсветка и прогресс волн
 *  - locked:  не открыта
 *
 * По нажатию на пройденную зону можно "перейти" к её 1-й волне
 * (полезно покопить золото / порубить ровно ту зону).
 */
export default function ZonesMapPanel({ onClose }) {
  const stage = useGameStore(s => s.stage)
  const maxStage = useGameStore(s => Math.max(s.stage, s.maxStage || s.stage))
  const wave  = useGameStore(s => s.wave)
  const jump  = useGameStore(s => s.jumpToZone)

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Карта мира</h2>
        <span className="panel-sub">{Math.max(0, maxStage - 1)} / {ZONES.length} зон пройдено</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="zones-grid">
        {ZONES.map((name, i) => {
          const zoneId = i + 1
          const cleared = zoneId < maxStage && zoneId !== stage
          const current = zoneId === stage
          const locked  = zoneId > maxStage
          const canVisit = zoneId <= maxStage && zoneId !== stage
          const boss = ZONE_BOSSES[(zoneId - 1) % ZONE_BOSSES.length]
          const tier = Math.floor((zoneId - 1) / 5)
          const wavesPct = current ? Math.round(((wave - 1) / 10) * 100) : (zoneId < maxStage ? 100 : 0)

          return (
            <button
              key={zoneId}
              className={'zone-tile' + (cleared ? ' cleared' : '') + (current ? ' current' : '') + (locked ? ' locked' : '') + (' tier-' + tier)}
              disabled={!canVisit}
              onClick={() => {
                if (canVisit) {
                  jump(zoneId, 1)
                  onClose()
                }
              }}
            >
              <div className="zone-art">
                <Sprite name={boss.sprite} size={68} />
                <span className="zone-num">{zoneId}</span>
                {locked && <span className="zone-overlay lock"><Icon name="lock" size={22} /></span>}
                {cleared && <span className="zone-overlay check"><Icon name="check" size={22} /></span>}
                {current && <span className="zone-overlay current-pulse"><Icon name="bolt" size={22} /></span>}
              </div>
              <div className="zone-info">
                <div className="zone-tag">Зона {zoneId}</div>
                <div className="zone-name">{name}</div>
                <div className="zone-progress">
                  <div className="zone-progress-bar" style={{ width: wavesPct + '%' }} />
                  <span>
                    {current && `Волна ${wave}/10 · здесь`}
                    {!current && cleared && 'Пройдено'}
                    {!current && locked && 'Закрыто'}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="hint">
        Нажмите на любую открытую зону, чтобы перейти к её первой волне. Прогресс не сбрасывается.
      </div>
    </section>
  )
}
