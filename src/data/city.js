// Город / База — метапрогрессия.
// Каждое здание можно качать за золото + руду. Уровень здания даёт офлайн-пассивы.
// Максимальный доступный уровень здания ограничен максимальной пройденной зоной
// (maxStage): чтобы прокачка города шла рука об руку с прогрессом в мире.
//
// Эффекты зданий собираются в один объект getCityBonuses() и применяются:
//   oresPerSec   — пассивная добыча руды в секунду (тикает в game loop)
//   expedSpeed   — ускорение экспедиций (доля: 0.1 = -10% времени)
//   shardChance  — +шанс осколков героев/артефактов (множитель к дропу)
//   gold         — +% к золоту
//   dmg          — +% к урону
//   offline      — +% к оффлайн-доходу

export const CITY_BUILDINGS = [
  {
    id: 'mine',
    name: 'Рудник',
    icon: '⛏️',
    color: '#b98c50',
    desc: 'Добывает руду в фоне, даже когда вы не в игре.',
    effect: 'Руда',
    // на уровень
    perLevel: { oresPerSec: 0.05 },
    // стоимость уровня N (1-based)
    cost: (lvl) => ({ gold: Math.floor(5000 * Math.pow(1.5, lvl - 1)), ore: Math.floor(10 * lvl) }),
    fmtValue: (lvl, b) => `${(b.oresPerSec).toFixed(2)} руды/сек`,
  },
  {
    id: 'guild',
    name: 'Гильдия',
    icon: '🏛️',
    color: '#67d6ff',
    desc: 'Ускоряет экспедиции отряда.',
    effect: 'Скорость экспедиций',
    perLevel: { expedSpeed: 0.02 },
    cost: (lvl) => ({ gold: Math.floor(8000 * Math.pow(1.55, lvl - 1)), ore: Math.floor(14 * lvl) }),
    fmtValue: (lvl, b) => `−${Math.round(b.expedSpeed * 100)}% времени`,
  },
  {
    id: 'altar',
    name: 'Алтарь',
    icon: '🔮',
    color: '#a072ff',
    desc: 'Повышает шанс выпадения осколков.',
    effect: 'Шанс осколков',
    perLevel: { shardChance: 0.03 },
    cost: (lvl) => ({ gold: Math.floor(12000 * Math.pow(1.6, lvl - 1)), ore: Math.floor(18 * lvl) }),
    fmtValue: (lvl, b) => `+${Math.round(b.shardChance * 100)}% к осколкам`,
  },
  {
    id: 'market',
    name: 'Рынок',
    icon: '🪙',
    color: '#ffd166',
    desc: 'Увеличивает добычу золота.',
    effect: 'Золото',
    perLevel: { gold: 0.03 },
    cost: (lvl) => ({ gold: Math.floor(10000 * Math.pow(1.55, lvl - 1)), ore: Math.floor(12 * lvl) }),
    fmtValue: (lvl, b) => `+${Math.round(b.gold * 100)}% золота`,
  },
  {
    id: 'barracks',
    name: 'Казармы',
    icon: '⚔️',
    color: '#ff7a2a',
    desc: 'Тренирует отряд — повышает урон.',
    effect: 'Урон отряда',
    perLevel: { dmg: 0.02 },
    cost: (lvl) => ({ gold: Math.floor(15000 * Math.pow(1.6, lvl - 1)), ore: Math.floor(16 * lvl) }),
    fmtValue: (lvl, b) => `+${Math.round(b.dmg * 100)}% урона`,
  },
  {
    id: 'tavern',
    name: 'Таверна',
    icon: '🍺',
    color: '#4ade80',
    desc: 'Повышает оффлайн-доход.',
    effect: 'Оффлайн-доход',
    perLevel: { offline: 0.04 },
    cost: (lvl) => ({ gold: Math.floor(9000 * Math.pow(1.55, lvl - 1)), ore: Math.floor(12 * lvl) }),
    fmtValue: (lvl, b) => `+${Math.round(b.offline * 100)}% оффлайна`,
  },
]

export function getBuilding(id) {
  return CITY_BUILDINGS.find(b => b.id === id) || null
}

// Сколько максимально можно прокачать здание при данной максимальной зоне.
// Каждая зона открывает +2 уровня города (старт — 5).
export function maxBuildingLevel(maxStage) {
  return 5 + Math.max(0, (maxStage || 1) - 1) * 2
}

// Накопленные значения эффекта здания на его уровне.
export function buildingValue(building, level) {
  const out = {}
  for (const k of Object.keys(building.perLevel)) {
    out[k] = building.perLevel[k] * level
  }
  return out
}

// Суммарные бонусы города по всем зданиям.
// cityLevels — { [id]: level }
export function getCityBonuses(cityLevels) {
  const out = { oresPerSec: 0, expedSpeed: 0, shardChance: 0, gold: 0, dmg: 0, offline: 0 }
  if (!cityLevels) return out
  for (const b of CITY_BUILDINGS) {
    const lvl = cityLevels[b.id] || 0
    if (lvl <= 0) continue
    const v = buildingValue(b, lvl)
    for (const k of Object.keys(v)) out[k] = (out[k] || 0) + v[k]
  }
  return out
}
