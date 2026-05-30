// 50+ героев-союзников. У каждого есть:
//   bonus  — пассивные бонусы для всего отряда (применяются если нанят, даже не в строю)
//   atk    — базовый урон одного авто-удара (только если в активном отряде)
//   speed  — атак в секунду
//   role   — melee | ranged | mage | support (для UI)
//
// rarity: common | rare | epic | legendary
// cost   — стоимость найма в золоте.

const HERO_TEMPLATES = [
  // [name, id, rarity, bonus, icon, atk, speed, role]
  ['Паладин Артур',     'paladin',  'epic',      { dmg: 0.05, hp: 0.10 }, '🛡️',  4,   1.0, 'melee'],
  ['Ассасин Шейн',      'assassin', 'epic',      { dmg: 0.08, crit: 0.05 }, '🗡️', 3,   1.8, 'melee'],
  ['Архимаг Илан',      'mage',     'legendary', { dmg: 0.12, rage: 0.10 }, '🔮', 8,   0.9, 'mage'],
  ['Жрица Лиара',       'priest',   'rare',      { hp: 0.15 }, '✨',         1.5, 1.0, 'support'],
  ['Берсерк Грор',      'berserker','rare',      { dmg: 0.10 }, '🪓',        5,   1.1, 'melee'],
  ['Лучница Эйрин',     'archer',   'rare',      { dmg: 0.06, crit: 0.04 }, '🏹', 3,   1.5, 'ranged'],
  ['Друид Кейн',        'druid',    'rare',      { hp: 0.08, gold: 0.05 }, '🌿',  2,   1.0, 'mage'],
  ['Тёмный рыцарь',     'dark',     'epic',      { dmg: 0.07, hp: 0.05 }, '⚫',   5,   1.0, 'melee'],
  ['Шаман Зул',         'shaman',   'common',    { rage: 0.05 }, '🪶',        2,   1.0, 'mage'],
  ['Воин Брок',         'warrior',  'common',    { dmg: 0.03 }, '⚔️',         3,   1.0, 'melee'],
  ['Монах Тэн',         'monk',     'rare',      { dmg: 0.04, crit: 0.03 }, '👊', 2.5, 1.6, 'melee'],
  ['Колдун Мор',        'warlock',  'epic',      { dmg: 0.09 }, '🩸',          6,   0.9, 'mage'],
  ['Страж границ',      'ranger',   'common',    { dmg: 0.03, gold: 0.02 }, '🌲', 2,   1.2, 'ranged'],
  ['Чародейка Селена',  'sorceress','epic',      { dmg: 0.07, rage: 0.05 }, '🌙', 6,   1.0, 'mage'],
  ['Гном-инженер',      'engineer', 'rare',      { gold: 0.10 }, '⚙️',         3,   1.3, 'ranged'],
  ['Эльфийский князь',  'elf',      'legendary', { dmg: 0.10, hp: 0.10 }, '🍃',   7,   1.4, 'ranged'],
  ['Орк-вождь',         'orc',      'rare',      { hp: 0.12 }, '🪖',           5,   0.9, 'melee'],
  ['Гоблин-плут',       'goblin',   'common',    { gold: 0.08 }, '🪙',          2,   1.4, 'melee'],
  ['Тролль каменный',   'troll',    'rare',      { hp: 0.10 }, '🪨',           4,   0.7, 'melee'],
  ['Ведьма Морриган',   'witch',    'epic',      { dmg: 0.06, rage: 0.06 }, '🧙', 5,   1.0, 'mage'],
  ['Рыцарь Розы',       'knight',   'rare',      { dmg: 0.05, hp: 0.05 }, '🌹',  4,   1.0, 'melee'],
  ['Снайпер Кай',       'sniper',   'epic',      { crit: 0.10 }, '🎯',          7,   0.7, 'ranged'],
  ['Призыватель Дант',  'summoner', 'epic',      { dmg: 0.08 }, '👁️',          5,   1.1, 'mage'],
  ['Ледяная дева',      'iceqn',    'epic',      { dmg: 0.06, rage: 0.04 }, '❄️', 5,   1.1, 'mage'],
  ['Огненный маг',      'pyro',     'rare',      { dmg: 0.06 }, '🔥',           4,   1.2, 'mage'],
  ['Громовой жрец',     'storm',    'rare',      { dmg: 0.05, rage: 0.03 }, '⚡', 4,   1.2, 'mage'],
  ['Целитель Орин',     'healer',   'common',    { hp: 0.05 }, '➕',            1,   1.0, 'support'],
  ['Кузнец Тордак',     'smith',    'rare',      { dmg: 0.04, gold: 0.04 }, '🔨', 4,   0.9, 'melee'],
  ['Купец Ларс',        'trader',   'common',    { gold: 0.12 }, '💰',          1,   1.0, 'support'],
  ['Бард Финн',         'bard',     'common',    { rage: 0.04 }, '🎻',          1,   1.4, 'support'],
  ['Алхимик Пим',       'alchemist','rare',      { gold: 0.06, hp: 0.04 }, '⚗️', 2,   1.1, 'support'],
  ['Некромант Зейл',    'necro',    'epic',      { dmg: 0.08, hp: 0.04 }, '☠️',  5,   1.1, 'mage'],
  ['Дух воды',          'water',    'rare',      { hp: 0.07 }, '💧',            3,   1.2, 'mage'],
  ['Дух огня',          'fire',     'rare',      { dmg: 0.07 }, '🔥',           4,   1.2, 'mage'],
  ['Дух ветра',         'wind',     'rare',      { rage: 0.07 }, '🌬️',         3,   1.5, 'mage'],
  ['Дух земли',         'earth',    'rare',      { hp: 0.07, dmg: 0.02 }, '🌍', 4,   0.9, 'mage'],
  ['Капитан стражи',    'captain',  'rare',      { dmg: 0.05, hp: 0.03 }, '🎖️', 4,   1.0, 'melee'],
  ['Ниндзя теней',      'ninja',    'epic',      { crit: 0.08 }, '🥷',           3,   2.0, 'melee'],
  ['Самурай Кенши',     'samurai',  'epic',      { dmg: 0.09 }, '🎌',            6,   1.1, 'melee'],
  ['Пиратка Айла',      'pirate',   'common',    { gold: 0.07 }, '🏴‍☠️',         3,   1.2, 'ranged'],
  ['Викинг Бьорн',      'viking',   'rare',      { dmg: 0.06, hp: 0.04 }, '🪓',  5,   1.0, 'melee'],
  ['Дракончик Эмбер',   'dragonet', 'epic',      { dmg: 0.07, rage: 0.04 }, '🐉', 6,   1.0, 'mage'],
  ['Феникс малыш',      'phoenix',  'legendary', { dmg: 0.10, hp: 0.10, rage: 0.05 }, '🦅', 8, 1.1, 'mage'],
  ['Ангел-хранитель',   'angel',    'legendary', { hp: 0.20 }, '😇',             4,   1.0, 'support'],
  ['Демон-страж',       'demon',    'legendary', { dmg: 0.15 }, '😈',            9,   1.0, 'melee'],
  ['Тигр-оборотень',    'weretiger','epic',      { dmg: 0.08, crit: 0.04 }, '🐅', 5,   1.4, 'melee'],
  ['Волк-альфа',        'wolf',     'rare',      { dmg: 0.05, crit: 0.02 }, '🐺', 3,   1.5, 'melee'],
  ['Сова-провидица',    'owl',      'common',    { rage: 0.05 }, '🦉',           2,   1.3, 'ranged'],
  ['Кот-пройдоха',      'cat',      'common',    { gold: 0.05, crit: 0.02 }, '🐈', 2, 1.6, 'melee'],
  ['Кентавр Хирон',     'centaur',  'rare',      { dmg: 0.05, hp: 0.05 }, '🐎',  4,   1.2, 'ranged'],
  ['Гарпия Айра',       'harpy',    'rare',      { dmg: 0.05, rage: 0.03 }, '🪽', 3,   1.5, 'ranged'],
  ['Минотавр Гром',     'mino',     'epic',      { dmg: 0.10, hp: 0.05 }, '🐂',  7,   0.9, 'melee'],
  ['Сирена Мира',       'siren',    'epic',      { rage: 0.10 }, '🧜',           4,   1.2, 'mage'],
  ['Король-личина',     'king',     'legendary', { dmg: 0.12, gold: 0.10 }, '👑', 7,   1.2, 'melee'],
  // ---- Mythic (только из сундуков, очень редкие) ----
  ['Драконий император','emp_drag', 'mythic',    { dmg: 0.22, hp: 0.12, crit: 0.06 }, '🐲', 14, 1.2, 'mage'],
  ['Архонт Звёзд',      'star_arc', 'mythic',    { dmg: 0.18, rage: 0.12, crit: 0.05 }, '🌟', 12, 1.4, 'ranged'],
  ['Хранитель Времени', 'timekeep', 'mythic',    { dmg: 0.18, gold: 0.18 }, '⏳',           11, 1.3, 'support'],
  ['Кровавая Принцесса','blood_pr', 'mythic',    { dmg: 0.20, crit: 0.10 }, '🩸',          10, 1.6, 'melee'],
  ['Тёмный Серафим',    'dark_ser', 'mythic',    { dmg: 0.16, hp: 0.20 }, '🪽',            13, 1.1, 'mage'],
  // ---- Premium (только в магазине за гемы) ----
  ['Звёздный Странник', 'prem_star','premium',   { dmg: 0.30, crit: 0.10, rage: 0.10 }, '⭐', 18, 1.5, 'mage'],
  ['Алый Воевода',      'prem_red', 'premium',   { dmg: 0.28, hp: 0.20 }, '🔥',            20, 1.2, 'melee'],
  ['Лунная Жрица',      'prem_lun', 'premium',   { dmg: 0.20, hp: 0.30, gold: 0.10 }, '🌙', 14, 1.4, 'support'],
  ['Гром Небес',        'prem_thn', 'premium',   { dmg: 0.32, crit: 0.08 }, '⚡',           22, 1.4, 'ranged'],
  ['Архимаг Бесконечности','prem_inf','premium', { dmg: 0.35, rage: 0.15 }, '🪄',           25, 1.3, 'mage'],
  // ===== Сезонные герои Battle Pass =====
  // Редкость 'season' — эксклюзив. НЕ выпадает из сундуков (фильтрация
  // выполнена в openChest), НЕ продаётся в магазине.
  ['Феникс Восхода',    'bp_phoenix', 'season',    { dmg: 0.30, rage: 0.12, hp: 0.15 }, '🦅', 20, 1.3, 'mage'],
];

// Стоимость зависит от редкости.
const RARITY_COST = {
  common: 200,
  rare: 1500,
  epic: 12000,
  legendary: 80000,
  mythic: 500_000,    // только если бы продавался — но он не продаётся, выпадает в сундуках
  // Премиум-герои не продаются за золото (только за гемы из PREMIUM_GEM_COST).
  // Но базовая «золотая стоимость» нужна для расчёта цены ПРОКАЧКИ героя.
  // Премиум — самые дорогие в апгрейде, делаем выше мификов.
  premium: 1_000_000,
  // Сезонные (Battle Pass). Не продаются, выдаются как награда сезона.
  season: 800_000,
};

// Стоимость premium-героев в гемах (мини-магазин в Инвентаре).
export const PREMIUM_GEM_COST = {
  prem_star: 800,
  prem_red:  900,
  prem_lun:  700,
  prem_thn:  1000,
  prem_inf:  1500,
};

// Стихия героя — детерминированный маппинг по id-префиксу шаблона.
// Если героя нет в карте, берём стихию по индексу.
// Стихии: fire | ice | lightning | poison | light | dark
const HERO_ELEMENT_BY_KEY = {
  paladin: 'light', priest: 'light', healer: 'light', angel: 'light', knight: 'light',
  monk: 'light', captain: 'light', cat: 'light', owl: 'light',
  pyro: 'fire', fire: 'fire', dragonet: 'fire', phoenix: 'fire', samurai: 'fire',
  berserker: 'fire', viking: 'fire', orc: 'fire', mino: 'fire', warrior: 'fire',
  iceqn: 'ice', water: 'ice', druid: 'ice', troll: 'ice', earth: 'ice',
  ranger: 'ice', engineer: 'ice', wolf: 'ice',
  storm: 'lightning', wind: 'lightning', archer: 'lightning', sniper: 'lightning',
  ninja: 'lightning', harpy: 'lightning', centaur: 'lightning', bard: 'lightning',
  warlock: 'poison', alchemist: 'poison', goblin: 'poison', shaman: 'poison',
  necro: 'poison', kobold: 'poison', smith: 'poison', trader: 'poison',
  mage: 'dark', sorceress: 'dark', dark: 'dark', witch: 'dark', summoner: 'dark',
  demon: 'dark', weretiger: 'dark', siren: 'dark', king: 'dark', pirate: 'dark',
  elf: 'light', assassin: 'dark', ranger_e: 'lightning',
  // Mythic
  emp_drag: 'fire', star_arc: 'light', timekeep: 'lightning', blood_pr: 'dark', dark_ser: 'dark',
  // Premium
  prem_star: 'light', prem_red: 'fire', prem_lun: 'ice', prem_thn: 'lightning', prem_inf: 'dark',
  // Сезонные
  bp_phoenix: 'fire',
};
const ELEMENT_FALLBACK = ['fire', 'ice', 'lightning', 'poison', 'light', 'dark'];

function elementFor(key, idx) {
  return HERO_ELEMENT_BY_KEY[key] || ELEMENT_FALLBACK[idx % ELEMENT_FALLBACK.length];
}

// Активные ульты по ролям. Ульт — описывает поведение для боевого тика.
//   melee   — мощный одиночный удар по фокусу x10 урона.
//   ranged  — залп: 5 ударов по 0.6 от текущего урона по фокусу.
//   mage    — взрыв по всем врагам, x4 от текущего урона.
//   support — баст отряда: x2 урон отряду на 6 секунд + восстановление 50% ярости.
const ULTS = {
  melee:   { id: 'cleave',   name: 'Сокрушающий удар', cd: 22, dmgMult: 10, target: 'focus',   desc: 'x10 урона по цели' },
  ranged:  { id: 'volley',   name: 'Залп',             cd: 18, dmgMult: 0.6, hits: 5, target: 'focus', desc: '5 выстрелов x0.6' },
  mage:    { id: 'blast',    name: 'Огненный взрыв',   cd: 25, dmgMult: 4,  target: 'all',     desc: 'x4 урона по всем' },
  support: { id: 'haste',    name: 'Боевой клич',      cd: 30, buffPartyMult: 2, buffMs: 6000, rage: 50, desc: 'x2 урон отряда 6 сек, +50% ярости' },
};

// Улучшенные ульты для 6★ «Пробуждённой формы». Заменяют базовый при достижении
// шестой звезды. Сильнее по урону, на меньшем cd, с расширенным эффектом.
const EVOLVED_ULTS = {
  melee:   { id: 'execute',     name: 'Казнь',              cd: 18, dmgMult: 18,                target: 'focus',
             desc: 'x18 урона + 25% мгновенный урон по соседним' },
  ranged:  { id: 'rain_arrows', name: 'Дождь стрел',        cd: 15, dmgMult: 0.8, hits: 8,      target: 'focus',
             desc: '8 выстрелов x0.8' },
  mage:    { id: 'cataclysm',   name: 'Катаклизм',          cd: 20, dmgMult: 7,                  target: 'all',
             desc: 'x7 урона по всем + статус стихии 100%' },
  support: { id: 'rally',       name: 'Боевой марш',        cd: 22, buffPartyMult: 2.5, buffMs: 8000, rage: 75,
             desc: 'x2.5 урон отряда 8 сек, +75% ярости' },
};
export function getEvolvedUlt(role) {
  return EVOLVED_ULTS[role] || null;
}

export const HEROES = HERO_TEMPLATES.map(([name, id, rarity, bonus, icon, atk, speed, role], i) => ({
  id: `${id}_${i}`,
  name,
  rarity,
  bonus,
  icon,
  atk,
  speed,
  role,
  element: elementFor(id, i),
  cost: RARITY_COST[rarity],
  ult: ULTS[role],
}))

export function getHero(id) {
  return HEROES.find((h) => h.id === id);
}

// Итоговый бонусный пул от всех нанятых героев (не зависит от состава отряда).
export function calcHeroBonuses(unlockedIds) {
  const acc = { dmg: 0, hp: 0, gold: 0, crit: 0, rage: 0 };
  for (const id of unlockedIds) {
    const h = getHero(id);
    if (!h) continue;
    for (const k of Object.keys(acc)) {
      if (h.bonus[k]) acc[k] += h.bonus[k];
    }
  }
  return acc;
}

// Множитель урона от уровня героя.
// Базовый рост per-level ЗАВИСИТ ОТ РЕДКОСТИ: чем выше редкость, тем круче
// растёт герой с уровнем. Это не даёт дешёвым «обычным» героям обгонять
// дорогих эпиков/легенд при равной прокачке.
// До soft cap — геометрический рост base^(lvl-1), после — мягкий slope.
const HERO_SOFT_CAP = 100;

// Рост за уровень по редкости.
const RARITY_LEVEL_BASE = {
  common:    1.130,
  rare:      1.150,
  epic:      1.180,
  legendary: 1.210,
  mythic:    1.240,
  premium:   1.260,
  season:    1.250,
};

// Плоский множитель «силы» по редкости — задаёт разрыв в базовом потолке.
export const RARITY_POWER = {
  common:    1.0,
  rare:      1.6,
  epic:      2.8,
  legendary: 5.0,
  mythic:    9.0,
  premium:   12.0,
  season:    10.0,
};

export function heroLevelMult(level, rarity = 'common') {
  const base = RARITY_LEVEL_BASE[rarity] || 1.18;
  const L = Math.max(0, (level || 1) - 1);
  if (L <= HERO_SOFT_CAP - 1) return Math.pow(base, L);
  const capped = Math.pow(base, HERO_SOFT_CAP - 1);
  const extra = L - (HERO_SOFT_CAP - 1);
  return capped * Math.pow(1.005, extra);
}

// Цена прокачки героя на следующий уровень.
// До 100 — 1.22^N от 25% стоимости найма.
// С 101 — экспонента быстрее (1.25).
export function heroUpgradeCost(hero, level) {
  if (level <= HERO_SOFT_CAP) {
    return Math.floor((hero.cost * 0.25) * Math.pow(1.22, level - 1));
  }
  const baseAt100 = (hero.cost * 0.25) * Math.pow(1.22, HERO_SOFT_CAP - 1);
  const extra = level - HERO_SOFT_CAP;
  return Math.floor(baseAt100 * Math.pow(1.25, extra));
}

// Информативный максимум уровня для UI: бесконечно после soft cap.
export const HERO_LEVEL_SOFT_CAP = HERO_SOFT_CAP;
