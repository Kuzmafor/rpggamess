// Питомцы / спутники.
// Маленький компаньон рядом с отрядом. У каждого вида:
//   id, name, art (ключ PetArt), color, element-flavor
//   rarity — common | rare | epic | legendary
//   affixes — 1-2 пассива, которые масштабируются от уровня питомца
//
// Питомцы выпадают в виде ЯИЦ из ивент-боссов и сундуков; яйцо вылупляется
// мгновенно в случайного питомца (редкость зависит от источника).
// Активный питомец один — даёт свои бонусы всему отряду.

export const PET_RARITIES = ['common', 'rare', 'epic', 'legendary']

export const PET_RARITY_INFO = {
  common:    { label: 'Обычный',     color: '#c8cee8', mult: 1.0 },
  rare:      { label: 'Редкий',      color: '#67d6ff', mult: 1.5 },
  epic:      { label: 'Эпический',   color: '#a072ff', mult: 2.2 },
  legendary: { label: 'Легендарный', color: '#ffd166', mult: 3.2 },
}

// Аффиксы питомцев (доля за 1 уровень питомца × rarity.mult).
// Применяются глобально к отряду.
export const PET_AFFIXES = {
  dmg:   { label: 'Урон',          base: 0.01 },
  gold:  { label: 'Золото',        base: 0.015 },
  crit:  { label: 'Крит',          base: 0.006 },
  rage:  { label: 'Ярость',        base: 0.012 },
  hp:    { label: 'HP',            base: 0.015 },
  ore:   { label: 'Добыча руды',   base: 0.02 },
}

// Виды питомцев. art — ключ для PetArt (см. assets/PetArt.jsx).
export const PETS = [
  { id: 'spark',   name: 'Искрёныш',   art: 'spark',   rarity: 'common', affixes: ['dmg'] },
  { id: 'coiny',   name: 'Златохвост', art: 'coin',    rarity: 'common', affixes: ['gold'] },
  { id: 'pebble',  name: 'Камешек',    art: 'rock',    rarity: 'common', affixes: ['hp'] },

  { id: 'foxfire', name: 'Лис-огонёк', art: 'fox',     rarity: 'rare',   affixes: ['dmg', 'crit'] },
  { id: 'frosty',  name: 'Морозко',    art: 'frost',   rarity: 'rare',   affixes: ['rage', 'hp'] },
  { id: 'golddrake',name:'Златодрейк', art: 'drakeg',  rarity: 'rare',   affixes: ['gold', 'ore'] },

  { id: 'thunderwing', name: 'Громокрыл', art: 'bird', rarity: 'epic',   affixes: ['dmg', 'rage'] },
  { id: 'shadowcat',   name: 'Тенекот',   art: 'cat',  rarity: 'epic',   affixes: ['crit', 'dmg'] },
  { id: 'gemslug',     name: 'Самоцвет',  art: 'slug', rarity: 'epic',   affixes: ['gold', 'ore'] },

  { id: 'phoenixling', name: 'Фениксёнок',  art: 'phoenix', rarity: 'legendary', affixes: ['dmg', 'rage'] },
  { id: 'celestial',   name: 'Небесный дух',art: 'celest',  rarity: 'legendary', affixes: ['crit', 'gold'] },
  { id: 'dragonpup',   name: 'Дракоша',     art: 'dragon',  rarity: 'legendary', affixes: ['dmg', 'hp'] },
]

export function getPet(id) {
  return PETS.find(p => p.id === id) || null
}

// Сила аффикса конкретного питомца на уровне.
export function petAffixValue(petRarity, affixKey, level) {
  const def = PET_AFFIXES[affixKey]
  if (!def) return 0
  const mult = PET_RARITY_INFO[petRarity]?.mult || 1
  return +(def.base * mult * level).toFixed(4)
}

// Стоимость прокачки питомца (золото) на следующий уровень.
export function petUpgradeCost(petRarity, level) {
  const base = { common: 2000, rare: 8000, epic: 30000, legendary: 120000 }[petRarity] || 2000
  return Math.floor(base * Math.pow(1.35, level - 1))
}

export const PET_MAX_LEVEL = 50

// Суммарные бонусы от АКТИВНОГО питомца.
// inst — { id, level } из owned.
export function getActivePetBonuses(inst) {
  const out = { dmg: 0, gold: 0, crit: 0, rage: 0, hp: 0, ore: 0 }
  if (!inst) return out
  const def = getPet(inst.id)
  if (!def) return out
  for (const af of def.affixes) {
    out[af] = (out[af] || 0) + petAffixValue(def.rarity, af, inst.level || 1)
  }
  return out
}

// Ролл яйца: вернёт id питомца указанной (или случайной) редкости.
export function rollPetFromEgg(forcedRarity = null) {
  let rarity = forcedRarity
  if (!rarity) {
    const r = Math.random()
    if (r < 0.55) rarity = 'common'
    else if (r < 0.85) rarity = 'rare'
    else if (r < 0.97) rarity = 'epic'
    else rarity = 'legendary'
  }
  const pool = PETS.filter(p => p.rarity === rarity)
  if (pool.length === 0) return PETS[0].id
  return pool[Math.floor(Math.random() * pool.length)].id
}

export function describePetAffix(petRarity, affixKey, level) {
  const def = PET_AFFIXES[affixKey]
  if (!def) return ''
  const v = petAffixValue(petRarity, affixKey, level)
  return `+${(v * 100).toFixed(1).replace(/\.0$/, '')}% ${def.label}`
}
