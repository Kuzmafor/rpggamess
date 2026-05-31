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

// Разбиваем текст на абзацы, заголовки разделов и списки.
function renderBody(body) {
  const blocks = String(body || '').split('\n\n')
  return blocks.map((block, bi) => {
    const lines = block.split('\n').filter(l => l.trim().length)
    const out = []
    let bullets = []
    const flush = (key) => {
      if (bullets.length) {
        out.push(
          <ul key={'ul' + key} className="news-list">
            {bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )
        bullets = []
      }
    }
    lines.forEach((line, li) => {
      const t = line.trim()
      if (t.startsWith('•')) {
        bullets.push(t.replace(/^•\s?/, ''))
      } else {
        flush(li)
        // Короткая строка без точки в конце — считаем заголовком раздела.
        const isHeading = t.length <= 40 && !/[.!?]$/.test(t)
        out.push(
          isHeading
            ? <div key={li} className="news-subhead">{t}</div>
            : <p key={li} className="news-para">{t}</p>
        )
      }
    })
    flush('end')
    return <div key={bi} className="news-block">{out}</div>
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
