import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'
import { Hero } from '../assets/sprites.jsx'
import { ZONES } from '../data/enemies.js'
import { DUNGEON_CHAPTERS, STAGES_PER_CHAPTER } from '../data/dungeon.js'
import { HEROES } from '../data/heroes.js'

const ROLES = [
  { id: 'melee',   label: 'Воин' },
  { id: 'ranged',  label: 'Стрелок' },
  { id: 'mage',    label: 'Маг' },
  { id: 'support', label: 'Поддержка' },
]

function fmtTime(ms) {
  if (!ms || ms < 0) return '—'
  const sec = Math.floor(ms / 1000)
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (d > 0) return `${d}д ${h}ч`
  if (h > 0) return `${h}ч ${m}м`
  return `${m}м`
}

export default function ProfilePanel({ onClose }) {
  const profile = useGameStore(s => s.profile)
  const stats = useGameStore(s => s.stats)
  const stage = useGameStore(s => s.stage)
  const maxStage = useGameStore(s => Math.max(s.stage, s.maxStage || s.stage))
  const wave = useGameStore(s => s.wave)
  const heroes = useGameStore(s => s.unlockedHeroes)
  const cleared = useGameStore(s => s.dungeonChapterClears || {})
  const setNickname = useGameStore(s => s.setNickname)
  const setAvatar = useGameStore(s => s.setAvatar)
  const redeemPromo = useGameStore(s => s.redeemPromo)

  const tg = profile?.telegram || null

  const [edit, setEdit] = useState(false)
  const [nick, setNick] = useState(profile?.nickname || '')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null) // { type: 'ok'|'err', text }

  const dungeonsCleared = Object.values(cleared).filter(c => c?.completed).length
  const dungeonStages = Object.values(cleared).reduce((a, c) => a + (c?.stage || 0), 0)
  const playMs = profile?.createdAt ? Date.now() - profile.createdAt : 0

  function saveNick() {
    setNickname(nick)
    setEdit(false)
  }

  function handleRedeem() {
    if (!code.trim()) return
    const r = redeemPromo(code)
    if (r.ok) {
      setMsg({ type: 'ok', text: 'Награда отправлена в Почту. Заберите её там!' })
      setCode('')
    } else {
      const map = { used: 'Промокод уже использован', invalid: 'Неверный промокод', empty: 'Введите промокод' }
      setMsg({ type: 'err', text: map[r.reason] || 'Не удалось активировать' })
    }
    setTimeout(() => setMsg(null), 4000)
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Профиль</h2>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="profile-scroll">
        {/* Шапка профиля */}
        <div className="profile-head">
          <div className="profile-avatar">
            {tg?.photoUrl
              ? <img className="profile-avatar-img" src={tg.photoUrl} alt="" referrerPolicy="no-referrer" />
              : <Hero role={profile?.avatar || 'melee'} size={84} />}
            {tg?.id && <span className="profile-tg-badge" title="Вошёл через Telegram">TG</span>}
          </div>
          <div className="profile-meta">
            {edit ? (
              <div className="profile-nick-edit">
                <input
                  className="text-input"
                  value={nick}
                  onChange={e => setNick(e.target.value)}
                  placeholder="Никнейм"
                  maxLength={24}
                  autoFocus
                />
                <button className="btn gold size-sm" onClick={saveNick}>OK</button>
                <button className="btn ghost size-sm" onClick={() => { setEdit(false); setNick(profile?.nickname || '') }}>Отмена</button>
              </div>
            ) : (
              <div className="profile-nick" onClick={() => setEdit(true)}>
                <span className="profile-nick-name">{profile?.nickname || (tg?.firstName) || 'Без имени'}</span>
                <Icon name="bolt" size={14} />
              </div>
            )}
            <div className="profile-sub">Зона {stage} · максимум: {maxStage}</div>
            {/* Аватарка-роль доступна только если не вошёл через Telegram */}
            {!tg?.photoUrl && (
              <div className="profile-avatars">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    className={'role-pick role-' + r.id + (profile?.avatar === r.id ? ' active' : '')}
                    onClick={() => setAvatar(r.id)}
                    title={r.label}
                  >
                    <Hero role={r.id} size={28} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Прогресс */}
        <div className="profile-section">
          <div className="profile-section-title">Прогресс</div>
          <div className="profile-grid">
            <Stat icon="tabBattle" label="Зон пройдено" value={`${Math.max(0, maxStage - 1)} / ${ZONES.length}`} accent="#ffd166" />
            <Stat icon="dungeon"   label="Глав в подземелье" value={`${dungeonsCleared} / ${DUNGEON_CHAPTERS.length}`} accent="#a072ff" />
            <Stat icon="dungeon"   label="Стадий пройдено" value={dungeonStages} accent="#67d6ff" />
            <Stat icon="tabHeroes" label="Героев в коллекции" value={`${heroes.length} / ${HEROES.length}`} accent="#7be281" />
            <Stat icon="clock"     label="В игре" value={fmtTime(playMs)} accent="#c8cee8" />
            <Stat icon="bolt"      label="Текущая волна" value={`${wave}/10`} accent="#ff7a2a" />
          </div>
        </div>

        {/* Статистика */}
        <div className="profile-section">
          <div className="profile-section-title">Статистика</div>
          <div className="profile-grid">
            <Stat icon="swords"  label="Убито врагов"   value={fmt(stats?.enemiesKilled || 0)} />
            <Stat icon="crown"   label="Убито боссов"   value={fmt(stats?.bossesKilled || 0)} />
            <Stat icon="bolt"    label="Тапов"          value={fmt(stats?.tapsCount || 0)} />
            <Stat icon="rocket"  label="Суперов"        value={fmt(stats?.superCount || 0)} />
            <Stat icon="chest"   label="Сундуков"       value={fmt(stats?.chestsOpened || 0)} />
            <Stat icon="dragon"  label="Рейдов пройдено" value={fmt(stats?.raidsCompleted || 0)} />
            <Stat icon="gold"    label="Заработано"     value={fmt(stats?.goldEarnedTotal || 0)} />
          </div>
        </div>

        {/* Промокоды */}
        <div className="profile-section">
          <div className="profile-section-title">Промокод</div>
          <div className="promo-row">
            <input
              className="text-input"
              placeholder="Введите код"
              value={code}
              onChange={e => setCode(e.target.value)}
              maxLength={32}
            />
            <button className="btn gold size-md" onClick={handleRedeem}>Активировать</button>
          </div>
          {msg && (
            <div className={'promo-msg ' + msg.type}>
              {msg.text}
            </div>
          )}
          <div className="hint" style={{ marginTop: 10 }}>
            Награда придёт письмом в Почту. Откройте раздел «Почта» и заберите её.
            Ресурсы и материалы — в разделе «Инвентарь».
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ icon, label, value, accent }) {
  return (
    <div className="stat-tile" style={accent ? { '--ac': accent } : null}>
      <div className="stat-ico"><Icon name={icon} size={18} /></div>
      <div className="stat-meta">
        <span className="stat-num">{value}</span>
        <span className="stat-name">{label}</span>
      </div>
    </div>
  )
}
