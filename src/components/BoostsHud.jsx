import React, { useEffect, useState } from 'react'
import { useGameStore, BOOSTS } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'

const ACTIVE = [
  { type: 'dmg',  icon: 'rocket', accent: '#ff7a2a' },
  { type: 'gold', icon: 'gold',   accent: '#ffd166' },
]

function fmtLeft(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function BoostsHud({ onOpenShop }) {
  const boosts = useGameStore(s => s.boosts) || {}
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 250)
    return () => clearInterval(id)
  }, [])

  const now = Date.now()
  const items = ACTIVE.map(it => {
    const until = it.type === 'dmg' ? boosts.dmgBoostUntil : boosts.goldBoostUntil
    const left = (until || 0) - now
    if (left <= 0) return null
    const def = BOOSTS[it.type]
    const total = (def?.duration || 300) * 1000
    const pct = Math.max(0, Math.min(100, ((total - left) / total) * 100))
    return { ...it, left, pct }
  }).filter(Boolean)

  if (!items.length) return null

  return (
    <div className="boost-stack">
      {items.map(it => (
        <button
          key={it.type}
          className="boost-mini"
          style={{ '--bc': it.accent }}
          onClick={() => onOpenShop?.()}
          title="Продлить буст"
        >
          <span className="bm-ico"><Icon name={it.icon} size={12} /></span>
          <span className="bm-mult">×2</span>
          <span className="bm-time">{fmtLeft(it.left)}</span>
          <span className="bm-progress">
            <span className="bm-bar" style={{ width: it.pct + '%' }} />
          </span>
        </button>
      ))}
    </div>
  )
}
