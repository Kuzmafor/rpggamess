import React, { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { getWeapon } from '../data/weapons.js'
import { getHero } from '../data/heroes.js'
import { fmt } from '../utils/fmt.js'
import { Sprite, Hero } from '../assets/sprites.jsx'
import ArenaBackground from './ArenaBackground.jsx'
import BoostsHud from './BoostsHud.jsx'
import { ELEMENTS } from '../data/elements.js'
import { STATUSES } from '../data/statusEffects.js'

export default function Arena() {
  const enemies   = useGameStore(s => s.enemies)
  const targetIdx = useGameStore(s => s.targetIdx)
  const setTarget = useGameStore(s => s.setTarget)
  const rage      = useGameStore(s => s.rage)
  const superActive = useGameStore(s => s.superActive)
  const tap         = useGameStore(s => s.tapAttack)
  const activateSuper = useGameStore(s => s.activateSuper)
  const tapDmg = useGameStore(s => s.getTapDamage())
  const dps    = useGameStore(s => s.getCurrentDps())
  const weapon = getWeapon(useGameStore(s => s.weaponTier))
  const party  = useGameStore(s => s.party)
  const towerPartyHp = useGameStore(s => s.tower?.run?.partyHp || null)

  const arenaRef = useRef(null)
  const arenaRectRef = useRef(null)
  const [pops, setPops] = useState([])
  const [hits, setHits] = useState({})
  const [attackPulse, setAttackPulse] = useState({})
  const lastPopRef = useRef(0)

  useEffect(() => {
    if (!party.length) return
    const id = setInterval(() => {
      const h = party[Math.floor(Math.random() * party.length)]
      setAttackPulse({ [h]: Date.now() })
    }, 300)
    return () => clearInterval(id)
  }, [party])

  // Кэшируем размеры арены — getBoundingClientRect() в каждом тапе тяжёлый.
  useEffect(() => {
    function update() {
      if (arenaRef.current) arenaRectRef.current = arenaRef.current.getBoundingClientRect()
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  function spawnPop(x, y, dmg, crit) {
    // Тротлинг: не больше одного цифрового pop'а в 40мс.
    // Иначе при быстром автотапе UI просто захлёбывается.
    const now = performance.now()
    if (now - lastPopRef.current < 40) return
    lastPopRef.current = now
    const id = Math.random().toString(36).slice(2)
    setPops(p => [...p, { id, x, y, dmg, crit }])
    setTimeout(() => setPops(p => p.filter(d => d.id !== id)), 700)
  }

  function flashHit(uid) {
    setHits(prev => ({ ...prev, [uid]: Date.now() }))
    setTimeout(() => {
      setHits(prev => {
        const n = { ...prev }
        delete n[uid]
        return n
      })
    }, 300)
  }

  function onTapBackground(e) {
    if (!arenaRef.current) return
    const rect = arenaRectRef.current || arenaRef.current.getBoundingClientRect()
    const t = e.touches?.[0] || e.changedTouches?.[0] || e
    const x = (t.clientX ?? rect.left + rect.width / 2) - rect.left
    const y = (t.clientY ?? rect.top + rect.height / 2) - rect.top
    tap()
    spawnPop(x, y, tapDmg, Math.random() < 0.1)
    const target = enemies[targetIdx]
    if (target) flashHit(target.uid)
  }

  function onTapEnemy(e, idx) {
    e.stopPropagation()
    if (idx !== targetIdx) setTarget(idx)
    if (!arenaRef.current) return
    const rect = arenaRectRef.current || arenaRef.current.getBoundingClientRect()
    const t = e.touches?.[0] || e.changedTouches?.[0] || e
    const x = (t.clientX ?? rect.left + rect.width / 2) - rect.left
    const y = (t.clientY ?? rect.top + rect.height / 2) - rect.top
    tap()
    spawnPop(x, y, tapDmg, Math.random() < 0.1)
    const target = enemies[idx]
    if (target) flashHit(target.uid)
  }

  return (
    <main className={'arena' + (superActive ? ' super' : '')}>
      <ArenaBackground />
      <div className="arena-bg" style={{ '--glow': weapon.glow }} />

      <div ref={arenaRef} className="tap-area" onPointerDown={onTapBackground}>
        {pops.map(p => (
          <span
            key={p.id}
            className={'dmg-pop' + (p.crit ? ' crit' : '')}
            style={{ left: p.x, top: p.y }}
          >
            {p.crit ? '✦ ' : ''}{fmt(p.dmg)}
          </span>
        ))}
      </div>

      <div className="arena-hud">
        <div className="weapon-hud">
          <Sprite name={weapon.sprite} size={36} />
          <div className="meta">
            <span className="nm">{weapon.name}</span>
            <span className="st">Урон: <b>{fmt(tapDmg)}</b> · DPS: <b>{fmt(dps)}</b></span>
          </div>
        </div>

        <button
          className={'super-btn' + (rage >= 100 ? ' ready' : '')}
          disabled={rage < 100}
          onClick={(e) => { e.stopPropagation(); activateSuper() }}
        >
          <span className="rage-fill" style={{ height: rage + '%' }} />
          <span className="super-label">⚡</span>
          <span className="super-pct">{Math.floor(rage)}%</span>
        </button>
      </div>

      <BoostsHud />

      {/* Линия героев */}
      <div className="hero-line">
        {party.slice(0, 5).map(id => {
          const hero = getHero(id)
          if (!hero) return null
          const attacking = attackPulse[id] && Date.now() - attackPulse[id] < 240
          const hp = towerPartyHp?.[id]
          const dead = hp && hp.hp <= 0
          const pct = hp ? Math.max(0, Math.min(100, (hp.hp / hp.maxHp) * 100)) : 0
          return (
            <div key={id} className={'hero-fighter' + (attacking ? ' attacking' : '') + (dead ? ' dead' : '')}>
              <Hero role={hero.role} size={56} />
              <span className={'role-flag ' + hero.role} />
              {hp && (
                <div className="hero-hp" title={`${hp.hp}/${hp.maxHp}`}>
                  <div className="hero-hp-bar" style={{ width: pct + '%' }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Враги */}
      <div className="enemy-line">
        {enemies.map((en, i) => {
          const pct = Math.max(0, Math.min(100, (en.hp / en.maxHp) * 100))
          const dead = en.hp <= 0
          const size = en.isBoss ? 200 : 140
          const isHit = !!hits[en.uid]
          const elem = en.element ? ELEMENTS[en.element] : null
          const statuses = en.statuses ? Object.keys(en.statuses) : []
          return (
            <button
              key={en.uid}
              className={
                'enemy-slot' +
                (en.isBoss ? ' boss' : '') +
                (i === targetIdx ? ' focused' : '') +
                (dead ? ' dead' : '') +
                (isHit ? ' hit' : '')
              }
              onPointerDown={(e) => onTapEnemy(e, i)}
              disabled={dead}
            >
              <div className="enemy-hud">
                {(statuses.length > 0 || (en.isBoss && (en.shield || en.enrage || en.roleLock))) && (
                  <div className="status-row">
                    {statuses.map(sid => {
                      const def = STATUSES[sid]
                      if (!def) return null
                      return (
                        <span key={sid} className="status-pill" style={{ borderColor: def.color, color: def.color }} title={def.name}>
                          {def.icon}
                        </span>
                      )
                    })}
                    {en.isBoss && en.shield > 0 && <span className="status-pill phase">🛡️</span>}
                    {en.isBoss && en.enrage && <span className="status-pill phase rage">😡</span>}
                    {en.isBoss && en.roleLock && (
                      <span className="status-pill phase lock" title={`Только ${en.roleLock}`}>
                        🔒{en.roleLock === 'mage' ? '🔮' : en.roleLock === 'ranged' ? '🏹' : '⚔️'}
                      </span>
                    )}
                  </div>
                )}
                <div className="hp-row">
                  {elem && (
                    <span className="el-chip" style={{ background: elem.color, color: '#0a0a14' }} title={elem.name}>
                      {elem.icon}
                    </span>
                  )}
                  <div className="mini-hp">
                    <div className="mini-hp-bar" style={{ width: pct + '%' }} />
                  </div>
                </div>
                <div className="mini-hp-text">{fmt(Math.max(0, en.hp))} / {fmt(en.maxHp)}</div>
              </div>
              <span className="hit-flash" />
              <Sprite name={en.sprite} size={size} />
            </button>
          )
        })}
      </div>
    </main>
  )
}
