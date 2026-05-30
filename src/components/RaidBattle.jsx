import React, { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { getRaid } from '../data/raids.js'
import { getHero } from '../data/heroes.js'
import { Sprite, Hero } from '../assets/sprites.jsx'
import { Icon } from '../assets/Icon.jsx'
import ArenaBackground from './ArenaBackground.jsx'
import { fmt } from '../utils/fmt.js'

/**
 * Боевая сцена рейда: показывается, пока активен raidActive.
 * Авто-бой: HP уменьшается из getCurrentDps; игрок может тапать босса.
 * По завершении в сторе появляется _lastRaidResult — показываем summary.
 */
export default function RaidBattle() {
  const active = useGameStore(s => s.raidActive)
  const lastResult = useGameStore(s => s._lastRaidResult)
  const tap = useGameStore(s => s.raidTap)
  const party = useGameStore(s => s.party)
  const dps = useGameStore(s => s.getCurrentDps())

  const [pops, setPops] = useState([])
  const [hit, setHit] = useState(false)
  const sceneRef = useRef(null)

  // Локальный summary-state — стор очищаем сразу, чтобы окно не залипло.
  const [summary, setSummary] = useState(null)
  useEffect(() => {
    if (lastResult) {
      setSummary(lastResult)
      useGameStore.setState({ _lastRaidResult: null })
    }
  }, [lastResult])

  if (!active && !summary) return null

  const raid = active ? getRaid(active.id) : null
  const boss = active?.boss
  const pct = boss ? Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100)) : 100
  const timeLeft = active ? Math.max(0, active.endsAt - Date.now()) : 0
  const sec = Math.ceil(timeLeft / 1000)
  const minutesLeft = Math.floor(sec / 60)
  const secLeft = sec % 60
  const tapDmg = useGameStore.getState().getTapDamage()

  function spawnPop(x, y, dmg, crit) {
    const id = Math.random().toString(36).slice(2)
    setPops(p => [...p, { id, x, y, dmg, crit }])
    setTimeout(() => setPops(p => p.filter(d => d.id !== id)), 700)
  }
  function flashHit() {
    setHit(true)
    setTimeout(() => setHit(false), 240)
  }
  function onTap(e) {
    if (!sceneRef.current) return
    const rect = sceneRef.current.getBoundingClientRect()
    const t = e.touches?.[0] || e.changedTouches?.[0] || e
    const x = (t.clientX ?? rect.left + rect.width / 2) - rect.left
    const y = (t.clientY ?? rect.top + rect.height / 2) - rect.top
    tap()
    spawnPop(x, y, tapDmg, Math.random() < 0.1)
    flashHit()
  }

  return (
    <>
      {active && raid && boss && (
        <div className="raid-scene">
          <ArenaBackground />
          {/* виньет */}
          <div className="raid-vignette" />

          <header className="raid-top">
            <div className="raid-name">
              <Sprite name={raid.sprite} size={28} />
              <span className="raid-title">{raid.name}</span>
            </div>
            <div className="raid-timer">
              <Icon name="clock" size={14} />
              <span>{minutesLeft}:{String(secLeft).padStart(2, '0')}</span>
            </div>
          </header>

          {/* HP босса */}
          <div className="raid-hp-wrap">
            <div className="raid-hp">
              <div className="raid-hp-bar" style={{ width: pct + '%' }} />
              <span className="raid-hp-text">{fmt(Math.max(0, boss.hp))} / {fmt(boss.maxHp)}</span>
            </div>
            <div className="raid-stat">DPS: <b>{fmt(dps)}</b></div>
          </div>

          {/* Сцена */}
          <main
            className={'raid-arena' + (hit ? ' hit' : '')}
            ref={sceneRef}
            onPointerDown={onTap}
          >
            <div className={'raid-boss' + (hit ? ' hit' : '')}>
              <Sprite name={raid.sprite} size={220} />
              <span className="boss-shadow" />
              <span className="boss-flash" />
            </div>
            {pops.map(p => (
              <span key={p.id} className={'dmg-pop' + (p.crit ? ' crit' : '')} style={{ left: p.x, top: p.y }}>
                {p.crit ? '✦ ' : ''}{fmt(p.dmg)}
              </span>
            ))}
          </main>

          {/* Отряд */}
          <div className="raid-party">
            {party.slice(0, 5).map(id => {
              const hero = getHero(id)
              if (!hero) return null
              return (
                <div key={id} className="raid-fighter">
                  <Hero role={hero.role} size={48} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {summary && (
        <div className="reveal-overlay" onClick={() => setSummary(null)}>
          <div
            className={'summary-card ' + (summary.ok ? 'rarity-legendary' : 'rarity-rare')}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="reveal-burst" />
            <div className="reveal-ttl">{summary.ok ? 'Рейд пройден!' : 'Поражение'}</div>
            <div className="reveal-name" style={{ marginTop: 8 }}>{summary.name}</div>
            {summary.ok ? (
              <>
                <div className="reveal-rarity">Награда</div>
                <div className="summary-rewards">
                  {summary.gold > 0 && (
                    <div className="srew gold">
                      <Icon name="gold" size={18} />
                      <div className="srew-meta">
                        <span className="srew-num">+{fmt(summary.gold)}</span>
                        <span className="srew-name">Золото</span>
                      </div>
                    </div>
                  )}
                  {summary.drop > 0 && (
                    <div className="srew shards">
                      <Icon name={raidIcon(summary.material)} size={18} />
                      <div className="srew-meta">
                        <span className="srew-num">+{summary.drop}</span>
                        <span className="srew-name">{raidLabel(summary.material)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="reveal-rarity">Время вышло. Усилься и попробуй снова.</div>
            )}
            <button className="btn gold size-md block" onClick={() => setSummary(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </>
  )
}

function raidIcon(material) {
  if (material === 'dragon') return 'scale'
  if (material === 'lich') return 'skull'
  if (material === 'golem') return 'rock'
  return 'artifact'
}
function raidLabel(material) {
  if (material === 'dragon') return 'Чешуя дракона'
  if (material === 'lich') return 'Эссенция лича'
  if (material === 'golem') return 'Ядро голема'
  return 'Материал'
}
