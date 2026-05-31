import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'
import { isLoggedIn, fetchLeaderboard, fetchMyRank } from '../mobile/cloud.js'

// Раздел "Рейтинг": общий топ игроков по прогрессу.
// Чтобы попасть в рейтинг, нужно войти через Telegram — тогда прогресс
// синхронизируется с сервером и учитывается в таблице лидеров.

export default function LeaderboardPanel({ onClose }) {
  const tgUser = useGameStore(s => s.profile?.telegram)
  const loggedIn = isLoggedIn()

  const [board, setBoard] = useState(null) // null = загрузка
  const [me, setMe] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const b = await fetchLeaderboard()
      if (!alive) return
      setBoard(b)
      if (!b) setError(true)
      if (loggedIn) {
        const r = await fetchMyRank()
        if (alive) setMe(r)
      }
    })()
    return () => { alive = false }
  }, [loggedIn])

  const myId = tgUser?.id

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Рейтинг</h2>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="lb-scroll">
        {/* Если не вошёл — приглашаем авторизоваться */}
        {!loggedIn && (
          <div className="lb-cta">
            <Icon name="crown" size={28} />
            <div className="lb-cta-title">Войдите через Telegram</div>
            <div className="lb-cta-desc">
              Авторизуйтесь на загрузочном экране, чтобы попасть в общий рейтинг
              и сравнить прогресс с другими игроками.
            </div>
          </div>
        )}

        {/* Моя позиция */}
        {loggedIn && me && (
          <div className="lb-me">
            <div className="lb-me-rank">#{me.rank}</div>
            <div className="lb-me-meta">
              <span className="lb-me-name">{me.name || 'Вы'}</span>
              <span className="lb-me-sub">
                Зона {me.maxStage}
                {me.ngLevel > 0 && <> · NG+{me.ngLevel}</>}
                {me.prestige > 0 && <> · престиж {me.prestige}</>}
              </span>
            </div>
            <div className="lb-me-score"><Icon name="bolt" size={14} /> {fmt(me.score)}</div>
          </div>
        )}

        {loggedIn && !me && board && board.length >= 0 && (
          <div className="hint" style={{ marginBottom: 10 }}>
            Поиграйте немного — ваш прогресс появится в рейтинге после автосохранения.
          </div>
        )}

        {/* Список лидеров */}
        {board === null && !error && (
          <div className="lb-loading">Загрузка рейтинга…</div>
        )}

        {error && (
          <div className="lb-loading">Рейтинг временно недоступен.</div>
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
