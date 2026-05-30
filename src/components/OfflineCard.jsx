import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'

const CAP_HOURS = 8

export default function OfflineCard() {
  const peek = useGameStore(s => s.peekOffline)
  const claim = useGameStore(s => s.claimOffline)
  const [data, setData] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => {
      const r = peek()
      if (r) setData(r)
    }, 700)
    return () => clearTimeout(t)
  }, [peek])

  if (!data) return null

  const hours = Math.floor(data.seconds / 3600)
  const mins = Math.floor((data.seconds % 3600) / 60)
  const pct = Math.min(100, (data.seconds / (CAP_HOURS * 3600)) * 100)
  // Скорость дохода в час, чтобы показать «темп».
  const goldPerHour = data.seconds > 0 ? data.gold / (data.seconds / 3600) : 0

  function onClaim() {
    claim()
    setData(null)
  }

  return (
    <div className="reveal-overlay" onClick={() => setData(null)}>
      <div className="offline-card" onClick={(e) => e.stopPropagation()}>
        <div className="off-glow" />
        <div className="off-rays" aria-hidden />

        <div className="off-icon-wrap">
          <span className="off-icon-pulse" aria-hidden />
          <div className="off-icon"><Icon name="clock" size={32} /></div>
        </div>

        <div className="off-title">С возвращением!</div>
        <div className="off-sub">Отряд работал, пока вас не было</div>

        <div className="off-time">
          <Icon name="clock" size={14} />
          <span><b>{hours}ч {mins}м</b> · {pct.toFixed(0)}% от {CAP_HOURS}ч кап</span>
        </div>

        <div className="off-progress">
          <div className="off-progress-bar" style={{ width: pct + '%' }} />
        </div>

        <div className="off-reward-block">
          <div className="off-reward-row">
            <span className="off-rew-label">Накоплено</span>
            <span className="off-reward">
              <Icon name="gold" size={20} />
              <span className="off-reward-num">+{fmt(data.gold)}</span>
            </span>
          </div>
          <div className="off-rate">
            ~ <b>{fmt(Math.round(goldPerHour))}</b> 🪙/час
          </div>
        </div>

        <button className="btn gold size-md block off-claim-btn" onClick={onClaim}>
          ✦ Забрать награду
        </button>

        <div className="off-hint">
          Накопление продолжится, но не больше {CAP_HOURS} часов. Заходите чаще.
        </div>
      </div>
    </div>
  )
}
