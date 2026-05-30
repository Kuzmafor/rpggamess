import React, { useState } from 'react'
import { WEAPONS } from '../data/weapons.js'
import { WEAPON_CATALOG } from '../data/weaponCatalog.js'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Sprite } from '../assets/sprites.jsx'
import { Icon } from '../assets/Icon.jsx'
import WeaponDetail from './WeaponDetail.jsx'
import { describeAffix } from '../data/gear.js'

const RARITY_LABEL = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
}
const RARITY_COLOR = {
  common: '#c8cee8',
  rare: '#67d6ff',
  epic: '#a072ff',
  legendary: '#ffd166',
}

export default function WeaponsPanel({ onClose }) {
  const [tab, setTab] = useState('catalog')

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Оружие</h2>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="raid-tabs">
        <button className={'raid-tab' + (tab === 'catalog' ? ' active' : '')} onClick={() => setTab('catalog')}>Каталог</button>
        <button className={'raid-tab' + (tab === 'evolve' ? ' active' : '')} onClick={() => setTab('evolve')}>Эволюция</button>
      </div>

      {tab === 'catalog' && <Catalog />}
      {tab === 'evolve' && <Evolution />}
    </section>
  )
}

/* ===================== Каталог оружия ===================== */
// Чисто коллекция: показывает все возможные варианты.
// Покупки тут нет — оружие выбивается с боссов / из сундуков.
// Уже найденные предметы помечаются «✓ Найдено».
function Catalog() {
  const bag = useGameStore(s => s.gearBag || [])
  const ownedIds = new Set(bag.map(g => g.catalogId).filter(Boolean))
  const order = ['legendary', 'epic', 'rare', 'common']
  const byRarity = order.reduce((acc, r) => {
    acc[r] = WEAPON_CATALOG.filter(w => w.rarity === r)
    return acc
  }, {})
  const total = WEAPON_CATALOG.length
  const owned = WEAPON_CATALOG.filter(w => ownedIds.has(w.id)).length

  return (
    <div className="catalog-scroll">
      <div className="hint" style={{ marginTop: 4 }}>
        Найдено: <b>{owned}</b> / {total}. Оружие выпадает с боссов мира,
        из рейдов, подземелья и сундуков. Часть редких видов также продаётся
        в Магазине за алмазы.
      </div>

      {order.map(r => {
        const list = byRarity[r] || []
        if (list.length === 0) return null
        return (
          <section key={r} className="cat-section">
            <header className="cat-head">
              <span className={'chip rar-' + r} style={{ color: RARITY_COLOR[r] }}>
                {RARITY_LABEL[r]}
              </span>
              <span className="cat-count">{list.filter(w => ownedIds.has(w.id)).length} / {list.length}</span>
            </header>
            <div className="weapons-grid">
              {list.map(w => {
                const have = ownedIds.has(w.id)
                return (
                  <div
                    key={w.id}
                    className={'weapon-shop-card rarity-' + r + (have ? '' : ' locked')}
                    style={{ '--ac': RARITY_COLOR[r] }}
                  >
                    <div className="weapon-shop-art">
                      <span className="weapon-shop-icon">{w.icon}</span>
                    </div>
                    <div className="weapon-shop-meta">
                      <div className="weapon-shop-name">
                        {w.name}
                        {have && <span className="catalog-found">✓ Найдено</span>}
                      </div>
                      <ul className="weapon-shop-affixes">
                        {w.affixes.map((af, i) => <li key={i}>{describeAffix(af)}</li>)}
                      </ul>
                      {w.inShop && (
                        <div className="catalog-shop-tag">
                          В Магазине: <Icon name="gem" size={11} /> {w.cost}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/* ===================== Эволюция ===================== */
function Evolution() {
  const tier = useGameStore(s => s.weaponTier)
  const gold = useGameStore(s => s.gold)
  const evolve = useGameStore(s => s.evolveWeapon)
  const next = WEAPONS[tier + 1]
  const [openTier, setOpenTier] = useState(null)

  return (
    <div className="weapon-evolution-wrap">
      <div className="weapon-list">
        {WEAPONS.map(w => {
          const state =
            w.tier < tier ? 'done' :
            w.tier === tier ? 'current' :
            w.tier === tier + 1 ? 'next' : 'locked'
          const canOpen = w.tier <= tier
          return (
            <div
              key={w.tier}
              className={'weapon-row state-' + state + (canOpen ? ' clickable' : '')}
              style={{ '--glow': w.glow }}
              onClick={() => canOpen && setOpenTier(w.tier)}
              role={canOpen ? 'button' : undefined}
            >
              <Sprite name={w.sprite} size={56} />
              <div className="w-body">
                <div className="w-name">{w.name}</div>
                <div className="w-stat">×{w.dmgMult} к урону</div>
              </div>
              <div className="w-action">
                {state === 'done'    && <span className="badge owned"><Icon name="check" size={12} /> Пройдено</span>}
                {state === 'current' && <span className="badge current">Сейчас</span>}
                {state === 'next' && (
                  <button
                    className="btn gold size-md"
                    disabled={gold < w.cost}
                    onClick={(e) => { e.stopPropagation(); evolve() }}
                  >
                    <Icon name="gold" size={14} /> {fmt(w.cost)}
                  </button>
                )}
                {state === 'locked'  && <span className="badge locked"><Icon name="lock" size={12} /></span>}
              </div>
            </div>
          )
        })}
      </div>

      {next && (
        <div className="hint">Следующая эволюция: <b>{next.name}</b> — урон ×{next.dmgMult}.</div>
      )}

      {openTier !== null && (
        <WeaponDetail tier={openTier} onClose={() => setOpenTier(null)} />
      )}
    </div>
  )
}
