// ============================================================
// Событие «Фестиваль Звездопада» — лимитированное событие на 7 дней.
//
// Содержит три активности:
//   1) Прыжки по руинам (skill-мини-игра: зажать → прыгнуть, не упасть)
//   2) Звёздный автомат (анимированный «дроп-автомат» наград)
//   3) Трек наград за звёздную пыль (event-валюта)
//
// Вся событийная валюта — «звёздная пыль» (tokens). Прыжки её приносят,
// автомат — тратит (или гемы), трек наград выдаёт за суммарно собранную пыль.
// ============================================================

export const EVENT_ID = 'starfall_v1'
export const EVENT_NAME = 'Фестиваль Звездопада'
export const EVENT_DESC = 'Звёзды падают на руины древнего храма. Лови их пыль, прыгай по летающим плитам и крути Звёздный автомат — пока длится фестиваль.'

export const EVENT_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 дней

// ===== Прыжки по руинам =====
export const JUMP_DAILY_ATTEMPTS = 5     // бесплатных попыток в день
export const JUMP_TOKENS_PER_TILE = 3    // звёздной пыли за каждую пройденную плиту
export const JUMP_GOLD_PER_TILE = 180    // золота (до масштабирования) за плиту

// ===== Звёздный автомат =====
export const SLOT_COST_TOKENS = 20       // стоимость прокрутки в пыли
export const SLOT_GEM_COST = 4           // альтернативная стоимость в гемах
export const SLOT_FREE_PER_DAY = 1       // бесплатных прокруток в день

// Таблица дропа автомата. weight — относительный вес.
// kind определяет что выдать; min/max — диапазон количества (до масштабирования).
// Для kind:'hero' — выпадает случайный герой (низкий шанс), редкость по heroRarity.
export const SLOT_ITEMS = [
  { id: 'gold',   kind: 'gold',   icon: 'gold',     label: 'Золото',       color: '#ffd166', weight: 34, min: 4000, max: 12000 },
  { id: 'ore',    kind: 'ore',    icon: 'ore',      label: 'Руда',         color: '#c0a06a', weight: 22, min: 20,   max: 60 },
  { id: 'tokens', kind: 'tokens', icon: 'star',     label: 'Звёздная пыль',color: '#9af5ff', weight: 16, min: 15,   max: 40 },
  { id: 'shards', kind: 'shards', icon: 'artifact', label: 'Осколки',      color: '#a072ff', weight: 13, min: 4,    max: 12 },
  { id: 'gems',   kind: 'gems',   icon: 'gem',      label: 'Гемы',         color: '#67d6ff', weight: 8,  min: 6,    max: 18 },
  { id: 'gear',   kind: 'gear',   icon: 'sword',    label: 'Снаряжение',   color: '#cdd5e1', weight: 6,  gearRarity: ['rare', 'epic', 'legendary'], gearWeights: [0.6, 0.32, 0.08] },
  { id: 'hero',   kind: 'hero',   icon: 'hero',     label: 'Герой',        color: '#ff7a2a', weight: 1,  heroRarity: ['rare', 'epic', 'legendary', 'mythic'], heroWeights: [0.55, 0.33, 0.10, 0.02] },
]

// ===== Трек наград за суммарную пыль =====
// Каждый порог требует totalTokens >= need и выдаётся один раз.
// reward — бандл { gold, gems, ore, shards, tokens, gear, hero, eggs }.
// gold/ore/shards масштабируются по прогрессу игрока в сторе.
export const EVENT_MILESTONES = [
  { need: 60,   label: 'Искра',          reward: { gold: 12000, ore: 30 } },
  { need: 180,  label: 'Метеор',         reward: { gold: 40000, shards: 12, gems: 20 } },
  { need: 360,  label: 'Звездопад',      reward: { gold: 90000, ore: 120, gear: 'epic' } },
  { need: 650,  label: 'Созвездие',      reward: { gold: 200000, shards: 30, gems: 60, eggs: 1 } },
  { need: 1050, label: 'Туманность',     reward: { gold: 450000, ore: 350, gear: 'legendary', gems: 100 } },
  { need: 1700, label: 'Сверхновая',     reward: { gold: 900000, shards: 80, gems: 180, hero: 'epic' } },
  { need: 2800, label: 'Сердце Галактики', reward: { gold: 2_000_000, ore: 900, shards: 150, gems: 350, hero: 'legendary' } },
]

// Утилита взвешенного выбора по массиву объектов с .weight.
export function weightedPick(items) {
  let total = 0
  for (const it of items) total += (it.weight || 0)
  let r = Math.random() * total
  for (const it of items) {
    r -= (it.weight || 0)
    if (r <= 0) return it
  }
  return items[items.length - 1]
}

// Выбор индекса по массиву весов (сумма не обязана быть 1).
export function weightedIndex(weights) {
  let total = 0
  for (const w of weights) total += w
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

// Текущее окно события: к какому 7-дневному циклу относится момент now.
// Возвращает { cycle, startedAt, endsAt }. Привязано к фиксированному якорю,
// чтобы у всех игроков циклы шли синхронно.
const EVENT_ANCHOR = Date.UTC(2024, 0, 1) // 1 января 2024, UTC

export function eventWindow(now = Date.now()) {
  const elapsed = now - EVENT_ANCHOR
  const cycle = Math.floor(elapsed / EVENT_DURATION_MS)
  const startedAt = EVENT_ANCHOR + cycle * EVENT_DURATION_MS
  const endsAt = startedAt + EVENT_DURATION_MS
  return { cycle, startedAt, endsAt }
}

// Ключ дня (для дневных лимитов) — локальная дата.
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
