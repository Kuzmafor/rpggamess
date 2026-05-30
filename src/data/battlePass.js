// Боевой пропуск: 30-дневные сезоны.
// Каждый сезон — 30 уровней. Каждый уровень даёт награды по двум трекам:
// бесплатный (free) и премиум (premium). Премиум открывается за гемы.
//
// XP начисляется за прогресс в игре: убийство боссов, открытие сундуков,
// прохождение рейдов, дневной логин и т.д. (см. store/useGameStore.js).

// ===== Конфигурация сезона =====
export const SEASON_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 дней
export const PREMIUM_COST_GEMS  = 600

// Сколько XP нужно, чтобы перейти с уровня N на N+1.
// Кривая нарастающая: ранние уровни ~600, поздние требуют тысячи XP,
// чтобы за сезон 30 уровней пробивались только при стабильном фарме.
export function bpXpNeeded(level) {
  // 0→1: 600, 1→2: 750, 2→3: 920, ..., 29→30: ~3000
  const L = Math.max(0, level | 0)
  return 600 + 150 * L + 6 * L * L
}

export const BP_MAX_LEVEL = 30

// ===== Сезоны =====
// id  — короткий слаг сезона.
// finalHero — id героя из HEROES, которого выдают на 30 уровне премиум-трека.
//             Этот герой НЕ продаётся в магазине и НЕ выпадает из сундуков.
// Новые сезоны добавляй сюда. Активный сезон выбирается через `getActiveSeason()`.
export const SEASONS = [
  {
    id: 'season_1',
    name: 'Сезон 1: Восход Феникса',
    color: '#ff7a2a',
    accent: '#ffd166',
    desc: 'Первый сезон. Эксклюзивная награда — пробуждённый Феникс Восхода.',
    // База — день старта сезона. На клиенте корректируется при первом запуске.
    startsAt: 0,
    finalHero: 'bp_phoenix',
  },
]

// Активный сезон. Сейчас просто первый — но позже можно ротации/расписание.
export function getActiveSeason() {
  return SEASONS[0]
}

// ===== Шаблоны наград =====
// type:
//   gold | gems | ore | shards (артефакт-осколки)
//   chest_common|chest_rare|chest_epic|chest_legendary
//   gear_rare|gear_epic|gear_legendary (просто рандомный gear указанной редкости)
//   hero (эксклюзивный сезонный герой — выдаётся только в финале премиум-трека)
//   skin (косметика — пока пометка)
//   nothing (для уровней, где трек ничего не даёт)
//
// На каждом из 30 уровней — по одной награде free и premium.
// Награды масштабируются от уровня игрока (см. scaleReward в стор), здесь
// мы храним «базовое» значение (≈ ранний-середняк) — потом стор умножает
// его на коэффициент прогрессии конкретного игрока.

function reward(type, amount = 1, extra = {}) {
  return { type, amount, ...extra }
}

export const BP_REWARDS = Array.from({ length: BP_MAX_LEVEL }, (_, i) => {
  const lvl = i + 1
  const free = freeTrack(lvl)
  const premium = premiumTrack(lvl)
  return { level: lvl, free, premium }
})

function freeTrack(level) {
  // Линейный рост по уровню BP. Смесь типов: золото, руда, осколки, сундуки.
  if (level === 30) return reward('chest_legendary', 1)
  if (level === 25) return reward('shards', 30)
  if (level === 20) return reward('chest_epic', 1)
  if (level === 15) return reward('gems', 50)
  if (level === 10) return reward('chest_rare', 1)
  if (level === 5)  return reward('shards', 5)
  if (level % 5 === 0) return reward('shards', 5 + Math.floor(level / 5) * 4)
  if (level % 3 === 0) return reward('ore', 20 + level * 2)
  return reward('gold', 1000 * level) // gold масштабируется в сторе
}

function premiumTrack(level) {
  // Финальная награда — эксклюзивный герой
  if (level === 30) return reward('hero', 1, { heroId: getActiveSeason().finalHero })
  if (level === 28) return reward('shards', 80)
  if (level === 25) return reward('gear_legendary', 1)
  if (level === 22) return reward('gems', 200)
  if (level === 20) return reward('chest_legendary', 1)
  if (level === 18) return reward('gear_epic', 1)
  if (level === 15) return reward('chest_epic', 1)
  if (level === 12) return reward('gems', 100)
  if (level === 10) return reward('gear_rare', 1)
  if (level === 5)  return reward('chest_rare', 2)
  if (level === 1)  return reward('gems', 50)
  if (level % 4 === 0) return reward('gems', 30)
  if (level % 3 === 0) return reward('chest_rare', 1)
  return reward('gold', 3000 * level) // gold масштабируется в сторе
}

// Лейбл для UI
export const RWD_LABEL = {
  gold:  'Золото',
  gems:  'Алмазы',
  ore:   'Руда',
  shards:'Осколки артефактов',
  chest_common:    'Обычный сундук',
  chest_rare:      'Редкий сундук',
  chest_epic:      'Эпический сундук',
  chest_legendary: 'Легендарный сундук',
  gear_rare:       'Редкое снаряжение',
  gear_epic:       'Эпическое снаряжение',
  gear_legendary:  'Легендарное снаряжение',
  hero:            'Эксклюзивный герой сезона',
  skin:            'Скин',
  nothing:         '—',
}

export const RWD_ICON = {
  gold:  'gold',
  gems:  'gem',
  ore:   'ore',
  shards:'artifact',
  chest_common:    'chest',
  chest_rare:      'chest',
  chest_epic:      'chest',
  chest_legendary: 'chest',
  gear_rare:       'sword',
  gear_epic:       'sword',
  gear_legendary:  'sword',
  hero:            'crown',
  skin:            'gem',
  nothing:         null,
}


// ===== Масштабирование наград от уровня игрока =====
// На вход — снимок прогрессии игрока:
//   stage    : текущая зона
//   maxStage : максимально достигнутая
//   ngLevel  : виток (NG+)
// Возвращает множитель [1..N] для денежных типов наград (gold/gems/ore/shards).
// Сундуки и шмот не масштабируются по числу — у них фиксированный «×1»,
// сила их зависит от рандомного дропа уровня героя.
export function rewardScale({ stage = 1, maxStage = 1, ngLevel = 0 } = {}) {
  const eff = Math.max(stage || 1, maxStage || 1)
  // 1 на ранних зонах, ~6× ближе к зоне 20, дальше плавно растёт.
  // Виток (NG+) добавляет +50% за каждый.
  const base = 1 + (eff - 1) * 0.25
  const ng = 1 + 0.5 * Math.max(0, ngLevel | 0)
  return base * ng
}

// Применяет масштаб к награде: возвращает копию с пересчитанным amount.
// Не меняет тип. Для не-числовых типов (chest_*, gear_*, hero, skin) возвращает оригинал.
export function scaleReward(reward, scale = 1) {
  if (!reward) return reward
  const t = reward.type
  const numeric = t === 'gold' || t === 'gems' || t === 'ore' || t === 'shards'
  if (!numeric) return reward
  const amount = Math.max(1, Math.floor((reward.amount || 0) * scale))
  return { ...reward, amount }
}
