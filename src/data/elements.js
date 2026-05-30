// Стихии и треугольник слабостей.
// Шесть стихий: огонь / лёд / молния / яд / свет / тьма.
// "Сильнее против" — урон x1.5. Обратное направление — x0.7.
// Та же стихия — x0.85.

export const ELEMENTS = {
  fire:      { id: 'fire',      name: 'Огонь',  color: '#ff7a2a', icon: '🔥' },
  ice:       { id: 'ice',       name: 'Лёд',    color: '#67d6ff', icon: '❄️' },
  lightning: { id: 'lightning', name: 'Молния', color: '#ffd166', icon: '⚡' },
  poison:    { id: 'poison',    name: 'Яд',     color: '#7ed957', icon: '🧪' },
  light:     { id: 'light',     name: 'Свет',   color: '#fff5bf', icon: '✨' },
  dark:      { id: 'dark',      name: 'Тьма',   color: '#a072ff', icon: '🌙' },
}

// Что бьёт что (rock-paper-scissors x2 треугольника):
// fire -> ice -> lightning -> fire   (стихии бури)
// poison -> light -> dark -> poison  (стихии духа)
const STRONG_AGAINST = {
  fire: 'ice',
  ice: 'lightning',
  lightning: 'fire',
  poison: 'light',
  light: 'dark',
  dark: 'poison',
}

export function elementMultiplier(attacker, defender) {
  if (!attacker || !defender) return 1
  if (STRONG_AGAINST[attacker] === defender) return 1.5
  if (STRONG_AGAINST[defender] === attacker) return 0.7
  if (attacker === defender) return 0.85
  return 1
}

// Статус, который вешает удар стихии при срабатывании шанса.
export const ELEMENT_STATUS = {
  fire:      { id: 'burn',   chance: 0.20 },
  ice:       { id: 'freeze', chance: 0.18 },
  lightning: { id: 'shock',  chance: 0.20 },
  poison:    { id: 'bleed',  chance: 0.22 },
  light:     { id: 'stun',   chance: 0.12 },
  dark:      { id: 'curse',  chance: 0.18 },
}

// Связь руны оружия со стихией (для совместимости со старыми сейвами).
export const RUNE_TO_ELEMENT = {
  flame: 'fire',
  frost: 'ice',
  lightning: 'lightning',
  poison: 'poison',
  light: 'light',
  dark: 'dark',
}
