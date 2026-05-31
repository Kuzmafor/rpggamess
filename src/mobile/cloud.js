// Клиент облачных сохранений. Общается с нашим сервером (server/index.js).
// Поток:
//   1. authTelegram(...) — отправляем данные входа, получаем сессионный токен.
//   2. fetchCloudSave()  — тянем облачный сейв игрока.
//   3. pushCloudSave(...)— отправляем локальный сейв в облако (с debounce).
//
// Токен сессии храним в localStorage, чтобы не логиниться каждый раз.

const TOKEN_KEY = 'bof.cloud.token'
// База API: на проде это тот же origin (сервер раздаёт и игру, и API).
// В dev можно указать VITE_API_BASE, иначе пробуем относительные пути.
const API_BASE = (import.meta?.env?.VITE_API_BASE || '').replace(/\/$/, '')

function url(path) {
  return API_BASE + path
}

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}
function setToken(t) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch {}
}
export function clearToken() { setToken('') }

// Авторизация. payload: { widget } для браузера или { initData } для Mini App.
// Возвращает { user } при успехе или null.
export async function authTelegram(payload) {
  try {
    const r = await fetch(url('/api/auth/telegram'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!r.ok) return null
    const data = await r.json()
    if (data?.token) {
      setToken(data.token)
      return { user: data.user }
    }
    return null
  } catch {
    return null
  }
}

// Загрузить облачный сейв. Возвращает { save, savedAt } или null.
export async function fetchCloudSave() {
  const token = getToken()
  if (!token) return null
  try {
    const r = await fetch(url('/api/save'), {
      headers: { Authorization: 'Bearer ' + token },
    })
    if (r.status === 401) { clearToken(); return null }
    if (!r.ok) return null
    const data = await r.json()
    if (!data?.save) return null
    return { save: data.save, savedAt: data.savedAt || 0 }
  } catch {
    return null
  }
}

// Отправить сейв в облако. save — объект, savedAt — метка времени.
// При конфликте (на сервере свежее) сервер вернёт свой сейв — отдаём его выше.
export async function pushCloudSave(save, savedAt) {
  const token = getToken()
  if (!token) return { ok: false, reason: 'no_token' }
  try {
    const r = await fetch(url('/api/save'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ save, savedAt }),
    })
    if (r.status === 401) { clearToken(); return { ok: false, reason: 'unauthorized' } }
    if (!r.ok) return { ok: false, reason: 'http_' + r.status }
    return await r.json()
  } catch {
    return { ok: false, reason: 'network' }
  }
}

export function isLoggedIn() {
  return !!getToken()
}

// Таблица лидеров (топ-100). Доступна без входа.
export async function fetchLeaderboard() {
  try {
    const r = await fetch(url('/api/leaderboard'))
    if (!r.ok) return []
    const data = await r.json()
    return Array.isArray(data?.board) ? data.board : []
  } catch {
    return []
  }
}

// Моя позиция в рейтинге (нужен вход). Возвращает объект или null.
export async function fetchMyRank() {
  const token = getToken()
  if (!token) return null
  try {
    const r = await fetch(url('/api/leaderboard/me'), {
      headers: { Authorization: 'Bearer ' + token },
    })
    if (!r.ok) return null
    const data = await r.json()
    return data?.me || null
  } catch {
    return null
  }
}
