// Codex / Бестиарий.
// Описания врагов и боссов, дроп-листы, лор-вставки. Счётчики убитых
// хранятся в стейте (store.codexKills[sprite]).
//
// Каждая запись изучается по мере убийств. Пороги «изучен» дают глобальные пассивы:
//   killed >= 1     — запись открыта (видны иконка/имя/стихия)
//   killed >= 25    — открыто описание и дроп
//   killed >= 100   — изучен, +небольшой бонус (см. CODEX_BONUS)
//   killed >= 500   — мастер изучения, дополнительный бонус
//
// Бонусы складываются по всем «изученным» врагам в общий пакет (см. getCodexBonuses).

import { COMMON_ENEMIES, ZONE_BOSSES } from './enemies.js'

// Описания обычных врагов
export const COMMON_DESC = {
  goblin:      { lore: 'Шумный мародёр окраин. Ходит стаями, ловит зазевавшихся.',
                 drops: ['Золото', 'Изредка осколки артефактов'] },
  skeleton:    { lore: 'Поднятые тёмной магией кости старых воинов. Слабые, но многочисленные.',
                 drops: ['Золото', 'Шанс рунической пыли'] },
  orc:         { lore: 'Жестокие разбойники. Любят засады в горных проходах.',
                 drops: ['Золото', 'Иногда — материал боссов рейда'] },
  wolf:        { lore: 'Тёмный волк. Быстрый и злой, чует кровь за километр.',
                 drops: ['Золото', 'Изредка осколки геройских классов'] },
  ghost:       { lore: 'Бесплотный страж забытых склепов. Уязвим к свету.',
                 drops: ['Золото', 'Эктоплазма (редко)'] },
  kobold:      { lore: 'Лукавые подземники. Любят ловушки и сюрпризы.',
                 drops: ['Золото', 'Иногда — компоненты ловушек'] },
  darkmage:    { lore: 'Падший волшебник, проклявший себя ради силы.',
                 drops: ['Золото', 'Магические осколки'] },
  zombie:      { lore: 'Медленный, но настойчивый. Ходячее предупреждение.',
                 drops: ['Золото', 'Гнилая ткань'] },
  imp:         { lore: 'Мелкий бес-проказник. Быстрый и подлый.',
                 drops: ['Золото', 'Раз в десять — гем'] },
  imp_thrower: { lore: 'Бес с метательными ножами. Бьёт издали.',
                 drops: ['Золото', 'Метательные клинки (декор)'] },
}

// Описания зональных боссов
export const BOSS_DESC = {
  boss_troll:        { lore: 'Тролль-вожак. Огромная булава и рёв на всё ущелье. Командует мелкими орками.', drops: ['Гем', 'Шанс редкого героя'] },
  boss_golem:        { lore: 'Лесной голем. Кора как сталь, а внутри — древняя магия. Бьёт землю до тряски.', drops: ['Гем', 'Шанс эпического сундука'] },
  boss_skullking:    { lore: 'Костяной король. Возрождает мёртвых и насмехается над живыми.', drops: ['Гем', 'Эссенция нежити'] },
  boss_firedemon:    { lore: 'Огненный демон. Рвёт реальность пламенем. Уязвим к воде/льду.', drops: ['Гем', 'Чешуя дракона'] },
  boss_icehydra:     { lore: 'Ледяная гидра с тремя головами. Каждая — стихия льда.', drops: ['Гем', 'Иней гидры'] },
  boss_stormtitan:   { lore: 'Грозовой титан. Стоит между скалами, призывая шторма.', drops: ['Гем', 'Грозовой кристалл'] },
  boss_shadowarchon: { lore: 'Теневой архонт. Старший среди тьмы, плетёт реальность.', drops: ['Гем', 'Тень архонта'] },
}

// Все возможные «sprite» ключи, которые попадут в Codex.
export function listCodexEntries() {
  const out = []
  for (const e of COMMON_ENEMIES) {
    out.push({
      kind: 'common',
      sprite: e.sprite,
      name: e.name,
      icon: e.icon,
      hpBase: e.hpBase,
      reward: e.reward,
      desc: COMMON_DESC[e.sprite]?.lore || '',
      drops: COMMON_DESC[e.sprite]?.drops || [],
    })
  }
  for (const b of ZONE_BOSSES) {
    out.push({
      kind: 'boss',
      sprite: b.sprite,
      name: b.name,
      icon: b.icon,
      hpBase: b.hpBase,
      reward: b.reward,
      desc: BOSS_DESC[b.sprite]?.lore || '',
      drops: BOSS_DESC[b.sprite]?.drops || [],
    })
  }
  return out
}

// Пороги изучения и бонусы.
// На каждой ступени мы прибавляем небольшой плоский бонус в общий пул:
//   discovered  — впервые увидел, запись открыта
//   studied     — изучил, +0.2% урона ИЛИ золота
//   mastered    — мастер, +0.5% урона/золота/руды
export const CODEX_TIERS = {
  discovered: { kills: 1,   label: 'Открыт' },
  briefing:   { kills: 25,  label: 'Описан' },
  studied:    { kills: 100, label: 'Изучен' },
  mastered:   { kills: 500, label: 'Мастер' },
}

export function codexTierOf(kills) {
  if (kills >= CODEX_TIERS.mastered.kills)  return 'mastered'
  if (kills >= CODEX_TIERS.studied.kills)   return 'studied'
  if (kills >= CODEX_TIERS.briefing.kills)  return 'briefing'
  if (kills >= CODEX_TIERS.discovered.kills) return 'discovered'
  return null
}

// Вклад одной записи в общий бонус.
export function codexEntryBonus(kind, kills) {
  const tier = codexTierOf(kills)
  if (!tier) return null
  // Базовые бонусы: обычные дают мелочь к урону, боссы — крупнее.
  const isBoss = kind === 'boss'
  if (tier === 'discovered') return null
  if (tier === 'briefing')   return isBoss ? { dmg: 0.005, gold: 0.005 } : { dmg: 0.001 }
  if (tier === 'studied')    return isBoss ? { dmg: 0.012, gold: 0.012 } : { dmg: 0.003, gold: 0.001 }
  if (tier === 'mastered')   return isBoss ? { dmg: 0.025, gold: 0.025, ore: 0.02 } : { dmg: 0.008, gold: 0.003 }
  return null
}

// Суммарный бонус из всех записей Codex.
// kills — { [sprite]: number }
// kinds — { [sprite]: 'common'|'boss' } (для маршрутизации множителя)
export function getCodexBonuses(kills, kinds) {
  const out = { dmg: 0, gold: 0, ore: 0, hp: 0 }
  if (!kills) return out
  for (const sprite of Object.keys(kills)) {
    const k = kills[sprite] || 0
    const kind = kinds[sprite] || 'common'
    const b = codexEntryBonus(kind, k)
    if (!b) continue
    for (const key of Object.keys(b)) {
      out[key] = (out[key] || 0) + b[key]
    }
  }
  return out
}
