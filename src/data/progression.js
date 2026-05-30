// Глубокая прогрессия героев: звёзды, осколки, пробуждение, синергии состава.

// ====== Звёзды (Ascension) ======
// 0 → 6 звёзд. На каждом шаге нужно: shardsCost[i] осколков ИМЕННО этого героя
// + золото. Золото масштабируется от стоимости найма героя.
//
// 6★ — особая «Пробуждённая форма». Стоит дополнительно: 1 осколок мифика
// + большое количество руды. Эту проверку делает сам стор (canAscend), здесь
// возвращаем только базовые требования.
export const MAX_STARS = 6

const STAR_SHARD_COST = [10, 25, 60, 140, 320, 700] // 0->1, 1->2, ..., 5->6
const STAR_GOLD_MULT  = [0.5, 1.2, 3.0, 8.0, 20.0, 60.0]
// Дополнительные требования к 6★: 1 любой осколок мифика + руда.
export const SIX_STAR_MYTHIC_SHARDS = 1
export const SIX_STAR_ORE_COST = 500

export function starShardCost(stars) {
  if (stars >= MAX_STARS) return 0
  return STAR_SHARD_COST[stars]
}
export function starGoldCost(hero, stars) {
  if (stars >= MAX_STARS) return 0
  return Math.floor(hero.cost * STAR_GOLD_MULT[stars])
}

// Бонус к атаке от звёзд: 1..5★ = 1.25^stars; 6★ — мощный скачок ×1.6.
export function starAtkMult(stars) {
  const s = Math.max(0, stars | 0)
  if (s <= 5) return Math.pow(1.25, s)
  // 6★ ≈ 1.25^5 * 1.6 = 4.88
  return Math.pow(1.25, 5) * Math.pow(1.6, s - 5)
}
// Каждая звезда +1% к криту (additive). 6★ даёт +3%.
export function starCritBonus(stars) {
  const s = Math.max(0, stars | 0)
  if (s <= 5) return 0.01 * s
  return 0.05 + 0.03 * (s - 5)
}

// ====== Осколки героев ======
// Это per-hero валюта для звёзд. Хранится в стейте: heroShards[heroId] = N.
//
// Источники:
// 1. При покупке героя, которого уже нанял → возвращаем 5 осколков
// 2. Из сундуков (бонус-фолбэк): дублирующий герой превращается в осколки
// 3. Прямая выдача из событий/почты
//
// Помощник для UI: что нужно для следующей звезды.
export function nextStarRequirement(hero, currentStars, heroShards) {
  if (currentStars >= MAX_STARS) return null
  const need = starShardCost(currentStars)
  const have = heroShards || 0
  return {
    needShards: need,
    haveShards: have,
    needGold: starGoldCost(hero, currentStars),
    canUp: have >= need,
  }
}

// ====== Пробуждение (Awakening) ======
// Появляется с уровня героя 50. Игрок выбирает одну из двух веток для роли.
// Это разовый выбор (можно реализовать сброс позже за гемы).
//
// Эффекты применяются поверх урона/скорости/крита/ярости.
export const AWAKENING_LEVEL = 50

export const AWAKENING_PATHS = {
  melee: [
    { id: 'guardian', name: 'Страж',     desc: '+30% HP отряду, –10% входящего урона', bonus: { teamHp: 0.30, incomingDmg: -0.10 } },
    { id: 'slayer',   name: 'Палач',     desc: '+25% к урону героя, +5% крит',         bonus: { atk: 0.25, crit: 0.05 } },
  ],
  ranged: [
    { id: 'marksman', name: 'Меткий',    desc: '+10% крит, +50% урона крита',          bonus: { crit: 0.10, critDmg: 0.50 } },
    { id: 'ranger',   name: 'Следопыт',  desc: '+30% скорость атак, +5% золото',       bonus: { speed: 0.30, gold: 0.05 } },
  ],
  mage: [
    { id: 'elementalist', name: 'Стихийник', desc: '+50% к шансу статусов, +25% урона',  bonus: { atk: 0.25, statusChance: 0.50 } },
    { id: 'archon',       name: 'Архонт',    desc: '+15% к шансу массового удара отряда', bonus: { aoeChance: 0.15, atk: 0.10 } },
  ],
  support: [
    { id: 'bard',   name: 'Бард',     desc: '+15% генерации ярости',                    bonus: { rage: 0.15 } },
    { id: 'cleric', name: 'Клирик',   desc: '+25% HP отряду, +5% золото',               bonus: { teamHp: 0.25, gold: 0.05 } },
  ],
}

export function getAwakeningPaths(role) {
  return AWAKENING_PATHS[role] || []
}

// Бонусы пробуждения собираются в один объект для UI и баланса.
export function awakeningBonuses(role, pathId) {
  const list = AWAKENING_PATHS[role] || []
  const def = list.find(x => x.id === pathId)
  return def?.bonus || {}
}

// ====== Синергии состава ======
// Считаются от текущей партии и возвращают пакет множителей/добавок.
//
// Активные синергии:
// 1. Парный фронт: 2+ melee и 1+ mage → +10% общий урон отряда
// 2. Однородная фракция: 3+ героя одной роли → +15% к скорости
// 3. Стихийный рой: 4+ героя одной стихии → +12% урона + +5% к шансу статуса
// 4. Радуга: 5 разных стихий в отряде → +10% универсальный урон
// 5. Союз поддержки: 1 support + 4 любых → +5% золото
//
// hero — массив объектов героя (после getHero). Не содержит null'ов.
export function calcSynergies(heroes) {
  const out = { id: [], partyDmg: 0, partySpd: 0, partyStatusChance: 0, gold: 0 }
  if (!heroes?.length) return out

  const roles = {}
  const elements = {}
  for (const h of heroes) {
    roles[h.role] = (roles[h.role] || 0) + 1
    if (h.element) elements[h.element] = (elements[h.element] || 0) + 1
  }

  if ((roles.melee || 0) >= 2 && (roles.mage || 0) >= 1) {
    out.id.push({ id: 'frontline', name: 'Парный фронт',  desc: '+10% урон отряда' })
    out.partyDmg += 0.10
  }
  for (const r of Object.keys(roles)) {
    if (roles[r] >= 3) {
      out.id.push({ id: 'kin_' + r, name: 'Сплочённость', desc: '+15% скорости атак' })
      out.partySpd += 0.15
      break
    }
  }
  for (const el of Object.keys(elements)) {
    if (elements[el] >= 4) {
      out.id.push({ id: 'swarm_' + el, name: 'Стихийный рой', desc: '+12% урона стихией, +5% статус' })
      out.partyDmg += 0.12
      out.partyStatusChance += 0.05
      break
    }
  }
  if (Object.keys(elements).length >= 5) {
    out.id.push({ id: 'rainbow', name: 'Радуга стихий', desc: '+10% общего урона' })
    out.partyDmg += 0.10
  }
  if ((roles.support || 0) >= 1 && heroes.length >= 5) {
    out.id.push({ id: 'support_pact', name: 'Союз поддержки', desc: '+5% золото' })
    out.gold += 0.05
  }

  // Парные «связи» — bond'ы. См. HERO_BONDS ниже.
  const ids = new Set(heroes.map(h => h.id.replace(/_\d+$/, '')))
  for (const b of HERO_BONDS) {
    if (b.heroes.every(h => ids.has(h))) {
      out.id.push({ id: 'bond_' + b.id, name: b.name, desc: b.desc })
      if (b.partyDmg)          out.partyDmg += b.partyDmg
      if (b.partySpd)          out.partySpd += b.partySpd
      if (b.partyStatusChance) out.partyStatusChance += b.partyStatusChance
      if (b.gold)              out.gold += b.gold
    }
  }

  return out
}

// ====== Hero Bonds ======
// Парные/тематические связи героев. Срабатывают, если оба (или все)
// перечисленные базовые id героев присутствуют в отряде.
//
// id героев берём БЕЗ суффикса _N (то есть только базовый шаблон).
//
// Бонусы складываются с обычными синергиями.
export const HERO_BONDS = [
  {
    id: 'archmage_priest',
    name: 'Магия и Свет',
    desc: '+10% урона, +5% скорости',
    heroes: ['mage', 'priest'],
    partyDmg: 0.10, partySpd: 0.05,
  },
  {
    id: 'paladin_assassin',
    name: 'Щит и Кинжал',
    desc: '+15% урона ближнему бою',
    heroes: ['paladin', 'assassin'],
    partyDmg: 0.15,
  },
  {
    id: 'phoenix_dragonet',
    name: 'Огненный союз',
    desc: '+8% шанс статусов, +10% урона',
    heroes: ['phoenix', 'dragonet'],
    partyDmg: 0.10, partyStatusChance: 0.08,
  },
  {
    id: 'angel_demon',
    name: 'Двойственность',
    desc: '+15% урон отряду, +5% золото',
    heroes: ['angel', 'demon'],
    partyDmg: 0.15, gold: 0.05,
  },
  {
    id: 'wolf_weretiger',
    name: 'Звериная стая',
    desc: '+12% скорости атак',
    heroes: ['wolf', 'weretiger'],
    partySpd: 0.12,
  },
  {
    id: 'siren_orc',
    name: 'Песня и ярость',
    desc: '+10% к ярости и +5% урона',
    heroes: ['siren', 'orc'],
    partyDmg: 0.05,
  },
  {
    id: 'engineer_goblin',
    name: 'Подпольный союз',
    desc: '+10% золота',
    heroes: ['engineer', 'goblin'],
    gold: 0.10,
  },
  {
    id: 'elf_archer',
    name: 'Лесные стрелки',
    desc: '+12% урона дальним',
    heroes: ['elf', 'archer'],
    partyDmg: 0.12,
  },
  {
    id: 'king_paladin',
    name: 'Королевский эскорт',
    desc: '+10% золото, +5% скорости',
    heroes: ['king', 'paladin'],
    gold: 0.10, partySpd: 0.05,
  },
  {
    id: 'viking_berserker',
    name: 'Северный шторм',
    desc: '+15% урона ближним',
    heroes: ['viking', 'berserker'],
    partyDmg: 0.15,
  },
]
