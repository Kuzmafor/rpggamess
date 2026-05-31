import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'
import { CITY_BUILDINGS, buildingValue, getCityBonuses } from '../data/city.js'
import { describeAffix, RARITY_INFO } from '../data/gear.js'

const NEXT_RARITY = { common: 'rare', rare: 'epic', epic: 'legendary', legendary: 'mythic', mythic: 'premium' }
const FORGE_ORDER = ['common', 'rare', 'epic', 'legendary', 'mythic']

export default function CityPanel({ onClose }) {
  const [tab, setTab] = useState('buildings')
  const cityLevels = useGameStore(s => s.cityLevels || {})
  const totalLvl = CITY_BUILDINGS.reduce((a, b) => a + (cityLevels[b.id] || 0), 0)

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Город</h2>
        <span className="panel-sub">Развитие: ур. {totalLvl}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="raid-tabs">
        <button className={'raid-tab' + (tab === 'buildings' ? ' active' : '')} onClick={() => setTab('buildings')}>Здания</button>
        <button className={'raid-tab' + (tab === 'forge' ? ' active' : '')} onClick={() => setTab('forge')}>Кузница</button>
      </div>

      {tab === 'buildings' && <Buildings />}
      {tab === 'forge' && <Forge />}
    </section>
  )
}

/* ===================== Здания ===================== */
function Buildings() {
  const cityLevels = useGameStore(s => s.cityLevels || {})
  const gold = useGameStore(s => s.gold)
  const ore = useGameStore(s => s.ore || 0)
  const maxLevel = useGameStore(s => s.cityMaxLevel())
  const upgrade = useGameStore(s => s.upgradeBuilding)

  const totals = getCityBonuses(cityLevels)
  const totalLvl = CITY_BUILDINGS.reduce((a, b) => a + (cityLevels[b.id] || 0), 0)

  return (
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
  )
}

/* ===================== Кузница (слияние оружия) ===================== */
function Forge() {
  const bag = useGameStore(s => s.gearBag || [])
  const equipped = useGameStore(s => s.gearEquipped || {})
  const forge = useGameStore(s => s.forgeWeapons)
  const [rar, setRar] = useState('common')
  const [picked, setPicked] = useState([])
  const [result, setResult] = useState(null)

  // Какие предметы оружия надеты — их не сливаем (чтобы не снять у героя случайно).
  const equippedIds = new Set()
  for (const hid of Object.keys(equipped)) {
    const slots = equipped[hid] || {}
    if (slots.weapon) equippedIds.add(slots.weapon)
  }

  // Доступное оружие выбранной редкости (не надетое).
  const pool = bag.filter(g => g.slot === 'weapon' && g.rarity === rar && !equippedIds.has(g.id))

  function toggle(id) {
    setPicked(prev => prev.includes(id)
      ? prev.filter(x => x !== id)
      : (prev.length >= 3 ? prev : [...prev, id]))
  }

  function doForge() {
    if (picked.length < 3) return
    const r = forge(picked)
    if (r.ok) {
      setResult(r)
      setPicked([])
      setTimeout(() => setResult(null), 3500)
    }
  }

  return (
    <div className="forge-scroll">
      <div className="hint" style={{ marginTop: 4 }}>
        Объедини <b>3 одинаковых по редкости</b> предмета оружия в один предмет
        следующей редкости. Надетое оружие не используется. Аффиксы нового
        предмета — случайные.
      </div>

      {/* Выбор редкости для слияния */}
      <div className="forge-rar-row">
        {FORGE_ORDER.map(r => {
          const cnt = bag.filter(g => g.slot === 'weapon' && g.rarity === r && !equippedIds.has(g.id)).length
          return (
            <button
              key={r}
              className={'forge-rar-chip' + (rar === r ? ' active' : '')}
              style={{ '--ac': RARITY_INFO[r]?.color }}
              onClick={() => { setRar(r); setPicked([]) }}
            >
              {RARITY_INFO[r]?.label} <span className="forge-rar-cnt">{cnt}</span>
            </button>
          )
        })}
      </div>

      <div className="forge-recipe">
        <span className="forge-recipe-from" style={{ color: RARITY_INFO[rar]?.color }}>
          3× {RARITY_INFO[rar]?.label}
        </span>
        <span className="forge-recipe-arrow">→</span>
        <span className="forge-recipe-to" style={{ color: RARITY_INFO[NEXT_RARITY[rar]]?.color }}>
          1× {RARITY_INFO[NEXT_RARITY[rar]]?.label || '—'}
        </span>
      </div>

      {result && (
        <div className="forge-result">
          ✦ Создано оружие: <b style={{ color: RARITY_INFO[result.rarity]?.color }}>{RARITY_INFO[result.rarity]?.label}</b>
          {result.item?.catalogName ? ` «${result.item.catalogName}»` : ''}
        </div>
      )}

      {pool.length === 0 ? (
        <div className="hint">Нет свободного оружия этой редкости. Выбивайте оружие в боях и сундуках.</div>
      ) : (
        <div className="forge-grid">
          {pool.map(it => {
            const on = picked.includes(it.id)
            return (
              <button
                key={it.id}
                className={'forge-item rarity-' + it.rarity + (on ? ' picked' : '')}
                style={{ '--ac': RARITY_INFO[it.rarity]?.color }}
                onClick={() => toggle(it.id)}
              >
                <div className="forge-item-name">{it.catalogName || 'Оружие'}</div>
                <ul className="forge-item-affixes">
                  {(it.affixes || []).slice(0, 2).map((af, i) => <li key={i}>{describeAffix(af)}</li>)}
                </ul>
                {on && <span className="forge-item-check">✓</span>}
              </button>
            )
          })}
        </div>
      )}

      <button
        className="btn neon size-lg block forge-btn"
        disabled={picked.length < 3 || !NEXT_RARITY[rar]}
        onClick={doForge}
      >
        {NEXT_RARITY[rar]
          ? `Сковать (${picked.length}/3)`
          : 'Это максимальная редкость'}
      </button>
    </div>
  )
}
