// Сезоны рейтинга. Топ обновляется каждые 14 дней; по итогам сезона лучшие
// игроки получают награды письмом. Окна привязаны к фиксированному якорю,
// чтобы у всех шли синхронно (как у события).

export const SEASON_DURATION_MS = 14 * 24 * 60 * 60 * 1000 // 14 дней
const SEASON_ANCHOR = Date.UTC(2024, 0, 1) // 1 января 2024, UTC

export function seasonWindow(now = Date.now()) {
  const elapsed = now - SEASON_ANCHOR
  const index = Math.floor(elapsed / SEASON_DURATION_MS)
  const startedAt = SEASON_ANCHOR + index * SEASON_DURATION_MS
  const endsAt = startedAt + SEASON_DURATION_MS
  return { index, startedAt, endsAt, number: index + 1 }
}

// Награды за итоговое место в сезоне (выдаются письмом на сервере по окончании).
export const SEASON_REWARDS = [
  { place: '1',      label: '1 место',     gold: 50_000_000, gems: 2000, shards: 300, tp: 20 },
  { place: '2–3',    label: '2–3 место',   gold: 20_000_000, gems: 1000, shards: 150, tp: 12 },
  { place: '4–10',   label: '4–10 место',  gold: 8_000_000,  gems: 500,  shards: 80,  tp: 6 },
  { place: '11–50',  label: '11–50 место', gold: 2_000_000,  gems: 200,  shards: 30,  tp: 3 },
  { place: '51–100', label: '51–100 место',gold: 500_000,    gems: 80,   shards: 10,  tp: 1 },
]

// Человекочитаемый остаток времени до конца сезона.
export function formatSeasonLeft(endsAt, now = Date.now()) {
  const ms = Math.max(0, endsAt - now)
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (d > 0) return `${d}д ${h}ч`
  if (h > 0) return `${h}ч ${m}м`
  return `${m}м`
}
