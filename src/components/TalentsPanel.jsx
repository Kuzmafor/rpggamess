import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { TALENT_BRANCHES } from '../data/talents.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'

export default function TalentsPanel({ onClose, embedded = false }) {
  const points = useGameStore(s => s.talentPoints || 0)
  const earned = useGameStore(s => s.talentEarned || 0)
  const upgrade = useGameStore(s => s.upgradeTalent)
  const canUpgrade = useGameStore(s => s.canUpgradeTalent)
  const level = useGameStore(s => s.talentLevel)
  const reset = useGameStore(s => s.resetTalents)
  const [branch, setBranch] = useState(TALENT_BRANCHES[0].id)

  const cur = TALENT_BRANCHES.find(b => b.id === branch) || TALENT_BRANCHES[0]

  const body = (
    <>
      <div className="filter-row">
        {TALENT_BRANCHES.map(b => (
          <button
            key={b.id}
            className={'filter-btn' + (b.id === branch ? ' active' : '')}
            onClick={() => setBranch(b.id)}
            style={{ '--ac': b.color }}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="talents-scroll">
        <div className="talent-branch-head" style={{ '--ac': cur.color }}>
          <div className="branch-icon"><Icon name={cur.icon} size={22} /></div>
          <div>
            <div className="branch-title">{cur.label}</div>
            <div className="branch-desc">{cur.desc}</div>
          </div>
        </div>

        <div className="talent-list">
          {cur.nodes.map(node => {
            const lv = level(cur.id, node.id)
            const max = node.max || 1
            const ok = canUpgrade(cur.id, node.id)
            const lockedByPrev = !!node.requires && level(cur.id, node.requires) <= 0
            return (
              <div key={node.id} className={'talent-card' + (lv >= max ? ' done' : '') + (lockedByPrev ? ' locked' : '')}>
                <div className="t-num">{lv}/{max}</div>
                <div className="t-meta">
                  <div className="t-name">{node.label}</div>
                  <div className="t-desc">{describeEffect(node)}</div>
                  {node.requires && lockedByPrev && (
                    <div className="t-req">Требуется: {labelOf(cur, node.requires)}</div>
                  )}
                </div>
                <button
                  className="btn gold size-sm"
                  disabled={!ok}
                  onClick={() => upgrade(cur.id, node.id)}
                  title={`Стоимость: ${node.cost || 1} очк.`}
                >
                  {lv >= max ? 'Макс.' : `Прокачать · ${node.cost || 1}`}
                </button>
              </div>
            )
          })}
        </div>

        <div className="talent-footer">
          <button
            className="btn ghost size-sm"
            onClick={() => {
              if (confirm('Сбросить все таланты? Стоимость: 50💎 (или 1 душа). Очки вернутся.')) {
                reset(false)
              }
            }}
          >
            Сбросить таланты
          </button>
        </div>
      </div>
    </>
  )

  if (embedded) return body

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Таланты</h2>
        <span className="panel-sub">Очки: {points} · Всего получено: {earned}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>
      {body}
    </section>
  )
}

function describeEffect(node) {
  const parts = []
  if (node.tap)     parts.push(`+${pct(node.tap)} к урону тапа`)
  if (node.dmg)     parts.push(`+${pct(node.dmg)} к урону`)
  if (node.gold)    parts.push(`+${pct(node.gold)} к золоту`)
  if (node.crit)    parts.push(`+${pct(node.crit)} к криту`)
  if (node.rage)    parts.push(`+${pct(node.rage)} к ярости`)
  if (node.ore)     parts.push(`+${pct(node.ore)} к добыче руды`)
  if (node.weapon)  parts.push(`+${pct(node.weapon)} к множителю оружия`)
  if (node.offline) parts.push(`+${pct(node.offline)} к оффлайн-доходу`)
  return parts.join(' · ')
}

function pct(v) {
  return Math.round(v * 100) + '%'
}

function labelOf(branch, nodeId) {
  const n = branch.nodes.find(x => x.id === nodeId)
  return n ? n.label : nodeId
}
