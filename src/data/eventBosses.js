// Ивент-боссы. Запускаются циклами по 24/72 часа. У каждого огромный HP,
// игрок наносит урон за серию атак (каждая атака = бой с фиксированной
// длительностью), его суммарный урон копится. Награды раздаются по достижению
// порогов урона — в любой момент цикла, не ждём убийства.
//
// Поля:
//   id        — slug
//   name      — отображаемое имя
//   sprite    — sprite ключ (используем существующих рейд-боссов)
//   icon      — emoji для миниатюры в карточке
//   color     — акцент UI
//   cycleHours — длина цикла (24 или 72)
//   hpDpsMul  — масштаб HP относительно DPS игрока:
//               maxHp = max(min, getCurrentDps * cycleSeconds * hpDpsMul)
//               (то есть «полный убой» ≈ hpDpsMul цикла фокусированной игры)
//   attackSeconds — длительность одной попытки в секундах
//                   (за это время прибавляется dps * attackSeconds × множители)
//   maxAttempts   — сколько раз за цикл можно атаковать
//   cooldownSec   — кулдаун между атаками
//   rewards   — массив { atPct, gold, gems, ore, shards, gear?: 'rare'|'epic'|'legendary' }
//               atPct — порог в долях [0..1] от maxHp.
//
// Все суммы скалируются в сторе через rewardScale (по прогрессу игрока).

export const EVENT_BOSSES = [
  {
    id: 'evt_volcanic_titan',
    name: 'Вулканический Титан',
    sprite: 'boss_firedemon',
    icon: '🌋',
    color: '#ff7a2a',
    desc: 'Пламенный гигант, охватывающий зоны огнём. Бьём по очереди — урон копится.',
    cycleHours: 24,
    hpDpsMul: 6,         // ~6 циклов «фокусированной» игры на full kill
    attackSeconds: 30,
    maxAttempts: 8,
    cooldownSec: 1800,    // 30 мин между атаками
    rewards: [
      { atPct: 0.05, gold: 8000,   ore: 20,  shards: 5  },
      { atPct: 0.15, gold: 25000,  ore: 60,  shards: 12, gems: 30 },
      { atPct: 0.30, gold: 80000,  ore: 140, shards: 25, gems: 60, gear: 'rare' },
      { atPct: 0.50, gold: 200000, ore: 280, shards: 50, gems: 120, gear: 'epic' },
      { atPct: 0.80, gold: 600000, ore: 600, shards: 100, gems: 250, gear: 'legendary' },
    ],
  },
  {
    id: 'evt_void_serpent',
    name: 'Змей Бездны',
    sprite: 'boss_shadowarchon',
    icon: '🐉',
    color: '#a072ff',
    desc: 'Древний хищник пустоты. Цикл 72 часа — бьём всем сообществом героев.',
    cycleHours: 72,
    hpDpsMul: 14,
    attackSeconds: 30,
    maxAttempts: 18,
    cooldownSec: 3600,    // 1 час
    rewards: [
      { atPct: 0.05, gold: 25000,  ore: 50,  shards: 10 },
      { atPct: 0.15, gold: 80000,  ore: 150, shards: 25, gems: 50  },
      { atPct: 0.30, gold: 250000, ore: 350, shards: 60, gems: 120, gear: 'rare' },
      { atPct: 0.50, gold: 700000, ore: 800, shards: 120, gems: 250, gear: 'epic' },
      { atPct: 0.80, gold: 2_000_000, ore: 1800, shards: 240, gems: 500, gear: 'legendary' },
    ],
  },
]

export function getEventBoss(id) {
  return EVENT_BOSSES.find(b => b.id === id) || null
}

export function pickActiveEventBoss(now) {
  // Простой ротатор: чередуем по дню. Чётный день — первый, нечётный — второй.
  // Можно расширить расписанием/выходными.
  const day = Math.floor(now / 86_400_000)
  const idx = day % EVENT_BOSSES.length
  return EVENT_BOSSES[idx]
}
