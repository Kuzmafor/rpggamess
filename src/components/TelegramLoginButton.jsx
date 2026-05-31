import React, { useEffect, useRef } from 'react'

// Официальный Telegram Login Widget для входа в ОБЫЧНОМ браузере.
// Telegram отдаёт данные пользователя (id, имя, username, аватар) + подпись hash.
// ВНИМАНИЕ: здесь подпись НЕ проверяется на сервере (выбран простой режим),
// поэтому данные считаем "как есть" — годятся для персонализации, но не для
// защищённых операций. Для настоящей проверки нужен бэкенд с токеном бота.
//
// Чтобы виджет работал, домен сайта должен быть привязан к боту в @BotFather:
//   /setdomain → выбрать бота → ввести домен (например rpggamess.onrender.com).
// На localhost виджет не отрисуется — только на привязанном домене.

const BOT_USERNAME = 'bladeoffatebot' // без @ и без https://t.me/

export default function TelegramLoginButton({ onAuth }) {
  const ref = useRef(null)

  useEffect(() => {
    // Глобальный колбэк, который вызовет виджет после успешного входа.
    window.onTelegramAuth = (user) => {
      try { onAuth?.(user) } catch {}
    }

    const container = ref.current
    if (!container) return

    // Не дублируем скрипт при повторном монтировании.
    if (container.querySelector('script')) return

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', BOT_USERNAME)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '12')
    script.setAttribute('data-userpic', 'true')
    script.setAttribute('data-request-access', 'write')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    container.appendChild(script)

    return () => {
      // Чистим колбэк, контейнер очистится сам при размонтировании.
      if (window.onTelegramAuth) {
        try { delete window.onTelegramAuth } catch { window.onTelegramAuth = undefined }
      }
    }
  }, [onAuth])

  return <div className="tg-login-widget" ref={ref} />
}
