import React, { useEffect, useState } from 'react'
import { useGameStore, CHESTS, BOOSTS, CONVERTS, GEM_PACKS, TREASURE_CHESTS, BOSS_CHESTS } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'
import ChestArt from '../assets/ChestArt.jsx'
import { Hero } from '../assets/sprites.jsx'
import BulkSelector from './BulkSelector.jsx'
import { WEAPON_SHOP } from '../data/weaponCatalog.js'
import { describeAffix } from '../data/gear.js'

const TABS = [
  { id: 'chests',  label: 'Сундуки' },
  { id: 'weapons', label: 'Оружие' },
  { id: 'boosts',  label: 'Бусты' },
  { id: 'upgrades',label: 'Усиления' },
  { id: 'convert', label: 'Обмен' },
  { id: 'gems',    label: 'Гемы' },
]

const RARITY_LABEL = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
  mythic: 'Мифический',
  premium: 'Премиум',
}

function useNow(intervalMs = 500) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export default function ShopPanel({ onClose }) {
  const [tab, setTab] = useState('chests')
  const [reveal, setReveal] = useState(null) // { rarity, reward }
  const [bulkReveal, setBulkReveal] = useState(null) // { rarity, count, summary }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Магазин</h2>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="filter-row shop-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={'filter-btn' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'chests'  && <Chests onReveal={setReveal} onBulkReveal={setBulkReveal} />}
      {tab === 'weapons' && <WeaponsCatalog />}
      {tab === 'boosts'  && <Boosts />}
      {tab === 'upgrades'&& <Upgrades />}
      {tab === 'convert' && <Convert />}
      {tab === 'gems'    && <Gems />}

      {reveal && <RevealModal data={reveal} onClose={() => setReveal(null)} />}
      {bulkReveal && <BulkRevealModal data={bulkReveal} onClose={() => setBulkReveal(null)} />}
    </section>
  )
}

/* ===================== СУНДУКИ ===================== */
function Chests({ onReveal, onBulkReveal }) {
  const open = useGameStore(s => s.openChest)
  const openBulk = useGameStore(s => s.openChestBulk)
  const openTreasure = useGameStore(s => s.openTreasureChest)
  const openBoss = useGameStore(s => s.openBossChest)
  const gold = useGameStore(s => s.gold)
  const gems = useGameStore(s => s.gems)
  const order = ['common', 'rare', 'epic', 'legendary']
  const [oddsRarity, setOddsRarity] = useState(null)
  const pressTimer = React.useRef(null)
  const [tab, setTab] = useState('hero')

  function handleOpen(rar) {
    const def = CHESTS[rar]
    const has = def.currency === 'gems' ? gems >= def.cost : gold >= def.cost
    if (!has) return
    const r = open(rar)
    if (r.ok) onReveal({ rarity: rar, reward: r.reward })
  }

  function handleBulk(rar, count) {
    const def = CHESTS[rar]
    const have = def.currency === 'gems' ? gems : gold
    if (have < def.cost * count) return
    const r = openBulk(rar, count)
    if (r.ok) onBulkReveal({ rarity: rar, count, summary: r.summary })
  }

  function startLongPress(rar) {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => setOddsRarity(rar), 500)
  }
  function cancelLongPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }
  function onContextMenu(e, rar) {
    e.preventDefault()
    setOddsRarity(rar)
  }

  return (
    <div className="shop-list">
      <div className="filter-row" style={{ padding: 0, gap: 6 }}>
        <button className={'filter-btn' + (tab === 'hero' ? ' active' : '')} onClick={() => setTab('hero')}>Герои</button>
        <button className={'filter-btn' + (tab === 'treasure' ? ' active' : '')} onClick={() => setTab('treasure')}>Сокровища</button>
        <button className={'filter-btn' + (tab === 'boss' ? ' active' : '')} onClick={() => setTab('boss')}>Боссовые</button>
      </div>

      {tab === 'hero' && order.map(rar => {
        const def = CHESTS[rar]
        const has = def.currency === 'gems' ? gems >= def.cost : gold >= def.cost
        return (
          <div
            key={rar}
            className={'shop-card chest rarity-' + rar}
            style={{ '--ac': def.color }}
            onPointerDown={() => startLongPress(rar)}
            onPointerUp={cancelLongPress}
            onPointerLeave={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onContextMenu={(e) => onContextMenu(e, rar)}
          >
            <div className="chest-art">
              <ChestArt variant={rar} size={88} />
              <span className={'chest-rarity-pill rar-' + rar}>{RARITY_LABEL[rar]}</span>
            </div>
            <div className="shop-meta">
              <div className="shop-title">Сундук: {RARITY_LABEL[rar]}</div>
              <div className="shop-desc">
                Шанс героя: <b>{Math.round(def.heroChance * 100)}%</b>. Удерживайте карточку — увидите все шансы.
              </div>
              <div className="shop-rewards">
                <span><Icon name="gold" size={12} /> +{fmt(def.guaranteedGold)}</span>
                <span><Icon name="ore" size={12} /> +{def.guaranteedOre}</span>
                <span className="muted"><Icon name="artifact" size={12} /> {def.fallbackShards}*</span>
              </div>
            </div>
            <div className="shop-actions">
              <button className="btn gold size-md" disabled={!has} onClick={() => handleOpen(rar)}>
                {def.currency === 'gems'
                  ? <><Icon name="gem" size={14} /> {def.cost}</>
                  : <><Icon name="gold" size={14} /> {fmt(def.cost)}</>}
              </button>
              <div className="chest-bulk-row">
                {[10, 30, 50].map(cnt => {
                  const total = def.cost * cnt
                  const canBulk = def.currency === 'gems' ? gems >= total : gold >= total
                  return (
                    <button
                      key={cnt}
                      className="btn ghost size-sm chest-bulk-btn"
                      disabled={!canBulk}
                      onClick={() => handleBulk(rar, cnt)}
                      title={`Открыть ${cnt} · ${def.currency === 'gems' ? total + '💎' : fmt(total) + '🪙'}`}
                    >
                      ×{cnt}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      {tab === 'hero' && (
        <div className="hint">* осколки выпадают, если героев такой редкости больше не осталось.</div>
      )}

      {tab === 'treasure' && Object.entries(TREASURE_CHESTS).map(([id, def]) => {
        const has = def.currency === 'gems' ? gems >= def.cost : gold >= def.cost
        return (
          <div key={id} className="shop-card" style={{ '--ac': def.color }}>
            <div className="chest-art">
              <ChestArt variant="treasure" size={88} />
            </div>
            <div className="shop-meta">
              <div className="shop-title">{def.label}</div>
              <div className="shop-desc">{def.desc}</div>
              <div className="shop-rewards">
                <span><Icon name="gold" size={12} /> +{fmt(def.gold)}</span>
                <span><Icon name="ore" size={12} /> +{def.ore}</span>
                {def.shards > 0 && <span><Icon name="artifact" size={12} /> +{def.shards}</span>}
              </div>
            </div>
            <button
              className="btn gold size-md"
              disabled={!has}
              onClick={() => {
                const r = openTreasure(id)
                if (r?.ok) onReveal({ rarity: 'epic', reward: r.reward })
              }}
            >
              {def.currency === 'gems'
                ? <><Icon name="gem" size={14} /> {def.cost}</>
                : <><Icon name="gold" size={14} /> {fmt(def.cost)}</>}
            </button>
          </div>
        )
      })}

      {tab === 'boss' && Object.entries(BOSS_CHESTS).map(([id, def]) => {
        const has = def.currency === 'gems' ? gems >= def.cost : gold >= def.cost
        return (
          <div key={id} className="shop-card" style={{ '--ac': def.color }}>
            <div className="chest-art">
              <ChestArt variant="boss" size={88} />
            </div>
            <div className="shop-meta">
              <div className="shop-title">{def.label}</div>
              <div className="shop-desc">{def.desc}</div>
              <div className="shop-rewards">
                <span><Icon name="gold" size={12} /> +{fmt(def.gold)}</span>
                <span><Icon name="ore" size={12} /> +{def.ore}</span>
                <span><Icon name="artifact" size={12} /> +{def.shards}</span>
                <span className="muted">+ материал рейда</span>
              </div>
            </div>
            <button
              className="btn neon size-md"
              disabled={!has}
              onClick={() => {
                const r = openBoss(id)
                if (r?.ok) onReveal({ rarity: 'legendary', reward: r.reward })
              }}
            >
              {def.currency === 'gems'
                ? <><Icon name="gem" size={14} /> {def.cost}</>
                : <><Icon name="gold" size={14} /> {fmt(def.cost)}</>}
            </button>
          </div>
        )
      })}

      {oddsRarity && (
        <OddsModal rarity={oddsRarity} onClose={() => setOddsRarity(null)} />
      )}
    </div>
  )
}

function OddsModal({ rarity, onClose }) {
  const def = CHESTS[rarity]
  const heroChance = Math.round((def.heroChance || 0) * 100)
  // распределение редкости героя — относительное (если ролл героя сработал)
  const dist = def.heroRarityChances || {}
  const order = ['premium', 'mythic', 'legendary', 'epic', 'rare', 'common']
  // подменяем иконку шапки модалки на красивый сундук
  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div className="odds-card" style={{ '--ac': def.color }} onClick={(e) => e.stopPropagation()}>
        <div className="odds-head">
          <div className="odds-icon"><ChestArt variant={rarity} size={36} glow={false} /></div>
          <div>
            <div className="odds-title">Шансы · Сундук «{RARITY_LABEL[rarity]}»</div>
            <div className="odds-sub">Шанс на героя: <b>{heroChance}%</b></div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        <div className="odds-section">
          <div className="odds-section-title">Гарантировано</div>
          <div className="odds-row">
            <span className="odds-key"><Icon name="gold" size={14} /> Золото</span>
            <span className="odds-val">+{fmt(def.guaranteedGold)}</span>
          </div>
          <div className="odds-row">
            <span className="odds-key"><Icon name="ore" size={14} /> Руда</span>
            <span className="odds-val">+{def.guaranteedOre}</span>
          </div>
        </div>

        <div className="odds-section">
          <div className="odds-section-title">Если выпал герой ({heroChance}%)</div>
          {order.map(r => {
            const p = dist[r] || 0
            if (!p) return null
            const pct = Math.round(p * 100)
            const total = Math.round((def.heroChance * p) * 100)
            return (
              <div key={r} className={'odds-row rar-' + r}>
                <span className="odds-key"><span className={'rar-dot rar-' + r} /> {RARITY_LABEL[r]}</span>
                <span className="odds-val">
                  <b>{pct}%</b><span className="muted"> · общий {total}%</span>
                </span>
              </div>
            )
          })}
        </div>

        <div className="odds-section">
          <div className="odds-section-title">Иначе</div>
          <div className="odds-row">
            <span className="odds-key"><Icon name="ore" size={14} /> Руда (бонус)</span>
            <span className="odds-val">+{Math.ceil(def.guaranteedOre * 0.4)}</span>
          </div>
        </div>

        <button className="btn ghost size-md block" onClick={onClose}>Понятно</button>
      </div>
    </div>
  )
}

/* ===================== КАТАЛОГ ОРУЖИЯ ===================== */
function WeaponsCatalog() {
  const buy = useGameStore(s => s.buyCatalogWeapon)
  const gems = useGameStore(s => s.gems)
  const RARITY_COLOR = {
    common: '#c8cee8', rare: '#67d6ff', epic: '#a072ff', legendary: '#ffd166',
  }
  const order = ['legendary', 'epic', 'rare', 'common']
  const byRarity = order.reduce((acc, r) => {
    acc[r] = WEAPON_SHOP.filter(w => w.rarity === r)
    return acc
  }, {})

  return (
    <div className="shop-list">
      {order.map(r => {
        const list = byRarity[r] || []
        if (list.length === 0) return null
        return (
          <section key={r} className="cat-section">
            <header className="cat-head">
              <span className={'chip rar-' + r} style={{ color: RARITY_COLOR[r] }}>
                {RARITY_LABEL[r]}
              </span>
              <span className="cat-count">{list.length}</span>
            </header>
            <div className="weapons-grid">
              {list.map(w => {
                const has = gems >= w.cost
                return (
                  <div
                    key={w.id}
                    className={'weapon-shop-card rarity-' + r}
                    style={{ '--ac': RARITY_COLOR[r] }}
                  >
                    <div className="weapon-shop-art">
                      <span className="weapon-shop-icon">{w.icon}</span>
                    </div>
                    <div className="weapon-shop-meta">
                      <div className="weapon-shop-name">{w.name}</div>
                      <ul className="weapon-shop-affixes">
                        {w.affixes.map((af, i) => <li key={i}>{describeAffix(af)}</li>)}
                      </ul>
                    </div>
                    <button
                      className="btn neon size-sm"
                      disabled={!has}
                      onClick={() => buy(w.id)}
                    >
                      <Icon name="gem" size={14} /> {w.cost}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
      <div className="hint">
        Здесь — особое оружие, которое можно купить за алмазы. Полный каталог
        и обычное оружие выпадает в боях и сундуках, см. раздел «Оружие».
      </div>
    </div>
  )
}


/* ===================== БУСТЫ ===================== */
function Boosts() {
  const now = useNow()
  const boosts = useGameStore(s => s.boosts) || {}
  const activate = useGameStore(s => s.activateBoost)
  const gems = useGameStore(s => s.gems)

  function timeLeft(until) {
    const ms = Math.max(0, until - now)
    if (ms <= 0) return null
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const items = [
    { id: 'dmg',       icon: 'rocket', kind: 'dmg' },
    { id: 'gold',      icon: 'gold',   kind: 'gold' },
    { id: 'dmg_long',  icon: 'rocket', kind: 'dmg' },
    { id: 'gold_long', icon: 'gold',   kind: 'gold' },
    { id: 'dmg_mega',  icon: 'flame',  kind: 'dmg' },
  ].map(b => {
    const u = b.kind === 'dmg' ? boosts.dmgBoostUntil : boosts.goldBoostUntil
    return { ...b, active: u > now, until: u }
  })

  return (
    <div className="shop-list">
      {items.map(it => {
        const def = BOOSTS[it.id]
        return (
          <div key={it.id} className={'shop-card boost' + (it.active ? ' active' : '')}>
            <div className="boost-art"><Icon name={it.icon} size={36} /></div>
            <div className="shop-meta">
              <div className="shop-title">{def.label}</div>
              <div className="shop-desc">{def.desc}</div>
              {it.active
                ? <div className="boost-timer">Активен · {timeLeft(it.until)}</div>
                : <div className="shop-rewards"><span>Длительность: {Math.round(def.duration / 60)} мин</span></div>}
            </div>
            <button
              className="btn neon size-md"
              disabled={gems < def.cost}
              onClick={() => activate(it.id)}
            >
              <Icon name="gem" size={14} /> {def.cost}
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ===================== УСИЛЕНИЯ (старая прокачка) ===================== */
function Upgrades() {
  const gold = useGameStore(s => s.gold)
  const tapLevel = useGameStore(s => s.tapLevel)
  const passiveLevel = useGameStore(s => s.passiveLevel)
  const upTap = useGameStore(s => s.upgradeTapBulk)
  const upPas = useGameStore(s => s.upgradePassiveBulk)

  const [mult, setMult] = useState(1) // 1 | 10 | 100 | 'max'

  const estTap = estimate('tap', tapLevel, gold, mult)
  const estPas = estimate('pas', passiveLevel, gold, mult)

  return (
    <div className="shop-list">
      <div className="bulk-row">
        <span className="bulk-label">Множитель:</span>
        {[1, 10, 100, 'max'].map(m => (
          <button
            key={String(m)}
            className={'bulk-chip' + (mult === m ? ' active' : '')}
            onClick={() => setMult(m)}
          >
            {m === 'max' ? 'MAX' : 'x' + m}
          </button>
        ))}
      </div>

      <div className="shop-card upgrade">
        <div className="upgrade-art"><Icon name="bolt" size={36} /></div>
        <div className="shop-meta">
          <div className="shop-title">Сила удара</div>
          <div className="shop-desc">
            Уровень {tapLevel}. {estTap.lv > 0 ? `+${estTap.lv} ур · ${fmt(estTap.cost)}🪙` : 'Не хватает золота для следующего уровня'}
          </div>
        </div>
        <button
          className="btn gold size-md"
          disabled={estTap.lv === 0}
          onClick={() => upTap(mult === 'max' ? 'max' : mult)}
        >
          <Icon name="gold" size={14} /> {fmt(estTap.cost || tapCostFor(tapLevel))}
        </button>
      </div>

      <div className="shop-card upgrade">
        <div className="upgrade-art"><Icon name="chart" size={36} /></div>
        <div className="shop-meta">
          <div className="shop-title">Пассивный DPS</div>
          <div className="shop-desc">
            Уровень {passiveLevel}. {estPas.lv > 0 ? `+${estPas.lv} ур · ${fmt(estPas.cost)}🪙` : 'Не хватает золота для следующего уровня'}
          </div>
        </div>
        <button
          className="btn gold size-md"
          disabled={estPas.lv === 0}
          onClick={() => upPas(mult === 'max' ? 'max' : mult)}
        >
          <Icon name="gold" size={14} /> {fmt(estPas.cost || passCostFor(passiveLevel))}
        </button>
      </div>
    </div>
  )
}

function tapCostFor(level) {
  return Math.floor(20 * Math.pow(1.15, Math.max(0, level - 1)))
}
function passCostFor(level) {
  return Math.floor(80 * Math.pow(1.18, Math.max(0, level)))
}
function estimate(kind, levelStart, gold, mult) {
  let lvl = levelStart
  let g = gold
  let lv = 0
  let total = 0
  const isMax = mult === 'max'
  const lim = isMax ? 100000 : mult
  for (let i = 0; i < lim; i++) {
    const cost = kind === 'tap' ? tapCostFor(lvl) : passCostFor(lvl)
    if (g < cost) break
    g -= cost
    total += cost
    lvl += 1
    lv += 1
  }
  return { lv, cost: total }
}

/* ===================== ОБМЕН ===================== */
function Convert() {
  const [gold, setGold] = useState(1)
  const [shards, setShards] = useState(1)
  const [ore, setOre] = useState(1)
  const [goldL, setGoldL] = useState(1)
  const [shardsL, setShardsL] = useState(1)
  const gems = useGameStore(s => s.gems)
  const convert = useGameStore(s => s.convertGems)

  return (
    <div className="shop-list">
      <div className="shop-card convert">
        <div className="convert-art"><Icon name="gold" size={36} /></div>
        <div className="shop-meta">
          <div className="shop-title">Обмен на золото</div>
          <div className="shop-desc">1 <Icon name="gem" size={12} /> = 5 000 <Icon name="gold" size={12} /></div>
          <div className="qty-row">
            <button className="qty-btn" onClick={() => setGold(Math.max(1, gold - 1))}>−</button>
            <span className="qty-value">×{gold}</span>
            <button className="qty-btn" onClick={() => setGold(gold + 1)}>+</button>
          </div>
        </div>
        <button
          className="btn primary size-md"
          disabled={gems < gold}
          onClick={() => convert('gold', gold)}
        >
          <Icon name="gem" size={14} /> {gold} → {fmt(gold * 5000)}
        </button>
      </div>

      <div className="shop-card convert">
        <div className="convert-art"><Icon name="artifact" size={36} /></div>
        <div className="shop-meta">
          <div className="shop-title">Обмен на осколки</div>
          <div className="shop-desc">1 <Icon name="gem" size={12} /> = 2 осколка артефактов</div>
          <div className="qty-row">
            <button className="qty-btn" onClick={() => setShards(Math.max(1, shards - 1))}>−</button>
            <span className="qty-value">×{shards}</span>
            <button className="qty-btn" onClick={() => setShards(shards + 1)}>+</button>
          </div>
        </div>
        <button
          className="btn primary size-md"
          disabled={gems < shards}
          onClick={() => convert('shards', shards)}
        >
          <Icon name="gem" size={14} /> {shards} → {shards * 2}
        </button>
      </div>

      <div className="shop-card convert">
        <div className="convert-art"><Icon name="ore" size={36} /></div>
        <div className="shop-meta">
          <div className="shop-title">Обмен на руду</div>
          <div className="shop-desc">1 <Icon name="gem" size={12} /> = 25 руды</div>
          <div className="qty-row">
            <button className="qty-btn" onClick={() => setOre(Math.max(1, ore - 1))}>−</button>
            <span className="qty-value">×{ore}</span>
            <button className="qty-btn" onClick={() => setOre(ore + 1)}>+</button>
          </div>
        </div>
        <button
          className="btn primary size-md"
          disabled={gems < ore}
          onClick={() => convert('ore', ore)}
        >
          <Icon name="gem" size={14} /> {ore} → {ore * 25}
        </button>
      </div>

      <div className="shop-card convert">
        <div className="convert-art"><Icon name="gold" size={36} /></div>
        <div className="shop-meta">
          <div className="shop-title">Крупный обмен на золото</div>
          <div className="shop-desc">5 <Icon name="gem" size={12} /> = 30 000 <Icon name="gold" size={12} /></div>
          <div className="qty-row">
            <button className="qty-btn" onClick={() => setGoldL(Math.max(1, goldL - 1))}>−</button>
            <span className="qty-value">×{goldL}</span>
            <button className="qty-btn" onClick={() => setGoldL(goldL + 1)}>+</button>
          </div>
        </div>
        <button
          className="btn neon size-md"
          disabled={gems < goldL * 5}
          onClick={() => convert('gold_l', goldL)}
        >
          <Icon name="gem" size={14} /> {goldL * 5} → {fmt(goldL * 30000)}
        </button>
      </div>

      <div className="shop-card convert">
        <div className="convert-art"><Icon name="artifact" size={36} /></div>
        <div className="shop-meta">
          <div className="shop-title">Крупный обмен на осколки</div>
          <div className="shop-desc">5 <Icon name="gem" size={12} /> = 12 осколков</div>
          <div className="qty-row">
            <button className="qty-btn" onClick={() => setShardsL(Math.max(1, shardsL - 1))}>−</button>
            <span className="qty-value">×{shardsL}</span>
            <button className="qty-btn" onClick={() => setShardsL(shardsL + 1)}>+</button>
          </div>
        </div>
        <button
          className="btn neon size-md"
          disabled={gems < shardsL * 5}
          onClick={() => convert('shards_l', shardsL)}
        >
          <Icon name="gem" size={14} /> {shardsL * 5} → {shardsL * 12}
        </button>
      </div>
    </div>
  )
}

/* ===================== ГЕМЫ ===================== */
function Gems() {
  const buy = useGameStore(s => s.buyGemPack)
  return (
    <div className="gems-grid">
      {GEM_PACKS.map((p, i) => (
        <div key={p.id} className={'gem-pack-card tier-' + i}>
          <div className="gp-glow" />
          {p.tag && <div className="gp-tag">{p.tag}</div>}
          <div className="gp-art">
            <Icon name="gem" size={36} />
            <span className="gp-pile" aria-hidden>
              <span className="gp-gem gp-gem-1"></span>
              <span className="gp-gem gp-gem-2"></span>
              <span className="gp-gem gp-gem-3"></span>
              <span className="gp-gem gp-gem-4"></span>
            </span>
          </div>
          <div className="gp-amount">
            <Icon name="gem" size={14} />
            <span>+{fmt(p.gems)}</span>
          </div>
          <div className="gp-name">{p.label}</div>
          <button className="btn gold size-md gp-buy" onClick={() => buy(p.id)}>
            Купить
          </button>
        </div>
      ))}
      <div className="hint" style={{ gridColumn: '1 / -1' }}>
        В этой версии гемы выдаются мгновенно — для отладки и idle-прогресса.
      </div>
    </div>
  )
}

/* ===================== Reveal ===================== */
/* ===================== Reveal — сценарий открытия сундука ===================== */
function RevealModal({ data, onClose }) {
  const { reward, rarity } = data
  // Фазы: 'idle' -> 'shake' -> 'flash' -> 'opening' -> 'coins' -> 'hero' -> 'summary'
  const [phase, setPhase] = useState('idle')

  useEffect(() => {
    let timers = []
    const hasHero = !!reward.hero
    const hasGear = !!(reward.gear && reward.gear.length)
    // 1) Сундук стоит и дрожит / накачивается светом
    timers.push(setTimeout(() => setPhase('shake'),    250))
    // 2) Резкая вспышка-blowup
    timers.push(setTimeout(() => setPhase('flash'),    1100))
    // 3) Сундук открывается, сильный bloom
    timers.push(setTimeout(() => setPhase('opening'),  1320))
    // 4) Из сундука летят монеты + звёзды
    timers.push(setTimeout(() => setPhase('coins'),    1700))
    // 5) Герой (если есть)
    let t = 3100
    if (hasHero) {
      timers.push(setTimeout(() => setPhase('hero'), t))
      t += 1300
    }
    // 6) Снаряжение (если выпало) — отдельная сцена-выезд
    if (hasGear) {
      timers.push(setTimeout(() => setPhase('gear'), t))
      t += 1300
    }
    // 7) Финальная сводка
    timers.push(setTimeout(() => setPhase('summary'), t))

    return () => { timers.forEach(clearTimeout) }
  }, [reward.hero, reward.gear])

  const role = reward.hero?.role || 'melee'
  const heroOwnedTitle = reward.dup
    ? 'Дубликат! +1 уровень'
    : reward.hero ? 'Новый герой!' : 'Награда'

  // Лучшая редкость выпавшего gear для сцены
  const topGearRarity = (reward.gear || []).reduce((best, g) => {
    const rank = { common: 0, rare: 1, epic: 2, legendary: 3 }
    return (rank[g.rarity] ?? 0) > (rank[best] ?? -1) ? g.rarity : best
  }, null)

  const coins = COINS_LAYOUT
  const skip = () => setPhase('summary')

  return (
    <div className="reveal-overlay" onClick={skip}>
      {/* лучи вокруг сундука */}
      <div className={'chest-stage rarity-' + rarity + ' phase-' + phase}
           onClick={(e) => e.stopPropagation()}>
        <div className="chest-rays" />
        <div className="chest-rune-ring" />

        {/* Сундук виден до сцены героя/снаряжения/сводки */}
        {phase !== 'summary' && phase !== 'hero' && phase !== 'gear' && (
          <div className={'chest-3d phase-' + phase}>
            <ChestArt
              variant={rarity}
              open={phase === 'opening' || phase === 'coins'}
              size={170}
            />
          </div>
        )}

        {/* Big white flash в момент раскрытия */}
        {(phase === 'flash' || phase === 'opening') && (
          <div className="chest-flash" key={phase} />
        )}

        {/* Звёздные частицы — начинаются с opening и продолжаются в coins */}
        {(phase === 'opening' || phase === 'coins') && (
          <div className="sparks-wrap">
            {SPARKS_LAYOUT.map((c, i) => (
              <span
                key={i}
                className="spark"
                style={{
                  animationDelay: c.delay + 'ms',
                  animationDuration: c.dur + 'ms',
                  '--tx': c.tx + 'px',
                  '--ty': c.ty + 'px',
                  '--sz': c.sz + 'px',
                }}
              />
            ))}
          </div>
        )}

        {/* Монеты — вылет */}
        {(phase === 'coins') && (
          <div className="coins-wrap">
            {coins.map((c, i) => (
              <span
                key={i}
                className="coin"
                style={{
                  animationDelay: c.delay + 'ms',
                  animationDuration: c.dur + 'ms',
                  '--tx': c.tx + 'px',
                  '--ty': c.ty + 'px',
                  '--rot': c.rot + 'deg',
                }}
              >
                <Icon name="gold" size={22} />
              </span>
            ))}
            <div className="coin-counter">
              <Icon name="gold" size={16} />
              <span>+{fmt(reward.gold)}</span>
            </div>
          </div>
        )}

        {/* Герой — заметный выезд */}
        {phase === 'hero' && reward.hero && (
          <div className={'hero-stage rarity-' + rarity}>
            <div className="hero-flash" />
            <div className="hero-fly">
              <Hero role={role} size={150} />
            </div>
            <div className="hero-name-block">
              <div className="reveal-ttl">{heroOwnedTitle}</div>
              <div className="reveal-name">
                {reward.hero.name}
                {reward.dup && <span className="hero-lvl-badge" style={{ marginLeft: 8 }}>+1 ур.</span>}
              </div>
              <div className="reveal-rarity">{RARITY_LABEL[reward.hero.rarity]}</div>
            </div>
          </div>
        )}

        {/* Снаряжение — выезд как у героя */}
        {phase === 'gear' && topGearRarity && (
          <div className={'hero-stage rarity-' + topGearRarity}>
            <div className="hero-flash" />
            <div className="gear-fly">
              <div className={'gear-fly-icon rar-' + topGearRarity}>
                <Icon name="sword" size={84} />
              </div>
            </div>
            <div className="hero-name-block">
              <div className="reveal-ttl">{reward.gear.length > 1 ? 'Снаряжение!' : 'Снаряжение!'}</div>
              <div className="reveal-name">
                {reward.gear.length > 1 ? `${reward.gear.length} предмета` : 'Новый предмет'}
              </div>
              <div className="reveal-rarity">{RARITY_LABEL[topGearRarity]}</div>
            </div>
          </div>
        )}

        {/* Финальная сводка */}
        {phase === 'summary' && (
          <div className={'summary-card rarity-' + rarity} onClick={(e) => e.stopPropagation()}>
            <div className="reveal-burst" />
            <div className="reveal-ttl">Общий дроп</div>

            {reward.hero && (
              <div className="summary-hero">
                <Hero role={role} size={92} />
                <div>
                  <div className="reveal-name">
                    {reward.hero.name}
                    {reward.dup && <span className="hero-lvl-badge" style={{ marginLeft: 8 }}>+1 ур.</span>}
                  </div>
                  <div className="reveal-rarity">{RARITY_LABEL[reward.hero.rarity]}</div>
                </div>
              </div>
            )}

            <div className="summary-rewards">
              <div className="srew gold">
                <Icon name="gold" size={18} />
                <div className="srew-meta">
                  <span className="srew-num">+{fmt(reward.gold)}</span>
                  <span className="srew-name">Золото</span>
                </div>
              </div>
              {reward.ore > 0 && (
                <div className="srew ore">
                  <Icon name="ore" size={18} />
                  <div className="srew-meta">
                    <span className="srew-num">+{reward.ore}</span>
                    <span className="srew-name">Руда</span>
                  </div>
                </div>
              )}
              {reward.shards > 0 && (
                <div className="srew shards">
                  <Icon name="artifact" size={18} />
                  <div className="srew-meta">
                    <span className="srew-num">+{reward.shards}</span>
                    <span className="srew-name">Осколки</span>
                  </div>
                </div>
              )}
              {reward.gear?.length > 0 && (
                <div className="srew gear">
                  <Icon name="sword" size={18} />
                  <div className="srew-meta">
                    <span className="srew-num">+{reward.gear.length}</span>
                    <span className="srew-name">
                      Снаряжение
                      {reward.gear.some(g => g.rarity === 'legendary') && ' · ★ Легенд.'}
                      {reward.gear.some(g => g.rarity === 'epic') && !reward.gear.some(g => g.rarity === 'legendary') && ' · Эпик'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button className="btn gold size-md block" onClick={onClose}>Принять</button>
          </div>
        )}

        {/* Подсказка-пропустить */}
        {phase !== 'summary' && (
          <button className="reveal-skip" onClick={skip}>Пропустить ›</button>
        )}
      </div>
    </div>
  )
}

/* Раскладка монет: ~22 штуки разлетаются и сходятся к счётчику. */
const COINS_LAYOUT = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2
  const r = 80 + (i % 3) * 30
  return {
    tx: Math.cos(angle) * r,
    ty: Math.sin(angle) * r * 0.8 - 40,
    rot: (i * 47) % 360,
    delay: 30 * i,
    dur: 900 + (i % 4) * 80,
  }
})

/* Звёздные частицы для эффекта вскрытия — летят вверх и в стороны. */
const SPARKS_LAYOUT = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2
  const r = 110 + (i % 4) * 22
  return {
    tx: Math.cos(angle) * r,
    ty: Math.sin(angle) * r * 0.7 - 50,
    sz: 4 + (i % 4),
    delay: 20 * i,
    dur: 1200 + (i % 5) * 90,
  }
})

/* Старый локальный SVG-арт более не используется — мы импортируем
   ChestArt из ../assets/ChestArt.jsx. Оставлено пусто. */

/* ===================== Bulk Reveal — массовое открытие ===================== */
function BulkRevealModal({ data, onClose }) {
  const { rarity, count, summary } = data
  // Сворачиваем героев: уникальные / дубликаты
  const heroes = summary.heroes || []
  const newHeroes = heroes.filter(h => !h.dup)
  const dupHeroes = heroes.filter(h => h.dup)

  // Группируем редкости gear
  const gearByRarity = (summary.gearRarities || []).reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1
    return acc
  }, {})

  // Уникальные новые герои (по id) для показа спрайтов
  const seen = new Set()
  const uniqueNew = []
  for (const h of newHeroes) {
    if (!seen.has(h.hero.id)) { seen.add(h.hero.id); uniqueNew.push(h.hero) }
  }

  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div className={'bulk-reveal rarity-' + rarity} onClick={(e) => e.stopPropagation()}>
        <div className="bulk-reveal-burst" />
        <div className="bulk-reveal-ttl">Открыто ×{count}</div>
        <div className="bulk-reveal-sub">Сундук «{RARITY_LABEL[rarity]}»</div>

        {/* Ресурсы */}
        <div className="bulk-res-grid">
          <div className="bulk-res gold">
            <Icon name="gold" size={18} />
            <span>+{fmt(summary.gold)}</span>
          </div>
          {summary.ore > 0 && (
            <div className="bulk-res ore">
              <Icon name="ore" size={18} />
              <span>+{fmt(summary.ore)}</span>
            </div>
          )}
          {summary.shards > 0 && (
            <div className="bulk-res shards">
              <Icon name="artifact" size={18} />
              <span>+{summary.shards}</span>
            </div>
          )}
          {summary.gearCount > 0 && (
            <div className="bulk-res gear">
              <Icon name="sword" size={18} />
              <span>×{summary.gearCount}</span>
            </div>
          )}
        </div>

        {/* Новые герои */}
        {uniqueNew.length > 0 && (
          <>
            <div className="bulk-section-ttl">Новые герои · {uniqueNew.length}</div>
            <div className="bulk-hero-grid">
              {uniqueNew.map(h => (
                <div key={h.id} className={'bulk-hero rar-' + h.rarity}>
                  <Hero role={h.role} size={56} />
                  <div className="bulk-hero-name">{h.name}</div>
                  <div className={'bulk-hero-rar rar-' + h.rarity}>{RARITY_LABEL[h.rarity]}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Дубликаты → осколки */}
        {dupHeroes.length > 0 && (
          <div className="bulk-dup-line">
            Дубликаты: <b>{dupHeroes.length}</b> (превращены в осколки и уровни)
          </div>
        )}

        {/* Снаряжение по редкости */}
        {summary.gearCount > 0 && (
          <>
            <div className="bulk-section-ttl">Снаряжение · {summary.gearCount}</div>
            <div className="bulk-gear-row">
              {['legendary','epic','rare','common'].map(r => (
                gearByRarity[r] ? (
                  <span key={r} className={'bulk-gear-pill rar-' + r}>
                    {RARITY_LABEL[r]}: {gearByRarity[r]}
                  </span>
                ) : null
              ))}
            </div>
          </>
        )}

        <button className="btn gold size-md block" onClick={onClose}>Принять</button>
      </div>
    </div>
  )
}

