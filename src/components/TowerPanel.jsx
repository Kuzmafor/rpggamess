import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'
import { TOWER, MODIFIER_INFO, modifiersAt } from '../data/tower.js'

export default function TowerPanel({ onClose, embedded = false }) {
  const tower = useGameStore(s => s.tower || {})
  const enter = useGameStore(s => s.enterTower)
  const inRun = !!tower.run

  const checkpoint = tower.checkpoint || 1
  const previewMods = modifiersAt(checkpoint).concat(modifiersAt(Math.max(checkpoint, checkpoint + 50)))
  const seenIds = Array.from(new Set(previewMods))

  const body = (
    <div className="tower-body">
        <div className="tower-card">
          <div className="tower-row">
            <span className="tower-label">Чек-поинт</span>
            <span className="tower-val">этаж <b>{checkpoint}</b></span>
          </div>
          <div className="tower-row">
            <span className="tower-label">Частицы силы</span>
            <span className="tower-val">✦ <b>{fmt(tower.powerShards || 0)}</b></span>
          </div>
          <div className="tower-row">
            <span className="tower-label">Чек-поинты</span>
            <span className="tower-val">каждые {TOWER.checkpointEvery} этажей</span>
          </div>
          <div className="tower-row">
            <span className="tower-label">Модификаторы</span>
            <span className="tower-val">с этажа 100, каждые 100</span>
          </div>
          <div className="tower-row">
            <span className="tower-label">Осколки героев</span>
            <span className="tower-val">с этажа {TOWER.ascendDropFrom}+ (шанс)</span>
          </div>
        </div>

        {seenIds.length > 0 && (
          <>
            <div className="tower-section-title">Модификаторы на старте</div>
            <div className="tower-mods">
              {seenIds.map(id => {
                const info = MODIFIER_INFO[id]
                if (!info) return null
                return (
                  <div key={id} className="tower-mod">
                    <div className="tower-mod-name">{info.name}</div>
                    <div className="tower-mod-desc">{info.desc}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="tower-actions">
          <button className="btn neon size-md block" onClick={() => { enter(); onClose?.() }} disabled={inRun}>
            {inRun ? 'Башня уже идёт' : `Войти с этажа ${checkpoint}`}
          </button>
        </div>

        <div className="hint">
          В башне один враг на этаж. Выходишь — чек-поинт сохраняется.
          Проиграть нельзя: можно выйти и вернуться. Лучший этаж недели сбрасывается каждый понедельник.
        </div>
    </div>
  )

  if (embedded) return body

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Бесконечная башня</h2>
        <span className="panel-sub">Лучший: <b>{tower.bestFloor || 0}</b> · На неделе: <b>{tower.bestThisWeek || 0}</b></span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>
      {body}
    </section>
  )
}
