// Мобильные интеграции Capacitor: хаптика + локальные уведомления.
// На вебе все вызовы no-op — ничего не падает.
// Доступ к самим плагинам через динамический импорт, чтобы не тащить
// нативный код в браузерный бандл и не падать в DEV.

import { Capacitor } from '@capacitor/core'

const isNative = () => {
  try { return Capacitor?.isNativePlatform?.() === true } catch { return false }
}

let hapticsMod = null
let notifMod = null

async function getHaptics() {
  if (!isNative()) return null
  if (hapticsMod) return hapticsMod
  try {
    hapticsMod = await import('@capacitor/haptics')
    return hapticsMod
  } catch { return null }
}

async function getNotifs() {
  if (!isNative()) return null
  if (notifMod) return notifMod
  try {
    notifMod = await import('@capacitor/local-notifications')
    return notifMod
  } catch { return null }
}

// ----- Хаптика -----
// Стиль: 'light' | 'medium' | 'heavy'.
// Включается флагом из настроек игры.
let hapticsEnabled = true
export function setHapticsEnabled(v) { hapticsEnabled = !!v }

export async function impact(style = 'light') {
  if (!hapticsEnabled) return
  const m = await getHaptics()
  if (!m) return
  try {
    const s = m.ImpactStyle?.[style.charAt(0).toUpperCase() + style.slice(1)] || m.ImpactStyle?.Light
    await m.Haptics.impact({ style: s })
  } catch {}
}

export async function vibrate(ms = 60) {
  if (!hapticsEnabled) return
  const m = await getHaptics()
  if (!m) return
  try { await m.Haptics.vibrate({ duration: ms }) } catch {}
}

// ----- Уведомления -----
// Один раз при старте — попросим разрешение и создадим канал.
let notifReady = false
let notifEnabled = true
export function setNotificationsEnabled(v) { notifEnabled = !!v }

export async function ensureNotifications() {
  if (notifReady) return notifEnabled
  notifReady = true
  const m = await getNotifs()
  if (!m) return false
  try {
    const perm = await m.LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') {
      const req = await m.LocalNotifications.requestPermissions()
      if (req.display !== 'granted') {
        notifEnabled = false
        return false
      }
    }
    await m.LocalNotifications.createChannel?.({
      id: 'bof_default',
      name: 'Blade of Fate',
      description: 'Игровые напоминания',
      importance: 4,
      visibility: 1,
      vibration: true,
    })
    return true
  } catch { return false }
}

// id — целое стабильное число (используем 4 константы ниже).
// at — Date в будущем, либо null чтобы отменить.
async function schedule(id, title, body, at) {
  if (!notifEnabled) return
  const m = await getNotifs()
  if (!m) return
  try {
    await m.LocalNotifications.cancel({ notifications: [{ id }] })
    if (!at) return
    const ts = at instanceof Date ? at.getTime() : Number(at)
    if (!ts || ts < Date.now() + 1000) return
    await m.LocalNotifications.schedule({
      notifications: [{
        id,
        title,
        body,
        channelId: 'bof_default',
        schedule: { at: new Date(ts), allowWhileIdle: true },
        smallIcon: 'ic_stat_icon',
      }],
    })
  } catch {}
}

export async function cancelAll() {
  const m = await getNotifs()
  if (!m) return
  try {
    const pending = await m.LocalNotifications.getPending()
    if (pending?.notifications?.length) {
      await m.LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) })
    }
  } catch {}
}

export const NotifIds = {
  offlineFull: 1,
  dailyReady:  2,
  raidDone:    3,
  loginStreak: 4,
}

// ----- API верхнего уровня -----
export async function notifyOfflineFull(at) {
  return schedule(
    NotifIds.offlineFull,
    'Сундук офлайн-награды полон',
    'Зайди в Blade of Fate и забери золото — дальше копиться не будет.',
    at,
  )
}

export async function notifyDailyReady(at) {
  return schedule(
    NotifIds.dailyReady,
    'Ежедневная награда готова',
    'Загляни и получи свой подарок дня.',
    at,
  )
}

export async function notifyRaidDone(at, raidName) {
  return schedule(
    NotifIds.raidDone,
    `Рейд завершён: ${raidName || 'босс'}`,
    'Открой игру и забери трофеи.',
    at,
  )
}

export async function cancelOfflineFull() { return schedule(NotifIds.offlineFull, '', '', null) }
export async function cancelRaidDone()    { return schedule(NotifIds.raidDone, '', '', null) }
