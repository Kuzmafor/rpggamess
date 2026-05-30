import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'
import {
  BP_REWARDS, BP_MAX_LEVEL, RWD_LABEL, RWD_ICON, PREMIUM_COST_GEMS,
  rewardScale, scaleReward,
} from '../data/battlePass.js'
import { HEROES, getHero } from '../data/heroes.js'
import { Hero } from '../assets/sprites.jsx'

function findHeroByBase(baseId) {
  return getHero(baseId) || HEROES.find(h => h.id === baseId || h.id.startsWith(baseId + '_')) || null
}

function fmtTimeLeft(ms) {
  if (ms <= 0) return 'завершён'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d} д ${h} ч`
  if (h > 0) return `${h} ч ${m} м`
  return `${m} м`
}

export default function BattlePassPanel({ onClose, embedded = false }) {
  const status = useGameStore(s => s.bpStatus())
  const claim = useGameStore(s => s.bpClaim)
  const buyPremium = useGameStore(s => s.buyBpPremium)
  const claimedFree = useGameStore(s => s.bp?.claimedFree || [])
  const claimedPremium = useGameStore(s => s.bp?.claimedPremium || [])
  const gems = useGameStore(s => s.gems)
  const stage = useGameStore(s => s.stage)
  const maxStage = useGameStore(s => s.maxStage || s.stage)
  const ngLevel = useGameStore(s => s.ngLevel || 0)

  // Масштабированные награды по прогрессу игрока (пересчитываются при росте зоны/витка)
  const scaledRewards = useMemo(() => {
    const sc = rewardScale({ stage, maxStage, ngLevel })
    return BP_REWARDS.map(r => ({
      level: r.level,
      free: scaleReward(r.free, sc),
      premium: scaleReward(r.premium, sc),
    }))
  }, [stage, maxStage, ngLevel])

  // тик раз в минуту, чтобы обновлялся таймер сезона
  const [, force] = useState(0)
  useEffect(() => {
    const id = setInterval(() => force(v => v + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const { season, level, inLevel, need, premium, timeLeftMs } = status

  // Авто-скролл к текущему уровню при первом открытии.
  // Используем scrollLeft напрямую (без scrollIntoView, который дёргает
  // и вертикальный контейнер страницы).
  const trackRef = useRef(null)
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const id = requestAnimationFrame(() => {
      const lvl = Math.max(1, Math.min(level || 1, BP_MAX_LEVEL))
      const el = track.querySelector(`.bp-stage[data-level="${lvl}"]`)
      if (!el) return
      // центрируем выбранную колонку внутри трека по горизонтали
      const target = el.offsetLeft - (track.clientWidth / 2) + (el.clientWidth / 2)
      track.scrollLeft = Math.max(0, target)
    })
    return () => cancelAnimationFrame(id)
  }, []) // только на маунт

  const finalReward = BP_REWARDS[BP_MAX_LEVEL - 1]
  const finalHero = finalReward?.premium?.heroId
    ? findHeroByBase(finalReward.premium.heroId)
    : null

  const finalReached = level >= BP_MAX_LEVEL
  const finalClaimed = claimedPremium.includes(BP_MAX_LEVEL)

  const body = (
      <div className="bp2-scroll">
        {/* Hero header сезона */}
        <div className="bp2-hero" style={{ '--ac': season.accent, '--ac2': season.color }}>
          <div className="bp2-hero-bg" />
          <div className="bp2-hero-info">
            <div className="bp2-hero-tag">Сезон {season.id.replace(/^season_/, '')}</div>
            <div className="bp2-hero-title">{season.name}</div>
            <div className="bp2-hero-desc">{season.desc}</div>
          </div>
          <div className="bp2-hero-art">
            {finalHero ? (
              <Hero role={finalHero.role} size={110} />
            ) : (
              <Icon name="crown" size={64} />
            )}
            <div className="bp2-hero-art-glow" />
          </div>
        </div>

        {/* Прогресс текущего уровня */}
        <div className="bp2-progress">
          <div className="bp2-progress-meta">
            <span>Уровень <b>{level}</b> / {BP_MAX_LEVEL}</span>
            <span className="bp2-progress-xp">{inLevel} / {need} XP</span>
          </div>
          <div className="bp2-progress-bar">
            <div
              className="bp2-progress-fill"
              style={{ width: Math.min(100, (inLevel / Math.max(1, need)) * 100) + '%' }}
            />
          </div>
        </div>

        {/* Парадная секция — финальная награда сезона */}
        {finalHero && (
          <div className={'bp2-final-card' + (finalReached ? ' reached' : '') + (finalClaimed ? ' claimed' : '')}>
            <div className="bp2-final-rays" aria-hidden />
            <div className="bp2-final-ring" aria-hidden />
            <div className="bp2-final-spark s1" aria-hidden />
            <div className="bp2-final-spark s2" aria-hidden />
            <div className="bp2-final-spark s3" aria-hidden />
            <div className="bp2-final-spark s4" aria-hidden />
            <div className="bp2-final-art">
              <Hero role={finalHero.role} size={120} />
            </div>
            <div className="bp2-final-meta">
              <div className="bp2-final-tag">★ Финал сезона · ур. {BP_MAX_LEVEL}</div>
              <div className="bp2-final-name">{finalHero.name}</div>
              <div className="bp2-final-sub">
                Эксклюзивный герой сезона. Не выпадает из сундуков и не продаётся.
              </div>
            </div>
          </div>
        )}

        {/* Кнопка покупки премиума */}
        {!premium && (
          <button
            className="btn neon size-md block bp2-buy-btn"
            disabled={gems < PREMIUM_COST_GEMS}
            onClick={() => buyPremium()}
          >
            <span className="bp2-buy-title">Премиум-пропуск</span>
            <span className="bp2-buy-sub">эксклюзивный герой + бонусы</span>
            <span className="bp2-buy-cost"><Icon name="gem" size={14} /> {PREMIUM_COST_GEMS}</span>
          </button>
        )}

        {/* Панель с треком наград */}
        <div className="bp2-track-panel">
          <div className="bp2-track-head">
            <span className="bp-section-head">Награды по уровням</span>
            <div className="bp2-track-legend">
              <span className="bp2-legend free">Free</span>
              <span className="bp2-legend prem">Premium</span>
            </div>
          </div>

          {/* Горизонтальный трек по уровням */}
          <div className="bp2-track" ref={trackRef}>
            {scaledRewards.map(row => {
              const reached = level >= row.level
              const claimedF = claimedFree.includes(row.level)
              const claimedP = claimedPremium.includes(row.level)
              const isFinal = row.level === BP_MAX_LEVEL
              return (
                <div
                  key={row.level}
                  data-level={row.level}
                  className={'bp-stage' + (reached ? ' reached' : '') + (isFinal ? ' final' : '')}
                >
                  {/* Бесплатная награда */}
                  <RewardCard
                    reward={row.free}
                    reached={reached}
                    unlocked={true}
                    claimed={claimedF}
                    onClaim={() => claim(row.level, 'free')}
                    variant="free"
                  />

                  {/* Бейдж уровня */}
                  <div className={'bp-stage-badge' + (reached ? ' reached' : '')}>
                    <span>{row.level}</span>
                  </div>

                  {/* Премиум */}
                  <RewardCard
                    reward={row.premium}
                    reached={reached}
                    unlocked={premium}
                    claimed={claimedP}
                    onClaim={() => claim(row.level, 'premium')}
                    variant="premium"
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Статистика прохождения */}
        <div className="bp2-stats">
          <div className="bp2-stat">
            <span className="bp2-stat-num">{claimedFree.length}</span>
            <span className="bp2-stat-name">Free собрано</span>
          </div>
          <div className="bp2-stat">
            <span className="bp2-stat-num">{premium ? claimedPremium.length : '—'}</span>
            <span className="bp2-stat-name">Premium собрано</span>
          </div>
          <div className="bp2-stat">
            <span className="bp2-stat-num">{Math.min(level, BP_MAX_LEVEL)} / {BP_MAX_LEVEL}</span>
            <span className="bp2-stat-name">Уровень сезона</span>
          </div>
        </div>
      </div>
  )

  if (embedded) return body

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Battle Pass</h2>
        <span className="panel-sub">{fmtTimeLeft(timeLeftMs)}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>
      {body}
    </section>
  )
}

function RewardCard({ reward, reached, unlocked, claimed, onClaim, variant }) {
  const icon = RWD_ICON[reward.type]
  let label = RWD_LABEL[reward.type] || '—'
  let isHero = false
  let heroRole = null
  if (reward.type === 'hero' && reward.heroId) {
    const hero = findHeroByBase(reward.heroId)
    if (hero) {
      label = hero.name
      isHero = true
      heroRole = hero.role
    }
  }
  const amount = reward.type === 'hero'
    ? null
    : reward.type.startsWith('chest_') || reward.type.startsWith('gear_')
      ? '×1'
      : '×' + (reward.amount || 1)

  const canClaim = reached && unlocked && !claimed

  return (
    <button
      className={
        'bp-card ' + variant +
        (claimed ? ' claimed' : '') +
        (canClaim ? ' available' : '') +
        (!unlocked ? ' need-premium' : '') +
        (isHero ? ' is-hero' : '')
      }
      onClick={canClaim ? onClaim : undefined}
      disabled={!canClaim}
    >
      <div className="bp-card-art">
        {isHero && heroRole ? (
          <Hero role={heroRole} size={64} />
        ) : icon ? (
          <Icon name={icon} size={28} />
        ) : (
          <span style={{ fontSize: 20 }}>•</span>
        )}
      </div>

      <div className="bp-card-meta">
        {amount && <div className="bp-card-amount">{amount}</div>}
        <div className="bp-card-label">{label}</div>
      </div>

      {claimed && <div className="bp-card-tick">✓</div>}
      {!unlocked && variant === 'premium' && (
        <div className="bp-card-lock">🔒</div>
      )}
      {canClaim && <div className="bp-card-claim">Забрать</div>}
    </button>
  )
}
