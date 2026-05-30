import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { getHero } from '../data/heroes.js'
import { getAwakeningPaths, MAX_STARS, starShardCost, starGoldCost, AWAKENING_LEVEL } from '../data/progression.js'
import { ELEMENTS } from '../data/elements.js'
import { fmt } from '../utils/fmt.js'
import { Hero } from '../assets/sprites.jsx'
import { Icon } from '../assets/Icon.jsx'
import {
  GEAR_SLOTS, RARITY_INFO, AFFIXES, describeAffix, getSetDef,
} from '../data/gear.js'
import { getEvolvedUlt } from '../data/heroes.js'
import { SIX_STAR_MYTHIC_SHARDS, SIX_STAR_ORE_COST } from '../data/progression.js'

const ROLE_LABEL = {
  melee: 'Ближний', ranged: 'Стрелок', mage: 'Маг', support: 'Поддержка',
}

export default function HeroDetail({ heroId, onClose }) {
  const hero = getHero(heroId)
  const stars = useGameStore(s => s.heroStars?.[heroId] || 0)
  const shards = useGameStore(s => s.heroShards?.[heroId] || 0)
  const awake = useGameStore(s => s.heroAwake?.[heroId] || null)
  const lvl = useGameStore(s => s.heroLevels?.[heroId] || 1)
  const gold = useGameStore(s => s.gold)
  const ascend = useGameStore(s => s.ascendHero)
  const awaken = useGameStore(s => s.awakenHero)
  const canAwaken = useGameStore(s => s.canAwaken(heroId))
  const dmg = useGameStore(s => s.getHeroAtk(heroId))
  const masteryProgress = useGameStore(s => s.heroMasteryProgress(heroId))
  // gear
  const heroSlots = useGameStore(s => (s.gearEquipped || {})[heroId] || {})
  const bag = useGameStore(s => s.gearBag || [])
  const equip = useGameStore(s => s.equipGearOn)
  const unequip = useGameStore(s => s.unequipHeroSlot)
  const [pickerSlot, setPickerSlot] = useState(null) // открывает выбор предмета

  if (!hero) return null

  const elem = hero.element ? ELEMENTS[hero.element] : null
  const needShards = stars < MAX_STARS ? starShardCost(stars) : 0
  const needGold   = stars < MAX_STARS ? starGoldCost(hero, stars) : 0
  // Дополнительные требования при ascending 5→6
  const isSixStarUp = stars === 5
  const ore = useGameStore.getState().ore || 0
  const totalMythicShards = useGameStore(s =>
    Object.entries(s.heroShards || {}).reduce((sum, [hid, n]) => {
      const h = getHero(hid)
      return sum + (h?.rarity === 'mythic' ? (n || 0) : 0)
    }, 0)
  )
  const canAscendCheck = useGameStore(s => s.canAscend(heroId))
  const evolvedUlt = stars >= 6 ? getEvolvedUlt(hero.role) : null

  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div className="hero-detail" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn raid-info-close" onClick={onClose}><Icon name="close" size={16} /></button>

        <div className="hd-art">
          <div className="ri-glow" />
          <Hero role={hero.role} size={130} />
        </div>

        <div className="hd-name">{hero.name}</div>
        <div className="hd-meta">
          <span>{ROLE_LABEL[hero.role]}</span>
          {elem && <span style={{ color: elem.color }}> · {elem.icon} {elem.name}</span>}
          <span> · ур. {lvl}</span>
        </div>

        <div className="hd-stars">
          {Array.from({ length: MAX_STARS }, (_, i) => (
            <span key={i} className={'star' + (i < stars ? ' on' : '')}>★</span>
          ))}
        </div>

        <div className="hd-stats">
          <div className="hd-stat">
            <Icon name="sword" size={14} />
            <span><b>{fmt(dmg)}</b> урон/удар</span>
          </div>
          <div className="hd-stat">
            <Icon name="bolt" size={14} />
            <span><b>{hero.speed}</b> уд/сек</span>
          </div>
        </div>

        {/* Mastery */}
        <div className="hd-section-title">Мастерство</div>
        <div className="hd-mastery">
          <div className="hd-mastery-head">
            <span className="hd-m-lvl">ур. <b>{masteryProgress.level}</b></span>
            <span className="hd-m-bonus">
              +{(masteryProgress.level * 0.5).toFixed(1)}% урона · +{(masteryProgress.level * 0.2).toFixed(1)}% скорости
            </span>
          </div>
          <div className="hd-mastery-bar">
            <div
              className="hd-mastery-fill"
              style={{ width: Math.min(100, (masteryProgress.cur / masteryProgress.need) * 100) + '%' }}
            />
            <span className="hd-mastery-text">
              {masteryProgress.cur}/{masteryProgress.need} ударов
            </span>
          </div>
          <div className="hd-mastery-hint">Каждый удар героя в бою повышает мастерство.</div>
        </div>

        {/* Снаряжение героя */}
        <div className="hd-section-title">Снаряжение</div>
        <div className="hd-gear-grid">
          {GEAR_SLOTS.map(slot => {
            const itemId = heroSlots[slot.id]
            const item = bag.find(g => g.id === itemId)
            return (
              <button
                key={slot.id}
                className={'hd-gear-slot' + (item ? ' filled rarity-' + item.rarity : '')}
                onClick={() => setPickerSlot(slot.id)}
              >
                <Icon name={slot.icon} size={18} />
                <div className="hd-gear-slot-meta">
                  <span className="hd-gear-slot-name">{slot.label}</span>
                  {item ? (
                    <span className="hd-gear-slot-rar">{RARITY_INFO[item.rarity]?.label}</span>
                  ) : (
                    <span className="hd-gear-slot-rar dim">пусто</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Ascension */}
        <div className="hd-section-title">Звёзды</div>
        <div className="hd-ascend">
          <div className="hd-ascend-info">
            <div>Осколки: <b>{shards}</b>{stars < MAX_STARS && <> / <b>{needShards}</b></>}</div>
            {stars < MAX_STARS && <div>Стоимость: <Icon name="gold" size={12} /> <b>{fmt(needGold)}</b></div>}
            {isSixStarUp && (
              <>
                <div>Осколки мифика: <b>{totalMythicShards}</b> / <b>{SIX_STAR_MYTHIC_SHARDS}</b></div>
                <div>Руда: <b>{fmt(ore)}</b> / <b>{fmt(SIX_STAR_ORE_COST)}</b></div>
                <div style={{ color: '#ffd166' }}>5★ → 6★ — Пробуждённая форма + новая ульта</div>
              </>
            )}
          </div>
          <button
            className="btn neon size-md"
            disabled={!canAscendCheck}
            onClick={() => ascend(heroId)}
          >
            {stars >= MAX_STARS
              ? 'Максимум'
              : stars === 5
                ? 'Пробудить ★6'
                : `+1 ★ (${stars}→${stars+1})`}
          </button>
        </div>

        {evolvedUlt && (
          <div className="hd-evolved-ult">
            <span className="hd-aw-tag">★6 Ульта</span>
            <b>{evolvedUlt.name}</b> — {evolvedUlt.desc}
          </div>
        )}

        {/* Awakening */}
        <div className="hd-section-title">Пробуждение</div>
        {!awake && lvl < AWAKENING_LEVEL && (
          <div className="hd-locked">Доступно с уровня {AWAKENING_LEVEL}. Сейчас: {lvl}</div>
        )}
        {!awake && lvl >= AWAKENING_LEVEL && (
          <div className="hd-awaken-grid">
            {getAwakeningPaths(hero.role).map(p => (
              <button
                key={p.id}
                className="hd-awaken-card"
                onClick={() => awaken(heroId, p.id)}
                disabled={!canAwaken}
              >
                <div className="hd-aw-name">{p.name}</div>
                <div className="hd-aw-desc">{p.desc}</div>
              </button>
            ))}
          </div>
        )}
        {awake && (
          <div className="hd-awaken-active">
            <span className="hd-aw-tag">Активно</span>
            {(() => {
              const p = getAwakeningPaths(hero.role).find(x => x.id === awake)
              return p ? <><b>{p.name}</b> — {p.desc}</> : <b>{awake}</b>
            })()}
          </div>
        )}
      </div>

      {pickerSlot && (
        <GearPicker
          heroId={heroId}
          slot={pickerSlot}
          currentId={heroSlots[pickerSlot]}
          onClose={() => setPickerSlot(null)}
          onEquip={(itemId) => { equip(heroId, itemId); setPickerSlot(null) }}
          onUnequip={() => { unequip(heroId, pickerSlot); setPickerSlot(null) }}
        />
      )}
    </div>
  )
}

function GearPicker({ heroId, slot, currentId, onClose, onEquip, onUnequip }) {
  const bag = useGameStore(s => s.gearBag || [])
  const equippedMap = useGameStore(s => s.gearEquipped || {})
  // Какие предметы из этого слота сейчас занят и кем
  function whoHas(itemId) {
    for (const hid of Object.keys(equippedMap)) {
      const slots = equippedMap[hid] || {}
      for (const sl of Object.keys(slots)) {
        if (slots[sl] === itemId) return { heroId: hid, slot: sl }
      }
    }
    return null
  }
  const items = bag.filter(g => g.slot === slot)

  const slotDef = GEAR_SLOTS.find(s => s.id === slot)

  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div className="gear-picker" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn raid-info-close" onClick={onClose}><Icon name="close" size={16} /></button>
        <div className="syn-modal-tag">{slotDef?.label || slot}</div>
        <div className="syn-modal-title">Выбери предмет</div>

        {currentId && (
          <button className="btn ghost size-sm block" onClick={onUnequip}>Снять текущий</button>
        )}

        {items.length === 0 ? (
          <div className="hint" style={{ marginTop: 12 }}>
            Подходящих предметов нет в инвентаре.
          </div>
        ) : (
          <div className="gear-picker-list">
            {items.map(item => {
              const owner = whoHas(item.id)
              const here = currentId === item.id
              return (
                <button
                  key={item.id}
                  className={'gear-card rarity-' + item.rarity + (here ? ' selected' : '')}
                  onClick={() => onEquip(item.id)}
                >
                  <div className="gear-card-head">
                    <span className="gear-card-rar">{RARITY_INFO[item.rarity]?.label}</span>
                    {item.setId && <span style={{ color: getSetDef(item.setId)?.color, fontSize: 10 }}>{getSetDef(item.setId)?.name}</span>}
                  </div>
                  <ul className="gear-card-affixes">
                    {item.affixes.map((af, i) => <li key={i}>{describeAffix(af)}</li>)}
                  </ul>
                  {here && <div className="hd-aw-tag" style={{ alignSelf: 'flex-start' }}>На герое</div>}
                  {!here && owner && <div className="gear-card-set" style={{ color: 'var(--text-dim)' }}>надет на другом герое</div>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
