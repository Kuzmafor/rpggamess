import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'

function timeAgo(ts) {
  const d = Math.max(0, Date.now() - ts)
  const m = Math.floor(d / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return m + ' мин назад'
  const h = Math.floor(m / 60)
  if (h < 24) return h + ' ч назад'
  const days = Math.floor(h / 24)
  return days + ' д назад'
}

export default function MailPanel({ onClose }) {
  const mail = useGameStore(s => s.mail)
  const claim = useGameStore(s => s.claimMail)
  const claimAll = useGameStore(s => s.claimAllMail)
  const cleanRead = useGameStore(s => s.deleteReadMail)
  const unread = mail.filter(m => !m.claimed).length

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Почта</h2>
        <span className="panel-sub">Непрочитано: {unread}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="filter-row">
        <button className="btn primary size-sm" disabled={unread === 0} onClick={claimAll}>
          Забрать всё
        </button>
        <button className="btn ghost size-sm" onClick={cleanRead}>
          Очистить прочитанные
        </button>
      </div>

      <div className="mail-list">
        {mail.length === 0 && (
          <div className="hint">Писем нет. Загляните позже.</div>
        )}
        {mail.map(m => (
          <div key={m.id} className={'mail-card' + (m.claimed ? ' claimed' : '')}>
            <div className="mail-icon"><Icon name="gift" size={28} /></div>
            <div className="mail-body">
              <div className="mail-title">
                {m.title}
                {!m.claimed && <span className="dot-new" />}
              </div>
              <div className="mail-text">{m.body}</div>
              <div className="mail-meta">
                <span>{timeAgo(m.ts)}</span>
                <div className="mail-rewards">
                  {m.gold ? <span><Icon name="gold" size={12} /> {fmt(m.gold)}</span> : null}
                  {m.gems ? <span><Icon name="gem" size={12} /> {m.gems}</span> : null}
                  {m.shards ? <span><Icon name="artifact" size={12} /> {m.shards}</span> : null}
                  {m.tp ? <span><Icon name="crown" size={12} /> {m.tp} очк.</span> : null}
                </div>
              </div>
            </div>
            <div className="mail-action">
              {m.claimed
                ? <span className="badge owned"><Icon name="check" size={12} /></span>
                : <button className="btn gold size-sm" onClick={() => claim(m.id)}>Забрать</button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
