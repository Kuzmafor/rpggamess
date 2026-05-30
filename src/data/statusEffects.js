// Статус-эффекты на врагах. Применяются стихийными ударами.
// Хранятся в enemy.statuses = { [id]: { startedAt, expiresAt } }.
//
// dotPct       — доля maxHp в секунду как DOT
// incomingMult — множитель на входящий урон, пока эффект активен
// chainPct     — доля урона, расплёскиваемая на других живых (для шока)
// haltsRegen   — стопает регенерацию ярости босса (для оглушения)

export const STATUSES = {
  burn:   { id: 'burn',   name: 'Поджог',       icon: '🔥', color: '#ff7a2a', dotPct: 0.045, dur: 4000 },
  bleed:  { id: 'bleed',  name: 'Кровотечение', icon: '🩸', color: '#ff5470', dotPct: 0.030, dur: 6000 },
  freeze: { id: 'freeze', name: 'Заморозка',    icon: '❄️', color: '#67d6ff', incomingMult: 1.30, dur: 3000 },
  stun:   { id: 'stun',   name: 'Оглушение',    icon: '✨', color: '#ffd166', incomingMult: 1.20, haltsRegen: true, dur: 2200 },
  shock:  { id: 'shock',  name: 'Шок',          icon: '⚡', color: '#ffd166', chainPct: 0.35, dur: 3500 },
  curse:  { id: 'curse',  name: 'Проклятие',    icon: '🌙', color: '#a072ff', incomingMult: 1.20, dur: 5000 },
}

// Возвращает обновлённую мапу статусов — продлевает эффект, если уже висит.
export function applyStatus(prev, id) {
  const def = STATUSES[id]
  if (!def) return prev || {}
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now())
  return {
    ...(prev || {}),
    [id]: {
      startedAt: now,
      expiresAt: now + def.dur,
    },
  }
}

// Чистит истёкшие эффекты. Возвращает [очищенная мапа, было ли что-то снято].
export function pruneStatuses(prev) {
  if (!prev) return [{}, false]
  const now = (typeof performance !== 'undefined' ? performance.now() : Date.now())
  let changed = false
  const out = {}
  for (const [id, info] of Object.entries(prev)) {
    if (now > info.expiresAt) { changed = true; continue }
    out[id] = info
  }
  return [out, changed]
}

// Сумма множителей входящего урона от всех активных статусов.
export function incomingMultFor(statuses) {
  if (!statuses) return 1
  let m = 1
  for (const id of Object.keys(statuses)) {
    const def = STATUSES[id]
    if (def?.incomingMult) m *= def.incomingMult
  }
  return m
}
