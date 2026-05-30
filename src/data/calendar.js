// 30-дневный календарь логинов. Награда зависит от дня.
// Каждый 5-й день — повышенный, 30-й — легендарный.

export const CALENDAR_DAYS = 30

function buildDay(day) {
  const isFinal = day === CALENDAR_DAYS
  const isMilestone = day % 5 === 0
  if (isFinal) {
    return {
      day,
      milestone: 'legendary',
      gold: 250000,
      gems: 200,
      shards: 30,
      ore: 200,
      legendaryChest: 1, // флаг — выдадим спец-сундук в почте
      label: 'Легендарный сундук',
    }
  }
  if (isMilestone) {
    return {
      day,
      milestone: 'epic',
      gold: 4000 * day,
      gems: 30 + day,
      shards: 5 + Math.floor(day / 3),
      ore: 20 + day,
      label: `День ${day} — большая награда`,
    }
  }
  return {
    day,
    milestone: null,
    gold: 600 * day,
    gems: 5,
    shards: 1,
    ore: 6 + Math.floor(day / 2),
    label: `День ${day}`,
  }
}

export const CALENDAR_REWARDS = Array.from({ length: CALENDAR_DAYS }, (_, i) => buildDay(i + 1))

export function getDay(day) {
  return CALENDAR_REWARDS[day - 1]
}
