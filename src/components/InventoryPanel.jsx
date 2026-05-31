import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'
import { Hero } from '../assets/sprites.jsx'
import { HEROES, PREMIUM_GEM_COST } from '../data/heroes.js'
import { BACKGROUNDS } from '../data/backgrounds.js'

const RES_LABEL = {
  gold: 'Золото', gems: 'Гемы', ore: 'Руда',
  artifactShards: 'Осколки артефактов', powerShards: 'Частицы силы',
  gloryStars: 'Звёзды славы', soulPrisms: 'Призмы душ',
}
const MAT_LABEL = {
  dragon: 'Чешуя дракона', lich: 'Эссенция лича', golem: 'Ядро голема',
  titan: 'Грозовой кристалл', hydra: 'Иней гидры', archon: 'Тень архонта',
  demon: 'Пепел демона', phoenix: 'Перо феникса', warden: 'Реликвия стража',
}

export default function InventoryPanel({ onClose }) {
  const [tab, setTab] = useState('items')
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Инвентарь</h2>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="raid-tabs">
        <button className={'raid-tab' + (tab === 'items'    ? ' active' : '')} onClick={() => setTab('items')}>Ресурсы</button>
        <button className={'raid-tab' + (tab === 'mats'     ? ' active' : '')} onClick={() => setTab('mats')}>Материалы</button>
        <button className={'raid-tab' + (tab === 'shards'   ? ' active' : '')} onClick={() => setTab('shards')}>Осколки героев</button>
        <button className={'raid-tab' + (tab === 'backgrounds' ? ' active' : '')} onClick={() => setTab('backgrounds')}>Фоны</button>
        <button className={'raid-tab' + (tab === 'premium'  ? ' active' : '')} onClick={() => setTab('premium')}>Премиум</button>
      </div>

      {tab === 'items'   && <ItemsTab />}
      {tab === 'mats'    && <MatsTab />}
      {tab === 'shards'  && <HeroShardsTab />}
      {tab === 'backgrounds' && <BackgroundsTab />}
      {tab === 'premium' && <PremiumShop />}
    </section>
  )
}

function ItemsTab() {
  const s = useGameStore(s => s)
  const items = [
    { key: 'gold',           icon: '🪙', val: s.gold, info: 'Зарабатываешь в боях, рейдах, экспедициях. Тратится на героев и прокачку.' },
    { key: 'gems',           icon: '💎', val: s.gems, info: 'Премиум-валюта: сундуки, премиум-герои, временные бусты.' },
    { key: 'ore',            icon: '⛏️', val: s.ore || 0, info: 'Падает в подземельях и за активность. Нужна для заточки оружия и рун.' },
    { key: 'artifactShards', icon: '🔮', val: s.artifactShards || 0, info: 'Прокачка артефактов и созвездий.' },
    { key: 'powerShards',    icon: '✦',  val: s.tower?.powerShards || 0, info: 'Награда из бесконечной башни. Будут тратиться у Грифон-мерчанта.' },
    { key: 'gloryStars',     icon: '⭐', val: s.gloryStars || 0, info: 'Boss Rush и экспедиции. Будут тратиться у Грифон-мерчанта.' },
    { key: 'soulPrisms',     icon: '💠', val: s.soulPrisms || 0, info: 'Открываются после 3 престижей. Покупка глобальных множителей в окне Реинкарнации.' },
  ]
  return (
    <div className="inv-list">
      {items.map(it => (
        <div key={it.key} className="inv-row">
          <span className="inv-icon">{it.icon}</span>
          <div className="inv-meta">
            <div className="inv-name">{RES_LABEL[it.key]}</div>
            <div className="inv-info">{it.info}</div>
          </div>
          <div className="inv-val">{fmt(it.val)}</div>
        </div>
      ))}
    </div>
  )
}

function MatsTab() {
  const mats = useGameStore(s => s.mats || {})
  const list = Object.keys(MAT_LABEL).map(k => ({ key: k, val: mats[k] || 0 }))
  const total = list.reduce((a, x) => a + x.val, 0)
  return (
    <div className="inv-list">
      {total === 0 && (
        <div className="hint">Материалы рейдов и боссов появятся здесь по мере побед в Рейдах и Boss Rush.</div>
      )}
      {list.map(it => (
        <div key={it.key} className="inv-row">
          <span className="inv-icon">📦</span>
          <div className="inv-meta">
            <div className="inv-name">{MAT_LABEL[it.key]}</div>
            <div className="inv-info">Награда из рейдов и боссовых сундуков.</div>
          </div>
          <div className="inv-val">{fmt(it.val)}</div>
        </div>
      ))}
    </div>
  )
}

function HeroShardsTab() {
  const heroShards = useGameStore(s => s.heroShards || {})
  const unlocked = useGameStore(s => s.unlockedHeroes || [])
  const ids = Object.keys(heroShards).filter(id => heroShards[id] > 0)
  const list = ids.map(id => ({ id, n: heroShards[id], hero: HEROES.find(h => h.id === id) })).filter(x => x.hero)
  list.sort((a, b) => b.n - a.n)

  return (
    <div className="inv-list">
      {list.length === 0 && (
        <div className="hint">Осколки героев падают в Boss Rush, Башне (этажи 50+) и из дубликатов в сундуках. Тратятся на звёзды героя в его карточке (долгое нажатие).</div>
      )}
      {list.map(({ id, n, hero }) => (
        <div key={id} className="inv-row">
          <span className="inv-icon"><Hero role={hero.role} size={28} /></span>
          <div className="inv-meta">
            <div className="inv-name">{hero.name}{!unlocked.includes(id) && <span className="inv-tag">не нанят</span>}</div>
            <div className="inv-info">Прокачка звёзд этого героя.</div>
          </div>
          <div className="inv-val">{fmt(n)}</div>
        </div>
      ))}
    </div>
  )
}

function BackgroundsTab() {
  const owned = useGameStore(s => s.backgrounds || ['default'])
  const active = useGameStore(s => s.activeBackground || 'default')
  const setActive = useGameStore(s => s.setActiveBackground)

  const RARITY_COLOR = {
    common: '#c8cee8', rare: '#67d6ff', epic: '#a072ff', legendary: '#ffd166', mythic: '#ff5470',
  }

  return (
    <div className="bg-grid">
      <div className="hint" style={{ gridColumn: '1 / -1', marginTop: 0 }}>
        Открыто: <b>{owned.length}</b> / {BACKGROUNDS.length}. Новые фоны выпадают
        из сундуков (редкие+). Выбери фон — он применится к арене боя.
      </div>
      {BACKGROUNDS.map(bg => {
        const have = owned.includes(bg.id)
        const isActive = active === bg.id
        return (
          <button
            key={bg.id}
            className={'bg-card' + (isActive ? ' active' : '') + (have ? '' : ' locked')}
            style={{ '--ac': RARITY_COLOR[bg.rarity] || '#c8cee8' }}
            disabled={!have}
            onClick={() => have && setActive(bg.id)}
          >
            <div
              className="bg-preview"
              style={{ background: `linear-gradient(180deg, ${bg.sky[0]}, ${bg.sky[1]} 55%, ${bg.sky[2]})` }}
            >
              <span className="bg-preview-moon" style={{ background: bg.accent }} />
              <span className="bg-preview-icon">{bg.icon}</span>
            </div>
            <div className="bg-name">{bg.name}</div>
            {isActive
              ? <div className="bg-tag active">Выбран</div>
              : have
                ? <div className="bg-tag">Выбрать</div>
                : <div className="bg-tag locked">🔒 Закрыт</div>}
          </button>
        )
      })}
    </div>
  )
}

function PremiumShop() {
  const unlocked = useGameStore(s => s.unlockedHeroes || [])
  const gems = useGameStore(s => s.gems || 0)
  const buy = useGameStore(s => s.buyPremiumHero)
  const list = HEROES.filter(h => h.rarity === 'premium')

  return (
    <div className="inv-list">
      <div className="hint" style={{ marginTop: 0 }}>
        Премиум-герои покупаются только за гемы. Их параметры выше легендарных. Каждый — раз навсегда.
      </div>
      {list.map(h => {
        const owned = unlocked.includes(h.id)
        const baseId = h.id.replace(/_\d+$/, '')
        const cost = PREMIUM_GEM_COST[baseId] || 1000
        return (
          <div key={h.id} className="prem-card">
            <div className="prem-portrait">
              <Hero role={h.role} size={88} />
              <span className="prem-tag">PREMIUM</span>
            </div>
            <div className="prem-meta">
              <div className="prem-name">{h.name}</div>
              <div className="prem-stats">
                ⚔ {h.atk} · {h.speed}/с · {h.role}
              </div>
              <div className="prem-bonuses">
                {h.bonus.dmg && <span>+{Math.round(h.bonus.dmg*100)}% урон</span>}
                {h.bonus.hp && <span>+{Math.round(h.bonus.hp*100)}% HP</span>}
                {h.bonus.crit && <span>+{Math.round(h.bonus.crit*100)}% крит</span>}
                {h.bonus.rage && <span>+{Math.round(h.bonus.rage*100)}% ярость</span>}
                {h.bonus.gold && <span>+{Math.round(h.bonus.gold*100)}% золото</span>}
              </div>
            </div>
            <button
              className="btn neon size-md"
              disabled={owned || gems < cost}
              onClick={() => buy(h.id)}
            >
              {owned ? '✓ Куплен' : <>💎 {cost}</>}
            </button>
          </div>
        )
      })}
    </div>
  )
}
