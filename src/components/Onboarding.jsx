import React, { useEffect, useLayoutEffect, useState } from 'react'
import { Icon } from '../assets/Icon.jsx'

/**
 * Простой пошаговый онбординг с подсветкой DOM-элементов.
 *
 * Селектор `target` ищется в документе — найденный элемент получает
 * "вырез" в маске + рамку. Плашка с текстом размещается выше или
 * ниже, в зависимости от того, сколько места.
 *
 * Если элемент не найден (UI ещё не успел отрендериться), шаг
 * пропускается автоматически.
 */

const STEPS = [
  {
    target: '.enemy-line',
    title: 'Враги',
    text: 'Тапайте по врагу, чтобы навести фокус и бить сильнее. Отряд автоматически добивает остальных.',
    placement: 'top',
  },
  {
    target: '.hp-wrap',
    title: 'Шкала HP волны',
    text: 'Это сводное HP всей шеренги. Когда оно опустеет — приходит следующая волна.',
    placement: 'bottom',
  },
  {
    target: '.stage-name-btn',
    title: 'Карта мира',
    text: 'Нажмите на имя зоны, чтобы открыть карту и быстро переключаться между пройденными зонами.',
    placement: 'bottom',
  },
  {
    target: '.super-btn',
    title: 'Ярость и Супер',
    text: 'Заполняйте ярость тапами. Когда круг готов — нажимайте, чтобы провести усиленную серию.',
    placement: 'left',
  },
  {
    target: '.party-bar',
    title: 'Отряд и ульты',
    text: 'Здесь — герои в строю с уровнем и уроном. Кольцо вокруг карточки — перезарядка ульты. Готовый ульт сияет золотом — тап, чтобы скастовать.',
    placement: 'top',
  },
  {
    target: '.bottombar',
    title: 'Меню снизу',
    text: 'Бой, Герои, Оружие, Рейды, Магазин. Здесь вы прокачиваете отряд и собираете снаряжение.',
    placement: 'top',
  },
  {
    target: '.burger-btn',
    title: 'Главное меню',
    text: 'Здесь — Профиль, Подземелье, Календарь, Артефакты, Почта и Настройки.',
    placement: 'bottom',
  },
]

const KEY = 'bof.onboarding.v1'

export default function Onboarding({ onClose }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState(null)
  const [missing, setMissing] = useState(false)

  const step = STEPS[stepIdx]

  // Вычисляем bounds подсвечиваемого элемента и обновляем при ресайзе/прокрутке.
  useLayoutEffect(() => {
    let raf
    function update() {
      const el = step ? document.querySelector(step.target) : null
      if (!el) {
        setMissing(true)
        setRect(null)
        return
      }
      setMissing(false)
      const r = el.getBoundingClientRect()
      setRect({
        x: r.left, y: r.top,
        w: r.width, h: r.height,
      })
    }
    update()
    const onResize = () => raf = requestAnimationFrame(update)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    const id = setInterval(update, 250) // на случай анимаций контента
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
      clearInterval(id)
    }
  }, [step?.target])

  // Если шаг пустой / элемента нет — авто-перейти дальше через 600мс
  useEffect(() => {
    if (!missing) return
    const t = setTimeout(() => goNext(), 600)
    return () => clearTimeout(t)
  }, [missing, stepIdx])

  function finish() {
    try { localStorage.setItem(KEY, '1') } catch {}
    onClose?.()
  }
  function goNext() {
    if (stepIdx + 1 >= STEPS.length) finish()
    else setStepIdx(stepIdx + 1)
  }
  function goPrev() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
  }

  // SVG-маска: вырез вокруг элемента
  const padding = 8
  const cutout = rect ? {
    x: Math.max(0, rect.x - padding),
    y: Math.max(0, rect.y - padding),
    w: rect.w + padding * 2,
    h: rect.h + padding * 2,
  } : null

  // Положение тултипа
  const tip = computeTipPlacement(rect, step?.placement)

  return (
    <div className="onb-overlay">
      {/* Маска с вырезом */}
      <svg className="onb-mask" width="100%" height="100%">
        <defs>
          <mask id="onbCut">
            <rect width="100%" height="100%" fill="white" />
            {cutout && (
              <rect
                x={cutout.x} y={cutout.y}
                width={cutout.w} height={cutout.h}
                rx="14" ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#onbCut)" />
        {cutout && (
          <rect
            x={cutout.x} y={cutout.y}
            width={cutout.w} height={cutout.h}
            rx="14" ry="14"
            fill="none"
            stroke="rgba(255,209,102,0.8)"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Тултип */}
      {step && (
        <div
          className="onb-tip"
          style={{
            left: tip.left,
            top: tip.top,
            transform: tip.transform,
            maxWidth: tip.maxWidth,
          }}
        >
          <div className="onb-tip-head">
            <span className="onb-step">Шаг {stepIdx + 1} / {STEPS.length}</span>
            <button className="onb-skip" onClick={finish}>Пропустить</button>
          </div>
          <div className="onb-title">{step.title}</div>
          <div className="onb-text">{step.text}</div>
          <div className="onb-actions">
            {stepIdx > 0 && <button className="btn ghost size-sm" onClick={goPrev}>Назад</button>}
            <button className="btn gold size-sm" onClick={goNext}>
              {stepIdx + 1 < STEPS.length ? 'Далее' : 'Поехали!'}
            </button>
          </div>
          <div className="onb-progress">
            {STEPS.map((_, i) => (
              <span key={i} className={'onb-dot' + (i === stepIdx ? ' active' : '') + (i < stepIdx ? ' done' : '')} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function computeTipPlacement(rect, placement = 'auto') {
  const W = window.innerWidth
  const H = window.innerHeight
  const margin = 12
  const tipMax = Math.min(360, W - margin * 2)
  if (!rect) {
    return {
      left: W / 2,
      top: H / 2,
      transform: 'translate(-50%, -50%)',
      maxWidth: tipMax,
    }
  }

  const cx = rect.x + rect.w / 2
  const above = rect.y > H * 0.42
  const useTop = placement === 'top' || (placement === 'auto' && above) || placement === 'auto-top'
  const useLeft = placement === 'left'
  const useRight = placement === 'right'

  // Считаем «целевые» координаты, потом ограничиваем плашку в пределах экрана.
  // Берём ширину/высоту "близко к правде" — реальные размеры известны после mount,
  // но мы аппроксимируем через tipMax и среднюю высоту.
  const tipW = Math.min(tipMax, 320)
  const tipH = 150

  if (useLeft) {
    let left = rect.x - margin
    let top = rect.y + rect.h / 2
    left = Math.max(margin + tipW, left) // слева тоже не вылезаем
    return { left, top, transform: 'translate(-100%, -50%)', maxWidth: tipMax }
  }
  if (useRight) {
    let left = rect.x + rect.w + margin
    let top = rect.y + rect.h / 2
    left = Math.min(W - margin - tipW, left)
    return { left, top, transform: 'translate(0, -50%)', maxWidth: tipMax }
  }

  // top / bottom — центруем по X цели и ограничиваем краями экрана.
  let left = cx
  const halfW = tipW / 2
  if (left - halfW < margin) left = margin + halfW
  if (left + halfW > W - margin) left = W - margin - halfW

  if (useTop) {
    const top = Math.max(margin + tipH, rect.y - margin)
    return {
      left,
      top,
      transform: 'translate(-50%, -100%)',
      maxWidth: tipMax,
    }
  }
  // bottom (по умолчанию)
  let top = rect.y + rect.h + margin
  if (top + tipH > H - margin) top = H - margin - tipH
  return {
    left,
    top,
    transform: 'translate(-50%, 0)',
    maxWidth: tipMax,
  }
}

function clampX(x, W) {
  const margin = 16
  return Math.max(margin, Math.min(W - margin, x))
}

export function isOnboardingDone() {
  try { return localStorage.getItem(KEY) === '1' } catch { return true }
}
