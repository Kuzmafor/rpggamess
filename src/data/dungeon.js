// Подземелье: 5 глав по 10 стадий.
// Каждая стадия — отдельный бой. На последней стадии главы — босс.
// Награды за стадии добавляются мгновенно (золото + руда),
// за прохождение всей главы — крупный итоговый "сундук".

import { COMMON_ENEMIES, ZONE_BOSSES } from './enemies.js'

export const DUNGEON_CHAPTERS = [
  {
    id: 1,
    name: 'Замшелые катакомбы',
    short: 'Глава 1',
    desc: 'Подземелье у предместий Долины теней. Простые твари.',
    color: '#67d6ff',
    icon: 'dungeon',
    bossSprite: 'boss_troll',
    enemyPool: ['goblin', 'skeleton', 'zombie', 'kobold'],
    hpScale: 1.0,
    rewardGold: 800,
    rewardOre: 30,
    rewardShards: 3,
    rewardGems: 2,
  },
  {
    id: 2,
    name: 'Колодец костей',
    short: 'Глава 2',
    desc: 'Покинутые шахты, наполненные нежитью.',
    color: '#a072ff',
    icon: 'dungeon',
    bossSprite: 'boss_skullking',
    enemyPool: ['skeleton', 'ghost', 'darkmage', 'zombie'],
    hpScale: 2.6,
    rewardGold: 4500,
    rewardOre: 60,
    rewardShards: 6,
    rewardGems: 3,
  },
  {
    id: 3,
    name: 'Лесной голем',
    short: 'Глава 3',
    desc: 'Древний голем затаился среди коренастых сосен.',
    color: '#7be281',
    icon: 'dungeon',
    bossSprite: 'boss_golem',
    enemyPool: ['orc', 'wolf', 'imp', 'imp_thrower'],
    hpScale: 6.5,
    rewardGold: 22000,
    rewardOre: 110,
    rewardShards: 10,
    rewardGems: 4,
  },
  {
    id: 4,
    name: 'Огненный демон',
    short: 'Глава 4',
    desc: 'Жаровни ада. Лава течёт по полу.',
    color: '#ff7a2a',
    icon: 'dungeon',
    bossSprite: 'boss_firedemon',
    enemyPool: ['imp', 'imp_thrower', 'darkmage', 'orc'],
    hpScale: 16,
    rewardGold: 110000,
    rewardOre: 200,
    rewardShards: 18,
    rewardGems: 6,
  },
  {
    id: 5,
    name: 'Чертоги Морока',
    short: 'Глава 5',
    desc: 'Туман и тьма. Здесь ждёт повелитель теней.',
    color: '#ffd166',
    icon: 'dungeon',
    bossSprite: 'boss_shadowarchon',
    enemyPool: ['ghost', 'darkmage', 'zombie', 'skeleton'],
    hpScale: 40,
    rewardGold: 600000,
    rewardOre: 380,
    rewardShards: 30,
    rewardGems: 10,
  },
  {
    id: 6,
    name: 'Костяной разлом',
    short: 'Глава 6',
    desc: 'Здесь ходит Костяной король, призывая мертвецов.',
    color: '#c8cee8',
    icon: 'dungeon',
    bossSprite: 'boss_skullking',
    enemyPool: ['skeleton', 'zombie', 'ghost', 'darkmage'],
    hpScale: 110,
    rewardGold: 2_400_000,
    rewardOre: 700,
    rewardShards: 50,
    rewardGems: 14,
  },
  {
    id: 7,
    name: 'Ледяная цитадель',
    short: 'Глава 7',
    desc: 'Ледяная гидра растит головы быстрее, чем ты их рубишь.',
    color: '#67d6ff',
    icon: 'dungeon',
    bossSprite: 'boss_icehydra',
    enemyPool: ['kobold', 'wolf', 'imp', 'ghost'],
    hpScale: 320,
    rewardGold: 9_500_000,
    rewardOre: 1300,
    rewardShards: 80,
    rewardGems: 20,
  },
  {
    id: 8,
    name: 'Громовое плато',
    short: 'Глава 8',
    desc: 'Грозовой титан управляет небесными разрядами.',
    color: '#ffe27a',
    icon: 'dungeon',
    bossSprite: 'boss_stormtitan',
    enemyPool: ['imp_thrower', 'darkmage', 'orc', 'imp'],
    hpScale: 1000,
    rewardGold: 38_000_000,
    rewardOre: 2400,
    rewardShards: 130,
    rewardGems: 28,
  },
  {
    id: 9,
    name: 'Око Хаоса',
    short: 'Глава 9',
    desc: 'Реальность здесь искажена. Будь готов ко всему.',
    color: '#a072ff',
    icon: 'dungeon',
    bossSprite: 'boss_shadowarchon',
    enemyPool: ['ghost', 'darkmage', 'imp', 'zombie'],
    hpScale: 3200,
    rewardGold: 150_000_000,
    rewardOre: 4500,
    rewardShards: 220,
    rewardGems: 40,
  },
  {
    id: 10,
    name: 'Пламя Преисподней',
    short: 'Глава 10',
    desc: 'Огненный демон вернулся злее прежнего.',
    color: '#ff5470',
    icon: 'dungeon',
    bossSprite: 'boss_firedemon',
    enemyPool: ['imp', 'imp_thrower', 'orc', 'darkmage'],
    hpScale: 10_000,
    rewardGold: 600_000_000,
    rewardOre: 8500,
    rewardShards: 380,
    rewardGems: 60,
  },
  {
    id: 11,
    name: 'Древо мира',
    short: 'Глава 11',
    desc: 'Лесной голем просыпается всё реже, но бьёт сильнее.',
    color: '#4ade80',
    icon: 'dungeon',
    bossSprite: 'boss_golem',
    enemyPool: ['wolf', 'orc', 'kobold', 'goblin'],
    hpScale: 32_000,
    rewardGold: 2_400_000_000,
    rewardOre: 16000,
    rewardShards: 650,
    rewardGems: 90,
  },
  {
    id: 12,
    name: 'Врата Бесконечности',
    short: 'Глава 12',
    desc: 'Финальное испытание. Победишь — пройдёшь сквозь время.',
    color: '#ffd166',
    icon: 'dungeon',
    bossSprite: 'boss_stormtitan',
    enemyPool: ['darkmage', 'ghost', 'imp_thrower', 'skeleton'],
    hpScale: 100_000,
    rewardGold: 9_500_000_000,
    rewardOre: 30000,
    rewardShards: 1100,
    rewardGems: 140,
  },
]

export const STAGES_PER_CHAPTER = 10

// Для удобства — быстрый поиск.
export function getChapter(id) {
  return DUNGEON_CHAPTERS.find(c => c.id === id)
}

// Построитель шеренги для конкретной стадии главы.
// stage 1..10. На 10-й — босс главы.
export function buildDungeonLineup(chapterId, stage) {
  const ch = getChapter(chapterId)
  if (!ch) return []
  // Используем шкалу HP: чем глубже стадия, тем толще.
  const stageMult = Math.pow(1.18, stage - 1) * ch.hpScale

  if (stage === STAGES_PER_CHAPTER) {
    // Босс главы — берём из готовых, но с собственным sprite/имени из главы.
    const baseBoss = ZONE_BOSSES.find(b => b.sprite === ch.bossSprite) || ZONE_BOSSES[0]
    const maxHp = Math.ceil(baseBoss.hpBase * stageMult * 1.4)
    const reward = Math.ceil(baseBoss.reward * stageMult * 0.4)
    return [{
      ...baseBoss,
      isBoss: true,
      uid: `dch${chapterId}_b${stage}`,
      hp: maxHp,
      maxHp,
      reward,
    }]
  }

  // 1-3 врага в шеренге, чем глубже — тем больше шанс на трио
  const n = stage <= 3 ? 1 : (stage <= 6 ? 2 : 3)
  const out = []
  const pool = ch.enemyPool
  for (let i = 0; i < n; i++) {
    const sp = pool[(stage * 7 + i * 11) % pool.length]
    const proto = COMMON_ENEMIES.find(e => e.sprite === sp) || COMMON_ENEMIES[0]
    const hpMult = 1 + i * 0.15
    const maxHp = Math.ceil(proto.hpBase * stageMult * hpMult)
    const reward = Math.ceil(proto.reward * stageMult * 0.6)
    out.push({
      ...proto,
      isBoss: false,
      uid: `dch${chapterId}_s${stage}_${i}`,
      hp: maxHp,
      maxHp,
      reward,
    })
  }
  return out
}
