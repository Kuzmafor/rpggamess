import React, { useEffect, useState } from 'react'
import TopBar from './components/TopBar.jsx'
import StageInfo from './components/StageInfo.jsx'
import Arena from './components/Arena.jsx'
import PartyBar from './components/PartyBar.jsx'
import BottomNav from './components/BottomNav.jsx'
import HeroesPanel from './components/HeroesPanel.jsx'
import WeaponsPanel from './components/WeaponsPanel.jsx'
import RaidsPanel from './components/RaidsPanel.jsx'
import ShopPanel from './components/ShopPanel.jsx'
import DungeonPanel from './components/DungeonPanel.jsx'
import MailPanel from './components/MailPanel.jsx'
import ArtifactsPanel from './components/ArtifactsPanel.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import SideMenu from './components/SideMenu.jsx'
import Toasts from './components/Toasts.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import DungeonHud from './components/DungeonHud.jsx'
import RaidBattle from './components/RaidBattle.jsx'
import ZonesMapPanel from './components/ZonesMapPanel.jsx'
import ProfilePanel from './components/ProfilePanel.jsx'
import PrestigePanel from './components/PrestigePanel.jsx'
import TalentsPanel from './components/TalentsPanel.jsx'
import ChallengesPanel from './components/ChallengesPanel.jsx'
import ProgressionPanel from './components/ProgressionPanel.jsx'
import RewardsPanel from './components/RewardsPanel.jsx'
import CodexPanel from './components/CodexPanel.jsx'
import CityPanel from './components/CityPanel.jsx'
import PetsPanel from './components/PetsPanel.jsx'
import Onboarding, { isOnboardingDone } from './components/Onboarding.jsx'
import OfflineCard from './components/OfflineCard.jsx'
import SynergyStrip from './components/SynergyStrip.jsx'
import TowerPanel from './components/TowerPanel.jsx'
import TowerHud from './components/TowerHud.jsx'
import InventoryPanel from './components/InventoryPanel.jsx'
import { useGameStore } from './store/useGameStore.js'
import * as audio from './audio/engine.js'
import { initTelegram, getTelegramUser } from './mobile/telegram.js'
import {
  ensureNotifications, setHapticsEnabled, setNotificationsEnabled,
  notifyOfflineFull, cancelOfflineFull,
} from './mobile/index.js'

export default function App() {
  const [tab, setTab] = useState('battle')
  const [menuOpen, setMenuOpen] = useState(false)
  const [overlay, setOverlay] = useState(null)
  const [loading, setLoading] = useState(() => {
    try { return !sessionStorage.getItem('bof.loaded') } catch { return true }
  })
  const [onbActive, setOnbActive] = useState(() => !isOnboardingDone())

  const tickPassive  = useGameStore(s => s.tickPassive)
  const tickParty    = useGameStore(s => s.tickParty)
  const tickStatuses = useGameStore(s => s.tickStatuses)
  const tickRaid     = useGameStore(s => s.tickRaid)
  const tickTower    = useGameStore(s => s.tickTower)
  const tickBossRush = useGameStore(s => s.tickBossRush)
  const tickActivity = useGameStore(s => s.tickActivity)
  const tickCity     = useGameStore(s => s.tickCity)
  const claimOffline = useGameStore(s => s.claimOffline)
  const fxLevel      = useGameStore(s => s.settings?.fxLevel || 'high')

  useEffect(() => {
    let last = performance.now()
    let lastInput = Date.now()
    let visible = !document.hidden
    let raf

    const onVis = () => { visible = !document.hidden; last = performance.now(); lastInput = Date.now() }
    const onInput = () => { lastInput = Date.now() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pointerdown', onInput)
    window.addEventListener('keydown', onInput)
    window.addEventListener('mousemove', onInput, { passive: true })

    const loop = (now) => {
      const dt = now - last
      last = now
      tickPassive(dt)
      tickParty(dt)
      tickStatuses(dt)
      tickRaid()
      tickTower(dt)
      tickBossRush()
      tickCity(dt)
      // активность считаем только когда вкладка видима и пользователь не AFK >5 минут
      const idle = Date.now() - lastInput
      if (visible && idle < 5 * 60 * 1000) {
        tickActivity(dt)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pointerdown', onInput)
      window.removeEventListener('keydown', onInput)
      window.removeEventListener('mousemove', onInput)
    }
  }, [tickPassive, tickParty, tickStatuses, tickRaid, tickTower, tickBossRush, tickActivity, tickCity])

  // Аккаунт-награда оффлайн показывается отдельным окном OfflineCard.

  // ===== Аудио =====
  // Разблокируем контекст по первому жесту, синхронизируем настройки и тему.
  useEffect(() => {
    function unlock() {
      audio.unlockAudio()
      const s = useGameStore.getState()
      audio.setSoundEnabled(!!s.settings?.sound)
      audio.setMusicEnabled(!!s.settings?.music)
      audio.startMusic(audio.getZoneTheme(s.stage), 1)
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  // Подписка на смену настроек Sound/Music и зоны
  useEffect(() => {
    return useGameStore.subscribe((s, prev) => {
      if (s.settings?.sound !== prev?.settings?.sound) {
        audio.setSoundEnabled(!!s.settings?.sound)
      }
      if (s.settings?.music !== prev?.settings?.music) {
        audio.setMusicEnabled(!!s.settings?.music)
      }
      if (s.settings?.haptics !== prev?.settings?.haptics) {
        setHapticsEnabled(!!s.settings?.haptics)
      }
      if (s.settings?.notifications !== prev?.settings?.notifications) {
        setNotificationsEnabled(!!s.settings?.notifications)
        if (s.settings?.notifications) ensureNotifications()
      }
      if (s.stage !== prev?.stage) {
        audio.startMusic(audio.getZoneTheme(s.stage), 1)
      }
    })
  }, [])

  // ===== Capacitor: инициализация при первом запуске =====
  useEffect(() => {
    const s = useGameStore.getState().settings || {}
    setHapticsEnabled(!!s.haptics)
    setNotificationsEnabled(!!s.notifications)
    if (s.notifications) ensureNotifications()
  }, [])

  // ===== Telegram Mini App: подхватываем профиль игрока при старте =====
  useEffect(() => {
    initTelegram()
    const user = getTelegramUser()
    if (user) {
      useGameStore.getState().setTelegramProfile(user)
    }
  }, [])

  // ===== Уведомление "оффлайн-сундук полон" =====
  // Планируем при уходе со страницы / визибилити hidden, отменяем при возврате.
  useEffect(() => {
    const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000
    function onHide() {
      const st = useGameStore.getState()
      if (!st.settings?.notifications) return
      const savedAt = st.savedAt || Date.now()
      const fillsAt = savedAt + OFFLINE_CAP_MS
      notifyOfflineFull(new Date(fillsAt))
    }
    function onShow() {
      cancelOfflineFull()
    }
    function onVis() {
      if (document.hidden) onHide()
      else onShow()
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', onHide)
    window.addEventListener('pageshow', onShow)
    // первичный отмен при заходе
    onShow()
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('pageshow', onShow)
    }
  }, [])

  return (
    <div className="app" data-fx={fxLevel === 'low' ? 'low' : 'high'}>
      <TopBar onMenu={() => setMenuOpen(true)} />
      <StageInfo onOpenMap={() => setOverlay('zones')} />
      <Arena />
      <SynergyStrip />
      <PartyBar />
      <BottomNav tab={tab} setTab={setTab} />

      {tab === 'heroes'   && <HeroesPanel onClose={() => setTab('battle')} />}
      {tab === 'weapons'  && <WeaponsPanel onClose={() => setTab('battle')} />}
      {tab === 'raids'    && <RaidsPanel onClose={() => setTab('battle')} />}
      {tab === 'pets'     && <PetsPanel onClose={() => setTab('battle')} />}

      {overlay === 'dungeon'    && <ChallengesPanel initialTab="dungeon" onClose={() => setOverlay(null)} />}
      {overlay === 'tower'      && <ChallengesPanel initialTab="tower"   onClose={() => setOverlay(null)} />}
      {overlay === 'challenges' && <ChallengesPanel onClose={() => setOverlay(null)} />}
      {overlay === 'battlepass' && <RewardsPanel initialTab="battlepass" onClose={() => setOverlay(null)} />}
      {overlay === 'rewards' && <RewardsPanel initialTab="event" onClose={() => setOverlay(null)} />}
      {overlay === 'codex' && <CodexPanel onClose={() => setOverlay(null)} />}
      {overlay === 'city' && <CityPanel onClose={() => setOverlay(null)} />}
      {overlay === 'shop' && <ShopPanel onClose={() => setOverlay(null)} />}
      {overlay === 'event' && <RewardsPanel initialTab="event" onClose={() => setOverlay(null)} />}
      {overlay === 'inventory' && <InventoryPanel onClose={() => setOverlay(null)} />}
      {overlay === 'mail'      && <MailPanel      onClose={() => setOverlay(null)} />}
      {overlay === 'progression' && <ProgressionPanel onClose={() => setOverlay(null)} />}
      {overlay === 'artifacts' && <ProgressionPanel initialTab="artifacts" onClose={() => setOverlay(null)} />}
      {overlay === 'talents'   && <ProgressionPanel initialTab="talents"   onClose={() => setOverlay(null)} />}
      {overlay === 'prestige'  && <ProgressionPanel initialTab="prestige"  onClose={() => setOverlay(null)} />}
      {overlay === 'settings'  && <SettingsPanel  onClose={() => setOverlay(null)} />}
      {overlay === 'zones'     && <ZonesMapPanel  onClose={() => setOverlay(null)} />}
      {overlay === 'profile'   && <ProfilePanel   onClose={() => setOverlay(null)} />}
      {overlay === 'calendar'  && <RewardsPanel initialTab="calendar" onClose={() => setOverlay(null)} />}

      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onPick={(id) => setOverlay(id)}
      />

      <Toasts />

      <DungeonHud />
      <RaidBattle />
      <OfflineCard />
      <TowerHud />

      {loading && (
        <LoadingScreen onDone={() => {
          try { sessionStorage.setItem('bof.loaded', '1') } catch {}
          setLoading(false)
        }} />
      )}

      {!loading && onbActive && (
        <Onboarding onClose={() => setOnbActive(false)} />
      )}
    </div>
  )
}
