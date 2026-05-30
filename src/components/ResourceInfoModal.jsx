import React from 'react'
import { Icon } from '../assets/Icon.jsx'
import { getResourceInfo } from '../data/resources.js'
import { fmt } from '../utils/fmt.js'

export default function ResourceInfoModal({ resourceKey, value, onClose }) {
  const info = getResourceInfo(resourceKey)
  if (!info) return null
  return (
    <div className="reveal-overlay" onClick={onClose}>
      <div
        className="resource-info"
        style={{ '--ac': info.color || '#ffd166' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn ri-close" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>

        <div className="ri-head">
          <div className="ri-icon-wrap">
            <Icon name={info.icon} size={28} />
          </div>
          <div className="ri-meta">
            <div className="ri-name">{info.label}</div>
            <div className="ri-have">У вас: <b>{fmt(value || 0)}</b></div>
          </div>
        </div>

        <div className="ri-desc">{info.desc}</div>

        <div className="ri-section-title">Где взять</div>
        <ul className="ri-list">
          {info.sources.map((s, i) => <li key={'s'+i}>{s}</li>)}
        </ul>

        <div className="ri-section-title">На что тратить</div>
        <ul className="ri-list">
          {info.spends.map((s, i) => <li key={'sp'+i}>{s}</li>)}
        </ul>

        <button className="btn ghost size-md block" onClick={onClose}>Понятно</button>
      </div>
    </div>
  )
}
