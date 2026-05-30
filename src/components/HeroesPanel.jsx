import React, { useMemo, useRef, useState } from 'react'
import { HEROES, PREMIUM_GEM_COST } from '../data/heroes.js'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Hero } from '../assets/sprites.jsx'
import { Icon } from '../assets/Icon.jsx'
import BulkSelector from './BulkSelector.jsx'
import HeroDetail from './HeroDetail.jsx'

const RARITY_LABEL = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythic: 'Мифический',
  premium: 'Премиум',
}

const ROLE_LABEL = {
  melee: 'Ближний',
  ranged: 'Стрелок',
  mage: 'Маг',
  support: 'Поддержка',
}

// Порядок: premium / mythic — в начале (самые сильные), далее по убыванию
const RARITY_ORDER = { premium: -1, mythic: 0, legendary: 1, epic: 2, rare: 3, common: 4 }
const CATALOG_RARITIES = ['premium', 'mythic', 'legendary', 'epic', 'rare', 'common']

const MY_FILTERS = [
  { id: 'all',    label: 'Все' },
  { id: 'party',  label: 'В отряде' },
]

function bonusBadges(b) {
  const out = []
  if (b.dmg)  out.push(`Урон +${Math.round(b.dmg * 100)}%`)
  if (b.hp)   out.push(`HP +${Math.round(b.hp * 100)}%`)
  if (b.gold) out.push(`Золото +${Math.round(b.gold * 100)}%`)
  if (b.crit) out.push(`Крит +${Math.round(b.crit * 100)}%`)
  if (b.rage) out.push(`Ярость +${Math.round(b.rage * 100)}%`)
  return out.join(' · ')
}

export default function HeroesPanel({ onClose }) {
  const unlocked = useGameStore(s => s.unlockedHeroes)
  const party = useGameStore(s => s.party)
  const partySize = useGameStore(s => s.partySize())

  const [tab, setTab] = useState('mine')
  const [detailId, setDetailId] = useState(null)

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Герои</h2>
        <span className="panel-sub">Отряд: {party.length}/{partySize} · Нанято: {unlocked.length}/{HEROES.length}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="raid-tabs">
        <button className={'raid-tab' + (tab === 'mine'    ? ' active' : '')} onClick={() => setTab('mine')}>Мои</button>
        <button className={'raid-tab' + (tab === 'catalog' ? ' active' : '')} onClick={() => setTab('catalog')}>Каталог</button>
      </div>

      {tab === 'mine'    && <MyHeroes onOpenDetail={setDetailId} />}
      {tab === 'catalog' && <CatalogHeroes onOpenDetail={setDetailId} />}

      {detailId && <HeroDetail heroId={detailId} onClose={() => setDetailId(null)} />}
    </section>
  )
}

/* ============= МОИ ГЕРОИ ============= */
function MyHeroes({ onOpenDetail }) {
  const gold = useGameStore(s => s.gold)
  const unlocked = useGameStore(s => s.unlockedHeroes)
  const party = useGameStore(s => s.party)
  const heroLevels = useGameStore(s => s.heroLevels)
  const partySize = useGameStore(s => s.partySize())
  const upgradeBulk = useGameStore(s => s.upgradeHeroBulk)
  const upgradeCostBulk = useGameStore(s => s.upgradeHeroCostBulk)
  const toggleParty = useGameStore(s => s.toggleParty)
  const getHeroAtk = useGameStore(s => s.getHeroAtk)

  const [filter, setFilter] = useState('all')
  const [bulk, setBulk] = useState(1)

  const holdTimerRef = useRef(null)
  function onHoldStart(heroId) {
    clearTimeout(holdTimerRef.current)
    holdTimerRef.current = setTimeout(() => onOpenDetail(heroId), 480)
  }
  function onHoldCancel() {
    clearTimeout(holdTimerRef.current)
  }

  const list = useMemo(() => {
    let arr = HEROES.filter(h => unlocked.includes(h.id))
    if (filter === 'party') arr = arr.filter(h => party.includes(h.id))
    arr.sort((a, b) => {
      const ap = party.includes(a.id) ? 0 : 1
      const bp = party.includes(b.id) ? 0 : 1
      if (ap !== bp) return ap - bp
      const ar = RARITY_ORDER[a.rarity] ?? 9
      const br = RARITY_ORDER[b.rarity] ?? 9
      if (ar !== br) return ar - br
      return a.cost - b.cost
    })
    return arr
  }, [filter, unlocked, party])

  if (unlocked.length === 0) {
    return (
      <div className="hero-grid">
        <div className="hint" style={{ gridColumn: '1 / -1' }}>
          У тебя пока нет нанятых героев. Загляни в «Каталог», чтобы нанять первого.
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="filter-row">
        {MY_FILTERS.map(f => (
          <button
            key={f.id}
            className={'filter-btn' + (filter === f.id ? ' active' : '')}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <BulkSelector value={bulk} onChange={setBulk} />
        </div>
      </div>

      <div className="hero-grid">
        {list.map(h => {
          const inParty = party.includes(h.id)
          const lvl = heroLevels[h.id] || 1
          const upCost = upgradeCostBulk(h.id, bulk)
          const partyFull = !inParty && party.length >= partySize
          const dmg = getHeroAtk(h.id)
          return (
            <div
              key={h.id}
              className={'hero-card2 rarity-' + h.rarity + ' owned' + (inParty ? ' in-party' : '')}
              onPointerDown={() => onHoldStart(h.id)}
              onPointerUp={onHoldCancel}
              onPointerCancel={onHoldCancel}
              onPointerLeave={onHoldCancel}
              onContextMenu={(e) => { e.preventDefault(); onOpenDetail(h.id) }}
            >
              <div className="hero-portrait">
                <div className="top-badges">
                  <span className={'chip rar-' + h.rarity}>{RARITY_LABEL[h.rarity]}</span>
                  <span className="chip lvl">ур. {lvl}</span>
                </div>
                <Hero role={h.role} size={110} />
                <CardStars heroId={h.id} />
              </div>

              <div className="h2-name">{h.name}</div>
              <div className="h2-meta">{ROLE_LABEL[h.role]} · {h.speed}/с</div>

              <div className="h2-stats">
                <span className="stat">
                  <Icon name="sword" size={12} /> Урон: <b>{fmt(dmg)}</b>
                </span>
              </div>

              <div className="h2-bonus">{bonusBadges(h.bonus)}</div>

              <div className="h2-actions">
                <button
                  className={'btn toggle size-sm' + (inParty ? ' on' : ' ghost')}
                  onClick={() => toggleParty(h.id)}
                  disabled={partyFull}
                  title={partyFull ? 'Отряд полон' : ''}
                >
                  {inParty ? '✓ В отряде' : (partyFull ? 'Отряд полон' : '+ В отряд')}
                </button>
                <button
                  className="btn gold size-sm"
                  disabled={!upCost || gold < upCost}
                  onClick={() => upgradeBulk(h.id, bulk)}
                  title={`Прокачать ${bulk === 'max' ? 'до конца' : '×' + bulk}`}
                >
                  <Icon name="gold" size={12} /> {fmt(upCost)}{bulk !== 1 ? <span className="bulk-tag">{bulk === 'max' ? 'Max' : '×' + bulk}</span> : null}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ============= КАТАЛОГ ============= */
function CatalogHeroes({ onOpenDetail }) {
  const gold = useGameStore(s => s.gold)
  const gems = useGameStore(s => s.gems)
  const unlocked = useGameStore(s => s.unlockedHeroes)
  const hire = useGameStore(s => s.hireHero)
  const buyPremium = useGameStore(s => s.buyPremiumHero)

  // Группировка по редкости
  const byRarity = useMemo(() => {
    const map = {}
    for (const r of CATALOG_RARITIES) map[r] = []
    for (const h of HEROES) {
      if (!map[h.rarity]) map[h.rarity] = []
      map[h.rarity].push(h)
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.cost - b.cost)
    }
    return map
  }, [])

  return (
    <div className="catalog-scroll">
      {CATALOG_RARITIES.map(r => {
        const list = byRarity[r] || []
        if (list.length === 0) return null
        const total = list.length
        const owned = list.filter(h => unlocked.includes(h.id)).length
        return (
          <section key={r} className="cat-section">
            <header className="cat-head">
              <span className={'chip rar-' + r}>{RARITY_LABEL[r]}</span>
              <span className="cat-count">{owned}/{total}</span>
            </header>
            <div className="cat-grid">
              {list.map(h => (
                <CatalogCard
                  key={h.id}
                  hero={h}
                  owned={unlocked.includes(h.id)}
                  gold={gold} gems={gems}
                  onHire={() => hire(h.id)}
                  onBuyPremium={() => buyPremium(h.id)}
                  onOpenDetail={() => onOpenDetail(h.id)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function CatalogCard({ hero, owned, gold, gems, onHire, onBuyPremium, onOpenDetail }) {
  const isPrem = hero.rarity === 'premium'
  const isMyth = hero.rarity === 'mythic'
  const baseId = hero.id.replace(/_\d+$/, '')
  const premCost = PREMIUM_GEM_COST[baseId] || 1000

  let cta
  if (owned) {
    cta = <button className="btn ghost size-sm block" onClick={onOpenDetail}>Открыть</button>
  } else if (isPrem) {
    cta = (
      <button className="btn neon size-sm block" disabled={gems < premCost} onClick={onBuyPremium}>
        💎 {premCost}
      </button>
    )
  } else if (isMyth) {
    cta = <button className="btn ghost size-sm block" disabled>🌟 Из сундуков</button>
  } else {
    cta = (
      <button className="btn gold size-sm block" disabled={gold < hero.cost} onClick={onHire}>
        <Icon name="gold" size={12} /> {fmt(hero.cost)}
      </button>
    )
  }

  return (
    <button
      className={'cat-card rarity-' + hero.rarity + (owned ? ' owned' : '')}
      onClick={onOpenDetail}
    >
      <div className="cat-portrait">
        <Hero role={hero.role} size={68} />
        {owned && <span className="cat-owned">✓</span>}
      </div>
      <div className="cat-name">{hero.name}</div>
      <div className="cat-meta">{ROLE_LABEL[hero.role]} · {hero.speed}/с</div>
      <div className="cat-bonus">{bonusBadges(hero.bonus) || '—'}</div>
      <div className="cat-cta" onClick={(e) => e.stopPropagation()}>{cta}</div>
    </button>
  )
}

function CardStars({ heroId }) {
  const stars = useGameStore(s => s.heroStars?.[heroId] || 0)
  if (!stars) return null
  return (
    <div className="card-stars" title={`${stars} звёзд`}>
      {Array.from({ length: stars }, (_, i) => <span key={i}>★</span>)}
    </div>
  )
}
