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
  mythic: 'Мифический',
  premium: 'Премиум',
}
const RARITY_COLOR = {
  common: '#c8cee8',
  rare: '#67d6ff',
  epic: '#a072ff',
  legendary: '#ffd166',
  mythic: '#ff5470',
  premium: '#ff8edb',
}
// Порядок редкости (выше — лучше) для сортировки.
const RARITY_RANK = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4, premium: 5 }

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

  // Сортировка и фильтр каталога.
  const [sort, setSort] = useState('rarity')  // rarity | rarity_asc | name
  const [filter, setFilter] = useState('all')  // all | owned | missing | shop

  const order = ['premium', 'mythic', 'legendary', 'epic', 'rare', 'common']
  const total = WEAPON_CATALOG.length
  const owned = WEAPON_CATALOG.filter(w => ownedIds.has(w.id)).length

  // Применяем фильтр.
  let list = WEAPON_CATALOG.filter(w => {
    if (filter === 'owned')   return ownedIds.has(w.id)
    if (filter === 'missing') return !ownedIds.has(w.id)
    if (filter === 'shop')    return !!w.inShop
    return true
  })

  // Группировка по редкости (для режима rarity) или плоский отсортированный список.
  const grouped = sort === 'name'
    ? null
    : (() => {
        const ord = sort === 'rarity_asc' ? [...order].reverse() : order
        return ord.map(r => ({ r, items: list.filter(w => w.rarity === r) })).filter(g => g.items.length)
      })()
  const flat = sort === 'name'
    ? [...list].sort((a, b) => a.name.localeCompare(b.name))
    : null

  return (
    <div className="catalog-scroll">
      <div className="hint" style={{ marginTop: 4 }}>
        Найдено: <b>{owned}</b> / {total}. Оружие выпадает с боссов мира,
        из рейдов, подземелья и сундуков. Часть редких видов также продаётся
        в Магазине за алмазы.
      </div>

      {/* Сортировка и фильтр */}
      <div className="cat-controls">
        <div className="cat-control-group">
          <span className="cat-control-label">Сорт.</span>
          <button className={'cat-chip' + (sort === 'rarity' ? ' active' : '')} onClick={() => setSort('rarity')}>Редкость ↓</button>
          <button className={'cat-chip' + (sort === 'rarity_asc' ? ' active' : '')} onClick={() => setSort('rarity_asc')}>Редкость ↑</button>
          <button className={'cat-chip' + (sort === 'name' ? ' active' : '')} onClick={() => setSort('name')}>По имени</button>
        </div>
        <div className="cat-control-group">
          <span className="cat-control-label">Фильтр</span>
          <button className={'cat-chip' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>Все</button>
          <button className={'cat-chip' + (filter === 'owned' ? ' active' : '')} onClick={() => setFilter('owned')}>Найдено</button>
          <button className={'cat-chip' + (filter === 'missing' ? ' active' : '')} onClick={() => setFilter('missing')}>Нет</button>
          <button className={'cat-chip' + (filter === 'shop' ? ' active' : '')} onClick={() => setFilter('shop')}>В магазине</button>
        </div>
      </div>

      {flat && (
        <div className="weapons-grid">
          {flat.map(w => <WeaponCatalogCard key={w.id} w={w} have={ownedIds.has(w.id)} />)}
          {flat.length === 0 && <div className="hint">Ничего не найдено по фильтру.</div>}
        </div>
      )}

      {grouped && grouped.map(({ r, items }) => (
        <section key={r} className="cat-section">
          <header className="cat-head">
            <span className={'chip rar-' + r} style={{ color: RARITY_COLOR[r] }}>
              {RARITY_LABEL[r]}
            </span>
            <span className="cat-count">{items.filter(w => ownedIds.has(w.id)).length} / {items.length}</span>
          </header>
          <div className="weapons-grid">
            {items.map(w => <WeaponCatalogCard key={w.id} w={w} have={ownedIds.has(w.id)} />)}
          </div>
        </section>
      ))}
      {grouped && grouped.length === 0 && <div className="hint">Ничего не найдено по фильтру.</div>}
    </div>
  )
}

// Карточка оружия в каталоге.
function WeaponCatalogCard({ w, have }) {
  return (
    <div
      className={'weapon-shop-card rarity-' + w.rarity + (have ? '' : ' locked')}
      style={{ '--ac': RARITY_COLOR[w.rarity] }}
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
