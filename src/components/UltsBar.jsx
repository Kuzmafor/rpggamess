import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { getHero } from '../data/heroes.js'
import { Hero } from '../assets/sprites.jsx'

export default function UltsBar() {
  const party = useGameStore(s => s.party)
  const cast  = useGameStore(s => s.castUlt)
  const isReady = useGameStore(s => s.isUltReady)
  const cdLeft = useGameStore(s => s.ultCooldownLeft)
  const [, setTick] = useState(0)

  // обновляем для прогресса кулдауна
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 250)
    return () => clearInterval(id)
  }, [])

  if (!party.length) return null

  return (
    <div className="ults-bar">
      {party.slice(0, 5).map(id => {
        const hero = getHero(id)
        if (!hero || !hero.ult) return <div key={id} className="ult-slot empty" />
        const ready = isReady(id)
        const cd = cdLeft(id)
        const total = (hero.ult.cd || 20) * 1000
        const pct = Math.max(0, Math.min(100, ((total - cd) / total) * 100))
        return (
          <button
            key={id}
            className={'ult-slot role-' + hero.role + (ready ? ' ready' : '')}
            onClick={() => cast(id)}
            disabled={!ready}
            title={hero.ult.name}
          >
            <Hero role={hero.role} size={28} />
            {!ready && (
              <span className="ult-cd">
                {cd > 0 ? Math.ceil(cd / 1000) + 'с' : ''}
              </span>
            )}
            <span className="ult-progress" style={{ height: pct + '%' }} />
          </button>
        )
      })}
    </div>
  )
}
