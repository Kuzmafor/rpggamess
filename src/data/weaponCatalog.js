// Каталог именованного оружия для магазина.
// Каждый предмет — это «шаблон gear-предмета» в слоте `weapon`.
// При выпадении/покупке создаётся уникальный item в gearBag с указанными аффиксами.
//
// Поле `inShop: true` означает, что предмет можно купить в магазине за алмазы.
// Остальные — только дропом с боссов / из сундуков.

export const WEAPON_CATALOG = [
  // ===== Common =====
  { id: 'w_dagger',      name: 'Кинжал новичка',     icon: '🔪', rarity: 'common',
    affixes: [{ type: 'dmg', value: 0.04 }] },
  { id: 'w_club',        name: 'Дубина',              icon: '🏑', rarity: 'common',
    affixes: [{ type: 'dmg', value: 0.05 }] },
  { id: 'w_sling',       name: 'Праща',               icon: '🧶', rarity: 'common',
    affixes: [{ type: 'speed', value: 0.04 }] },
  { id: 'w_axe_s',       name: 'Топор лесоруба',      icon: '🪓', rarity: 'common',
    affixes: [{ type: 'dmg', value: 0.06 }] },
  { id: 'w_bow_s',       name: 'Простой лук',         icon: '🏹', rarity: 'common',
    affixes: [{ type: 'speed', value: 0.05 }] },

  // ===== Rare =====
  { id: 'w_steel',       name: 'Стальной меч',        icon: '🗡️', rarity: 'rare',
    affixes: [{ type: 'dmg', value: 0.08 }, { type: 'crit', value: 0.03 }] },
  { id: 'w_warhammer',   name: 'Боевой молот',        icon: '🔨', rarity: 'rare',
    affixes: [{ type: 'dmg', value: 0.10 }, { type: 'speed', value: -0.02 }] },
  { id: 'w_rapier',      name: 'Рапира',              icon: '⚔️', rarity: 'rare',
    affixes: [{ type: 'speed', value: 0.06 }, { type: 'crit', value: 0.04 }] },
  { id: 'w_crossbow',    name: 'Арбалет',             icon: '🎯', rarity: 'rare',
    affixes: [{ type: 'dmg', value: 0.07 }, { type: 'speed', value: 0.03 }] },
  { id: 'w_staff',       name: 'Посох искр',          icon: '🪄', rarity: 'rare',
    affixes: [{ type: 'rage', value: 0.06 }, { type: 'dmg', value: 0.05 }] },

  // ===== Epic =====
  { id: 'w_fireblade',   name: 'Огненный клинок',     icon: '🔥', rarity: 'epic',
    affixes: [{ type: 'dmg', value: 0.12 }, { type: 'speed', value: 0.05 }, { type: 'crit', value: 0.04 }] },
  { id: 'w_iceblade',    name: 'Ледяной клинок',      icon: '❄️', rarity: 'epic',
    affixes: [{ type: 'dmg', value: 0.10 }, { type: 'rage', value: 0.08 }, { type: 'crit', value: 0.04 }] },
  { id: 'w_thunder',     name: 'Жезл бури',           icon: '⚡', rarity: 'epic', inShop: true, currency: 'gems', cost: 80,
    affixes: [{ type: 'speed', value: 0.10 }, { type: 'dmg', value: 0.08 }, { type: 'crit', value: 0.03 }] },
  { id: 'w_shadowbow',   name: 'Теневой лук',         icon: '🏴', rarity: 'epic',
    affixes: [{ type: 'crit', value: 0.08 }, { type: 'speed', value: 0.06 }, { type: 'dmg', value: 0.06 }] },
  { id: 'w_runeaxe',     name: 'Рунный топор',        icon: '🪓', rarity: 'epic', inShop: true, currency: 'gems', cost: 90,
    affixes: [{ type: 'dmg', value: 0.15 }, { type: 'rage', value: 0.05 }, { type: 'crit', value: 0.03 }] },

  // ===== Legendary =====
  { id: 'w_fate',        name: 'Клинок Судьбы',       icon: '🌟', rarity: 'legendary', inShop: true, currency: 'gems', cost: 350,
    affixes: [{ type: 'dmg', value: 0.20 }, { type: 'crit', value: 0.06 }, { type: 'speed', value: 0.08 }] },
  { id: 'w_voidreaper',  name: 'Жнец Бездны',         icon: '🌑', rarity: 'legendary',
    affixes: [{ type: 'dmg', value: 0.22 }, { type: 'rage', value: 0.10 }, { type: 'crit', value: 0.05 }] },
  { id: 'w_sunhammer',   name: 'Молот Солнца',        icon: '☀️', rarity: 'legendary',
    affixes: [{ type: 'dmg', value: 0.18 }, { type: 'speed', value: 0.10 }, { type: 'gold', value: 0.10 }] },
  { id: 'w_dragonfang',  name: 'Клык дракона',        icon: '🐉', rarity: 'legendary', inShop: true, currency: 'gems', cost: 500,
    affixes: [{ type: 'dmg', value: 0.25 }, { type: 'crit', value: 0.08 }, { type: 'rage', value: 0.05 }] },
  { id: 'w_archonbow',   name: 'Лук Архонта',         icon: '🌌', rarity: 'legendary',
    affixes: [{ type: 'speed', value: 0.15 }, { type: 'crit', value: 0.10 }, { type: 'dmg', value: 0.10 }] },

  // ===== Mythic ===== (мощнее легендарных; часть продаётся за гемы)
  { id: 'w_eclipse',     name: 'Клинок Затмения',     icon: '🌘', rarity: 'mythic', inShop: true, currency: 'gems', cost: 900,
    affixes: [{ type: 'dmg', value: 0.30 }, { type: 'crit', value: 0.12 }, { type: 'speed', value: 0.12 }, { type: 'rage', value: 0.08 }] },
  { id: 'w_starfall',    name: 'Коса Звездопада',     icon: '☄️', rarity: 'mythic',
    affixes: [{ type: 'dmg', value: 0.34 }, { type: 'crit', value: 0.14 }, { type: 'gold', value: 0.12 }, { type: 'speed', value: 0.08 }] },
  { id: 'w_worldsplit',  name: 'Разлом Миров',        icon: '🌋', rarity: 'mythic', inShop: true, currency: 'gems', cost: 1200,
    affixes: [{ type: 'dmg', value: 0.32 }, { type: 'rage', value: 0.16 }, { type: 'crit', value: 0.10 }, { type: 'speed', value: 0.10 }] },
  { id: 'w_voidpierce',  name: 'Копьё Пустоты',       icon: '🔱', rarity: 'mythic',
    affixes: [{ type: 'crit', value: 0.18 }, { type: 'dmg', value: 0.28 }, { type: 'speed', value: 0.14 }, { type: 'rage', value: 0.06 }] },

  // ===== Premium ===== (топ-редкость, только за гемы)
  { id: 'w_celestial',   name: 'Небесный Разитель',   icon: '✨', rarity: 'premium', inShop: true, currency: 'gems', cost: 2500,
    affixes: [{ type: 'dmg', value: 0.45 }, { type: 'crit', value: 0.18 }, { type: 'speed', value: 0.18 }, { type: 'gold', value: 0.15 }] },
  { id: 'w_godslayer',   name: 'Богоубийца',          icon: '⚜️', rarity: 'premium', inShop: true, currency: 'gems', cost: 4000,
    affixes: [{ type: 'dmg', value: 0.55 }, { type: 'crit', value: 0.20 }, { type: 'rage', value: 0.18 }, { type: 'speed', value: 0.15 }] },
]

// Список оружия, доступного к покупке в Магазине.
export const WEAPON_SHOP = WEAPON_CATALOG.filter(w => w.inShop)

export function getWeaponDef(id) {
  return WEAPON_CATALOG.find(w => w.id === id) || null
}
