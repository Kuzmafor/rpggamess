import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'
import { ELEMENTS, elementMultiplier, RUNE_TO_ELEMENT } from '../data/elements.js'
import { STATUSES } from '../data/statusEffects.js'

const ROLE_LABEL = { melee: 'Ближний', ranged: 'Стрелок', mage: 'Маг', support: 'Поддержка' }

export default function StatsModal({ onClose }) {
  const bonuses = useGameStore(s => s.getBonuses())
  const syn = useGameStore(s => s.getSynergyBonuses())
  const crit = useGameStore(s => s.getCritChance())
  const tapDmg = useGameStore(s => s.getTapDamage())
  const dps = useGameStore(s => s.getCurrentDps())
  const partyDps = useGameStore(s => s.getPartyDps())
  const enemies = useGameStore(s => s.enemies)
  const targetIdx = useGameStore(s => s.targetIdx)
  const weaponTier = useGameStore(s => s.weaponTier)
  const weaponRunes = useGameStore(s => s.weaponRunes)
  const boostsState = useGameStore(s => s.boosts || {})
  const partyDmgUntil = useGameStore(s => s.partyDmgBoostUntil)
  const superActive = useGameStore(s => s.superActive)

  const target = enemies[targetIdx] || null
  const tapElement = RUNE_TO_ELEMENT[weaponRunes?.[weaponTier]] || null

  // Активные бусты
  const now = Date.now()
  const activeBoosts = []
  if (boostsState.dmgBoostUntil > now) {
    activeBoosts.push({ label: `Урон x${boostsState.dmgBoostMult || 2}`, until: boostsState.dmgBoostUntil })
  }
  if (boostsState.goldBoostUntil > now) {
    activeBoosts.push({ label: `Золото x${boostsState.goldBoostMult || 2}`, until: boostsState.goldBoostUntil })
  }
  if (partyDmgUntil > now) {
    activeBoosts.push({ label: `Отряд x2 урон`, until: partyDmgUntil })
  }
  if (superActive) {
    activeBoosts.push({ label: 'Супер-режим', until: null })
  }

  const tapElMult = tapElement && target?.element ? elementMultiplier(tapElement, target.element) : 1
  const targetStatuses = target?.statuses ? Object.keys(target.statuses) : []

  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn raid-info-close" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>

        <div className="syn-modal-tag">📊 Все активные бонусы</div>
        <div className="syn-modal-title">Сводка боя</div>

        {/* Текущая боеспособность */}
        <div className="stats-section-title">Текущий бой</div>
        <div className="stats-grid">
          <StatBox label="Урон тапа"   value={fmt(tapDmg)} />
          <StatBox label="DPS отряда"  value={fmt(partyDps)} />
          <StatBox label="DPS общий"   value={fmt(dps)} />
          <StatBox label="Шанс крита"  value={`${(crit * 100).toFixed(1)}%`} />
        </div>

        {/* Глобальные множители */}
        <div className="stats-section-title">Глобальные бонусы</div>
        <div className="stats-rows">
          <BonusRow icon="⚔️" label="Урон"        value={pct(bonuses.dmg)} />
          <BonusRow icon="🪙" label="Золото"      value={pct(bonuses.gold)} />
          <BonusRow icon="❤️" label="HP отряда"   value={pct(bonuses.hp)} />
          <BonusRow icon="✦"  label="Крит"        value={pct(bonuses.crit)} />
          <BonusRow icon="⚡" label="Ярость"      value={pct(bonuses.rage)} />
          {(bonuses.ore || 0) > 0   && <BonusRow icon="⛏️" label="Руда"     value={pct(bonuses.ore)} />}
          {(bonuses.weapon || 0) > 0&& <BonusRow icon="🗡️" label="Оружие"   value={pct(bonuses.weapon)} />}
          {(bonuses.offline || 0) > 0&& <BonusRow icon="🌙" label="Оффлайн"  value={pct(bonuses.offline)} />}
        </div>

        {/* Синергии */}
        {syn?.id?.length > 0 && (
          <>
            <div className="stats-section-title">Синергии состава</div>
            <div className="stats-rows">
              {syn.id.map(s => (
                <div key={s.id} className="bonus-row">
                  <span>⚡ <b>{s.name}</b></span>
                  <span className="bonus-val">{s.desc}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Активные бусты */}
        {activeBoosts.length > 0 && (
          <>
            <div className="stats-section-title">Временные бусты</div>
            <div className="stats-rows">
              {activeBoosts.map((b, i) => (
                <div key={i} className="bonus-row hot">
                  <span>🔥 <b>{b.label}</b></span>
                  <span className="bonus-val">{b.until ? formatRemain(b.until - now) : 'активно'}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Цель */}
        {target && (
          <>
            <div className="stats-section-title">Текущая цель</div>
            <div className="target-card">
              <div className="target-name">
                {target.name}{target.isBoss ? ' · БОСС' : ''}
              </div>
              <div className="target-hp">
                HP {fmt(Math.max(0, target.hp))} / {fmt(target.maxHp)}
              </div>

              {target.element && (
                <div className="target-row">
                  <span className="target-label">Стихия</span>
                  <span className="target-val" style={{ color: ELEMENTS[target.element]?.color }}>
                    {ELEMENTS[target.element]?.icon} {ELEMENTS[target.element]?.name}
                  </span>
                </div>
              )}

              {tapElement && (
                <div className="target-row">
                  <span className="target-label">Тап стихия</span>
                  <span className="target-val" style={{ color: ELEMENTS[tapElement]?.color }}>
                    {ELEMENTS[tapElement]?.icon} → x{tapElMult.toFixed(2)}
                  </span>
                </div>
              )}

              {targetStatuses.length > 0 && (
                <div className="target-row">
                  <span className="target-label">Статусы</span>
                  <span className="target-val">
                    {targetStatuses.map(sid => {
                      const def = STATUSES[sid]
                      if (!def) return null
                      return (
                        <span key={sid} className="status-pill" style={{ borderColor: def.color, color: def.color, marginRight: 4 }}>
                          {def.icon} {def.name}
                        </span>
                      )
                    })}
                  </span>
                </div>
              )}

              {target.isBoss && target.shield > 0 && (
                <div className="target-row">
                  <span className="target-label">Щит</span>
                  <span className="target-val">🛡️ урон x0.45</span>
                </div>
              )}
              {target.isBoss && target.enrage && (
                <div className="target-row">
                  <span className="target-label">Ярость</span>
                  <span className="target-val">😡 босс ускоряет регенерацию</span>
                </div>
              )}
              {target.isBoss && target.roleLock && (target.roleLockUntil || 0) > Date.now() && (
                <div className="target-row">
                  <span className="target-label">Замок</span>
                  <span className="target-val">🔒 урон только от: {ROLE_LABEL[target.roleLock] || target.roleLock}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="stat-box">
      <span className="stat-box-val">{value}</span>
      <span className="stat-box-lbl">{label}</span>
    </div>
  )
}

function BonusRow({ icon, label, value }) {
  return (
    <div className="bonus-row">
      <span>{icon} <b>{label}</b></span>
      <span className="bonus-val">{value}</span>
    </div>
  )
}

function pct(v) {
  if (!v) return '0%'
  return (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%'
}

function formatRemain(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000))
  if (sec >= 60) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}м ${s}с`
  }
  return `${sec}с`
}
