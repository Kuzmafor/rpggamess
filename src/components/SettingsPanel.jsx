import React from 'react'
import { useGameStore } from '../store/useGameStore.js'
import { Icon } from '../assets/Icon.jsx'
import { useT } from '../i18n/useT.js'
import { setLocale, SUPPORTED_LOCALES } from '../i18n/index.js'

export default function SettingsPanel({ onClose }) {
  const { t, locale } = useT()
  const settings = useGameStore(s => s.settings)
  const setSetting = useGameStore(s => s.setSetting)
  const reset = useGameStore(s => s.hardReset)

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{t('settings.title')}</h2>
        <button className="close-btn" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>

      <div className="settings-list">
        <ToggleRow
          icon="bolt"
          label={t('settings.sound')}
          desc={t('settings.sound.desc')}
          value={settings.sound}
          onChange={(v) => setSetting('sound', v)}
        />
        <ToggleRow
          icon="bolt"
          label={t('settings.music')}
          desc={t('settings.music.desc')}
          value={settings.music}
          onChange={(v) => setSetting('music', v)}
        />
        <SegmentRow
          icon="bolt"
          label={t('settings.fx')}
          desc={t('settings.fx.desc')}
          value={settings.fxLevel}
          onChange={(v) => setSetting('fxLevel', v)}
          options={[
            { id: 'low',  label: t('settings.fx.low') },
            { id: 'high', label: t('settings.fx.high') },
          ]}
        />
        <ToggleRow
          icon="bolt"
          label={t('settings.haptics')}
          desc={t('settings.haptics.desc')}
          value={settings.haptics}
          onChange={(v) => setSetting('haptics', v)}
        />
        <ToggleRow
          icon="bolt"
          label={t('settings.notif')}
          desc={t('settings.notif.desc')}
          value={settings.notifications}
          onChange={(v) => setSetting('notifications', v)}
        />
        <SegmentRow
          icon="bolt"
          label={t('settings.lang')}
          desc={t('settings.lang.desc')}
          value={locale}
          onChange={(v) => setLocale(v)}
          options={SUPPORTED_LOCALES}
        />

        <div className="settings-row danger">
          <Icon name="close" size={22} />
          <div className="settings-meta">
            <div className="settings-label">{t('settings.reset')}</div>
            <div className="settings-desc">{t('settings.reset.desc')}</div>
          </div>
          <button
            className="btn danger size-md"
            onClick={() => { if (confirm(t('settings.reset.confirm'))) reset() }}
          >
            {t('settings.reset.btn')}
          </button>
        </div>
      </div>
    </section>
  )
}

function ToggleRow({ icon, label, desc, value, onChange }) {
  return (
    <div className="settings-row">
      <Icon name={icon} size={22} />
      <div className="settings-meta">
        <div className="settings-label">{label}</div>
        <div className="settings-desc">{desc}</div>
      </div>
      <button
        className={'switch' + (value ? ' on' : '')}
        onClick={() => onChange(!value)}
        aria-pressed={value}
      >
        <span className="switch-knob" />
      </button>
    </div>
  )
}

function SegmentRow({ icon, label, desc, value, onChange, options }) {
  return (
    <div className="settings-row">
      <Icon name={icon} size={22} />
      <div className="settings-meta">
        <div className="settings-label">{label}</div>
        <div className="settings-desc">{desc}</div>
      </div>
      <div className="segment">
        {options.map(o => (
          <button
            key={o.id}
            className={'segment-btn' + (value === o.id ? ' on' : '')}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
