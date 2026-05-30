import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'
import { CITY_BUILDINGS, buildingValue, getCityBonuses } from '../data/city.js'

export default function CityPanel({ onClose }) {
  const cityLevels = useGameStore(s => s.cityLevels || {})
  const gold = useGameStore(s => s.gold)
  const ore = useGameStore(s => s.ore || 0)
  const maxLevel = useGameStore(s => s.cityMaxLevel())
  const upgrade = useGameStore(s => s.upgradeBuilding)

  const totals = getCityBonuses(cityLevels)
  const totalLvl = CITY_BUILDINGS.reduce((a, b) => a + (cityLevels[b.id] || 0), 0)

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Город</h2>
        <span className="panel-sub">Развитие: ур. {totalLvl}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="city-scroll">
        {/* Сводка пассивов */}
        <div className="city-summary">
          <div className="city-summary-title">Активные бонусы города</div>
          <div className="city-summary-list">
            {totals.oresPerSec > 0 && <span>⛏ {totals.oresPerSec.toFixed(2)} руды/сек</span>}
            {totals.gold > 0 && <span>🪙 +{Math.round(totals.gold * 100)}% золота</span>}
            {totals.dmg > 0 && <span>⚔ +{Math.round(totals.dmg * 100)}% урона</span>}
            {totals.expedSpeed > 0 && <span>🏛 −{Math.round(totals.expedSpeed * 100)}% экспед.</span>}
            {totals.shardChance > 0 && <span>🔮 +{Math.round(totals.shardChance * 100)}% осколков</span>}
            {totals.offline > 0 && <span>🍺 +{Math.round(totals.offline * 100)}% оффлайн</span>}
            {totalLvl === 0 && <span className="muted">Постройте здания, чтобы получить пассивы.</span>}
          </div>
        </div>

        <div className="city-grid">
          {CITY_BUILDINGS.map(b => {
            const lvl = cityLevels[b.id] || 0
            const maxed = lvl >= maxLevel
            const cost = b.cost(lvl + 1)
            const canBuy = !maxed && gold >= cost.gold && ore >= cost.ore
            const curVal = buildingValue(b, lvl)
            const nextVal = buildingValue(b, lvl + 1)
            return (
              <div key={b.id} className="city-card" style={{ '--ac': b.color }}>
                <div className="city-card-head">
                  <div className="city-ico">{b.icon}</div>
                  <div className="city-card-meta">
                    <div className="city-name">{b.name}</div>
                    <div className="city-lvl">ур. {lvl}{maxed ? ' · макс' : ` / ${maxLevel}`}</div>
                  </div>
                </div>
                <div className="city-desc">{b.desc}</div>
                <div className="city-effect">
                  <span className="city-effect-now">{b.fmtValue(lvl, curVal)}</span>
                  {!maxed && (
                    <span className="city-effect-next">→ {b.fmtValue(lvl + 1, nextVal)}</span>
                  )}
                </div>
                <button
                  className="btn gold size-sm block"
                  disabled={!canBuy}
                  onClick={() => upgrade(b.id)}
                >
                  {maxed ? (
                    'Максимум'
                  ) : (
                    <>
                      <Icon name="gold" size={12} /> {fmt(cost.gold)}
                      <span className="city-cost-sep">·</span>
                      <Icon name="ore" size={12} /> {cost.ore}
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <div className="hint">
          Максимальный уровень зданий растёт по мере прохождения зон. Рудник
          добывает руду даже когда игра закрыта.
        </div>
      </div>
    </section>
  )
}
