// Экспедиции — отправь героев на длительное приключение, потом забери лут.
// Без активной игры. Это idle-петля.

export const EXPEDITIONS = [
  {
    id: 'forest', name: 'Зачистка леса', icon: '🌲',
    duration: 1 * 60 * 60 * 1000, // 1 час
    heroes: 2,
    reward: { gold: 25000, ore: 30, shards: 1, gems: 0, stars: 0 },
    desc: 'Короткая вылазка для разогрева.',
    minStage: 3,
  },
  {
    id: 'mines', name: 'Шахты гномов', icon: '⛏️',
    duration: 2 * 60 * 60 * 1000, // 2 часа
    heroes: 3,
    reward: { gold: 80000, ore: 120, shards: 3, gems: 0, stars: 1 },
    desc: 'Руды много, ловушек тоже.',
    minStage: 5,
  },
  {
    id: 'dragon', name: 'Логово дракона', icon: '🐉',
    duration: 4 * 60 * 60 * 1000, // 4 часа
    heroes: 3,
    reward: { gold: 250000, ore: 280, shards: 8, gems: 2, stars: 2, mat: 'dragon' },
    desc: 'Долго, опасно — но дракон спит.',
    minStage: 8,
  },
  {
    id: 'abyss', name: 'Бездна Времён', icon: '🌌',
    duration: 6 * 60 * 60 * 1000, // 6 часов
    heroes: 4,
    reward: { gold: 800000, ore: 600, shards: 18, gems: 5, stars: 4 },
    desc: 'Глубоко, потеряешь счёт времени.',
    minStage: 12,
  },
  {
    id: 'eternity', name: 'Врата Бесконечности', icon: '⏳',
    duration: 8 * 60 * 60 * 1000, // 8 часов
    heroes: 5,
    reward: { gold: 2500000, ore: 1200, shards: 40, gems: 12, stars: 8, mat: 'warden' },
    desc: 'Самая долгая. Награда — соответствующая.',
    minStage: 16,
  },
]

export function getExpedition(id) {
  return EXPEDITIONS.find(e => e.id === id)
}
