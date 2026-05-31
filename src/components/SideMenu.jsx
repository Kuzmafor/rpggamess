import React, { useRef, useState } from 'react'
import { Icon } from '../assets/Icon.jsx'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import ResourceInfoModal from './ResourceInfoModal.jsx'

const ITEMS = [
  { id: 'profile',     icon: 'tabHeroes', label: 'Профиль',     desc: 'Статистика и промокоды' },
  { id: 'leaderboard', icon: 'crown',     label: 'Рейтинг',     desc: 'Топ игроков по прогрессу' },
  { id: 'shop',        icon: 'shop',      label: 'Магазин',     desc: 'Сундуки, оружие, бусты, гемы' },
  { id: 'rewards',     icon: 'gift',      label: 'Награды',     desc: 'Событие, Battle Pass, календарь' },
  { id: 'inventory',   icon: 'gem',       label: 'Инвентарь',   desc: 'Ресурсы, материалы, премиум' },
  { id: 'challenges',  icon: 'crown',     label: 'Испытания',   desc: 'Башня и подземелье' },
  { id: 'city',        icon: 'dungeon',   label: 'Город',       desc: 'Постройки и пассивы' },
  { id: 'mail',        icon: 'mail',      label: 'Почта',       desc: 'Подарки и уведомления' },
  { id: 'progression', icon: 'artifact',  label: 'Прокачка',    desc: 'Артефакты, таланты, реинкарнация' },
  { id: 'codex',       icon: 'tabHeroes', label: 'Энциклопедия', desc: 'Бестиарий, гайды и пассивы' },
  { id: 'settings',    icon: 'settings',  label: 'Настройки',   desc: 'Звук, эффекты, прогресс' },
]

const RESOURCES = [
  { key: 'gold',   icon: 'gold',     getter: (s) => s.gold },
  { key: 'gems',   icon: 'gem',      getter: (s) => s.gems },
  { key: 'ore',    icon: 'ore',      getter: (s) => s.ore || 0 },
  { key: 'shards', icon: 'artifact', getter: (s) => s.artifactShards || 0 },
  { key: 'stars',  icon: 'crown',    getter: (s) => s.gloryStars || 0 },
  { key: 'dragon', icon: 'scale',    getter: (s) => s.mats?.dragon || 0 },
  { key: 'lich',   icon: 'skull',    getter: (s) => s.mats?.lich || 0 },
  { key: 'golem',  icon: 'rock',     getter: (s) => s.mats?.golem || 0 },
  { key: 'titan',  icon: 'bolt',     getter: (s) => s.mats?.titan || 0 },
  { key: 'hydra',  icon: 'gem',      getter: (s) => s.mats?.hydra || 0 },
  { key: 'archon', icon: 'artifact', getter: (s) => s.mats?.archon || 0 },
  { key: 'demon',  icon: 'flame',    getter: (s) => s.mats?.demon || 0 },
  { key: 'phoenix',icon: 'crown',    getter: (s) => s.mats?.phoenix || 0 },
  { key: 'warden', icon: 'crown',    getter: (s) => s.mats?.warden || 0 },
]

export default function SideMenu({ open, onClose, onPick }) {
  const unread = useGameStore(s => s.mail.filter(m => !m.claimed).length)
  const shards = useGameStore(s => s.artifactShards)
  const calClaim = useGameStore(s => s.canClaimToday())
  const tp = useGameStore(s => s.talentPoints || 0)
  const eventAlert = useGameStore(s => {
    try {
      const ms = s.eventMilestones?.() || []
      if (ms.some(m => m.canClaim)) return true
      if ((s.eventSlotFreeLeft?.() || 0) > 0) return true
      if ((s.eventJumpAttemptsLeft?.() || 0) > 0) return true
      return false
    } catch { return false }
  })
  const canPrestige = useGameStore(s => s.canPrestige())
  const bpUnclaimed = useGameStore(s => {
    const bp = s.bp || {}
    const lvl = bp.level || 0
    if (!lvl) return 0
    let c = 0
    for (let i = 1; i <= lvl; i++) {
      if (!(bp.claimedFree || []).includes(i)) c++
      if (bp.premium && !(bp.claimedPremium || []).includes(i)) c++
    }
    return c
  })
  const state = useGameStore(s => s)
  const [info, setInfo] = useState(null) // { key, value }

  const pressTimer = useRef(null)
  const longPressed = useRef(false)

  function startPress(key, value) {
    longPressed.current = false
    if (pressTimer.current) clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => {
      longPressed.current = true
      setInfo({ key, value })
    }, 450)
  }
  function cancelPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }
  function handleClick(e, key, value) {
    // Чтобы тап тоже что-то делал — открываем инфу.
    // Долгое нажатие уже открыло, тогда клик игнорим.
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    setInfo({ key, value })
  }
  function handleContextMenu(e, key, value) {
    e.preventDefault()
    setInfo({ key, value })
  }

  return (
    <>
      <div className={'side-overlay' + (open ? ' open' : '')} onClick={onClose} />
      <aside className={'side-menu' + (open ? ' open' : '')}>
        <div className="side-head">
          <h3>Меню</h3>
          <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        <div className="side-body">
          <div className="side-list">
            {ITEMS.map(it => (
              <button
                key={it.id}
                className="side-item"
                onClick={() => { onPick(it.id); onClose() }}
              >
                <span className="side-icon"><Icon name={it.icon} size={22} /></span>
                <span className="side-meta">
                  <span className="side-label">
                    {it.label}
                    {it.id === 'mail' && unread > 0 && <span className="bubble">{unread}</span>}
                    {it.id === 'rewards' && (bpUnclaimed > 0 || calClaim || eventAlert) && (
                      <span className="bubble">{bpUnclaimed > 0 ? bpUnclaimed : '!'}</span>
                    )}
                    {it.id === 'progression' && (shards > 0 || tp > 0 || canPrestige) && (
                      <span className={'bubble' + (canPrestige ? '' : ' pale')}>
                        {canPrestige ? '!' : (tp || shards)}
                      </span>
                    )}
                  </span>
                  <span className="side-desc">{it.desc}</span>
                </span>
                <span className="side-arrow">›</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {info && (
        <ResourceInfoModal
          resourceKey={info.key}
          value={info.value}
          onClose={() => setInfo(null)}
        />
      )}
    </>
  )
}
