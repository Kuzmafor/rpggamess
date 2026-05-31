// Интеграция с Telegram Mini App (telegram-web-app.js).
// Когда игра открыта внутри Telegram, глобальный объект window.Telegram.WebApp
// уже доступен и содержит данные пользователя. В обычном браузере его нет —
// все функции возвращают безопасные значения и ничего не ломают.

function getWebApp() {
  try {
    return window?.Telegram?.WebApp || null
  } catch {
    return null
  }
}

// Запущена ли игра внутри Telegram (Mini App), а не в обычном браузере.
export function isTelegram() {
  const wa = getWebApp()
  // initData непустой только при реальном запуске из Telegram.
  return !!(wa && typeof wa.initData === 'string' && wa.initData.length > 0)
}

// Данные текущего пользователя Telegram или null.
// ВНИМАНИЕ: это unsafe-данные (без серверной проверки подписи). Их достаточно
// для персонализации (имя/аватар), но НЕЛЬЗЯ доверять им для платежей/прав.
export function getTelegramUser() {
  const wa = getWebApp()
  try {
    const u = wa?.initDataUnsafe?.user
    if (!u || !u.id) return null
    return {
      id: u.id,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      username: u.username || '',
      photo_url: u.photo_url || '',
      language_code: u.language_code || '',
    }
  } catch {
    return null
  }
}

// Готовим Mini App: сообщаем Telegram что интерфейс загружен, разворачиваем
// окно на весь экран и подгоняем цвета шапки под тему игры.
// Безопасно вызывать всегда — вне Telegram просто выйдет.
export function initTelegram() {
  const wa = getWebApp()
  setupViewport(wa)
  if (!wa) return null
  try {
    wa.ready()
    wa.expand?.()
    wa.setHeaderColor?.('#06081a')
    wa.setBackgroundColor?.('#06081a')
    wa.disableVerticalSwipes?.()
  } catch {}
  return wa
}

// Привязываем реальную высоту области просмотра к CSS-переменной --app-h.
// В Telegram webview значение 100dvh ненадёжно (контент уезжает под шапку и
// нижнюю панель), поэтому берём точную высоту из Telegram, а в обычном
// браузере — из visualViewport / innerHeight. Обновляем при любых изменениях.
let viewportBound = false
export function setupViewport(waArg) {
  const root = document.documentElement
  const wa = waArg || getWebApp()

  const apply = () => {
    let h = 0
    try {
      if (wa && wa.viewportStableHeight) {
        h = wa.viewportStableHeight
      } else if (window.visualViewport && window.visualViewport.height) {
        h = window.visualViewport.height
      } else {
        h = window.innerHeight
      }
    } catch {
      h = window.innerHeight
    }
    if (h && h > 0) {
      root.style.setProperty('--app-h', h + 'px')
    }
    // Безопасные зоны Telegram (челка/жесты) — если доступны.
    try {
      const sa = wa?.contentSafeAreaInset || wa?.safeAreaInset
      if (sa) {
        root.style.setProperty('--tg-safe-top', (sa.top || 0) + 'px')
        root.style.setProperty('--tg-safe-bottom', (sa.bottom || 0) + 'px')
      }
    } catch {}
  }

  apply()

  if (viewportBound) return
  viewportBound = true

  try { wa?.onEvent?.('viewportChanged', apply) } catch {}
  try { wa?.onEvent?.('safeAreaChanged', apply) } catch {}
  try { wa?.onEvent?.('contentSafeAreaChanged', apply) } catch {}
  window.addEventListener('resize', apply)
  window.addEventListener('orientationchange', apply)
  try { window.visualViewport?.addEventListener('resize', apply) } catch {}
  // Метим html для CSS-веток, когда мы внутри Telegram.
  if (isTelegram()) root.setAttribute('data-tg', '1')
}

// Полная строка initData — понадобится позже, если добавите серверную
// проверку подписи (HMAC с токеном бота) для защищённого входа.
export function getInitDataRaw() {
  const wa = getWebApp()
  try {
    return wa?.initData || ''
  } catch {
    return ''
  }
}

// Ссылка на бота для приглашения играть из обычного браузера.
export const BOT_URL = 'https://t.me/bladeoffatebot'

// Открыть окно оплаты Telegram Stars по ссылке-инвойсу.
// Возвращает Promise со статусом: 'paid' | 'cancelled' | 'failed' | 'pending'.
export function openInvoice(link) {
  const wa = getWebApp()
  return new Promise((resolve) => {
    if (!wa || !wa.openInvoice) { resolve('unsupported'); return }
    try {
      wa.openInvoice(link, (status) => resolve(status))
    } catch {
      resolve('failed')
    }
  })
}

// Поддерживается ли оплата звёздами (мы внутри Telegram с нужным API).
export function canPayStars() {
  const wa = getWebApp()
  return !!(wa && typeof wa.openInvoice === 'function')
}
