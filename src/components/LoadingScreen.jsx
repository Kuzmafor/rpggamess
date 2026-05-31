import React, { useEffect, useMemo, useState } from 'react'
import ArenaBackground from './ArenaBackground.jsx'
import { Icon } from '../assets/Icon.jsx'
import { useGameStore } from '../store/useGameStore.js'
import { isTelegram } from '../mobile/telegram.js'
import { authTelegram, fetchCloudSave, pushCloudSave } from '../mobile/cloud.js'
import TelegramLoginButton from './TelegramLoginButton.jsx'

const TIPS = [
  'Тапайте по врагу для фокуса — герои добивают остальных.',
  'Качайте героев в сундуках. Дубликат даёт +1 к уровню.',
  'Артефакты усиливают весь отряд — не забудьте качать осколки.',
  'В подземелье добывается руда. Чем глубже — тем больше.',
  'Бусты урона и золота складываются по таймеру.',
  'Меч эволюционирует — каждое следующее оружие в разы сильнее.',
  'Боссы появляются на 10‑й волне зоны и дают гем.',
  'Используйте «⚡», когда полоса ярости заполнена.',
  'В отряде до 5 героев. Меняйте состав под бой.',
  'В рейдах учитывается фактический DPS — следите за ним.',
]

const LOAD_MS = 5000

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * TIPS.length))
  // Состояние:
  //   'loading' — идёт прогресс-бар
  //   'ready'   — загрузка завершена, ждём тапа игрока
  //   'closing' — тап получен, играем fade-out и зовём onDone
  const [state, setState] = useState('loading')
  const isClosing = state === 'closing'

  const tgUser = useGameStore(s => s.profile?.telegram)
  const setTelegramProfile = useGameStore(s => s.setTelegramProfile)
  const applyCloudSave = useGameStore(s => s.applyCloudSave)
  const inTelegram = useMemo(() => isTelegram(), [])

  // Вход через Login Widget в браузере: сохраняем профиль, авторизуемся на
  // сервере и подтягиваем облачный сейв (если он новее локального).
  async function handleWidgetAuth(user) {
    setTelegramProfile(user)
    const auth = await authTelegram({ widget: user })
    if (!auth) return // сервер недоступен или подпись не прошла — играем локально
    try {
      const cloud = await fetchCloudSave()
      const localSavedAt = useGameStore.getState().savedAt || 0
      if (cloud && cloud.save) {
        const cloudSavedAt = cloud.savedAt || cloud.save.savedAt || 0
        if (cloudSavedAt > localSavedAt) {
          applyCloudSave({ ...cloud.save, savedAt: cloudSavedAt })
          return
        }
      }
      const s = useGameStore.getState()
      let subset = { savedAt: s.savedAt || Date.now() }
      try {
        const raw = localStorage.getItem('blade-of-fate.save.v3')
        if (raw) subset = JSON.parse(raw)
      } catch {}
      pushCloudSave(subset, subset.savedAt || Date.now())
    } catch {}
  }

  useEffect(() => {
    if (state !== 'loading') return
    const start = performance.now()
    let raf
    const step = (now) => {
      const t = Math.min(1, (now - start) / LOAD_MS)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(eased * 100)
      if (t >= 1) {
        setState('ready')
        return
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [state])

  useEffect(() => {
    const id = setInterval(() => {
      setTipIdx(i => (i + 1) % TIPS.length)
    }, 2300)
    return () => clearInterval(id)
  }, [])

  function continueIn() {
    if (state !== 'ready') return
    setState('closing')
    setTimeout(() => onDone?.(), 350)
  }

  const dots = useMemo(() => '·'.repeat((Math.floor(Date.now() / 400) % 3) + 1), [progress])

  return (
    <div
      className={'loading-screen' + (isClosing ? ' done' : '')}
      onClick={continueIn}
      aria-hidden={isClosing}
      role={state === 'ready' ? 'button' : undefined}
    >
      <ArenaBackground />

      {/* Виньетка поверх фона для контраста */}
      <div className="ls-vignette" />

      {/* Кнопки соц-сетей */}
      <div className="ls-links" onClick={(e) => e.stopPropagation()}>
        <a
          className="ls-link"
          href="https://t.me/bladeoffatebot"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Telegram канал"
          title="Telegram канал"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
            <path
              fill="currentColor"
              d="M9.04 15.36 8.86 19c.4 0 .58-.18.78-.39l1.88-1.81 3.91 2.85c.72.4 1.23.19 1.42-.66l2.58-12.07v-.01c.22-1.05-.38-1.46-1.07-1.21L3.4 10.3c-1.04.4-1.02.97-.18 1.23l4.05 1.27 9.41-5.93c.44-.28.84-.13.51.16z"
            />
          </svg>
          <span className="ls-link-tag">Канал</span>
        </a>
        <a
          className="ls-link"
          href="https://t.me/bladeoffatebot"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Поддержка"
          title="Поддержка"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
            <path
              fill="currentColor"
              d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 0 1-8-8c0-1.84.62-3.54 1.66-4.9l3.74 3.74a3 3 0 0 0 4.24 4.24l3.74 3.74A7.97 7.97 0 0 1 12 20Zm6.34-3.1-3.74-3.74a3 3 0 0 0-4.24-4.24L6.62 5.18A8 8 0 0 1 18.34 16.9Z"
            />
          </svg>
          <span className="ls-link-tag">Support</span>
        </a>
      </div>

      {/* Логотип + слоган */}
      <div className="ls-content">
      <div className="ls-spacer ls-spacer-top" />
      <div className="ls-brand">
        <div className="ls-logo">
          <Icon name="sword" size={28} />
          <span className="ls-title">Blade of Fate</span>
        </div>
        <div className="ls-sub">Idle RPG · параллакс приключение</div>
      </div>

      {/* Блок входа через Telegram */}
      <div className="ls-auth" onClick={(e) => e.stopPropagation()}>
        {tgUser ? (
          <div className="ls-auth-user">
            {tgUser.photoUrl ? (
              <img className="ls-auth-ava" src={tgUser.photoUrl} alt="" />
            ) : (
              <div className="ls-auth-ava ls-auth-ava--ph">
                {(tgUser.firstName || tgUser.username || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="ls-auth-meta">
              <span className="ls-auth-hi">С возвращением</span>
              <span className="ls-auth-name">
                {tgUser.firstName || (tgUser.username ? '@' + tgUser.username : 'Игрок')}
              </span>
            </div>
            <svg className="ls-auth-check" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
            </svg>
          </div>
        ) : inTelegram ? (
          <div className="ls-auth-note">Вход через Telegram…</div>
        ) : (
          <div className="ls-auth-widget">
            <TelegramLoginButton onAuth={handleWidgetAuth} />
          </div>
        )}
        {!tgUser && !inTelegram && (
          <div className="ls-auth-guest">или продолжите как гость</div>
        )}
      </div>

      <div className="ls-spacer" />

      {/* Прогресс или приглашение нажать */}
      {state === 'loading' && (
        <div className="ls-progress-wrap">
          <div className="ls-progress">
            <div className="ls-bar" style={{ width: progress + '%' }} />
            <div className="ls-shine" style={{ left: (progress - 12) + '%' }} />
          </div>
          <div className="ls-progress-meta">
            <span>Загрузка{dots}</span>
            <span>{Math.floor(progress)}%</span>
          </div>
        </div>
      )}

      {state === 'ready' && (
        <button
          className="ls-tap-cta"
          onClick={(e) => { e.stopPropagation(); continueIn() }}
        >
          <span className="ls-tap-cta-text">Нажмите, чтобы продолжить</span>
          <span className="ls-tap-cta-hint">Tap to start</span>
        </button>
      )}

      {/* Подсказка */}
      <div className="ls-tips">
        <div className="ls-tip-label">Совет</div>
        <div key={tipIdx} className="ls-tip">{TIPS[tipIdx]}</div>
      </div>
      </div>
    </div>
  )
}
