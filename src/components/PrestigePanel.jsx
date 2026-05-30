import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'

export default function PrestigePanel({ onClose, embedded = false }) {
  const stage = useGameStore(s => s.stage)
  const maxStage = useGameStore(s => Math.max(s.stage, s.maxStage || s.stage))
  const souls = useGameStore(s => s.souls || 0)
  const prisms = useGameStore(s => s.soulPrisms || 0)
  const prestigeCount = useGameStore(s => s.prestigeCount || 0)
  const required = useGameStore(s => s.prestigeStageRequired())
  const can = useGameStore(s => s.canPrestige())
  const reward = useGameStore(s => s.prestigeReward())
  const reset = useGameStore(s => s.prestigeReset)
  const upPrism = useGameStore(s => s.upgradeSoulPrism)
  const prismCost = useGameStore(s => s.soulPrismCost)
  const prismLvl = useGameStore(s => s.soulPrismLevel)

  const showPrisms = prestigeCount >= 3

  const onConfirm = () => {
    if (!can) return
    if (confirm(`Реинкарнация: получите ${reward} душ. Прогресс зон/оружия/уровней героев сбросится. Продолжить?`)) {
      reset()
      onClose?.()
    }
  }

  const body = (
    <div className="prestige-scroll">
        <div className="prestige-card">
          <div className="prestige-art">
            <Icon name="crown" size={56} />
            <div className="prestige-glow" />
          </div>
          <div className="prestige-info">
            <div className="prestige-title">Душевные камни</div>
            <div className="prestige-num">{fmt(souls)}</div>
            <div className="prestige-desc">+0.1% к урону, золоту и оффлайн-доходу за каждый камень. Действует постоянно.</div>
          </div>
        </div>

        <div className="prestige-row">
          <div className="prestige-stat">
            <span className="ps-name">Текущая зона</span>
            <span className="ps-val">{stage}</span>
          </div>
          <div className="prestige-stat">
            <span className="ps-name">Макс. зона</span>
            <span className="ps-val">{maxStage}</span>
          </div>
          <div className="prestige-stat">
            <span className="ps-name">Получите душ</span>
            <span className="ps-val gold">{reward}</span>
          </div>
        </div>

        <div className="prestige-rules">
          <div className="rules-title">При реинкарнации сбросится</div>
          <ul>
            <li>Зона/волна/прогресс мира</li>
            <li>Уровни героев</li>
            <li>Тир и заточка оружия</li>
            <li>Сила удара и пассивный DPS</li>
            <li>Текущее золото и руда</li>
          </ul>
          <div className="rules-title">Сохранится</div>
          <ul>
            <li>Коллекция героев и артефакты</li>
            <li>Гемы, осколки, материалы рейдов</li>
            <li>Таланты, души, статистика</li>
            <li>Достигнутые сундуки/рейды/подземелья</li>
          </ul>
        </div>

        <button
          className="btn gold size-lg block prestige-btn"
          disabled={!can}
          onClick={onConfirm}
        >
          {can
            ? <>Реинкарнировать · +{reward} душ</>
            : <>Требуется зона {required} (с учётом витков)</>}
        </button>

        {showPrisms && (
          <>
            <div className="rules-title" style={{ marginTop: 16 }}>🔮 Призмы душ</div>
            <div className="prestige-card prism-card">
              <div className="prestige-info" style={{ flex: 1 }}>
                <div className="prestige-title">Доступно: {fmt(prisms)} 🔮</div>
                <div className="prestige-desc">
                  10% от прироста душ при каждом престиже становится призмами. Ими покупаются глобальные множители без потолка — каждый уровень +1%.
                </div>
              </div>
            </div>
            <div className="prism-grid">
              {[
                { id: 'dmg',  name: 'Урон',   icon: '⚔️' },
                { id: 'gold', name: 'Золото', icon: '🪙' },
                { id: 'crit', name: 'Крит',   icon: '✦' },
                { id: 'rage', name: 'Ярость', icon: '⚡' },
              ].map(p => {
                const lvl = prismLvl(p.id)
                const cost = prismCost(p.id)
                return (
                  <div key={p.id} className="prism-tile">
                    <div className="prism-icon">{p.icon}</div>
                    <div className="prism-name">{p.name}</div>
                    <div className="prism-lvl">+{lvl}%</div>
                    <button
                      className="btn neon size-sm block"
                      disabled={prisms < cost}
                      onClick={() => upPrism(p.id)}
                    >
                      🔮 {cost}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
    </div>
  )

  if (embedded) return body

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Престиж · Реинкарнация</h2>
        <span className="panel-sub">Реинкарнаций: {prestigeCount}</span>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>
      {body}
    </section>
  )
}
