// Серверная копия логики сезонов (должна совпадать с src/data/seasons.js).
export const SEASON_DURATION_MS = 14 * 24 * 60 * 60 * 1000
const SEASON_ANCHOR = Date.UTC(2024, 0, 1)

export function seasonWindow(now = Date.now()) {
  const elapsed = now - SEASON_ANCHOR
  const index = Math.floor(elapsed / SEASON_DURATION_MS)
  const startedAt = SEASON_ANCHOR + index * SEASON_DURATION_MS
  const endsAt = startedAt + SEASON_DURATION_MS
  return { index, startedAt, endsAt, number: index + 1 }
}

// Награда (в гемах) за итоговое место в сезоне. Прочие ресурсы выдаём через
// почту на клиенте было бы сложно — для серверной простоты начисляем гемы
// (как и покупки), а письмо с прочим контентом можно добавить позже.
export function seasonGemRewardForRank(rank) {
  if (rank <= 1) return 2000
  if (rank <= 3) return 1000
  if (rank <= 10) return 500
  if (rank <= 50) return 200
  if (rank <= 100) return 80
  return 0
}
