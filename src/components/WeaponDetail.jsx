import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'
import { Sprite } from '../assets/sprites.jsx'

const RUNES = [
  { id: 'flame',     label: 'Пламя',  icon: 'flame',  color: '#ff7a2a', desc: '+5% к множителю урона, огненный визуал' },
  { id: 'frost',     label: 'Мороз',  icon: 'gem',    color: '#67d6ff', desc: '+5% к множителю урона, ледяной визуал' },
  { id: 'lightning', label: 'Молния', icon: 'bolt',   color: '#ffe27a', desc: '+5% к множителю урона, грозовой визуал' },
]

export default function WeaponDetail({ tier, onClose }) {
  const all = useGameStore(s => s.weaponTier)
  const sharp = useGameStore(s => s.weaponSharp?.[tier] || 0)
  const rune = useGameStore(s => s.weaponRunes?.[tier] || null)
  const ore = useGameStore(s => s.ore || 0)
  const gems = useGameStore(s => s.gems)
  const shards = useGameStore(s => s.artifactShards)
  const sharpenCost = useGameStore(s => s.sharpenCost(tier))
  const sharpen = useGameStore(s => s.sharpen)
  const setRune = useGameStore(s => s.setRune)
  const getMult = useGameStore(s => s.getWeaponMult)

  const current = tier === all
  const mult = getMult(tier)

  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div className="weapon-detail" onClick={(e) => e.stopPropagation()}>
        <div className="wd-head">
          <Sprite name={getWeaponSprite(tier)} size={64} />
          <div className="wd-meta">
            <div className="wd-name">{getWeaponName(tier)}</div>
            <div className="wd-stat">
              ×{mult.toFixed(2)} к урону · заточка ур. {sharp}
              {rune && <span className="wd-rune-tag" style={{ color: RUNES.find(r => r.id === rune)?.color }}> · {labelRune(rune)}</span>}
            </div>
            {!current && <div className="wd-tip">Заточка работает только на текущем оружии</div>}
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        <div className="wd-section">
          <div className="wd-section-title">Кузница</div>
          <div className="wd-row">
            <div className="wd-row-meta">
              <div className="wd-row-name">Заточка</div>
              <div className="wd-row-desc">+10% к множителю урона за уровень. Текущий: <b>+{sharp * 10}%</b></div>
            </div>
            <button
              className="btn gold size-md"
              disabled={ore < sharpenCost}
              onClick={() => sharpen(tier)}
            >
              <Icon name="ore" size={14} /> {fmt(sharpenCost)}
            </button>
          </div>

          <div className="wd-section-title">Руна</div>
          <div className="rune-row">
            {RUNES.map(r => {
              const active = rune === r.id
              const canSet = gems >= 1 && shards >= 5
              return (
                <button
                  key={r.id}
                  className={'rune-btn' + (active ? ' active' : '')}
                  style={{ '--ac': r.color }}
                  onClick={() => active ? setRune(tier, null) : (canSet && setRune(tier, r.id))}
                  disabled={!active && !canSet}
                  title={r.desc}
                >
                  <Icon name={r.icon} size={20} />
                  <span className="rune-label">{r.label}</span>
                </button>
              )
            })}
          </div>
          <div className="hint" style={{ marginTop: 8 }}>
            Установка/смена руны: <Icon name="gem" size={12} /> 1 + <Icon name="artifact" size={12} /> 5. Снять — бесплатно.
          </div>
        </div>
      </div>
    </div>
  )
}

function labelRune(id) {
  const r = RUNES.find(x => x.id === id); return r ? r.label : ''
}

function getWeaponSprite(tier) {
  const map = ['w_wood', 'w_steel', 'w_silver', 'w_fire', 'w_ice', 'w_storm', 'w_shadow', 'w_fate']
  return map[tier] || 'w_wood'
}
function getWeaponName(tier) {
  const map = ['Деревянный меч', 'Стальной меч', 'Серебряный клинок', 'Огненный клинок', 'Ледяной клинок', 'Грозовой клинок', 'Теневой клинок', 'Клинок Судьбы']
  return map[tier] || 'Меч'
}
