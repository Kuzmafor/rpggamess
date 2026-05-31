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
import LeaderboardPanel from './components/LeaderboardPanel.jsx'
import CityPanel from './components/CityPanel.jsx'
import PetsPanel from './components/PetsPanel.jsx'
import Onboarding, { isOnboardingDone } from './components/Onboarding.jsx'
import OfflineCard from './components/OfflineCard.jsx'
import SynergyStrip from './components/SynergyStrip.jsx'
import TowerPanel from './components/TowerPanel.jsx'
import TowerHud from './components/TowerHud.jsx'
import InventoryPanel from './components/InventoryPanel.jsx'
import { useGameStore } from './store/useGameStore.js'
import { registerCloudPush } from './store/useGameStore.js'
import * as audio from './audio/engine.js'
import { initTelegram, getTelegramUser, getInitDataRaw } from './mobile/telegram.js'
import { authTelegram, fetchCloudSave, pushCloudSave, isLoggedIn } from './mobile/cloud.js'
import {
  ensureNotifications, setHapticsEnabled, setNotificationsEnabled,
  notifyOfflineFull, cancelOfflineFull,
} from './mobile/index.js'

// Синхронизация облака после успешного входа: тянем серверный сейв и,
// если он новее локального, применяем его к игре. Иначе отправляем локальный
// в облако, чтобы там оказалась самая свежая версия.
async function syncCloudAfterLogin() {
  try {
    const cloud = await fetchCloudSave()
    const localSavedAt = useGameStore.getState().savedAt || 0
    if (cloud && cloud.save) {
      const cloudSavedAt = cloud.savedAt || cloud.save.savedAt || 0
      if (cloudSavedAt > localSavedAt) {
        useGameStore.getState().applyCloudSave({ ...cloud.save, savedAt: cloudSavedAt })
        return
      }
    }
    // Локальный прогресс новее (или облако пустое) — заливаем его в облако.
    const s = useGameStore.getState()
    pushCloudSave(buildSaveSubset(s), s.savedAt || Date.now())
  } catch {}
}

// Минимальный снимок прогресса для отправки в облако сразу после входа.
// (Полный снимок формируется в сторе при следующем saveState, здесь —
// чтобы не ждать первого действия игрока.)
function buildSaveSubset(s) {
  try {
    const raw = localStorage.getItem('blade-of-fate.save.v3')
    if (raw) return JSON.parse(raw)
  } catch {}
  return { savedAt: s.savedAt || Date.now() }
}

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
    let slowAcc = 0   // аккумулятор времени для фоновых тиков (~10 Гц)
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

      // Когда вкладка скрыта — не крутим тяжёлые тики (экономим CPU/батарею).
      if (!visible) {
        raf = requestAnimationFrame(loop)
        return
      }

      // Боевые тики — каждый кадр (плавность анимаций).
      tickPassive(dt)
      tickParty(dt)
      tickStatuses(dt)

      // Фоновые системы не нуждаются в 60 FPS — обновляем ~10 раз/сек.
      // Это заметно снижает нагрузку на слабых устройствах без потери логики.
      slowAcc += dt
      if (slowAcc >= 100) {
        tickRaid()
        tickTower(slowAcc)
        tickBossRush()
        tickCity(slowAcc)
        // активность считаем только когда не AFK >5 минут
        const idle = Date.now() - lastInput
        if (idle < 5 * 60 * 1000) tickActivity(slowAcc)
        slowAcc = 0
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
    // Регистрируем отправку сейвов в облако (debounce внутри стора).
    registerCloudPush((subset, savedAt) => {
      if (isLoggedIn()) pushCloudSave(subset, savedAt)
    })

    initTelegram()
    const user = getTelegramUser()
    if (user) {
      useGameStore.getState().setTelegramProfile(user)
      // Внутри Telegram авторизуемся через initData и подтягиваем облако.
      const initData = getInitDataRaw()
      if (initData) {
        ;(async () => {
          const auth = await authTelegram({ initData })
          if (auth) await syncCloudAfterLogin()
        })()
      }
    } else if (isLoggedIn()) {
      // Уже была сессия в этом браузере — синхронизируемся.
      syncCloudAfterLogin()
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
      {overlay === 'leaderboard' && <LeaderboardPanel onClose={() => setOverlay(null)} />}
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
