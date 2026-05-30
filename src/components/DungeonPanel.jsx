import React, { useState } from 'react'
import { DUNGEON_CHAPTERS, STAGES_PER_CHAPTER, getChapter } from '../data/dungeon.js'
import { useGameStore } from '../store/useGameStore.js'
import { fmt } from '../utils/fmt.js'
import { Icon } from '../assets/Icon.jsx'
import { Sprite } from '../assets/sprites.jsx'
import { ChapterScene } from '../assets/dungeonScenes.jsx'

export default function DungeonPanel({ onClose, embedded = false }) {
  const [chapterId, setChapterId] = useState(null)

  const body = !chapterId
    ? <ChaptersGrid onPick={setChapterId} />
    : <ChapterStages chapterId={chapterId} onBack={() => setChapterId(null)} onClosePanel={onClose} />

  if (embedded) {
    // В встроенном режиме показываем "хлебные крошки" вместо panel-head,
    // чтобы можно было вернуться из глав к списку, не закрывая всю панель.
    return (
      <>
        {chapterId && (
          <div className="filter-row" style={{ alignItems: 'center' }}>
            <button className="btn ghost size-sm" onClick={() => setChapterId(null)}>
              ‹ К главам
            </button>
            <span style={{ marginLeft: 8, fontWeight: 700 }}>
              Глава {chapterId} · {getChapter(chapterId)?.name}
            </span>
          </div>
        )}
        {body}
      </>
    )
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{chapterId ? `Глава ${chapterId}` : 'Подземелье'}</h2>
        {chapterId && (
          <span className="panel-sub">{getChapter(chapterId)?.name}</span>
        )}
        <button className="close-btn" onClick={() => chapterId ? setChapterId(null) : onClose()}>
          <Icon name="close" size={16} />
        </button>
      </div>
      {body}
    </section>
  )
}

/* ===================== СПИСОК ГЛАВ ===================== */
function ChaptersGrid({ onPick }) {
  const clears = useGameStore(s => s.dungeonChapterClears)
  return (
    <div className="dungeon-grid">
      {DUNGEON_CHAPTERS.map(ch => {
        const cl = clears[ch.id]
        const completed = !!cl?.completed
        const stagesDone = cl?.stage || 0
        const locked = ch.id > 1 && !clears[ch.id - 1]?.completed
        const pct = Math.min(100, Math.round((stagesDone / STAGES_PER_CHAPTER) * 100))
        return (
          <button
            key={ch.id}
            className={'chapter-tile' + (locked ? ' locked' : '') + (completed ? ' completed' : '')}
            disabled={locked}
            onClick={() => onPick(ch.id)}
            style={{ '--ac': ch.color }}
          >
            <div className="chapter-art">
              <ChapterScene chapterId={ch.id} />
              <div className="chapter-boss-pin">
                <Sprite name={ch.bossSprite} size={44} />
              </div>
              <span className="chapter-num">{ch.id}</span>
              {locked && <span className="lock-overlay"><Icon name="lock" size={26} /></span>}
              {completed && <span className="check-overlay"><Icon name="check" size={22} /></span>}
            </div>
            <div className="chapter-info">
              <div className="chapter-title">{ch.short}</div>
              <div className="chapter-name">{ch.name}</div>
              <div className="chapter-progress">
                <div className="chapter-progress-bar" style={{ width: pct + '%' }} />
                <span>{stagesDone} / {STAGES_PER_CHAPTER}</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ===================== СТАДИИ ГЛАВЫ ===================== */
function ChapterStages({ chapterId, onBack, onClosePanel }) {
  const ch = getChapter(chapterId)
  const cl = useGameStore(s => s.dungeonChapterClears[chapterId])
  const enter = useGameStore(s => s.enterChapter)
  const isStageUnlocked = useGameStore(s => s.isStageUnlocked)
  const exitDungeon = useGameStore(s => s.exitDungeon)

  const stagesDone = cl?.stage || 0

  function start(stage) {
    if (!isStageUnlocked(chapterId, stage)) return
    if (enter(chapterId, stage)) {
      // Закрываем панель, чтобы было видно сцену боя.
      onClosePanel?.()
    }
  }

  return (
    <>
      <div className="chapter-summary" style={{ '--ac': ch.color }}>
        <Sprite name={ch.bossSprite} size={64} />
        <div className="cs-meta">
          <div className="cs-title">{ch.name}</div>
          <div className="cs-desc">{ch.desc}</div>
          <div className="cs-rewards">
            <span><Icon name="gold" size={12} /> +{fmt(ch.rewardGold)}</span>
            <span><Icon name="ore"  size={12} /> +{ch.rewardOre}</span>
            <span><Icon name="artifact" size={12} /> +{ch.rewardShards}</span>
            <span><Icon name="gem"  size={12} /> +{ch.rewardGems}</span>
          </div>
          <div className="cs-rewards-label">Награда за прохождение главы</div>
        </div>
      </div>

      <div className="stages-grid">
        {Array.from({ length: STAGES_PER_CHAPTER }, (_, i) => i + 1).map(stage => {
          const unlocked = isStageUnlocked(chapterId, stage)
          const done = stage <= stagesDone
          const isBoss = stage === STAGES_PER_CHAPTER
          return (
            <button
              key={stage}
              className={'stage-cell' + (unlocked ? '' : ' locked') + (done ? ' done' : '') + (isBoss ? ' boss' : '')}
              disabled={!unlocked}
              onClick={() => start(stage)}
              style={{ '--ac': ch.color }}
            >
              <div className="stage-num">{chapterId}-{stage}</div>
              {isBoss && <div className="stage-tag">БОСС</div>}
              {done && !isBoss && <Icon name="check" size={14} />}
              {!unlocked && <Icon name="lock" size={14} />}
            </button>
          )
        })}
      </div>

      <div className="hint">
        Стадия открывается после прохождения предыдущей. Финальный бой главы — против босса.
      </div>
    </>
  )
}
