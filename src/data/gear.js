// Снаряжение (gear / runes).
// 6 слотов, 4 редкости, 6 типов аффиксов, 4 сета.
// Применяется глобально к отряду — добавляется в pool бонусов.

// ===== Слоты =====
export const GEAR_SLOTS = [
  { id: 'weapon',  label: 'Оружие',  icon: 'sword' },
  { id: 'helmet',  label: 'Шлем',    icon: 'crown' },
  { id: 'armor',   label: 'Броня',   icon: 'shield' },
  { id: 'boots',   label: 'Сапоги',  icon: 'rocket' },
  { id: 'ring',    label: 'Кольцо',  icon: 'gem' },
  { id: 'amulet',  label: 'Амулет',  icon: 'artifact' },
]

// ===== Редкости =====
export const GEAR_RARITIES = ['common', 'rare', 'epic', 'legendary']

export const RARITY_INFO = {
  common:    { label: 'Обычный',     color: '#c8cee8', affixes: 1, mult: 1.0 },
  rare:      { label: 'Редкий',      color: '#67d6ff', affixes: 2, mult: 1.4 },
  epic:      { label: 'Эпический',   color: '#a072ff', affixes: 3, mult: 1.9 },
  legendary: { label: 'Легендарный', color: '#ffd166', affixes: 3, mult: 2.6 },
}

// ===== Аффиксы =====
// `apply` определяет, как значение аффикса попадает в общий бонус.
// Все значения — доли (0.05 = +5%).
export const AFFIXES = {
  dmg:   { label: 'Урон отряда',     icon: 'sword',  base: 0.04, jitter: 0.02 },
  speed: { label: 'Скорость атак',   icon: 'bolt',   base: 0.03, jitter: 0.015 },
  crit:  { label: 'Шанс крита',      icon: 'gem',    base: 0.02, jitter: 0.01 },
  gold:  { label: 'Золото',          icon: 'gold',   base: 0.05, jitter: 0.025 },
  hp:    { label: 'HP отряда',       icon: 'shield', base: 0.05, jitter: 0.025 },
  rage:  { label: 'Прирост ярости',  icon: 'flame',  base: 0.04, jitter: 0.02 },
}

export const AFFIX_KEYS = Object.keys(AFFIXES)

// Случайный «ролл» значения аффикса с учётом редкости.
function rollAffixValue(key, rarity, rng = Math.random) {
  const def = AFFIXES[key]
  if (!def) return 0
  const mult = RARITY_INFO[rarity]?.mult || 1
  const v = def.base + (rng() * def.jitter * 2 - def.jitter)
  return Math.max(0.005, +(v * mult).toFixed(3))
}

// Сгенерировать gear-предмет случайно.
// opts: { slot?, rarity?, setId? } — если не задано, выбираются случайно.
export function rollGear(opts = {}) {
  const rng = Math.random
  const slot = opts.slot || GEAR_SLOTS[Math.floor(rng() * GEAR_SLOTS.length)].id
  const rarity = opts.rarity || rollRarity(rng)
  const def = RARITY_INFO[rarity]
  // setId — c шансом 35% даём принадлежность к сету (только для rare+)
  let setId = opts.setId
  if (setId === undefined) {
    if (rarity !== 'common' && rng() < 0.35) {
      setId = SETS[Math.floor(rng() * SETS.length)].id
    } else {
      setId = null
    }
  }
  // выбираем уникальные аффиксы
  const pool = [...AFFIX_KEYS]
  const affixes = []
  for (let i = 0; i < def.affixes; i++) {
    const idx = Math.floor(rng() * pool.length)
    const key = pool.splice(idx, 1)[0]
    affixes.push({ type: key, value: rollAffixValue(key, rarity, rng) })
  }
  return {
    id: 'g_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36).slice(-4),
    slot,
    rarity,
    setId,
    affixes,
  }
}

// Распределение редкости при дропе.
function rollRarity(rng) {
  const r = rng()
  if (r < 0.55) return 'common'
  if (r < 0.85) return 'rare'
  if (r < 0.97) return 'epic'
  return 'legendary'
}

// ===== Сеты =====
// 2-piece bonus и 4-piece bonus. Применяются только если соответствующее
// число предметов с тем же setId надето.
export const SETS = [
  {
    id: 'storm',
    name: 'Громовой шторм',
    color: '#67d6ff',
    bonus2: { speed: 0.05 },
    bonus4: { speed: 0.10, dmg: 0.08 },
  },
  {
    id: 'inferno',
    name: 'Инферно',
    color: '#ff7a2a',
    bonus2: { dmg: 0.08 },
    bonus4: { dmg: 0.15, crit: 0.04 },
  },
  {
    id: 'fortune',
    name: 'Удача торговца',
    color: '#ffd166',
    bonus2: { gold: 0.10 },
    bonus4: { gold: 0.20, rage: 0.05 },
  },
  {
    id: 'titan',
    name: 'Доспех титана',
    color: '#a072ff',
    bonus2: { hp: 0.10 },
    bonus4: { hp: 0.20, dmg: 0.06 },
  },
]

export function getSetDef(id) {
  return SETS.find(s => s.id === id) || null
}

// ===== Применение к бонусам =====
// На вход — массив надетых gear-предметов.
// Возвращает: { dmg, speed, crit, gold, hp, rage } — суммарные доли.
export function applyGearBonuses(equipped) {
  const out = { dmg: 0, speed: 0, crit: 0, gold: 0, hp: 0, rage: 0 }
  if (!equipped || !equipped.length) return out

  // 1) Аффиксы каждого предмета
  for (const it of equipped) {
    if (!it) continue
    for (const af of it.affixes || []) {
      if (out[af.type] != null) out[af.type] += af.value
    }
  }

  // 2) Сетовые бонусы — считаем по setId
  const counts = {}
  for (const it of equipped) {
    if (!it?.setId) continue
    counts[it.setId] = (counts[it.setId] || 0) + 1
  }
  for (const [setId, cnt] of Object.entries(counts)) {
    const def = getSetDef(setId)
    if (!def) continue
    if (cnt >= 2 && def.bonus2) {
      for (const k of Object.keys(def.bonus2)) out[k] = (out[k] || 0) + def.bonus2[k]
    }
    if (cnt >= 4 && def.bonus4) {
      for (const k of Object.keys(def.bonus4)) out[k] = (out[k] || 0) + def.bonus4[k]
    }
  }
  return out
}

// ===== Кузница: реролл аффиксов =====
// Стоимость реролла одного аффикса в руде по редкости.
export const REROLL_COST = {
  common:    20,
  rare:      80,
  epic:      250,
  legendary: 700,
}

export function rerollAffix(item, affixIdx) {
  if (!item || !item.affixes?.[affixIdx]) return item
  // не повторяем существующие типы
  const used = new Set(item.affixes.map(a => a.type))
  const pool = AFFIX_KEYS.filter(k => !used.has(k) || k === item.affixes[affixIdx].type)
  const newType = pool[Math.floor(Math.random() * pool.length)]
  const newVal = rollAffixValue(newType, item.rarity)
  const next = { ...item, affixes: item.affixes.map((a, i) =>
    i === affixIdx ? { type: newType, value: newVal } : a) }
  return next
}

// Удобное описание аффикса для UI.
export function describeAffix(af) {
  const def = AFFIXES[af.type]
  if (!def) return ''
  const pct = (af.value * 100).toFixed(1).replace(/\.0$/, '')
  return `+${pct}% ${def.label}`
}

// Сводка эффекта надетого комплекта в человеко-читаемом виде.
export function summarizeBonuses(b) {
  const lines = []
  for (const [k, v] of Object.entries(b)) {
    if (!v) continue
    const def = AFFIXES[k]
    if (!def) continue
    lines.push(`${def.label}: +${(v * 100).toFixed(1).replace(/\.0$/, '')}%`)
  }
  return lines
}
