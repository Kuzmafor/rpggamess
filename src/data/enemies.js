// Обычные враги по волнам и боссы.
// hpBase — здоровье на 1-й волне, реальное HP = hpBase * scale(stage, wave).
// reward — золото за убийство (тоже масштабируется).

import { BOSS_ELEMENT, COMMON_ELEMENT, getPhasesForSprite } from './bossPhases.js'

export const COMMON_ENEMIES = [
  { name: 'Гоблин',         sprite: 'goblin',     icon: '👺', hpBase: 30,  reward: 5 },
  { name: 'Скелет',         sprite: 'skeleton',   icon: '💀', hpBase: 45,  reward: 7 },
  { name: 'Орк-разбойник',  sprite: 'orc',        icon: '👹', hpBase: 70,  reward: 11 },
  { name: 'Тёмный волк',    sprite: 'wolf',       icon: '🐺', hpBase: 60,  reward: 9 },
  { name: 'Призрак',        sprite: 'ghost',      icon: '👻', hpBase: 90,  reward: 14 },
  { name: 'Кобольд',        sprite: 'kobold',     icon: '🦎', hpBase: 50,  reward: 8 },
  { name: 'Тёмный маг',     sprite: 'darkmage',   icon: '🧙‍♂️', hpBase: 110, reward: 18 },
  { name: 'Зомби',          sprite: 'zombie',     icon: '🧟', hpBase: 80,  reward: 12 },
  { name: 'Имп',            sprite: 'imp',        icon: '😈', hpBase: 65,  reward: 10 },
  { name: 'Бес-метатель',   sprite: 'imp_thrower',icon: '🪤', hpBase: 75,  reward: 11 },
];

// Боссы появляются на 10-й волне каждой зоны.
export const ZONE_BOSSES = [
  { name: 'Тролль-вожак',     sprite: 'boss_troll',        icon: '👹', hpBase: 800,    reward: 200 },
  { name: 'Лесной голем',     sprite: 'boss_golem',        icon: '🌳', hpBase: 2000,   reward: 500 },
  { name: 'Костяной король',  sprite: 'boss_skullking',    icon: '☠️', hpBase: 6000,   reward: 1500 },
  { name: 'Огненный демон',   sprite: 'boss_firedemon',    icon: '🔥', hpBase: 18000,  reward: 5000 },
  { name: 'Ледяная гидра',    sprite: 'boss_icehydra',     icon: '🐍', hpBase: 60000,  reward: 15000 },
  { name: 'Грозовой титан',   sprite: 'boss_stormtitan',   icon: '⚡', hpBase: 200000, reward: 45000 },
  { name: 'Теневой архонт',   sprite: 'boss_shadowarchon', icon: '🌑', hpBase: 700000, reward: 130000 },
];

export const ZONES = [
  'Долина теней',
  'Сожжённые равнины',
  'Кристальные пещеры',
  'Замок Морока',
  'Бездна Времён',
  'Небесные руины',
  'Вулкан Гнева',
  'Ледяная цитадель',
  'Чертоги Судьбы',
  'Туманные топи',
  'Подземный лабиринт',
  'Громовое плато',
  'Песчаная гробница',
  'Древо мира',
  'Призрачная гавань',
  'Лунный храм',
  'Око Хаоса',
  'Сад окаменелых',
  'Кровавая арена',
  'Врата Бесконечности',
];

export function scaleHp(stage, wave, ng = 0) {
  const step = (stage - 1) * 10 + (wave - 1);
  // Чуть круче растим HP после 10-й и 20-й зоны, чтобы поздние боссы
  // не отставали от прокачки игрока.
  let base;
  if (stage <= 10) base = 1.18;
  else if (stage <= 20) base = 1.22;
  else base = 1.24;
  const tier = Math.floor((stage - 1) / 5); // 0..n
  const tierBoost = Math.pow(1.5, tier);    // 1, 1.5, 2.25, 3.375, ...
  const ngMult = 1 + 0.5 * Math.max(0, ng | 0);
  return Math.pow(base, step) * tierBoost * ngMult;
}
export function scaleGold(stage, wave, ng = 0) {
  const step = (stage - 1) * 10 + (wave - 1);
  let base;
  if (stage <= 10) base = 1.14;
  else if (stage <= 20) base = 1.17;
  else base = 1.19;
  const tier = Math.floor((stage - 1) / 5);
  const tierBoost = Math.pow(1.35, tier);
  const ngMult = 1 + 0.4 * Math.max(0, ng | 0);
  return Math.pow(base, step) * tierBoost * ngMult;
}

function lineupSize(stage, wave) {
  if (wave === 10) return 1;
  if (wave === 5) return 3;
  if (stage >= 3 && wave >= 7) return 3;
  if (stage >= 2 || wave >= 4) return 2;
  return 1;
}

function pickCommon(stage, wave, slot) {
  const idx = (stage * 7 + wave * 3 + slot * 11) % COMMON_ENEMIES.length;
  return { ...COMMON_ENEMIES[idx], isBoss: false };
}

// Используется фазой summonAdds — выбирает обычного моба и помечает его стихией.
export function pickCommonForBoss(stage, wave, slot) {
  const e = pickCommon(stage, wave, slot);
  return { ...e, isBoss: false, element: COMMON_ELEMENT[e.sprite] || 'dark' };
}

export function buildWaveLineup(stage, wave, ng = 0) {
  const hpScale = scaleHp(stage, wave, ng);
  const goldScale = scaleGold(stage, wave, ng);

  if (wave === 10) {
    const idx = (stage - 1) % ZONE_BOSSES.length;
    const cycle = Math.floor((stage - 1) / ZONE_BOSSES.length); // 0,1,2…
    const b = ZONE_BOSSES[idx];
    // Каждый «круг» боссов делаем ощутимо мощнее — так зоны 8+
    // не оказываются легче, чем 6–7.
    const cycleHp     = Math.pow(2.2, cycle); // 1, 2.2, 4.84, 10.6…
    const cycleReward = Math.pow(1.8, cycle);
    const maxHp = Math.ceil(b.hpBase * hpScale * 1.5 * cycleHp);
    // Награда босса должна заметно превышать награду за обычных врагов той же
    // зоны. Берём максимальную базу обычного врага на этой зоне и гарантируем,
    // что босс даёт минимум 25 таких убийств — иначе мелочь «обгоняла» босса.
    const maxCommonBase = Math.max(...COMMON_ENEMIES.map(e => e.reward));
    const bossRewardRaw = Math.ceil(b.reward * goldScale * cycleReward);
    const bossRewardFloor = Math.ceil(maxCommonBase * goldScale * 25);
    return [{
      ...b,
      isBoss: true,
      uid: `b_${stage}_${wave}`,
      hp: maxHp,
      maxHp,
      reward: Math.max(bossRewardRaw, bossRewardFloor),
      element: BOSS_ELEMENT[b.sprite] || 'dark',
      phases: getPhasesForSprite(b.sprite),
      phasesActive: [],
      shield: 0,
      enrage: false,
      roleLock: null,
      statuses: {},
    }];
  }

  const n = lineupSize(stage, wave);
  const out = [];
  for (let i = 0; i < n; i++) {
    const e = pickCommon(stage, wave, i);
    const hpMult = 1 + i * 0.15;
    const maxHp = Math.ceil(e.hpBase * hpScale * hpMult);
    out.push({
      ...e,
      uid: `e_${stage}_${wave}_${i}`,
      hp: maxHp,
      maxHp,
      reward: Math.ceil(e.reward * goldScale * (1 + i * 0.1)),
      element: COMMON_ELEMENT[e.sprite] || 'dark',
      statuses: {},
    });
  }
  return out;
}

export function pickEnemy(stage, wave) {
  return buildWaveLineup(stage, wave)[0];
}
