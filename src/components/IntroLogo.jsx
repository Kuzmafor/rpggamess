import React, { useEffect, useState } from 'react'
import logoUrl from '../assets/logo.jpg'

// Экран-приветствие: логотип на чёрном фоне.
// Анимация: плавное появление (fade-in) + лёгкий zoom + свечение,
// затем плавное исчезновение. После — вызывает onDone (показываем splash).
// Всего ~2.6 сек. Тап по экрану пропускает intro.

const HOLD_MS = 1700      // сколько логотип держится после появления
const FADE_OUT_MS = 600   // длительность затухания

export default function IntroLogo({ onDone }) {
  const [phase, setPhase] = useState('in') // in | hold | out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 50)
    const t2 = setTimeout(() => setPhase('out'), HOLD_MS)
    const t3 = setTimeout(() => onDone?.(), HOLD_MS + FADE_OUT_MS)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  function skip() {
    setPhase('out')
    setTimeout(() => onDone?.(), FADE_OUT_MS)
  }

  return (
    <div
      className={'intro-logo intro-' + phase}
      onClick={skip}
      role="button"
      aria-label="Пропустить заставку"
    >
      <div className="intro-glow" />
      <img className="intro-logo-img" src={logoUrl} alt="Blade of Fate" />
    </div>
  )
}
