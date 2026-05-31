import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'
import { fetchLeaderboard, fetchMyRank } from '../mobile/cloud.js'

// Раздел "Рейтинг": общий топ игроков по прогрессу.
// Игрок, вошедший через Telegram, всегда видит свою карточку прогресса —
// даже если серверный рейтинг ещё не подсчитан или сервер недоступен.

// Тот же расчёт очков, что и на сервере (server/index.js: computeScore),
// чтобы игрок сразу видел свой счёт локально.
function localScore(s) {
  const maxStage = Math.max(1, Math.floor(s.maxStage || s.stage || 1))
  const ngLevel = Math.max(0, Math.floor(s.ngLevel || 0))
  const prestige = Math.max(0, Math.floor(s.prestigeCount || 0))
  return { score: maxStage + ngLevel * 100000 + prestige * 10000, maxStage, ngLevel, prestige }
}

export default function LeaderboardPanel({ onClose }) {
  const tgUser = useGameStore(s => s.profile?.telegram)
  const nickname = useGameStore(s => s.profile?.nickname)
  const local = useGameStore(s => localScore(s))

  // Авторизован = есть профиль Telegram (не зависит от состояния сервера).
  const authed = !!(tgUser && tgUser.id)
  const myName = nickname || tgUser?.username || tgUser?.firstName || 'Вы'

  const [board, setBoard] = useState(null) // null = загрузка
  const [me, setMe] = useState(null)       // ранг с сервера (если доступен)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const b = await fetchLeaderboard()
      if (!alive) return
      if (b === null || b === undefined) setError(true)
      setBoard(b || [])
      if (authed) {
        const r = await fetchMyRank()
        if (alive && r) setMe(r)
      }
    })()
    return () => { alive = false }
  }, [authed])

  const myId = tgUser?.id

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Рейтинг</h2>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="lb-scroll">
        {/* Не вошёл через Telegram — приглашаем авторизоваться */}
        {!authed && (
          <div className="lb-cta">
            <Icon name="crown" size={28} />
            <div className="lb-cta-title">Войдите через Telegram</div>
            <div className="lb-cta-desc">
              Авторизуйтесь на загрузочном экране, чтобы попасть в общий рейтинг
              и сравнить прогресс с другими игроками.
            </div>
          </div>
        )}

        {/* Моя карточка прогресса (всегда для вошедших) */}
        {authed && (
          <div className="lb-me">
            <div className="lb-me-rank">{me ? '#' + me.rank : '—'}</div>
            <div className="lb-ava lb-me-ava">
              {tgUser?.photoUrl
                ? <img src={tgUser.photoUrl} alt="" />
                : <span className="lb-ava-ph">{(myName || '?').charAt(0).toUpperCase()}</span>}
            </div>
            <div className="lb-me-meta">
              <span className="lb-me-name">{myName}</span>
              <span className="lb-me-sub">
                Зона {local.maxStage}
                {local.ngLevel > 0 && <> · NG+{local.ngLevel}</>}
                {local.prestige > 0 && <> · престиж {local.prestige}</>}
              </span>
            </div>
            <div className="lb-me-score"><Icon name="bolt" size={14} /> {fmt(local.score)}</div>
          </div>
        )}

        {/* Подсказка, если сервер пока не подтянул позицию */}
        {authed && !me && !error && (
          <div className="hint" style={{ marginBottom: 10 }}>
            Ваш прогресс синхронизируется автоматически и скоро появится в общем рейтинге.
          </div>
        )}

        {/* Список лидеров */}
        {board === null && !error && (
          <div className="lb-loading">Загрузка рейтинга…</div>
        )}

        {error && (
          <div className="lb-loading">Общий рейтинг временно недоступен. Ваш прогресс сохраняется.</div>
        )}

        {board && board.length === 0 && !error && (
          <div className="hint">Пока никого нет в рейтинге. Станьте первым!</div>
        )}

        {board && board.length > 0 && (
          <div className="lb-list">
            {board.map(row => (
              <div
                key={row.tgId}
                className={'lb-row' + (row.tgId === myId ? ' is-me' : '') + (row.rank <= 3 ? ' top-' + row.rank : '')}
              >
                <div className="lb-rank">
                  {row.rank <= 3
                    ? <span className="lb-medal">{row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : '🥉'}</span>
                    : <span className="lb-rank-num">{row.rank}</span>}
                </div>
                <div className="lb-ava">
                  {row.photoUrl
                    ? <img src={row.photoUrl} alt="" />
                    : <span className="lb-ava-ph">{(row.name || '?').charAt(0).toUpperCase()}</span>}
                </div>
                <div className="lb-info">
                  <span className="lb-name">{row.name}</span>
                  <span className="lb-sub">
                    Зона {row.maxStage}
                    {row.ngLevel > 0 && <> · NG+{row.ngLevel}</>}
                    {row.prestige > 0 && <> · престиж {row.prestige}</>}
                  </span>
                </div>
                <div className="lb-score"><Icon name="bolt" size={12} /> {fmt(row.score)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="hint" style={{ marginTop: 12 }}>
          Очки рейтинга растут вместе с прогрессом: пройденные зоны, круги New Game+
          и реинкарнации. Прогресс обновляется автоматически.
        </div>
      </div>
    </section>
  )
}
