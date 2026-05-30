import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import {
  GEAR_SLOTS, RARITY_INFO, AFFIXES, REROLL_COST,
  describeAffix, getSetDef,
} from '../data/gear.js'
import { getHero } from '../data/heroes.js'

const SLOT_LABEL = Object.fromEntries(GEAR_SLOTS.map(s => [s.id, s.label]))
const SLOT_ICON  = Object.fromEntries(GEAR_SLOTS.map(s => [s.id, s.icon]))

// Инвентарь снаряжения. Надевание происходит в карточке героя
// (HeroDetail), сюда вынесли только сумку, разбор и кузницу.
export default function GearPanel({ embedded = false, onClose }) {
  const [tab, setTab] = useState('inv')
  const [selectedId, setSelectedId] = useState(null)
  const [filterSlot, setFilterSlot] = useState('all')

  const bag = useGameStore(s => s.gearBag || [])
  const ore = useGameStore(s => s.ore || 0)
  const sell = useGameStore(s => s.sellGear)
  const reroll = useGameStore(s => s.rerollGearAffix)
  const isEquipped = useGameStore(s => s.isGearEquipped)

  const selected = bag.find(g => g.id === selectedId) || null

  const filtered = filterSlot === 'all' ? bag : bag.filter(g => g.slot === filterSlot)

  const body = (
    <div className="gear-scroll">
      <div className="gear-tabs">
        <button className={'raid-tab' + (tab === 'inv' ? ' active' : '')} onClick={() => setTab('inv')}>Инвентарь</button>
        <button className={'raid-tab' + (tab === 'forge' ? ' active' : '')} onClick={() => setTab('forge')}>Кузница</button>
      </div>

      {tab === 'inv' && (
        <>
          {/* Фильтр по слоту */}
          <div className="filter-row" style={{ padding: 0 }}>
            <button className={'filter-btn' + (filterSlot === 'all' ? ' active' : '')} onClick={() => setFilterSlot('all')}>Все</button>
            {GEAR_SLOTS.map(s => (
              <button
                key={s.id}
                className={'filter-btn' + (filterSlot === s.id ? ' active' : '')}
                onClick={() => setFilterSlot(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="hint" style={{ marginTop: 8 }}>
              Снаряжение выпадает с боссов мира, рейдов и подземелья.
              Надеть его можно в карточке героя (раздел «Герои»).
            </div>
          ) : (
            <div className="gear-bag">
              {filtered.map(item => {
                const owner = isEquipped(item.id)
                const ownerHero = owner ? getHero(owner.heroId) : null
                return (
                  <button
                    key={item.id}
                    className={'gear-card rarity-' + item.rarity + (selectedId === item.id ? ' selected' : '') + (owner ? ' equipped' : '')}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="gear-card-head">
                      <div className="gear-card-slot"><Icon name={SLOT_ICON[item.slot]} size={18} /></div>
                      <div className="gear-card-rar">{RARITY_INFO[item.rarity]?.label}</div>
                    </div>
                    <div className="gear-card-name">{SLOT_LABEL[item.slot]}</div>
                    <ul className="gear-card-affixes">
                      {item.affixes.map((af, i) => <li key={i}>{describeAffix(af)}</li>)}
                    </ul>
                    {item.setId && (
                      <div className="gear-card-set" style={{ color: getSetDef(item.setId)?.color }}>
                        сет: {getSetDef(item.setId)?.name}
                      </div>
                    )}
                    {ownerHero && (
                      <div className="gear-card-set" style={{ color: 'var(--text-dim)' }}>
                        надет: {ownerHero.name}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'forge' && (
        <ForgeTab
          item={selected}
          ore={ore}
          onReroll={(idx) => reroll(selected.id, idx)}
        />
      )}

      {selected && (
        <div className="gear-actions-bar">
          <div className="gear-actions-name">
            {RARITY_INFO[selected.rarity]?.label} · {SLOT_LABEL[selected.slot]}
          </div>
          <button
            className="btn ghost size-sm"
            onClick={() => { sell(selected.id); setSelectedId(null) }}
          >
            Разобрать
          </button>
        </div>
      )}
    </div>
  )

  if (embedded) return body

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Снаряжение</h2>
        <span className="panel-sub"><Icon name="ore" size={12} /> {ore}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>
      {body}
    </section>
  )
}

function ForgeTab({ item, ore, onReroll }) {
  if (!item) {
    return (
      <div className="gear-forge-empty">
        Выбери предмет в инвентаре, чтобы перебросить аффикс за руду.
      </div>
    )
  }
  const cost = REROLL_COST[item.rarity] || 50
  return (
    <div className="gear-forge">
      <div className="gear-section-title">Перековка</div>
      <div className="gear-forge-card">
        <div className="gear-forge-head">
          <span className={'gear-forge-rar rar-' + item.rarity}>{RARITY_INFO[item.rarity]?.label}</span>
          <span>{SLOT_LABEL[item.slot]}</span>
        </div>
        <ul className="gear-forge-list">
          {item.affixes.map((af, i) => (
            <li key={i} className="gear-forge-row">
              <span>{describeAffix(af)}</span>
              <button
                className="btn gold size-sm"
                disabled={ore < cost}
                onClick={() => onReroll(i)}
                title={`Стоимость: ${cost} руды`}
              >
                <Icon name="ore" size={12} /> {cost}
              </button>
            </li>
          ))}
        </ul>
        <div className="hint">
          Каждое перековывание заменит этот аффикс на случайный другой.
        </div>
      </div>
    </div>
  )
}
