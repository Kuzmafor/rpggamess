import React from 'react'
import { ARTIFACTS, artifactBonus, artifactUpgradeCost, constellationLevel } from '../data/artifacts.js'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'

const STAT_LABEL = {
  dmg: 'Урон отряда',
  hp:  'HP отряда',
  gold:'Золото',
  crit:'Шанс крита',
  rage:'Прирост ярости',
  all: 'Все статы',
}

export default function ArtifactsPanel({ onClose, embedded = false }) {
  const shards = useGameStore(s => s.artifactShards)
  const levels = useGameStore(s => s.artifactLevels)
  const upgrade = useGameStore(s => s.upgradeArtifact)

  const body = (
    <>
      <div className="art-grid">
        {ARTIFACTS.map(a => {
          const lv = levels[a.id] || 0
          const next = lv + 1
          const cost = artifactUpgradeCost(next)
          const cur = artifactBonus(a, lv)
          const upd = artifactBonus(a, next)
          const canBuy = shards >= cost
          return (
            <div key={a.id} className="art-card" style={{ '--ac': a.color }}>
              <div className="art-head">
                <div className="art-icon"><Icon name={a.icon} size={28} /></div>
                <div className="art-meta">
                  <div className="art-name">{a.name}</div>
                  <div className="art-stat">{STAT_LABEL[a.stat]}</div>
                </div>
                <div className="art-lvl">ур. {lv}</div>
              </div>
              <div className="art-desc">{a.desc}</div>
              {constellationLevel(lv) > 0 && (
                <div className="art-constellation">
                  {Array.from({ length: constellationLevel(lv) }, (_, i) => (
                    <span key={i}>★</span>
                  ))}
                  <span className="art-c-tag">созвездие · +{constellationLevel(lv) * 20}%</span>
                </div>
              )}
              <div className="art-current">
                {lv > 0 ? <>Сейчас: <b>+{(cur * 100).toFixed(1)}%</b></> : <span style={{opacity:.7}}>Не активен</span>}
                <span style={{ opacity: 0.7 }}>→ <b>+{(upd * 100).toFixed(1)}%</b></span>
              </div>
              <button className="btn gold size-md block" disabled={!canBuy} onClick={() => upgrade(a.id)}>
                <Icon name="artifact" size={14} /> {cost} осколков · {lv === 0 ? 'Активировать' : 'Прокачать'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="hint">
        Осколки выпадают в подземельях и иногда приходят почтой. Выберите 1–2 артефакта и качайте — стэки сильные.
      </div>
    </>
  )

  if (embedded) return body

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Артефакты</h2>
        <span className="panel-sub"><Icon name="artifact" size={12} /> {shards} осколков</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>
      {body}
    </section>
  )
}
