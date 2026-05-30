// Минимальный i18n без рантайм-зависимостей.
// Локали ru | en. Падение — возврат ключа.

import { ru } from './ru.js'
import { en } from './en.js'

const DICTS = { ru, en }

const KEY = 'bof.locale'
let current = 'ru'

function detect() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && DICTS[saved]) return saved
  } catch {}
  try {
    const lang = (navigator.language || 'ru').slice(0, 2).toLowerCase()
    if (DICTS[lang]) return lang
  } catch {}
  return 'ru'
}
current = detect()

const subs = new Set()

export function getLocale() { return current }
export function setLocale(loc) {
  if (!DICTS[loc]) return false
  current = loc
  try { localStorage.setItem(KEY, loc) } catch {}
  for (const fn of subs) fn(loc)
  return true
}
export function onLocaleChange(fn) { subs.add(fn); return () => subs.delete(fn) }

// t('key', { name: 'Foo' })
export function t(key, vars) {
  const dict = DICTS[current] || DICTS.ru
  let str = dict[key]
  if (str == null) {
    const fb = DICTS.ru[key]
    str = fb != null ? fb : key
  }
  if (vars && typeof str === 'string') {
    for (const k of Object.keys(vars)) {
      str = str.replaceAll('{' + k + '}', vars[k])
    }
  }
  return str
}

export const SUPPORTED_LOCALES = [
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
]
