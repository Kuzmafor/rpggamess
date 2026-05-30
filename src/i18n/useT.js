import { useEffect, useState } from 'react'
import { onLocaleChange, t as rawT, getLocale } from './index.js'

// Хук-обёртка: возвращает функцию t и тек. локаль; перерендеривает компонент при смене языка.
export function useT() {
  const [, setTick] = useState(0)
  useEffect(() => onLocaleChange(() => setTick(x => x + 1)), [])
  return { t: rawT, locale: getLocale() }
}
