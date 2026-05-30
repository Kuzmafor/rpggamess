import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { getChapter, STAGES_PER_CHAPTER } from '../data/dungeon.js'
import { Icon } from '../assets/Icon.jsx'
import { fmt } from '../utils/fmt.js'

/**
 * Поверх арены: маленький HUD при активном забеге в подземелье,
 * и модальное окно "Глава пройдена!" с наградами.
 */
export default function DungeonHud() {
  const run = useGameStore(s => s.dungeonRun)
  const lastReward = useGameStore(s => s._lastChapterReward)
  const exitDungeon = useGameStore(s => s.exitDungeon)
  const [reward, setReward] = useState(null)

  // Когда стор отдаёт _lastChapterReward, показываем модалку.
  useEffect(() => {
    if (lastReward) {
      setReward(lastReward)
      // очистим флаг
      useGameStore.setState({ _lastChapterReward: null })
    }
  }, [lastReward])

  const ch = run ? getChapter(run.chapterId) : null

  return (
    <>
      {ch && (
        <div className="dungeon-hud" style={{ '--ac': ch.color }}>
          <div className="dh-meta">
            <div className="dh-title">{ch.short} · {ch.name}</div>
            <div className="dh-stage">Стадия {ch.id}-{run.stage} / {ch.id}-{STAGES_PER_CHAPTER}</div>
          </div>
          <button className="btn ghost size-sm" onClick={exitDungeon}>Выйти</button>
        </div>
      )}

      {reward && (
        <div className="reveal-overlay" onClick={() => setReward(null)}>
          <div className="reveal-card rarity-legendary" onClick={(e) => e.stopPropagation()}>
            <div className="reveal-burst" />
            <div className="reveal-ttl">Глава пройдена!</div>
            <div className="reveal-name" style={{ marginTop: 8 }}>{reward.name}</div>
            <div className="reveal-rarity">Награда главы</div>
            <div className="reveal-rewards" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
              <span><Icon name="gold" size={14} /> +{fmt(reward.gold)}</span>
              <span><Icon name="ore" size={14} /> +{reward.ore}</span>
              <span><Icon name="artifact" size={14} /> +{reward.shards}</span>
              <span><Icon name="gem" size={14} /> +{reward.gems}</span>
            </div>
            <button className="btn gold size-md block" onClick={() => setReward(null)}>Принять</button>
          </div>
        </div>
      )}
    </>
  )
}
