// Фоны арены. Меняют небо/палитру параллакс-сцены боя.
// Игрок открывает их из сундуков и выбирает в Инвентаре.
// Тема применяется к .arena-bg-scene через CSS-переменные (см. index.css):
//   --bg-sky-top / --bg-sky-mid / --bg-sky-bot — цвета неба
//   --bg-accent — акцент (луна/свечение)
// 'default' доступен всем сразу.

export const BACKGROUNDS = [
  {
    id: 'default', name: 'Долина теней', rarity: 'common', icon: '🌲',
    sky: ['#0a0e2a', '#0c1030', '#161a44'], accent: '#fff7d9',
    desc: 'Стандартный ночной лес. Доступен всем.',
  },
  {
    id: 'dawn', name: 'Рассветные пики', rarity: 'rare', icon: '🌄',
    sky: ['#3a2a5e', '#7a4a6a', '#e6915a'], accent: '#ffe2a8',
    desc: 'Тёплый рассвет над горами.',
  },
  {
    id: 'aurora', name: 'Северное сияние', rarity: 'rare', icon: '🌌',
    sky: ['#06122a', '#0e2a3a', '#1a4a3a'], accent: '#7bffd6',
    desc: 'Зелёные всполохи в ледяном небе.',
  },
  {
    id: 'sunset', name: 'Багровый закат', rarity: 'epic', icon: '🌇',
    sky: ['#2a0e2a', '#6a1f3a', '#e0553a'], accent: '#ffb13a',
    desc: 'Небо горит закатным пламенем.',
  },
  {
    id: 'abyss', name: 'Бездна', rarity: 'epic', icon: '🕳️',
    sky: ['#04040e', '#0a0820', '#2a0e4a'], accent: '#9a6cff',
    desc: 'Тьма, в которой мерцают чужие звёзды.',
  },
  {
    id: 'celestial', name: 'Небесный чертог', rarity: 'legendary', icon: '✨',
    sky: ['#0a1a4a', '#2a3a8a', '#6ab0ff'], accent: '#fff7d9',
    desc: 'Золотые облака над хрустальным небом.',
  },
  {
    id: 'inferno', name: 'Преисподняя', rarity: 'legendary', icon: '🔥',
    sky: ['#1a0404', '#4a0e0e', '#e0401a'], accent: '#ffd166',
    desc: 'Пепел и пламя бескрайнего ада.',
  },
  {
    id: 'void', name: 'Сердце Пустоты', rarity: 'mythic', icon: '🌑',
    sky: ['#04040e', '#1a0a3a', '#5a1a8a'], accent: '#ff8edb',
    desc: 'Реальность истончается до предела.',
  },
]

export function getBackground(id) {
  return BACKGROUNDS.find(b => b.id === id) || BACKGROUNDS[0]
}

// Веса для дропа фона из сундука по редкости сундука.
export const BG_DROP_BY_CHEST = {
  rare:      ['dawn', 'aurora'],
  epic:      ['dawn', 'aurora', 'sunset', 'abyss'],
  legendary: ['sunset', 'abyss', 'celestial', 'inferno'],
}
