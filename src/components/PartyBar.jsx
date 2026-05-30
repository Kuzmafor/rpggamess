import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { getHero } from '../data/heroes.js'
import { Hero } from '../assets/sprites.jsx'
import { fmt } from '../utils/fmt.js'

export default function PartyBar() {
  const party = useGameStore(s => s.party)
  const heroLevels = useGameStore(s => s.heroLevels)
  const partySize = useGameStore(s => s.partySize())
  // подписки для пересчёта
  useGameStore(s => s.weaponTier)
  useGameStore(s => s.unlockedHeroes)
  useGameStore(s => s.superActive)
  useGameStore(s => s.stage)
  const getAtk = useGameStore(s => s.getHeroAtk)
  const isReady = useGameStore(s => s.isUltReady)
  const cdLeft = useGameStore(s => s.ultCooldownLeft)
  const cast = useGameStore(s => s.castUlt)

  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 250)
    return () => clearInterval(id)
  }, [])

  const slots = []
  for (let i = 0; i < partySize; i++) {
    const id = party[i]
    if (!id) {
      slots.push(<div key={'empty-' + i} className="party-slot empty">＋</div>)
      continue
    }
    const hero = getHero(id)
    if (!hero) {
      slots.push(<div key={'empty-' + i} className="party-slot empty">？</div>)
      continue
    }
    const lvl = heroLevels[id] || 1
    const dmg = getAtk(id)
    const ready = isReady(id)
    const cd = cdLeft(id)
    const total = (hero.ult?.cd || 20) * 1000
    const pct = Math.max(0, Math.min(100, ((total - cd) / total) * 100))

    slots.push(
      <button
        key={id}
        className={'party-slot role-' + hero.role + (ready ? ' ult-ready' : '')}
        onClick={() => cast(id)}
        disabled={!ready}
        title={hero.ult?.name || 'Ультимейт'}
      >
        {/* Заполнение снизу вверх по кулдауну */}
        <span
          className="ult-fill"
          style={{ height: pct + '%' }}
          aria-hidden
        />

        <Hero role={hero.role} size={36} />
        <span className="lvl">ур.{lvl}</span>
        <span className="dmg">{fmt(dmg)}</span>

        {ready && <span className="ult-ready-glow" aria-hidden />}
      </button>
    )
  }

  return <div className="party-bar">{slots}</div>
}
