import React, { useEffect, useState } from 'react'
import { RAIDS, getRaid } from '../data/raids.js'
import { EXPEDITIONS as EXPEDITIONS_DATA } from '../data/expeditions.js'
import { HEROES } from '../data/heroes.js'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Sprite } from '../assets/sprites.jsx'
import { Icon } from '../assets/Icon.jsx'

const MATERIAL = {
  dragon:  { icon: 'scale',    label: 'Чешуя дракона' },
  lich:    { icon: 'skull',    label: 'Эссенция лича' },
  golem:   { icon: 'rock',     label: 'Ядро голема' },
  titan:   { icon: 'bolt',     label: 'Грозовой кристалл' },
  hydra:   { icon: 'gem',      label: 'Иней гидры' },
  archon:  { icon: 'artifact', label: 'Тень архонта' },
  demon:   { icon: 'flame',    label: 'Пепел демона' },
  phoenix: { icon: 'crown',    label: 'Перо феникса' },
  warden:  { icon: 'crown',    label: 'Реликвия стража' },
}

function fmtCooldown(ms) {
  const sec = Math.floor(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m > 0) return `${m} мин ${s ? s + ' с' : ''}`.trim()
  return `${s} с`
}

function useNow(intervalMs = 250) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export default function RaidsPanel({ onClose }) {
  const now = useNow()
  const active = useGameStore(s => s.raidActive)
  const cd = useGameStore(s => s.raidCooldowns)
  const start = useGameStore(s => s.startRaid)
  const setToaster = useGameStore(s => s.setToaster)
  const escalation = useGameStore(s => s.raidEscalation || {})
  const [openId, setOpenId] = useState(null)
  const [tab, setTab] = useState('raids')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.__bofToast) {
      setToaster(window.__bofToast)
    }
  }, [setToaster])

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Рейды</h2>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="raid-tabs">
        <button className={'raid-tab' + (tab === 'raids'  ? ' active' : '')} onClick={() => setTab('raids')}>Боссы</button>
        <button className={'raid-tab' + (tab === 'event'  ? ' active' : '')} onClick={() => setTab('event')}>Ивент</button>
        <button className={'raid-tab' + (tab === 'rush'   ? ' active' : '')} onClick={() => setTab('rush')}>Boss Rush</button>
        <button className={'raid-tab' + (tab === 'expeds' ? ' active' : '')} onClick={() => setTab('expeds')}>Экспедиции</button>
      </div>

      {tab === 'raids' && (
        <>
          <div className="raid-list">
            {RAIDS.map(r => {
              const isActive = active && active.id === r.id
              const cooldownLeft = Math.max(0, (cd[r.id] || 0) - now)
              const mat = MATERIAL[r.material] || { icon: 'artifact', label: r.material }
              const stacks = escalation[r.id] || 0
              const escMult = 1 + 0.05 * stacks

              return (
                <button
                  key={r.id}
                  className="raid-card raid-card-btn"
                  onClick={() => setOpenId(r.id)}
                >
                  <Sprite name={r.sprite} size={64} />
                  <div className="r-body">
                    <div className="r-name">
                      {r.name}
                      {stacks > 0 && <span className="esc-tag" title="Эскалация">⬆ {stacks}</span>}
                    </div>
                    <div className="r-meta">
                      <Icon name="gold" size={12} /> <b>{fmt(Math.ceil(r.rewardGold * escMult))}</b>
                      {mat && (
                        <>
                          {' · '}
                          <Icon name={mat.icon} size={12} /> {r.rewardMin}–{r.rewardMax}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="r-action">
                    {isActive ? (
                      <span className="badge current">Идёт</span>
                    ) : cooldownLeft > 0 ? (
                      <span className="badge locked"><Icon name="clock" size={12} /> {Math.ceil(cooldownLeft / 1000)}c</span>
                    ) : (
                      <span className="badge">Подробнее ›</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="hint">
            В рейде учитывается ваш фактический DPS. Каждое успешное прохождение +5% сложности и +5% к награде — навсегда.
          </div>
        </>
      )}

      {tab === 'event'  && <EventBossTab now={now} />}
      {tab === 'rush'   && <BossRushTab onClose={onClose} now={now} />}
      {tab === 'expeds' && <ExpeditionsTab now={now} />}

      {openId && (
        <RaidInfoModal
          raid={getRaid(openId)}
          mat={MATERIAL[getRaid(openId)?.material]}
          cooldownLeft={Math.max(0, (cd[openId] || 0) - now)}
          isActive={active?.id === openId}
          busy={!!active}
          onStart={() => {
            const res = start(openId)
            if (res?.ok && onClose) onClose()
            setOpenId(null)
          }}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  )
}

function RaidInfoModal({ raid, mat, cooldownLeft, isActive, busy, onStart, onClose }) {
  if (!raid) return null
  // Грубая оценка HP — те же 90% от minDps×duration, что и в стартере боя.
  const estHp = Math.ceil(raid.minDps * raid.duration * 0.9)

  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div className="raid-info" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn raid-info-close" onClick={onClose}><Icon name="close" size={16} /></button>

        <div className="raid-info-art">
          <div className="ri-glow" />
          <Sprite name={raid.sprite} size={130} />
        </div>

        <div className="raid-info-name">{raid.name}</div>
        <div className="raid-info-desc">{raid.desc}</div>

        <div className="raid-info-grid">
          <div className="ri-stat">
            <Icon name="bolt" size={16} />
            <div>
              <span className="ri-num">{fmt(estHp)}</span>
              <span className="ri-name">HP босса</span>
            </div>
          </div>
          <div className="ri-stat">
            <Icon name="clock" size={16} />
            <div>
              <span className="ri-num">{raid.duration} c</span>
              <span className="ri-name">Длительность</span>
            </div>
          </div>
          <div className="ri-stat">
            <Icon name="chart" size={16} />
            <div>
              <span className="ri-num">{fmt(raid.minDps)}</span>
              <span className="ri-name">Мин. DPS</span>
            </div>
          </div>
          <div className="ri-stat">
            <Icon name="clock" size={16} />
            <div>
              <span className="ri-num">{fmtCooldown(raid.cooldown)}</span>
              <span className="ri-name">Перезарядка</span>
            </div>
          </div>
        </div>

        <div className="raid-info-section-title">Награды</div>
        <div className="raid-info-rewards">
          <div className="rir gold">
            <Icon name="gold" size={18} />
            <div className="rir-meta">
              <span className="rir-num">+{fmt(raid.rewardGold)}</span>
              <span className="rir-name">Золото</span>
            </div>
          </div>
          {mat && (
            <div className="rir mat">
              <Icon name={mat.icon} size={18} />
              <div className="rir-meta">
                <span className="rir-num">{raid.rewardMin}–{raid.rewardMax}</span>
                <span className="rir-name">{mat.label}</span>
              </div>
            </div>
          )}
        </div>

        <div className="raid-info-actions">
          {isActive ? (
            <button className="btn ghost size-md block" disabled>Рейд уже идёт</button>
          ) : cooldownLeft > 0 ? (
            <button className="btn ghost size-md block" disabled>
              <Icon name="clock" size={14} /> {Math.ceil(cooldownLeft / 1000)} с до возможности
            </button>
          ) : (
            <button className="btn neon size-md block" disabled={busy} onClick={onStart}>
              Начать бой
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


// =============== Ивент-боссы ===============
function EventBossTab({ now }) {
  const status = useGameStore(s => s.eventBossStatus())
  const attack = useGameStore(s => s.eventBossAttack)
  const claim = useGameStore(s => s.eventBossClaim)
  const claimed = useGameStore(s => s.eventBoss?.claimed || [])
  const { def, cur, left, cdLeft, attemptsLeft, damagePct } = status

  return (
    <div className="raid-list">
      <div className="evt-card" style={{ '--ac': def.color }}>
        <div className="evt-art">
          <Sprite name={def.sprite} size={84} />
          <span className="evt-icon">{def.icon}</span>
        </div>
        <div className="evt-meta">
          <div className="evt-name">{def.name}</div>
          <div className="evt-desc">{def.desc}</div>
          <div className="evt-stats">
            <span><Icon name="clock" size={12} /> Цикл: {def.cycleHours} ч</span>
            <span><Icon name="bolt" size={12} /> Попыток: <b>{attemptsLeft}</b> / {def.maxAttempts}</span>
          </div>
        </div>
      </div>

      <div className="evt-progress">
        <div className="evt-progress-meta">
          <span>HP: <b>{fmt(cur.maxHp - cur.damage)}</b> / {fmt(cur.maxHp)}</span>
          <span>{Math.round(damagePct * 100)}%</span>
        </div>
        <div className="evt-progress-bar">
          <div className="evt-progress-fill" style={{ width: (damagePct * 100) + '%' }} />
        </div>
        <div className="evt-progress-meta sub">
          <span>До конца цикла: {formatLeft(left)}</span>
          <span>{cdLeft > 0 ? `Перезарядка: ${formatLeft(cdLeft)}` : 'Готов к атаке'}</span>
        </div>
      </div>

      <button
        className="btn neon size-md block"
        disabled={cdLeft > 0 || attemptsLeft <= 0 || left <= 0 || damagePct >= 1}
        onClick={() => attack()}
      >
        {damagePct >= 1
          ? 'Босс повержен'
          : left <= 0
          ? 'Цикл завершён'
          : attemptsLeft <= 0
          ? 'Попыток нет'
          : cdLeft > 0
          ? `До следующей: ${formatLeft(cdLeft)}`
          : 'Атаковать!'}
      </button>

      <div className="evt-thresholds">
        <div className="evt-thresholds-title">Награды по урону</div>
        {def.rewards.map((r, idx) => {
          const reached = damagePct >= r.atPct
          const isClaimed = claimed.includes(idx)
          return (
            <div key={idx} className={'evt-threshold' + (reached ? ' reached' : '') + (isClaimed ? ' claimed' : '')}>
              <div className="evt-threshold-pct">{Math.round(r.atPct * 100)}%</div>
              <div className="evt-threshold-rewards">
                {r.gold   ? <span><Icon name="gold" size={12} /> {fmt(r.gold)}</span>   : null}
                {r.gems   ? <span><Icon name="gem"  size={12} /> {r.gems}</span>        : null}
                {r.ore    ? <span><Icon name="ore"  size={12} /> {r.ore}</span>         : null}
                {r.shards ? <span><Icon name="artifact" size={12} /> {r.shards}</span> : null}
                {r.gear   ? <span className={'evt-gear-tag ' + r.gear}>{r.gear === 'legendary' ? 'Легендарный шмот' : r.gear === 'epic' ? 'Эпический шмот' : 'Редкий шмот'}</span> : null}
              </div>
              {isClaimed ? (
                <span className="evt-threshold-state ok">✓</span>
              ) : reached ? (
                <button className="btn gold size-sm" onClick={() => claim(idx)}>Забрать</button>
              ) : (
                <span className="evt-threshold-state lock">🔒</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="hint">
        Урон копится за весь цикл. Награды можно забирать сразу при достижении порогов.
      </div>
    </div>
  )
}

// =============== Boss Rush ===============
function BossRushTab({ onClose, now }) {
  const active = useGameStore(s => s.bossRushActive)
  const cooldown = useGameStore(s => s.bossRushCooldown || 0)
  const can = useGameStore(s => s.canStartBossRush())
  const start = useGameStore(s => s.startBossRush)
  const finish = useGameStore(s => s.finishBossRush)

  const remaining = active ? Math.max(0, active.endsAt - Date.now()) : 0
  const cdLeft = Math.max(0, cooldown - now)

  return (
    <div className="raid-list">
      <div className="rush-card">
        <div className="rush-head">
          <span className="rush-icon">⚔️</span>
          <div className="rush-meta">
            <div className="rush-title">Boss Rush · 2 минуты</div>
            <div className="rush-desc">Бей столько боссов, сколько успеешь. Награды растут с каждым убитым.</div>
          </div>
        </div>

        {active ? (
          <>
            <div className="rush-stats">
              <span>Убито: <b>{active.killed}</b></span>
              <span>Осталось: <b>{Math.ceil(remaining / 1000)}c</b></span>
            </div>
            <button className="btn ghost size-md block" onClick={() => { finish(); onClose?.() }}>
              Завершить досрочно
            </button>
          </>
        ) : (
          <>
            <div className="rush-rewards">
              <div className="rr">⭐ звёзды славы</div>
              <div className="rr">💎 гемы</div>
              <div className="rr">🔮 осколки артефактов</div>
              <div className="rr">📦 материалы рейдов</div>
            </div>
            <button
              className="btn neon size-md block"
              disabled={!can}
              onClick={() => { start(); onClose?.() }}
            >
              {cdLeft > 0
                ? `До следующего: ${formatLeft(cdLeft)}`
                : (can ? 'Начать Boss Rush' : 'Сейчас занят')}
            </button>
          </>
        )}
      </div>

      <div className="hint">
        Раз в 22 часа. Награды растут с количеством убитых: 5+, 10+, 15+, 20+ дают всё крупнее.
      </div>
    </div>
  )
}

function formatLeft(ms) {
  const s = Math.ceil(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}ч ${m}м`
  if (m > 0) return `${m}м ${sec}с`
  return `${sec}с`
}

// =============== Экспедиции ===============
function ExpeditionsTab({ now }) {
  const expeditions = useGameStore(s => s.expeditions || {})
  const start = useGameStore(s => s.startExpedition)
  const claim = useGameStore(s => s.claimExpedition)
  const unlocked = useGameStore(s => s.unlockedHeroes)
  const heroLevels = useGameStore(s => s.heroLevels)
  const maxStage = useGameStore(s => s.maxStage || s.stage)
  const [picker, setPicker] = useState(null) // { def }

  // Импорт списков выше через ES-модуль
  const EXPEDITIONS_INNER = EXPEDITIONS_DATA

  return (
    <div className="raid-list">
      {EXPEDITIONS_INNER.map(def => {
        const e = expeditions[def.id]
        const running = !!(e && e.endsAt > Date.now())
        const ready = !!(e && e.endsAt <= Date.now() && !e.claimed)
        const locked = maxStage < def.minStage
        const remain = e ? Math.max(0, e.endsAt - Date.now()) : 0

        return (
          <div key={def.id} className={'expd-card' + (locked ? ' locked' : '')}>
            <div className="expd-head">
              <span className="expd-icon">{def.icon}</span>
              <div className="expd-meta">
                <div className="expd-name">{def.name}</div>
                <div className="expd-desc">{def.desc}</div>
                <div className="expd-need">Героев: {def.heroes} · Длительность: {Math.round(def.duration / 3600000)}ч · Зона {def.minStage}+</div>
              </div>
            </div>
            <div className="expd-rewards">
              {def.reward.gold   > 0 && <span>🪙 {fmt(def.reward.gold)}</span>}
              {def.reward.ore    > 0 && <span>⛏️ {def.reward.ore}</span>}
              {def.reward.shards > 0 && <span>🔮 {def.reward.shards}</span>}
              {def.reward.gems   > 0 && <span>💎 {def.reward.gems}</span>}
              {def.reward.stars  > 0 && <span>⭐ {def.reward.stars}</span>}
              {def.reward.mat       && <span>📦 {def.reward.mat}</span>}
            </div>
            {locked ? (
              <button className="btn ghost size-md block" disabled>Откроется на зоне {def.minStage}</button>
            ) : ready ? (
              <button className="btn gold size-md block" onClick={() => claim(def.id)}>Забрать награду</button>
            ) : running ? (
              <button className="btn ghost size-md block" disabled>В пути · {formatLeft(remain)}</button>
            ) : (
              <button className="btn neon size-md block" onClick={() => setPicker({ def })}>Отправить</button>
            )}
          </div>
        )
      })}

      {picker && (
        <ExpeditionPicker
          def={picker.def}
          unlocked={unlocked}
          heroLevels={heroLevels}
          onCancel={() => setPicker(null)}
          onConfirm={(ids) => { start(picker.def.id, ids); setPicker(null) }}
        />
      )}
    </div>
  )
}

function ExpeditionPicker({ def, unlocked, heroLevels, onCancel, onConfirm }) {
  const [picked, setPicked] = useState([])
  const list = HEROES.filter(h => unlocked.includes(h.id))

  function toggle(id) {
    setPicked(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= def.heroes) return prev
      return [...prev, id]
    })
  }

  return (
    <div className="reveal-overlay" onClick={onCancel}>
      <div className="expd-picker" onClick={(e) => e.stopPropagation()}>
        <div className="syn-modal-tag">{def.icon} {def.name}</div>
        <div className="syn-modal-title">Выбери {def.heroes} героев</div>
        <div className="expd-pick-grid">
          {list.map(h => {
            const lvl = heroLevels[h.id] || 1
            const on = picked.includes(h.id)
            return (
              <button key={h.id} className={'expd-pick' + (on ? ' on' : '')} onClick={() => toggle(h.id)}>
                <div className="expd-pick-name">{h.name}</div>
                <div className="expd-pick-lvl">ур. {lvl}</div>
              </button>
            )
          })}
        </div>
        <div className="expd-pick-actions">
          <button className="btn ghost size-md" onClick={onCancel}>Отмена</button>
          <button className="btn neon size-md" disabled={picked.length !== def.heroes} onClick={() => onConfirm(picked)}>Отправить</button>
        </div>
      </div>
    </div>
  )
}
