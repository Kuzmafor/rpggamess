// Бесконечная башня (Infinite Tower).
// Каждые 10 этажей — чек-поинт: можно "сохранить" этаж и в случае проигрыша
// откатиться сюда, а не на 1.
// Каждые 100 этажей — обязательный модификатор: ограничения боя.
// Этажи >= 50 могут давать осколки героев для ascension.
//
// HP врага этажа = baseHp * 1.18^floor.
// Базовая HP = 80, чтобы первые этажи были слабее средних арен-врагов
// и игрок входил в башню в комфорте, а потом упирался.
//
// Награда за этаж:
//   + золото = 5 * 1.16^floor (быстрее накапливается, чем урон растёт)
//   + частицы силы = 1 на каждые 5 этажей
//   + материалы Ascension с этажей >= 50 (1 осколок случайного героя в отряде)
//
// Сброс этажа — раз в неделю по понедельникам 00:00 локального времени.
// Лучшее достижение этой недели уходит в bestThisWeek для лидерборда.

import { COMMON_ENEMIES, ZONE_BOSSES } from './enemies.js'

export const TOWER = {
  baseHp: 80,
  hpExp: 1.18,
  baseGold: 5,
  goldExp: 1.16,
  checkpointEvery: 10,
  modifierEvery: 100,
  // Награда — частицы силы (powerShards). Тратятся отдельно от престижа.
  shardsEvery: 5,
  ascendDropFrom: 50,
}

// Модификаторы этажа — определяются по floor.
// Возвращает массив id модификаторов, активных на этом этаже.
// Активируются на каждом 100-м: floor 100, 200, 300...
// Дальше эффект сохраняется на ближайшие 50 этажей, потом сходит на нет.
export function modifiersAt(floor) {
  if (floor < 100) return []
  const tier = Math.floor(floor / 100)
  // Цикл из 4 модификаторов
  const pool = ['noUlts', 'noHeal', 'magesOnly', 'rangedOnly']
  const id = pool[(tier - 1) % pool.length]
  // Активен на этом этаже и на следующих 49.
  if (floor % 100 < 50) return [id]
  return []
}

export const MODIFIER_INFO = {
  noUlts:    { name: 'Без ультов',          desc: 'Ультимейты героев заблокированы.' },
  noHeal:    { name: 'Без хила',            desc: 'Бонус HP отряда отключён.' },
  magesOnly: { name: 'Только маги',         desc: 'Урон проходит только от героев-магов и тапов.' },
  rangedOnly:{ name: 'Только стрелки',      desc: 'Урон проходит только от героев-стрелков и тапов.' },
}

// Конкретный враг этажа.
// Чем выше этаж — тем чаще босс. Каждый 10-й — мини-босс,
// каждый 100-й — большой босс.
export function buildTowerEnemy(floor) {
  const isMini = floor % 10 === 0 && floor % 100 !== 0
  const isBig  = floor % 100 === 0
  const hpMult = isBig ? 4 : (isMini ? 2 : 1)
  const hp = Math.ceil(TOWER.baseHp * Math.pow(TOWER.hpExp, floor) * hpMult)

  if (isBig || isMini) {
    const b = ZONE_BOSSES[(floor - 1) % ZONE_BOSSES.length]
    return {
      ...b,
      isBoss: true,
      uid: `t_b_${floor}`,
      hp, maxHp: hp,
      reward: Math.ceil(TOWER.baseGold * Math.pow(TOWER.goldExp, floor) * (isBig ? 6 : 3)),
      element: 'dark',
      phases: [], phasesActive: [],
      shield: 0, enrage: false, roleLock: null,
      statuses: {},
    }
  }
  const e = COMMON_ENEMIES[(floor * 7) % COMMON_ENEMIES.length]
  return {
    ...e,
    isBoss: false,
    uid: `t_e_${floor}`,
    hp, maxHp: hp,
    reward: Math.ceil(TOWER.baseGold * Math.pow(TOWER.goldExp, floor)),
    element: 'dark',
    statuses: {},
  }
}

// Подсчёт награды за чистый этаж.
export function towerFloorReward(floor) {
  return {
    gold: Math.ceil(TOWER.baseGold * Math.pow(TOWER.goldExp, floor)),
    powerShards: floor % TOWER.shardsEvery === 0 ? 1 : 0,
    heroShard: floor >= TOWER.ascendDropFrom && Math.random() < 0.18,
  }
}

// Мощь обычной атаки врага этажа.
// На обычных этажах ниже, на мини-боссах и больших боссах — выше.
export function towerEnemyAtk(floor, isBoss, isBig) {
  const base = 10 * Math.pow(1.16, floor)
  if (isBig) return Math.ceil(base * 4)
  if (isBoss) return Math.ceil(base * 2)
  return Math.ceil(base)
}

// Интервал между атаками в мс. Босс бьёт чаще.
export function towerEnemyInterval(floor, isBoss, isBig) {
  if (isBig) return 1400
  if (isBoss) return 1700
  return 2200
}

// Базовая HP героя по роли.
export const HERO_BASE_HP = {
  melee: 120, ranged: 80, mage: 70, support: 95,
}

// Ключ "недели" по понедельнику 00:00 локального времени.
// Используем для еженедельного сброса.
export function weekKey(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay() // 0 sun, 1 mon...
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10) // 'YYYY-MM-DD'
}
