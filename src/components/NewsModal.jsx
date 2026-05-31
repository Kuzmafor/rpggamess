import React from 'react'
import { Icon } from '../assets/Icon.jsx'
import { NEWS } from '../data/news.js'

// Метки новостей → подпись и цвет.
const TAGS = {
  update:  { label: 'Обновление', color: '#7c5cff' },
  fix:     { label: 'Исправление', color: '#4ade80' },
  event:   { label: 'Событие', color: '#ffd166' },
  balance: { label: 'Баланс', color: '#67d6ff' },
}

function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

// Разбиваем текст на абзацы и списки для аккуратного вывода.
function renderBody(body) {
  const blocks = String(body || '').split('\n\n')
  return blocks.map((block, bi) => {
    const lines = block.split('\n')
    const isList = lines.every(l => l.trim().startsWith('•'))
    if (isList) {
      return (
        <ul key={bi} className="news-list">
          {lines.map((l, li) => <li key={li}>{l.replace(/^•\s?/, '')}</li>)}
        </ul>
      )
    }
    return <p key={bi} className="news-para">{block}</p>
  })
}

export default function NewsModal({ onClose }) {
  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div className="news-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn raid-info-close" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>

        <div className="news-head">
          <Icon name="mail" size={22} />
          <span className="news-head-title">Новости</span>
        </div>

        <div className="news-scroll">
          {NEWS.length === 0 && (
            <div className="hint">Пока новостей нет. Загляните позже.</div>
          )}
          {NEWS.map(item => {
            const tag = TAGS[item.tag] || TAGS.update
            return (
              <article key={item.id} className="news-item">
                <header className="news-item-head">
                  <span className="news-tag" style={{ color: tag.color, borderColor: tag.color }}>
                    {tag.label}
                  </span>
                  <span className="news-date">{fmtDate(item.date)}</span>
                </header>
                <h3 className="news-title">{item.title}</h3>
                <div className="news-body">{renderBody(item.body)}</div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
