import { create } from 'zustand'
import {
  HEROES,
  getHero,
  calcHeroBonuses,
  heroLevelMult,
  heroUpgradeCost,
  PREMIUM_GEM_COST,
  getEvolvedUlt,
  RARITY_POWER,
} from '../data/heroes.js'
import { WEAPONS, getWeapon } from '../data/weapons.js'
import { buildWaveLineup, ZONES, pickCommonForBoss } from '../data/enemies.js'
import { getRaid } from '../data/raids.js'
import { ARTIFACTS, getArtifact, artifactBonus, artifactUpgradeCost } from '../data/artifacts.js'
import { DUNGEON_CHAPTERS, STAGES_PER_CHAPTER, getChapter, buildDungeonLineup } from '../data/dungeon.js'
import { CALENDAR_REWARDS, CALENDAR_DAYS, getDay as getCalendarDay } from '../data/calendar.js'
import { TALENT_BRANCHES, getTalent, talentBonuses } from '../data/talents.js'
import { elementMultiplier, ELEMENT_STATUS, RUNE_TO_ELEMENT } from '../data/elements.js'
import { STATUSES, applyStatus, pruneStatuses, incomingMultFor } from '../data/statusEffects.js'
import {
  starShardCost, starGoldCost, starAtkMult, starCritBonus,
  MAX_STARS, AWAKENING_LEVEL, awakeningBonuses, calcSynergies, getAwakeningPaths,
  SIX_STAR_MYTHIC_SHARDS, SIX_STAR_ORE_COST,
} from '../data/progression.js'
import { TOWER, buildTowerEnemy, modifiersAt, towerFloorReward, weekKey, towerEnemyAtk, towerEnemyInterval, HERO_BASE_HP } from '../data/tower.js'
import { rollTowerChest, towerBuffMods, TOWER_BUFFS } from '../data/towerChests.js'
import { BOSS_RUSH, buildRushBoss, bossRushRewards } from '../data/bossRush.js'
import { EXPEDITIONS, getExpedition } from '../data/expeditions.js'
import { rollGear, applyGearBonuses, GEAR_SLOTS, REROLL_COST, rerollAffix as rerollAffixData } from '../data/gear.js'
import { WEAPON_CATALOG, getWeaponDef as getCatalogWeaponDef } from '../data/weaponCatalog.js'
import {
  SEASONS, getActiveSeason, BP_REWARDS, BP_MAX_LEVEL,
  bpXpNeeded, SEASON_DURATION_MS, PREMIUM_COST_GEMS,
  rewardScale, scaleReward,
} from '../data/battlePass.js'
import {
  EVENT_BOSSES, getEventBoss, pickActiveEventBoss,
} from '../data/eventBosses.js'
import {
  listCodexEntries, getCodexBonuses, codexTierOf, CODEX_TIERS,
} from '../data/codex.js'
import {
  CITY_BUILDINGS, getBuilding, maxBuildingLevel, getCityBonuses,
} from '../data/city.js'
import {
  PETS, getPet, getActivePetBonuses, petUpgradeCost, PET_MAX_LEVEL, rollPetFromEgg,
} from '../data/pets.js'
import {
  EVENT_ID, EVENT_MILESTONES, SLOT_ITEMS, SLOT_COST_TOKENS, SLOT_GEM_COST, SLOT_FREE_PER_DAY,
  JUMP_DAILY_ATTEMPTS, JUMP_TOKENS_PER_TILE, JUMP_GOLD_PER_TILE,
  weightedPick, weightedIndex, eventWindow, dayKey,
} from '../data/event.js'
import * as audio from '../audio/engine.js'
import { impact, vibrate } from '../mobile/index.js'
import { notifyRaidDone, cancelRaidDone, notifyOfflineFull, cancelOfflineFull, notifyDailyReady } from '../mobile/index.js'

function fmtSimple(n) {
  if (n == null) return '0'
  if (Math.abs(n) < 1000) return Math.floor(n).toString()
  if (Math.abs(n) < 1_000_000) return (n / 1000).toFixed(1) + 'K'
  if (Math.abs(n) < 1_000_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  return (n / 1_000_000_000).toFixed(1) + 'B'
}

const SAVE_KEY = 'blade-of-fate.save.v3'
const PARTY_SIZE = 5
const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000 // 8 часов

// ===== Конфигурация магазина =====

// Сундуки.
// heroChance — шанс, что вообще выпадет ГЕРОЙ (0..1).
// heroRarityChances — распределение редкости героя при удачном ролле (сумма = 1).
//   Премиум-герои выпадают крайне редко — это «джекпот».
// guaranteedGold / guaranteedOre — что выпадает всегда.
// fallbackShards / fallbackGold — если выбранная редкость героев исчерпана.
export const CHESTS = {
  common: {
    currency: 'gold', cost: 600, color: '#9aa6c2',
    guaranteedGold: 200, guaranteedOre: 6,
    heroChance: 0.20,
    // премиум 0.05% (1 / 2000)
    heroRarityChances: { common: 0.9295, rare: 0.06, epic: 0.009, legendary: 0.001, premium: 0.0005 },
    fallbackShards: 1, fallbackGold: 600,
  },
  rare: {
    currency: 'gold', cost: 6000, color: '#67d6ff',
    guaranteedGold: 1500, guaranteedOre: 18,
    heroChance: 0.45,
    // премиум 0.2% (1 / 500)
    heroRarityChances: { common: 0.398, rare: 0.50, epic: 0.085, legendary: 0.015, premium: 0.002 },
    fallbackShards: 3, fallbackGold: 4000,
  },
  epic: {
    currency: 'gems', cost: 8, color: '#a072ff',
    guaranteedGold: 8000, guaranteedOre: 40,
    heroChance: 0.70,
    // премиум 0.5% (1 / 200)
    heroRarityChances: { common: 0.085, rare: 0.43, epic: 0.40, legendary: 0.07, mythic: 0.01, premium: 0.005 },
    fallbackShards: 5, fallbackGold: 16000,
  },
  legendary: {
    currency: 'gems', cost: 40, color: '#ffd166',
    guaranteedGold: 50000, guaranteedOre: 110,
    heroChance: 0.90,
    // премиум 1.5% (1 / 67)
    heroRarityChances: { common: 0, rare: 0.07, epic: 0.485, legendary: 0.40, mythic: 0.03, premium: 0.015 },
    fallbackShards: 12, fallbackGold: 100000,
  },
}

// Сундуки сокровищ — без героев, но с большим золотом + рудой.
export const TREASURE_CHESTS = {
  treasure_s: {
    currency: 'gold', cost: 2000, color: '#ffd166',
    label: 'Малый сундук сокровищ',
    desc: 'Гарантированно даёт золото и руду. Без героев.',
    gold: 4000, ore: 20, shards: 0,
  },
  treasure_m: {
    currency: 'gold', cost: 12000, color: '#ffd166',
    label: 'Средний сундук сокровищ',
    desc: 'Большая порция золота и руды.',
    gold: 30000, ore: 80, shards: 2,
  },
  treasure_l: {
    currency: 'gems', cost: 6, color: '#ff7a2a',
    label: 'Гранд-сундук сокровищ',
    desc: 'Огромный куш золота, руды и осколки.',
    gold: 120000, ore: 250, shards: 6,
  },
}

// Боссовый сундук — шанс выбить материалы рейдов.
// drops — массив { material, weight, min, max } (взвешенный пик).
export const BOSS_CHESTS = {
  boss_s: {
    currency: 'gems', cost: 12, color: '#ff5470',
    label: 'Боссовый сундук',
    desc: 'Шанс получить материал из ранних рейдов.',
    gold: 20000, ore: 30, shards: 4,
    drops: [
      { material: 'dragon', weight: 60, min: 1, max: 3 },
      { material: 'lich',   weight: 30, min: 1, max: 2 },
      { material: 'golem',  weight: 10, min: 1, max: 1 },
    ],
  },
  boss_l: {
    currency: 'gems', cost: 60, color: '#a072ff',
    label: 'Боссовый сундук: высший',
    desc: 'Высокий шанс редких материалов поздних рейдов.',
    gold: 200000, ore: 80, shards: 12,
    drops: [
      { material: 'titan',   weight: 35, min: 1, max: 2 },
      { material: 'hydra',   weight: 25, min: 1, max: 2 },
      { material: 'archon',  weight: 18, min: 1, max: 1 },
      { material: 'demon',   weight: 12, min: 1, max: 1 },
      { material: 'phoenix', weight: 7,  min: 1, max: 1 },
      { material: 'warden',  weight: 3,  min: 1, max: 1 },
    ],
  },
}

export const BOOSTS = {
  dmg:        { cost: 4,  duration: 300,  label: 'Урон x2',     desc: '5 минут двойного урона',     mult: 2,    type: 'dmg' },
  gold:       { cost: 4,  duration: 300,  label: 'Золото x2',   desc: '5 минут двойного золота',     mult: 2,    type: 'gold' },
  dmg_long:   { cost: 12, duration: 1200, label: 'Урон x2 (20м)', desc: '20 минут двойного урона',  mult: 2,    type: 'dmg' },
  gold_long:  { cost: 12, duration: 1200, label: 'Золото x2 (20м)', desc: '20 минут двойного золота', mult: 2, type: 'gold' },
  dmg_mega:   { cost: 30, duration: 600,  label: 'Урон x3',     desc: '10 минут тройного урона',     mult: 3,    type: 'dmg' },
}

// Активный множитель буста заданного типа ('dmg' | 'gold') по индивидуальным
// таймерам. Берём максимальный среди активных, чтобы x3 не «затирался» x2 и
// наоборот. Если ни один не активен — возвращаем 1.
export function activeBoostMult(boosts, kind, now = Date.now()) {
  const active = boosts?.active || {}
  let mult = 1
  for (const id of Object.keys(active)) {
    const def = BOOSTS[id]
    if (!def || def.type !== kind) continue
    if ((active[id] || 0) > now) mult = Math.max(mult, def.mult || 2)
  }
  return mult
}

export const CONVERTS = {
  gold:    { cost: 1, amount: 5000,  label: '5 000 золота',   icon: 'gold' },
  shards:  { cost: 1, amount: 2,     label: '2 осколка',       icon: 'artifact' },
  ore:     { cost: 1, amount: 25,    label: '25 руды',         icon: 'ore' },
  gold_l:  { cost: 5, amount: 30000, label: '30 000 золота',   icon: 'gold' },
  shards_l:{ cost: 5, amount: 12,    label: '12 осколков',     icon: 'artifact' },
}

export const GEM_PACKS = [
  { id: 'p0', gems: 20,    label: 'Пробный',     tag: '' },
  { id: 'p1', gems: 50,    label: 'Стартовый',   tag: '' },
  { id: 'p2', gems: 280,   label: 'Любительский', tag: '+12%' },
  { id: 'p3', gems: 720,   label: 'Героический',  tag: '+20%' },
  { id: 'p4', gems: 2000,  label: 'Эпический',    tag: '+30%' },
  { id: 'p5', gems: 6500,  label: 'Легендарный',  tag: '+45%' },
  { id: 'p6', gems: 18000, label: 'Архонтский',   tag: '+60%' },
]

// Промокоды (UPPERCASE). Награды приходят письмом.
export const PROMO_CODES = {
  'WELCOME':   { gold: 5000,   gems: 25,  shards: 5,  message: 'Приветственный набор для нового бойца.' },
  'BLADE':     { gold: 20000,  gems: 50,  shards: 10, message: 'Меч судьбы готов.' },
  'DUNGEON':   { gold: 0,      gems: 0,  shards: 25, message: 'Осколки артефактов в дорогу.' },
  'GEMSTONE':  { gold: 0,      gems: 200, shards: 0,  message: 'Сундук гемов.' },
  'NIGHTOWL':  { gold: 100000, gems: 100, shards: 15, message: 'Полночная награда.' },
}


const DEFAULT_STATE = {
  // ресурсы
  gold: 0,
  gems: 5,
  ore: 0,
  mats: {
    dragon: 0, lich: 0, golem: 0,
    titan: 0, hydra: 0, archon: 0, demon: 0, phoenix: 0, warden: 0,
  },

  // прогресс боя
  stage: 1,
  maxStage: 1,
  wave: 1,
  enemies: [],          // шеренга врагов: [{ uid, name, icon, hp, maxHp, reward, isBoss }]
  targetIdx: 0,         // индекс врага, по которому фокус (тап / удары героев)
  ngLevel: 0,           // NG+: каждый "виток" зон 1..20 повышает множитель

  // ярость / супер
  rage: 0,
  superActive: false,
  superEndsAt: 0,

  // боец
  baseDmg: 1,
  tapLevel: 1,
  passiveLevel: 0,      // оставлено как «глобальная» прокачка пассивного DPS
  weaponTier: 0,
  weaponSharp: {},      // { [tier]: уровень заточки 0..N }
  weaponRunes: {},      // { [tier]: 'flame' | 'frost' | 'lightning' | null }

  // герои
  unlockedHeroes: [],   // [id]
  heroLevels: {},       // { [id]: level }
  heroStars: {},        // { [id]: 0..5 } — звёзды/ascension
  heroShards: {},       // { [id]: N } — осколки конкретного героя для звёзд
  heroAwake: {},        // { [id]: pathId } — выбранная ветка пробуждения
  // Mastery: индивидуальная горизонтальная прогрессия героя.
  // Каждые MASTERY_HITS_PER_LEVEL ударов = +1 уровень мастерства
  // (диминишинг: следующий уровень требует чуть больше ударов).
  heroMastery: {},      // { [id]: { hits, level } }

  // Снаряжение / руны: предметы в инвентаре + надетые ПО ГЕРОЮ.
  // gearBag — array of { id, slot, rarity, setId, affixes:[{type,value}] }
  // gearEquipped — { [heroId]: { [slot]: gearId } } — что у каждого героя надето.
  gearBag: [],
  gearEquipped: {},

  // ===== Battle Pass / сезон =====
  // bp.seasonId — id активного сезона; если изменится — прогресс сбрасывается.
  // bp.startedAt — timestamp старта (для таймера).
  // bp.xp — суммарный xp в этом сезоне.
  // bp.level — текущий уровень (вычисляется из xp, кэшируется для удобства).
  // bp.premium — куплен ли премиум-трек.
  // bp.claimedFree / bp.claimedPremium — массивы уровней, у которых уже забрана награда.
  bp: {
    seasonId: null,
    startedAt: 0,
    xp: 0,
    level: 0,
    premium: false,
    claimedFree: [],
    claimedPremium: [],
  },

  // ===== Ивент-боссы =====
  // eventBoss — текущая попытка/цикл активного босса.
  //   bossId      — id из EVENT_BOSSES
  //   startedAt   — timestamp старта цикла
  //   cycleHours  — копия из data, чтобы не зависеть от смены данных
  //   maxHp       — снимок при старте цикла
  //   damage      — суммарный накопленный урон
  //   attempts    — сколько атак уже сделано
  //   lastAttackAt— timestamp последней атаки
  //   claimed     — индексы порогов наград, которые игрок забрал
  eventBoss: null,

  // ===== Codex / Бестиарий =====
  // codexKills: { [sprite]: число убийств } — счётчик встреч/убийств.
  // codexKinds: { [sprite]: 'common'|'boss' } — карта вида (для бонусов).
  codexKills: {},
  codexKinds: {},

  // ===== Город / База =====
  // cityLevels: { [buildingId]: level } — уровни зданий.
  cityLevels: {},
  // дробный аккумулятор добытой руды (чтобы не терять доли при тике)
  _oreAcc: 0,

  // ===== Питомцы =====
  // pets: { [petId]: { level } } — пойманные питомцы (по виду; дубликаты копят осколки уровня)
  // petEggs: количество невылупленных яиц
  // activePet: petId активного спутника
  pets: {},
  petEggs: 0,
  activePet: null,

  party: [],            // [id, id, ...] до PARTY_SIZE

  // рейды
  raidActive: null,
  raidCooldowns: {},

  // подземелье
  dungeonChapterClears: {},   // { [chapterId]: { stage: maxStage, completed: bool } }
  // режим боя в подземелье — если активен, основная сцена показывает шеренгу подземелья
  dungeonRun: null,           // { chapterId, stage, lineup: [...], targetIdx, prevWorldEnemies, prevTargetIdx }

  // почта
  mail: [],                   // [{ id, title, body, gold, gems, shards, ts, claimed }]

  // артефакты
  artifactShards: 0,          // ресурс для прокачки артефактов
  artifactLevels: {},         // { [id]: level (>=1 если открыт) }

  // настройки
  settings: {
    sound: true,
    music: true,
    fxLevel: 'high',          // low | high
    haptics: true,
    notifications: true,
    autoUlt: false,           // авто-каст ультов героев
  },

  // профиль и статистика
  profile: {
    nickname: '',
    avatar: 'melee',          // ключ роли героя для портрета
    createdAt: 0,
    telegram: null,           // данные Telegram Mini App: { id, firstName, lastName, username, photoUrl }
  },
  stats: {
    enemiesKilled: 0,
    bossesKilled: 0,
    tapsCount: 0,
    superCount: 0,
    chestsOpened: 0,
    raidsCompleted: 0,
    dungeonsCleared: 0,
    goldEarnedTotal: 0,
    promosUsed: [],            // [code]
  },

  // бусты магазина
  boosts: {
    dmgBoostUntil: 0,         // timestamp — х2 урон до ...
    goldBoostUntil: 0,        // timestamp — х2 золото до ...
    speedBoostUntil: 0,       // timestamp — ускорение боя до ...
    speedBoostMult: 2,        // множитель скорости (по умолчанию x2)
    active: {},               // индивидуальные таймеры по id буста: { [boostId]: untilTs }
  },

  // dps трекинг
  dpsWindow: [],

  // ультимейты
  heroCooldowns: {},          // { [heroId]: timestamp до } 
  partyDmgBoostUntil: 0,      // мульт x2 урона отряда до timestamp

  // время последнего сохранения для оффлайн-награды
  savedAt: 0,

  // активная сессия: копит только пока окно фокусно
  activitySessionMs: 0,
  activitySessionAwarded: 0,   // сколько 30-минуток уже выдали в этой сессии

  // престиж и таланты
  souls: 0,                    // душевные камни (валюта вечной прокачки)
  prestigeCount: 0,            // сколько раз уже реинкарнировал
  soulPrisms: 0,               // призмы душ — мета над душами (после 3 престижей)
  soulPrismLevels: {},         // уровни мета-апгрейдов { dmg, gold, crit, rage }
  talentPoints: 0,             // нераспределённые очки талантов
  talentEarned: 0,             // сколько очков талантов всего получено
  talents: {},                 // { [branchId]: { [nodeId]: level } }

  // башня — бесконечный режим
  tower: {
    floor: 1,                  // текущий этаж попытки
    bestFloor: 0,              // лучший этаж за всё время
    bestThisWeek: 0,           // лучший на неделе (для лидерборда)
    weekKey: '',               // когда последний раз обновляли неделю
    powerShards: 0,            // частицы силы — мета-валюта башни
    checkpoint: 1,             // куда откатиться при поражении
    run: null,                 // активная попытка: { floor, startedAt, prevWorldEnemies, partyHp, lastAtkAt }
  },

  // звёзды славы — новая мета-валюта (Boss Rush, экспедиции)
  gloryStars: 0,

  // активный Boss Rush
  bossRushActive: null,        // { startedAt, endsAt, killed, prevWorldEnemies }
  bossRushCooldown: 0,         // timestamp до

  // эскалация рейдов: { [raidId]: stacks }, каждый стак +5% HP/DPS требований и +5% наград
  raidEscalation: {},

  // активные экспедиции: { [expId]: { startedAt, endsAt, heroes: [id...] } }
  expeditions: {},

  // сюжет
  storySeen: [],               // id показанных кадров

  // календарь логинов
  loginCalendar: {
    streak: 0,                 // сколько дней подряд
    lastClaimedDate: null,     // 'YYYY-MM-DD' последнего забранного дня
    claimedDays: [],           // [day...] какие дни уже забраны
  },

  // ===== Событие «Фестиваль Звездопада» (7 дней) =====
  // cycle — номер 7-дневного окна, к которому относится прогресс.
  //         При смене окна прогресс сбрасывается (новый фестиваль).
  // tokens — текущий баланс звёздной пыли (валюта события).
  // totalTokens — сколько пыли собрано за цикл (для трека наград).
  // claimedMilestones — индексы забранных порогов трека.
  // jump — состояние мини-игры прыжков: { dayKey, attemptsUsed, best }.
  // slot — состояние автомата: { dayKey, freeUsed }.
  event: {
    cycle: null,
    tokens: 0,
    totalTokens: 0,
    claimedMilestones: [],
    jump: { dayKey: '', attemptsUsed: 0, best: 0 },
    slot: { dayKey: '', freeUsed: 0 },
  },
}

function freshLineup(stage, wave, ng = 0) {
  return buildWaveLineup(stage, wave, ng)
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveState(state) {
  const subset = {
    gold: state.gold,
    gems: state.gems,
    ore: state.ore,
    mats: state.mats,
    stage: state.stage,
    maxStage: state.maxStage,
    wave: state.wave,
    tapLevel: state.tapLevel,
    passiveLevel: state.passiveLevel,
    weaponTier: state.weaponTier,
    weaponSharp: state.weaponSharp,
    weaponRunes: state.weaponRunes,
    unlockedHeroes: state.unlockedHeroes,
    heroLevels: state.heroLevels,
    heroStars: state.heroStars,
    heroShards: state.heroShards,
    heroAwake: state.heroAwake,
    heroMastery: state.heroMastery,
    gearBag: state.gearBag,
    gearEquipped: state.gearEquipped,
    bp: state.bp,
    eventBoss: state.eventBoss,
    codexKills: state.codexKills,
    codexKinds: state.codexKinds,
    cityLevels: state.cityLevels,
    pets: state.pets,
    petEggs: state.petEggs,
    activePet: state.activePet,
    party: state.party,
    raidCooldowns: state.raidCooldowns,
    dungeonChapterClears: state.dungeonChapterClears,
    mail: state.mail,
    artifactShards: state.artifactShards,
    artifactLevels: state.artifactLevels,
    settings: state.settings,
    profile: state.profile,
    stats: state.stats,
    boosts: state.boosts,
    loginCalendar: state.loginCalendar,
    souls: state.souls,
    prestigeCount: state.prestigeCount,
    talentPoints: state.talentPoints,
    talentEarned: state.talentEarned,
    talents: state.talents,
    storySeen: state.storySeen,
    tower: state.tower,
    ngLevel: state.ngLevel,
    soulPrisms: state.soulPrisms,
    soulPrismLevels: state.soulPrismLevels,
    artifactConstellations: state.artifactConstellations,
    gloryStars: state.gloryStars,
    bossRushCooldown: state.bossRushCooldown,
    raidEscalation: state.raidEscalation,
    expeditions: state.expeditions,
    event: state.event,
    savedAt: Date.now(),
  }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(subset)) } catch {}
  scheduleCloudPush(subset)
}

// ---- Облачная синхронизация (опционально, после входа через Telegram) ----
// Чтобы не дёргать сеть на каждое действие, отправляем сейв с задержкой.
let cloudPushTimer = null
let cloudPushFn = null
// Регистрируется из App после загрузки модуля cloud, чтобы стор не зависел
// напрямую от сетевого слоя (и сборка не тянула fetch в нативный билд зря).
export function registerCloudPush(fn) { cloudPushFn = fn }
function scheduleCloudPush(subset) {
  if (!cloudPushFn) return
  if (cloudPushTimer) clearTimeout(cloudPushTimer)
  cloudPushTimer = setTimeout(() => {
    cloudPushTimer = null
    try { cloudPushFn(subset, subset.savedAt) } catch {}
  }, 4000)
}

export const useGameStore = create((set, get) => {
  const saved = loadSave()
  const initStage = saved?.stage ?? 1
  const initWave = saved?.wave ?? 1

  const initial = {
    ...DEFAULT_STATE,
    ...(saved || {}),
    enemies: freshLineup(initStage, initWave, saved?.ngLevel || 0),
    targetIdx: 0,
    raidActive: null,
    dungeonRun: null,
    rage: 0,
    superActive: false,
    superEndsAt: 0,
    dpsWindow: [],
  }
  // совместимость со старыми сейвами без maxStage
  if (!initial.maxStage || initial.maxStage < initial.stage) {
    initial.maxStage = initial.stage
  }
  // профиль/статы — мягкая миграция
  if (!initial.profile || typeof initial.profile !== 'object') {
    initial.profile = { nickname: '', avatar: 'melee', createdAt: Date.now(), telegram: null }
  } else {
    if (!initial.profile.createdAt) {
      initial.profile = { ...initial.profile, createdAt: Date.now() }
    }
    if (typeof initial.profile.telegram === 'undefined') {
      initial.profile = { ...initial.profile, telegram: null }
    }
  }
  // бусты — гарантируем наличие индивидуальных таймеров (active)
  if (!initial.boosts || typeof initial.boosts !== 'object') {
    initial.boosts = { dmgBoostUntil: 0, goldBoostUntil: 0, speedBoostUntil: 0, speedBoostMult: 2, active: {} }
  } else if (!initial.boosts.active || typeof initial.boosts.active !== 'object') {
    initial.boosts = { ...initial.boosts, active: {} }
  }
  if (!initial.stats || typeof initial.stats !== 'object') {
    initial.stats = {
      enemiesKilled: 0, bossesKilled: 0, tapsCount: 0, superCount: 0,
      chestsOpened: 0, raidsCompleted: 0, dungeonsCleared: 0, goldEarnedTotal: 0,
      promosUsed: [],
    }
  } else if (!Array.isArray(initial.stats.promosUsed)) {
    initial.stats.promosUsed = []
  }
  if (!initial.loginCalendar || typeof initial.loginCalendar !== 'object') {
    initial.loginCalendar = { streak: 0, lastClaimedDate: null, claimedDays: [] }
  }
  if (!Array.isArray(initial.loginCalendar.claimedDays)) initial.loginCalendar.claimedDays = []
  // мат. ресурсы — добавим недостающие новые ключи
  initial.mats = {
    dragon: 0, lich: 0, golem: 0,
    titan: 0, hydra: 0, archon: 0, demon: 0, phoenix: 0, warden: 0,
    ...(initial.mats || {}),
  }
  // престиж/таланты — миграция
  if (typeof initial.souls !== 'number') initial.souls = 0
  if (typeof initial.prestigeCount !== 'number') initial.prestigeCount = 0
  if (typeof initial.talentPoints !== 'number') initial.talentPoints = 0
  if (typeof initial.talentEarned !== 'number') initial.talentEarned = 0
  if (!initial.talents || typeof initial.talents !== 'object') initial.talents = {}
  if (!Array.isArray(initial.storySeen)) initial.storySeen = []

  // settings — миграция дефолтов для новых ключей
  initial.settings = {
    sound: true, music: true, fxLevel: 'high', haptics: true, notifications: true, autoUlt: false,
    ...(initial.settings || {}),
  }

  // прогрессия — миграция
  if (!initial.heroStars  || typeof initial.heroStars  !== 'object') initial.heroStars  = {}
  if (!initial.heroShards || typeof initial.heroShards !== 'object') initial.heroShards = {}
  if (!initial.heroAwake  || typeof initial.heroAwake  !== 'object') initial.heroAwake  = {}
  if (typeof initial.ngLevel !== 'number') initial.ngLevel = 0
  if (typeof initial.soulPrisms !== 'number') initial.soulPrisms = 0
  if (!initial.soulPrismLevels || typeof initial.soulPrismLevels !== 'object') initial.soulPrismLevels = {}
  if (!initial.artifactConstellations || typeof initial.artifactConstellations !== 'object') initial.artifactConstellations = {}
  if (typeof initial.gloryStars !== 'number') initial.gloryStars = 0
  if (typeof initial.bossRushCooldown !== 'number') initial.bossRushCooldown = 0
  if (!initial.raidEscalation || typeof initial.raidEscalation !== 'object') initial.raidEscalation = {}
  if (!initial.expeditions || typeof initial.expeditions !== 'object') initial.expeditions = {}

  // событие «Фестиваль Звездопада» — миграция + сброс при смене окна
  if (!initial.event || typeof initial.event !== 'object') {
    initial.event = {
      cycle: null, tokens: 0, totalTokens: 0, claimedMilestones: [],
      jump: { dayKey: '', attemptsUsed: 0, best: 0 },
      slot: { dayKey: '', freeUsed: 0 },
    }
  } else {
    initial.event = {
      cycle: null, tokens: 0, totalTokens: 0, claimedMilestones: [],
      jump: { dayKey: '', attemptsUsed: 0, best: 0 },
      slot: { dayKey: '', freeUsed: 0 },
      ...initial.event,
    }
    if (!initial.event.jump || typeof initial.event.jump !== 'object') {
      initial.event.jump = { dayKey: '', attemptsUsed: 0, best: 0 }
    }
    if (!initial.event.slot || typeof initial.event.slot !== 'object') {
      initial.event.slot = { dayKey: '', freeUsed: 0 }
    }
    if (!Array.isArray(initial.event.claimedMilestones)) initial.event.claimedMilestones = []
  }
  {
    const win = eventWindow(Date.now())
    if (initial.event.cycle !== win.cycle) {
      // новый фестиваль — сбрасываем прогресс цикла
      initial.event = {
        cycle: win.cycle, tokens: 0, totalTokens: 0, claimedMilestones: [],
        jump: { dayKey: '', attemptsUsed: 0, best: initial.event?.jump?.best || 0 },
        slot: { dayKey: '', freeUsed: 0 },
      }
    }
  }
  // Активный bossRush не сохраняем — после рестарта обнуляется.
  initial.bossRushActive = null

  // башня — миграция
  if (!initial.tower || typeof initial.tower !== 'object') {
    initial.tower = { floor: 1, bestFloor: 0, bestThisWeek: 0, weekKey: '', powerShards: 0, checkpoint: 1, run: null }
  } else {
    initial.tower = {
      floor: 1, bestFloor: 0, bestThisWeek: 0, weekKey: '', powerShards: 0, checkpoint: 1, run: null,
      ...initial.tower,
    }
    // Сброс попытки — её не сохраняем активной между запусками,
    // чтобы не путать игрока (можно зайти и стартовать заново с чек-поинта).
    initial.tower.run = null
  }
  // Еженедельный сброс bestThisWeek по понедельнику.
  const wk = weekKey()
  if (initial.tower.weekKey !== wk) {
    initial.tower.bestThisWeek = 0
    initial.tower.weekKey = wk
  }

  // Стартовое письмо — только при чистом запуске.
  if (!saved) {
    initial.mail = [{
      id: 'welcome',
      title: 'Добро пожаловать!',
      body: 'Мы рады видеть вас в Blade of Fate. Прими первый подарок и в путь.',
      gold: 100, gems: 1, shards: 1,
      ts: Date.now(),
      claimed: false,
    }]
  }

  return {
    ...initial,

    // ===== вычисляемые геттеры =====
    getBonuses() {
      const heroes = calcHeroBonuses(get().unlockedHeroes)
      const artBonus = get().getArtifactBonuses()
      const tal = talentBonuses(get().talents || {})
      const souls = get().souls || 0
      const syn = get().getSynergyBonuses()
      const prism = get().getSoulPrismBonuses()
      // gear: глобальные эффекты (gold/hp) суммируем по всему отряду,
      // индивидуальные (dmg/speed/crit/rage) применяются адресно в getHeroAtk/tickParty
      const partyGear = get().getPartyGearBonuses()
      // Codex: пассивы за изучение врагов
      const codex = getCodexBonuses(get().codexKills || {}, get().codexKinds || {})
      // Город: метапассивы
      const city = getCityBonuses(get().cityLevels || {})
      // Питомец: бонусы активного спутника
      const petInst = get().activePet ? { id: get().activePet, level: get().pets?.[get().activePet]?.level || 1 } : null
      const pet = getActivePetBonuses(petInst)
      // Каждые 10 душевных камней — +1% к урону, золоту, оффлайну.
      const soulsBonus = souls * 0.001
      // Башенный модификатор noHeal — обнуляет HP бонусы.
      const tw = get().tower
      const towerMods = tw?.run ? modifiersAt(tw.floor) : []
      const hpScale = towerMods.includes('noHeal') ? 0 : 1
      // Soft cap: после 200% доп. бонусы идут логарифмически.
      // Это убирает ломку баланса и оставляет смысл качать дальше.
      const softCap = (v) => {
        if (v <= 2) return v
        return 2 + Math.log10(1 + (v - 2)) * 1.0
      }
      return {
        dmg:  softCap(heroes.dmg  + (artBonus.dmg  || 0) + (tal.dmg  || 0) + soulsBonus + (prism.dmg  || 0) + (codex.dmg || 0) + (city.dmg || 0) + (pet.dmg || 0)),
        hp:   (heroes.hp   + (artBonus.hp   || 0) + (partyGear.hp || 0) + (codex.hp || 0) + (pet.hp || 0)) * hpScale,
        gold: softCap(heroes.gold + (artBonus.gold || 0) + (tal.gold || 0) + soulsBonus + (syn.gold || 0) + (prism.gold || 0) + (partyGear.gold || 0) + (codex.gold || 0) + (city.gold || 0) + (pet.gold || 0)),
        crit: heroes.crit + (artBonus.crit || 0) + (tal.crit || 0) + (prism.crit || 0) + (pet.crit || 0),
        rage: heroes.rage + (artBonus.rage || 0) + (tal.rage || 0) + (prism.rage || 0) + (pet.rage || 0),
        // дополнительные «специфические» — для UI
        ore:    (tal.ore || 0) + (codex.ore || 0),
        weapon: (tal.weapon || 0),
        offline:(tal.offline || 0) + soulsBonus + (city.offline || 0),
      }
    },

    // Бонусы синергий состава — отдельный геттер, чтобы UI мог показать список.
    getSynergyBonuses() {
      const s = get()
      const heroes = (s.party || []).map(id => getHero(id)).filter(Boolean)
      return calcSynergies(heroes)
    },

    // Текущий шанс крита для тапа: базовый (из бонусов) + средний от звёзд
    // героев в отряде.
    getCritChance() {
      const s = get()
      let stars = 0
      let count = 0
      for (const id of s.party || []) {
        stars += s.heroStars?.[id] || 0
        count += 1
      }
      const avgStarCrit = count ? starCritBonus(stars / count) : 0
      return Math.max(0, Math.min(0.95, (s.getBonuses().crit || 0) + avgStarCrit))
    },

    getArtifactBonuses() {
      const lv = get().artifactLevels || {}
      const acc = { dmg: 0, hp: 0, gold: 0, crit: 0, rage: 0 }
      for (const a of ARTIFACTS) {
        const level = lv[a.id] || 0
        if (level <= 0) continue
        const v = artifactBonus(a, level)
        if (a.stat === 'all') {
          acc.dmg += v; acc.hp += v; acc.gold += v; acc.crit += v; acc.rage += v
        } else {
          acc[a.stat] += v
        }
      }
      return acc
    },

    // Урон одного героя за удар.
    // эффективный множитель оружия с учётом заточки и руны
    getWeaponMult(tier = null) {
      const s = get()
      const t = tier == null ? s.weaponTier : tier
      const w = getWeapon(t)
      const sharp = (s.weaponSharp?.[t] || 0)
      const sharpMult = 1 + sharp * 0.1   // +10% за заточку
      // эффект руны: пока — равномерный +5% к множителю
      const rune = (s.weaponRunes?.[t] || null)
      const runeMult = rune ? 1.05 : 1
      const tal = talentBonuses(s.talents || {})
      const wMult = 1 + (tal.weapon || 0)
      return w.dmgMult * sharpMult * runeMult * wMult
    },

    getHeroAtk(heroId) {
      const s = get()
      const hero = getHero(heroId)
      if (!hero) return 0
      const lvl = s.heroLevels[heroId] || 1
      const stars = s.heroStars?.[heroId] || 0
      const awakePath = s.heroAwake?.[heroId] || null
      const awake = awakeningBonuses(hero.role, awakePath)
      const synergy = s.getSynergyBonuses()
      const weapon = getWeapon(s.weaponTier)
      const bonuses = s.getBonuses()
      const stageMult = 1 + (s.stage - 1) * 0.05
      // Mastery: +0.5% урон за уровень мастерства, индивидуально герою
      const mLvl = s.heroMastery?.[heroId]?.level || 0
      const masteryDmg = 1 + mLvl * 0.005
      // Шмот героя: индивидуальный множитель урона
      const heroGear = s.getHeroGearBonuses(heroId)
      const gearDmg = 1 + (heroGear.dmg || 0)
      const dmg =
        hero.atk *
        (RARITY_POWER[hero.rarity] || 1) *
        heroLevelMult(lvl, hero.rarity) *
        starAtkMult(stars) *
        (1 + (awake.atk || 0)) *
        (1 + (synergy.partyDmg || 0)) *
        (1 + bonuses.dmg) *
        (0.6 + 0.4 * s.getWeaponMult() / 1) *
        stageMult *
        masteryDmg *
        gearDmg
      const superMult = s.superActive ? 2.5 : 1
      const boost = activeBoostMult(s.boosts, 'dmg')
      const partyBoost = s.partyDmgBoostUntil > Date.now() ? 2 : 1
      return Math.max(1, Math.round(dmg * superMult * boost * partyBoost))
    },

    getTapDamage() {
      const s = get()
      const base = s.baseDmg + (s.tapLevel - 1) * 1.6
      const heroDmg = 1 + s.getBonuses().dmg
      const tapBonus = 1 + (talentBonuses(s.talents || {}).tap || 0)
      const dmg = base * s.getWeaponMult() * heroDmg * tapBonus
      const superMult = s.superActive ? 5 : 1
      const boost = activeBoostMult(s.boosts, 'dmg')
      return Math.max(1, Math.round(dmg * superMult * boost))
    },

    // DPS активного отряда (без тапов и пассивки) — используется для рейдов.
    getPartyDps() {
      const s = get()
      let dps = 0
      const speedBoost = s.boosts?.speedBoostUntil > Date.now()
        ? (s.boosts?.speedBoostMult || 2)
        : 1
      for (const id of s.party) {
        const h = getHero(id)
        if (!h) continue
        dps += s.getHeroAtk(id) * h.speed * speedBoost
      }
      return Math.round(dps)
    },

    getPassiveDps() {
      const s = get()
      const weapon = getWeapon(s.weaponTier)
      const heroDmg = 1 + s.getBonuses().dmg
      const tap = s.baseDmg + (s.tapLevel - 1) * 1.6
      const speedBoost = s.boosts?.speedBoostUntil > Date.now()
        ? (s.boosts?.speedBoostMult || 2)
        : 1
      return Math.round(tap * weapon.dmgMult * heroDmg * 0.3 * s.passiveLevel * speedBoost)
    },

    getCurrentDps() {
      // мгновенный DPS = окно последних 3 сек тапов + пассивка + DPS отряда
      const now = performance.now()
      const win = get().dpsWindow.filter(d => now - d.t < 3000)
      const sum = win.reduce((a, b) => a + b.dmg, 0)
      return Math.round(sum / 3) + get().getPassiveDps() + get().getPartyDps()
    },

    getZoneName() {
      const s = get()
      const idx = (s.stage - 1) % ZONES.length
      return `Зона ${s.stage} — ${ZONES[idx]}`
    },

    // Совместимость со старым кодом, использовавшим s.enemy.
    getCurrentTarget() {
      const s = get()
      return s.enemies[s.targetIdx] || null
    },

    // ===== действия =====
    tapAttack() {
      const s = get()
      const target = s.enemies[s.targetIdx]
      if (!target) return
      const dmg = s.getTapDamage()
      const tapElement = RUNE_TO_ELEMENT[s.weaponRunes?.[s.weaponTier]] || null
      // Хаптика: шанс крита берём из бонусов + средние звёзды партии
      const isCrit = Math.random() < s.getCritChance()
      get()._applyDamage(dmg * (isCrit ? 2 : 1), true, { element: tapElement, role: 'tap', allowsStatus: true })
      const bonus = 1 + s.getBonuses().rage
      const rage = Math.min(100, s.rage + 1.4 * bonus)
      set({ rage })
      get()._bumpStat('tapsCount', 1)
      audio.sfxTap()
      // Хаптический отклик (на native — реальный, на web — no-op)
      if (target.isBoss) impact('heavy')
      else if (isCrit)   impact('medium')
      else               impact('light')
    },

    setTarget(idx) {
      const s = get()
      if (idx < 0 || idx >= s.enemies.length) return
      set({ targetIdx: idx })
    },

    // Перейти к указанной зоне/волне (без сброса прогресса). Полезно для перехода
    // на пройденные зоны, чтобы добывать золото или ловить материалы.
    jumpToZone(zoneId, waveId = 1) {
      const s = get()
      if (s.dungeonRun) return false
      if (s.tower?.run) return false
      if (zoneId < 1) zoneId = 1
      const cap = Math.max(s.stage, s.maxStage || s.stage)
      if (zoneId > cap) return false
      const w = Math.max(1, Math.min(10, waveId | 0))
      set({
        stage: zoneId,
        wave: w,
        enemies: freshLineup(zoneId, w, s.ngLevel || 0),
        targetIdx: 0,
      })
      saveState(get())
      return true
    },

    // dmg — урон, fromTap — попал ли в трекер DPS
    // meta: { element, role, allowsStatus, skipPhases }
    _applyDamage(dmg, fromTap = false, meta = null) {
      const s = get()
      let enemies = s.enemies
      if (!enemies.length) return
      let idx = s.targetIdx
      if (idx >= enemies.length) idx = enemies.length - 1
      const target = enemies[idx]
      if (!target) return

      // ---- Боссовая блокировка по роли (временная) ----
      if (target.isBoss && target.roleLock && (target.roleLockUntil || 0) > Date.now()
          && meta?.role && meta.role !== target.roleLock) {
        // Урон полностью поглощён, фиксируем "0" и выходим
        return
      }

      // ---- Башенные модификаторы (magesOnly / rangedOnly) ----
      if (s.tower?.run && meta?.role && meta.role !== 'tap' && meta.role !== 'passive') {
        const mods = modifiersAt(s.tower.floor)
        if (mods.includes('magesOnly')   && meta.role !== 'mage')   return
        if (mods.includes('rangedOnly')  && meta.role !== 'ranged') return
      }

      // ---- Расчёт фактического урона ----
      let final = dmg
      // стихии
      if (meta?.element && target.element) {
        final *= elementMultiplier(meta.element, target.element)
      }
      // щит
      if (target.isBoss && target.shield > 0) {
        final *= 0.45
      }
      // входящий мульт от статусов
      final *= incomingMultFor(target.statuses)

      final = Math.max(1, Math.round(final))

      // ---- Применяем статус, если положено ----
      let newStatuses = target.statuses || {}
      if (meta?.allowsStatus && meta?.element) {
        const rule = ELEMENT_STATUS[meta.element]
        if (rule && Math.random() < rule.chance) {
          newStatuses = applyStatus(newStatuses, rule.id)
        }
      }

      const hp = target.hp - final
      let updated = enemies.map((e, i) =>
        i === idx ? { ...e, hp, statuses: newStatuses } : e
      )

      // ---- Триггерим следующую фазу босса при пересечении thresholds ----
      if (target.isBoss && !meta?.skipPhases && hp > 0) {
        const pct = hp / target.maxHp
        const phases = target.phases || []
        const active = new Set(target.phasesActive || [])
        let bossUpdate = { ...updated[idx] }
        let bossChanged = false
        for (let pi = 0; pi < phases.length; pi++) {
          if (active.has(pi)) continue
          const ph = phases[pi]
          if (pct <= ph.atPct) {
            active.add(pi)
            bossChanged = true
            if (ph.type === 'shield') {
              bossUpdate.shield = (bossUpdate.shield || 0) + 1
            } else if (ph.type === 'enrage') {
              bossUpdate.enrage = true
            } else if (ph.type === 'roleLock') {
              bossUpdate.roleLock = ph.role
              // Блокировка по роли теперь ВРЕМЕННАЯ: висит ~8 секунд и спадает,
              // чтобы не превращаться в вечный «блок» до конца боя.
              bossUpdate.roleLockUntil = Date.now() + 8000
            }
            // adds докинем в шеренгу после босса
            if (ph.type === 'summonAdds') {
              const adds = []
              for (let k = 0; k < (ph.count || 1); k++) {
                const tpl = pickCommonForBoss(s.stage, s.wave, k + (target.phasesActive?.length || 0))
                const maxHp = Math.max(50, Math.round(target.maxHp * 0.05))
                adds.push({
                  ...tpl,
                  uid: `add_${target.uid}_${pi}_${k}`,
                  hp: maxHp,
                  maxHp,
                  reward: Math.max(1, Math.round(target.reward * 0.05)),
                  statuses: {},
                })
              }
              updated = [...updated.slice(0, idx + 1), ...adds, ...updated.slice(idx + 1)]
            }
            get()._toast?.(ph.message)
          }
        }
        if (bossChanged) {
          bossUpdate.phasesActive = Array.from(active)
          // снимаем щит при активации следующей фазы (любой)
          updated[idx] = bossUpdate
        }
      }

      const win = fromTap
        ? [...s.dpsWindow.filter(d => performance.now() - d.t < 3000), { t: performance.now(), dmg: final }]
        : s.dpsWindow

      // ---- Шок-цепочка ----
      if (newStatuses?.shock && updated.length > 1) {
        const chain = STATUSES.shock.chainPct
        const otherIdx = updated.findIndex((e, i) => i !== idx && e.hp > 0)
        if (otherIdx >= 0) {
          const splash = Math.max(1, Math.round(final * chain))
          updated = updated.map((e, i) => i === otherIdx ? { ...e, hp: e.hp - splash } : e)
        }
      }

      if (updated[idx].hp <= 0) {
        get()._enemyKilled(updated, idx, target, win)
      } else {
        set({ enemies: updated, dpsWindow: win })
      }
    },

    _enemyKilled(updated, idx, target, win) {
      const s = get()
      // Codex: считаем убийства по sprite-ключу врага
      if (target?.sprite) {
        const sprite = target.sprite
        const kind = target.isBoss ? 'boss' : 'common'
        const kills = { ...(s.codexKills || {}) }
        const kinds = { ...(s.codexKinds || {}) }
        const prev = kills[sprite] || 0
        kills[sprite] = prev + 1
        kinds[sprite] = kind
        // Уведомляем при пересечении порога изучения
        const beforeTier = (function() {
          if (prev >= 500) return 'mastered'
          if (prev >= 100) return 'studied'
          if (prev >= 25)  return 'briefing'
          if (prev >= 1)   return 'discovered'
          return null
        })()
        const afterTier = (function() {
          const k = kills[sprite]
          if (k >= 500) return 'mastered'
          if (k >= 100) return 'studied'
          if (k >= 25)  return 'briefing'
          if (k >= 1)   return 'discovered'
          return null
        })()
        if (beforeTier !== afterTier) {
          if (afterTier === 'studied' || afterTier === 'mastered') {
            get()._toast?.(`Codex: ${target.name} — ${afterTier === 'mastered' ? 'Мастер' : 'Изучен'}`)
          }
        }
        set({ codexKills: kills, codexKinds: kinds })
      }
      const goldBoost = activeBoostMult(s.boosts, 'gold')
      const goldGain = Math.ceil(target.reward * (1 + s.getBonuses().gold) * goldBoost)
      const remain = updated.filter((e) => e.hp > 0)
      const gemGain = target.isBoss ? 1 : 0

      // статистика убийств
      get()._bumpStat('enemiesKilled', 1)
      if (target.isBoss) get()._bumpStat('bossesKilled', 1)
      get()._bumpGoldEarned(goldGain)

      // ----- Режим Boss Rush -----
      if (s.bossRushActive) {
        if (remain.length === 0) {
          set({ enemies: updated, dpsWindow: win })
          get()._bossRushAdvance()
          return
        } else {
          set({ enemies: updated, dpsWindow: win })
          return
        }
      }

      // ----- Режим башни -----
      if (s.tower?.run) {
        // В башне всегда один враг. Если он мёртв — этаж пройден.
        if (remain.length === 0) {
          // Сначала зачислим золото за этаж и переключим на следующий
          set({ enemies: updated, dpsWindow: win })
          get()._towerFloorCleared(target)
          return
        } else {
          set({ enemies: updated, dpsWindow: win })
          return
        }
      }

      // ----- Режим подземелья -----
      if (s.dungeonRun) {
        // Стадия завершена?
        if (remain.length === 0) {
          const ch = getChapter(s.dungeonRun.chapterId)
          const stage = s.dungeonRun.stage

          // Маленькая награда за стадию (золото + руда)
          const stageGold = Math.ceil(target.reward * 1.2 * (1 + s.getBonuses().gold) * goldBoost)
          const oreMult  = 1 + (s.getBonuses().ore || 0)
          const stageOre  = Math.max(1, Math.floor(stage * 1.2 * oreMult))
          let next = {
            gold: s.gold + goldGain + stageGold,
            gems: s.gems + gemGain,
            ore: (s.ore || 0) + stageOre,
            dpsWindow: win,
          }

          // Обновим прогресс главы
          const cur = s.dungeonChapterClears[s.dungeonRun.chapterId] || { stage: 0, completed: false }
          const newCur = { ...cur, stage: Math.max(cur.stage, stage) }

          if (stage === STAGES_PER_CHAPTER) {
            // Глава пройдена! Большая награда.
            const reward = {
              gold: ch.rewardGold,
              ore: ch.rewardOre,
              shards: ch.rewardShards,
              gems: ch.rewardGems,
            }
            next.gold += reward.gold
            next.ore  += reward.ore
            next.gems += reward.gems
            next.artifactShards = (s.artifactShards || 0) + reward.shards
            newCur.completed = true

            const restore = s.dungeonRun.prevWorldEnemies && s.dungeonRun.prevWorldEnemies.length
              ? s.dungeonRun.prevWorldEnemies
              : freshLineup(s.stage, s.wave)

            next.enemies = restore
            next.targetIdx = 0
            next.dungeonRun = null
            next.dungeonChapterClears = { ...s.dungeonChapterClears, [s.dungeonRun.chapterId]: newCur }
            // флаг для UI — показать reward модалку
            next._lastChapterReward = { chapterId: ch.id, ...reward, name: ch.name }
            set(next)
            get()._toast?.(`Глава "${ch.name}" пройдена!`)
            // Дроп gear: чем дальше глава — тем выше шанс эпика/легендарки
            const id = ch.id
            const rr = Math.random()
            const rarity = id >= 6 && rr < 0.15
              ? 'legendary'
              : id >= 4 && rr < 0.40
              ? 'epic'
              : 'rare'
            get()._dropGear({ rarity })
            get()._bumpStat('dungeonsCleared', 1)
            get().addBpXp(250)
            get()._bumpGoldEarned(reward.gold || 0)
            saveState(get())
          } else {
            // Следующая стадия
            const nextStage = stage + 1
            const lineup = buildDungeonLineup(s.dungeonRun.chapterId, nextStage)
            next.dungeonRun = { ...s.dungeonRun, stage: nextStage }
            next.enemies = lineup
            next.targetIdx = 0
            next.dungeonChapterClears = { ...s.dungeonChapterClears, [s.dungeonRun.chapterId]: newCur }
            set(next)
            saveState(get())
          }
          return
        } else {
          // Враг пал, но стадия продолжается
          let newIdx = idx
          const aliveIdx = updated.findIndex(e => e.hp > 0)
          newIdx = aliveIdx === -1 ? 0 : aliveIdx
          set({
            gold: s.gold + goldGain,
            enemies: updated,
            targetIdx: newIdx,
            dpsWindow: win,
          })
          return
        }
      }

      // ----- Обычный мир -----
      if (remain.length === 0) {
        let nextWave = s.wave + 1
        let nextStage = s.stage
        let nextNg = s.ngLevel || 0
        let ngBumped = false
        if (nextWave > 10) { nextWave = 1; nextStage += 1 }
        // NG+: после зоны 20 → виток повышается, возвращаемся к зоне 1
        if (nextStage > 20) {
          nextStage = 1
          nextNg += 1
          ngBumped = true
        }
        const nextMax = Math.max(s.maxStage || s.stage, nextStage)
        // если открыта новая зона — даём очки талантов (увеличено для более
        // активной прокачки дерева талантов)
        const tpDelta = (nextMax > (s.maxStage || s.stage)) ? 2 : 0
        // дополнительно — за убийство босса даём ещё очки
        const tpBoss = target.isBoss ? 2 : 0
        // За завершение витка — щедрая награда: +10 талантов, +1 души
        const ngTp = ngBumped ? 10 : 0
        const ngSouls = ngBumped ? 1 : 0
        set({
          gold: s.gold + goldGain,
          gems: s.gems + gemGain,
          wave: nextWave,
          stage: nextStage,
          maxStage: nextMax,
          ngLevel: nextNg,
          enemies: freshLineup(nextStage, nextWave, nextNg),
          targetIdx: 0,
          dpsWindow: win,
          talentPoints: (s.talentPoints || 0) + tpDelta + tpBoss + ngTp,
          talentEarned: (s.talentEarned || 0) + tpDelta + tpBoss + ngTp,
          souls: (s.souls || 0) + ngSouls,
        })
        if (target.isBoss) get()._toast?.(`Босс повержен! +${goldGain}🪙 +1💎 +2 очка таланта`)
        if (tpDelta > 0) get()._toast?.('Открыта новая зона! +2 очка таланта')
        if (ngBumped) get()._toast?.(`Виток ${nextNg + 1}! +10 талантов, +1 душа · враги стали сильнее`)
        // Battle Pass XP
        if (target.isBoss) get().addBpXp(200)
        else get().addBpXp(10)
        // Шанс дропа снаряжения с зонального босса
        if (target.isBoss && Math.random() < 0.55) {
          // На поздних зонах — шанс редкого+ шмота
          const stage = s.stage
          const r = Math.random()
          let rarity
          if (stage >= 15 && r < 0.25)      rarity = 'legendary'
          else if (stage >= 10 && r < 0.45) rarity = 'epic'
          else if (stage >= 5 && r < 0.65)  rarity = 'rare'
          else                              rarity = undefined // случайная
          get()._dropGear({ rarity })
        }
        if (target.isBoss) audio.sfxFanfare()
        if (target.isBoss) vibrate(180)
        if (tpDelta > 0 || ngBumped) {
          const theme = audio.getZoneTheme(nextStage)
          audio.startMusic(theme, 1)
        }
        saveState(get())
      } else {
        let newIdx = idx
        const aliveIdx = updated.findIndex(e => e.hp > 0)
        newIdx = aliveIdx === -1 ? 0 : aliveIdx
        set({
          gold: s.gold + goldGain,
          enemies: updated,
          targetIdx: newIdx,
          dpsWindow: win,
        })
      }
    },

    activateSuper() {
      const s = get()
      if (s.rage < 100 || s.superActive) return
      // Серия по текущему таргету.
      const tapElement = RUNE_TO_ELEMENT[s.weaponRunes?.[s.weaponTier]] || null
      for (let i = 0; i < 12; i++) {
        const dmg = Math.round(s.getTapDamage() * 0.9)
        get()._applyDamage(dmg, true, { element: tapElement, role: 'tap', allowsStatus: true })
        if (!get().enemies.length) break
      }
      set({ rage: 0, superActive: true, superEndsAt: performance.now() + 5000 })
      setTimeout(() => set({ superActive: false }), 5000)
      get()._bumpStat('superCount', 1)
      audio.sfxSuper()
      audio.setMusicIntensity(2.4)
      setTimeout(() => audio.setMusicIntensity(1), 5000)
    },

    // Пассивный DPS (старая прокачка).
    tickPassive(dt) {
      const s = get()
      if (!s.enemies.length) return
      const dps = s.getPassiveDps()
      if (dps <= 0) return
      const dmg = Math.max(1, Math.round((dps * dt) / 1000))
      const tapElement = RUNE_TO_ELEMENT[s.weaponRunes?.[s.weaponTier]] || null
      get()._applyDamage(dmg, false, { element: tapElement, role: 'passive' })
    },

    // Авто-бой отряда: каждый герой бьёт со своей скоростью.
    // Внутренние таймеры храним в замыкании, чтобы не плодить state.
    _heroTimers: {},
    tickParty(dt) {
      const s = get()
      if (!s.enemies.length || !s.party.length) return
      const timers = get()._heroTimers
      const partyHp = s.tower?.run?.partyHp || null
      const auto = !!s.settings?.autoUlt
      // Башня: блокировка ультов
      const ultsBlocked = s.tower?.run && modifiersAt(s.tower.floor).includes('noUlts')
      // Башенные баффы
      const towerBuffs = s.tower?.run?.buffs || []
      const buffMods = towerBuffMods(towerBuffs)
      const dmgMult   = 1 + (buffMods.dmg || 0)
      // Скоростной буст из магазина (через "Скорость")
      const speedBoost = s.boosts?.speedBoostUntil > Date.now()
        ? (s.boosts?.speedBoostMult || 2)
        : 1
      const speedMult = (1 + (buffMods.speed || 0)) * speedBoost
      for (const id of s.party) {
        // Если в башне и герой мёртв — пропускаем атаки
        if (partyHp && partyHp[id] && partyHp[id].hp <= 0) continue
        const h = getHero(id)
        if (!h) continue
        // Авто-каст ульта если готов и включена опция
        if (auto && !ultsBlocked && s.isUltReady(id)) {
          get().castUlt(id)
        }
        // Mastery скорости: +0.2% за уровень индивидуально герою
        const mLvl = s.heroMastery?.[id]?.level || 0
        const mSpd = 1 + mLvl * 0.002
        // Скорость от шмота этого героя
        const gSpd = 1 + (s.getHeroGearBonuses(id).speed || 0)
        const period = 1000 / (h.speed * speedMult * mSpd * gSpd)
        const t = (timers[id] || 0) + dt
        if (t >= period) {
          // Несколько ударов за тик при низком FPS, но с потолком в 5.
          const hits = Math.min(5, Math.floor(t / period))
          const left = t - hits * period
          for (let k = 0; k < hits; k++) {
            const dmg = Math.round(s.getHeroAtk(id) * dmgMult)
            get()._applyDamage(dmg, false, { element: h.element, role: h.role, allowsStatus: true })
            if (!get().enemies.length) break
          }
          // Mastery: засчитываем удары, даже если враг умер от первого
          get()._addHeroMasteryHits(id, hits)
          timers[id] = left
        } else {
          timers[id] = t
        }
      }
    },

    // Тик статусов: DOT + истечение. Зовётся в основном game-loop'е.
    // Оптимизация: запускаем не чаще 10 раз/сек и пропускаем, если ни у кого нет статусов.
    _statusAcc: 0,
    tickStatuses(dt) {
      const acc = (get()._statusAcc || 0) + dt
      if (acc < 100) {
        get()._statusAcc = acc
        return
      }
      const realDt = acc
      get()._statusAcc = 0

      const s = get()
      if (!s.enemies.length) return
      // Быстрый выход, если ни у кого нет активных статусов.
      let anyStatus = false
      for (const e of s.enemies) {
        if (e.statuses && Object.keys(e.statuses).length) { anyStatus = true; break }
      }
      if (!anyStatus) return

      const tickSec = realDt / 1000
      const enemies = s.enemies.map(e => {
        if (!e.statuses || !Object.keys(e.statuses).length) return e
        const [pruned] = pruneStatuses(e.statuses)
        let hp = e.hp
        for (const sid of Object.keys(pruned)) {
          const def = STATUSES[sid]
          if (def?.dotPct) {
            hp -= e.maxHp * def.dotPct * tickSec
          }
        }
        return { ...e, hp, statuses: pruned }
      })
      // если кто-то умер от DOT — отдаём в _enemyKilled через цикл
      let curIdx = s.targetIdx
      let cur = enemies[curIdx]
      let arr = enemies
      let win = s.dpsWindow
      let died = false
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].hp <= 0 && (s.enemies[i]?.hp || 0) > 0) {
          died = true
          break
        }
      }
      if (!died) {
        set({ enemies: arr })
        return
      }
      const idxDied = arr.findIndex((e, i) => e.hp <= 0 && (s.enemies[i]?.hp || 0) > 0)
      if (idxDied < 0) {
        set({ enemies: arr })
        return
      }
      const target = s.enemies[idxDied]
      get()._enemyKilled(arr, idxDied, target, win)
    },

    // Ультимейты героев.
    isUltReady(heroId) {
      const cd = get().heroCooldowns?.[heroId] || 0
      return cd <= Date.now()
    },
    ultCooldownLeft(heroId) {
      const cd = get().heroCooldowns?.[heroId] || 0
      return Math.max(0, cd - Date.now())
    },
    castUlt(heroId) {
      const s = get()
      if (!s.party.includes(heroId)) return false
      if (!s.isUltReady(heroId)) return false
      if (!s.enemies.length) return false
      // Башня: модификатор noUlts блокирует ультимейты
      if (s.tower?.run && modifiersAt(s.tower.floor).includes('noUlts')) {
        get()._toast?.('Ульт заблокирован модификатором этажа')
        return false
      }
      const hero = getHero(heroId)
      if (!hero || !hero.ult) return false
      const baseAtk = s.getHeroAtk(heroId)
      // Если герой достиг 6★ — используем улучшенную ульту.
      const stars = s.heroStars?.[heroId] || 0
      const u = (stars >= 6 && getEvolvedUlt(hero.role)) || hero.ult

      // Применим эффекты по типу
      if (u.target === 'focus') {
        const hits = u.hits || 1
        const mult = u.dmgMult || 1
        for (let i = 0; i < hits; i++) {
          const d = Math.max(1, Math.round(baseAtk * mult))
          get()._applyDamage(d, false, { element: hero.element, role: hero.role, allowsStatus: true })
          if (!get().enemies.length) break
        }
      } else if (u.target === 'all') {
        const mult = u.dmgMult || 1
        const dmgPer = Math.max(1, Math.round(baseAtk * mult))
        const updated = get().enemies.map(e => ({ ...e, hp: e.hp - dmgPer }))
        // обработаем по очереди — найдём всех мёртвых
        // Простой путь: записать обновлённые HP, потом каскадно вызывать _enemyKilled.
        // Чтобы не усложнять — отнимем по одному через _applyDamage в цикле.
        for (let i = 0; i < updated.length; i++) {
          if (!get().enemies.length) break
          // Нацелим временно на i, чтобы _applyDamage положил урон именно туда.
          set({ targetIdx: Math.min(i, get().enemies.length - 1) })
          get()._applyDamage(dmgPer, false, { element: hero.element, role: hero.role, allowsStatus: true })
        }
      } else if (u.buffPartyMult) {
        set({
          partyDmgBoostUntil: Date.now() + (u.buffMs || 5000),
          rage: Math.min(100, s.rage + (u.rage || 0)),
        })
      }

      set({
        heroCooldowns: { ...s.heroCooldowns, [heroId]: Date.now() + (u.cd || 20) * 1000 },
      })
      // Не спамим тостами при ультах — особенно при авто-касте.
      audio.sfxUlt()
      audio.setMusicIntensity(2)
      setTimeout(() => audio.setMusicIntensity(1), 4000)
      return true
    },

    // ===== прокачка =====
    upgradeTap() {
      const s = get()
      const cost = s.upgradeTapCost()
      if (s.gold < cost) return false
      set({ gold: s.gold - cost, tapLevel: s.tapLevel + 1 })
      saveState(get())
      audio.sfxLevelUp()
      return true
    },

    // Массовая прокачка тапа: точно n уровней, либо до конца золота если 'max'.
    upgradeTapBulk(count) {
      const s = get()
      let gold = s.gold
      let lvl = s.tapLevel
      let done = 0
      const isMax = count === 'max'
      const lim = isMax ? 100000 : count
      for (let i = 0; i < lim; i++) {
        const cost = Math.floor(20 * Math.pow(1.15, lvl - 1))
        if (gold < cost) break
        gold -= cost
        lvl += 1
        done += 1
      }
      if (done === 0) return 0
      set({ gold, tapLevel: lvl })
      saveState(get())
      audio.sfxLevelUp()
      return done
    },
    // Массовая прокачка тапа: x1/x10/x100 или 'max'.
    upgradeTapBulk(amount = 1) {
      const s = get()
      let bought = 0
      let gold = s.gold
      let lvl = s.tapLevel
      const maxIter = amount === 'max' ? 100000 : amount
      while (bought < maxIter) {
        const cost = Math.floor(20 * Math.pow(1.15, lvl - 1))
        if (gold < cost) break
        gold -= cost
        lvl += 1
        bought += 1
      }
      if (!bought) return 0
      set({ gold, tapLevel: lvl })
      saveState(get())
      audio.sfxLevelUp()
      return bought
    },
    // Стоимость покупки следующих N уровней тапа.
    upgradeTapCostBulk(amount = 1) {
      const s = get()
      let total = 0
      let lvl = s.tapLevel
      const maxIter = amount === 'max' ? 100000 : amount
      let gold = s.gold
      for (let i = 0; i < maxIter; i++) {
        const c = Math.floor(20 * Math.pow(1.15, lvl - 1))
        if (amount === 'max' && total + c > gold) break
        total += c
        lvl += 1
      }
      return total
    },
    upgradeTapCost() {
      const s = get()
      return Math.floor(20 * Math.pow(1.15, s.tapLevel - 1))
    },

    upgradePassive() {
      const s = get()
      const cost = s.upgradePassiveCost()
      if (s.gold < cost) return false
      set({ gold: s.gold - cost, passiveLevel: s.passiveLevel + 1 })
      saveState(get())
      audio.sfxLevelUp()
      return true
    },

    upgradePassiveBulk(count) {
      const s = get()
      let gold = s.gold
      let lvl = s.passiveLevel
      let done = 0
      const isMax = count === 'max'
      const lim = isMax ? 100000 : count
      for (let i = 0; i < lim; i++) {
        const cost = Math.floor(80 * Math.pow(1.18, lvl))
        if (gold < cost) break
        gold -= cost
        lvl += 1
        done += 1
      }
      if (done === 0) return 0
      set({ gold, passiveLevel: lvl })
      saveState(get())
      audio.sfxLevelUp()
      return done
    },
    upgradePassiveBulk(amount = 1) {
      const s = get()
      let bought = 0
      let gold = s.gold
      let lvl = s.passiveLevel
      const maxIter = amount === 'max' ? 100000 : amount
      while (bought < maxIter) {
        const cost = Math.floor(80 * Math.pow(1.18, lvl))
        if (gold < cost) break
        gold -= cost
        lvl += 1
        bought += 1
      }
      if (!bought) return 0
      set({ gold, passiveLevel: lvl })
      saveState(get())
      audio.sfxLevelUp()
      return bought
    },
    upgradePassiveCostBulk(amount = 1) {
      const s = get()
      let total = 0
      let lvl = s.passiveLevel
      const maxIter = amount === 'max' ? 100000 : amount
      let gold = s.gold
      for (let i = 0; i < maxIter; i++) {
        const c = Math.floor(80 * Math.pow(1.18, lvl))
        if (amount === 'max' && total + c > gold) break
        total += c
        lvl += 1
      }
      return total
    },
    upgradePassiveCost() {
      const s = get()
      return Math.floor(80 * Math.pow(1.18, s.passiveLevel))
    },

    evolveWeapon() {
      const s = get()
      const next = WEAPONS[s.weaponTier + 1]
      if (!next) return false
      if (s.gold < next.cost) return false
      set({ gold: s.gold - next.cost, weaponTier: s.weaponTier + 1 })
      saveState(get())
      audio.sfxFanfare()
      return true
    },

    // ===== кузница (заточка/руны) =====
    sharpenCost(tier) {
      const lvl = (get().weaponSharp?.[tier] || 0) + 1
      // простая формула: 20 руды × 1.4^уровень
      return Math.floor(20 * Math.pow(1.4, lvl - 1))
    },
    sharpen(tier) {
      const s = get()
      const cost = s.sharpenCost(tier)
      if ((s.ore || 0) < cost) return false
      const lvl = (s.weaponSharp?.[tier] || 0) + 1
      set({
        ore: s.ore - cost,
        weaponSharp: { ...s.weaponSharp, [tier]: lvl },
      })
      saveState(get())
      audio.sfxLevelUp()
      return true
    },

    setRune(tier, runeId) {
      const s = get()
      const ALLOWED = ['flame', 'frost', 'lightning']
      if (runeId && !ALLOWED.includes(runeId)) return false
      // Стоимость установки/смены: 1 гем + 5 осколков
      if (runeId) {
        if (s.gems < 1 || s.artifactShards < 5) return false
        set({
          gems: s.gems - 1,
          artifactShards: s.artifactShards - 5,
          weaponRunes: { ...s.weaponRunes, [tier]: runeId },
        })
      } else {
        // снять руну — бесплатно
        const next = { ...s.weaponRunes }
        delete next[tier]
        set({ weaponRunes: next })
      }
      saveState(get())
      return true
    },

    // ===== герои =====
    hireHero(heroId) {
      const s = get()
      const hero = getHero(heroId)
      if (!hero) return false
      if (s.unlockedHeroes.includes(heroId)) return false
      if (s.gold < hero.cost) return false
      const unlocked = [...s.unlockedHeroes, heroId]
      const heroLevels = { ...s.heroLevels, [heroId]: 1 }
      // Авто-добавление в отряд, если есть место.
      let party = s.party
      if (party.length < PARTY_SIZE) party = [...party, heroId]
      set({
        gold: s.gold - hero.cost,
        unlockedHeroes: unlocked,
        heroLevels,
        party,
      })
      saveState(get())
      audio.sfxFanfare()
      return true
    },

    upgradeHeroCost(heroId) {
      const s = get()
      const hero = getHero(heroId)
      if (!hero) return Infinity
      const lvl = s.heroLevels[heroId] || 1
      return heroUpgradeCost(hero, lvl)
    },
    upgradeHero(heroId) {
      const s = get()
      if (!s.unlockedHeroes.includes(heroId)) return false
      const cost = s.upgradeHeroCost(heroId)
      if (s.gold < cost) return false
      const lvl = (s.heroLevels[heroId] || 1) + 1
      set({
        gold: s.gold - cost,
        heroLevels: { ...s.heroLevels, [heroId]: lvl },
      })
      saveState(get())
      audio.sfxLevelUp()
      return true
    },
    upgradeHeroBulk(heroId, amount = 1) {
      const s = get()
      const hero = getHero(heroId)
      if (!hero || !s.unlockedHeroes.includes(heroId)) return 0
      let bought = 0
      let gold = s.gold
      let lvl = s.heroLevels[heroId] || 1
      const maxIter = amount === 'max' ? 100000 : amount
      while (bought < maxIter) {
        const cost = heroUpgradeCost(hero, lvl)
        if (gold < cost) break
        gold -= cost
        lvl += 1
        bought += 1
      }
      if (!bought) return 0
      set({
        gold,
        heroLevels: { ...s.heroLevels, [heroId]: lvl },
      })
      saveState(get())
      audio.sfxLevelUp()
      return bought
    },
    upgradeHeroCostBulk(heroId, amount = 1) {
      const s = get()
      const hero = getHero(heroId)
      if (!hero) return 0
      let total = 0
      let lvl = s.heroLevels[heroId] || 1
      const maxIter = amount === 'max' ? 100000 : amount
      const gold = s.gold
      for (let i = 0; i < maxIter; i++) {
        const c = heroUpgradeCost(hero, lvl)
        if (amount === 'max' && total + c > gold) break
        total += c
        lvl += 1
      }
      return total
    },

    toggleParty(heroId) {
      const s = get()
      if (!s.unlockedHeroes.includes(heroId)) return false
      let party = [...s.party]
      const idx = party.indexOf(heroId)
      if (idx >= 0) {
        party.splice(idx, 1)
      } else {
        if (party.length >= PARTY_SIZE) return false
        party.push(heroId)
      }
      set({ party })
      saveState(get())
      return true
    },

    partySize() { return PARTY_SIZE },

    // Покупка premium-героя за гемы. Цена в PREMIUM_GEM_COST.
    buyPremiumHero(heroId) {
      const s = get()
      const hero = getHero(heroId)
      if (!hero || hero.rarity !== 'premium') return false
      if (s.unlockedHeroes.includes(heroId)) return false
      const cost = PREMIUM_GEM_COST[heroId.replace(/_\d+$/, '')] || 1000
      if (s.gems < cost) return false
      const unlocked = [...s.unlockedHeroes, heroId]
      const heroLevels = { ...s.heroLevels, [heroId]: 1 }
      let party = s.party
      if (party.length < PARTY_SIZE) party = [...party, heroId]
      set({
        gems: s.gems - cost,
        unlockedHeroes: unlocked,
        heroLevels,
        party,
      })
      saveState(get())
      audio.sfxFanfare?.()
      get()._toast?.(`Премиум-герой ${hero.name} в отряде`)
      return true
    },

    // ===== прогрессия (звёзды/осколки/пробуждение) =====
    addHeroShards(heroId, n = 1) {
      if (!n) return
      const s = get()
      const cur = s.heroShards?.[heroId] || 0
      set({ heroShards: { ...s.heroShards, [heroId]: cur + n } })
    },
    heroStarsOf(heroId)  { return get().heroStars?.[heroId]  || 0 },
    heroShardsOf(heroId) { return get().heroShards?.[heroId] || 0 },
    heroAwakeOf(heroId)  { return get().heroAwake?.[heroId]  || null },

    // ===== Hero Mastery =====
    // Каждый удар героя в бою (партией) добавляет 1 в счётчик.
    // Уровень мастерства считается по формуле: hits >= level*(level+1)/2 * BASE,
    // т.е. требования растут квадратично, прогресс ощущается всё медленнее.
    heroMasteryOf(heroId) { return get().heroMastery?.[heroId] || { hits: 0, level: 0 } },
    heroMasteryNeed(level) {
      // hits, нужное чтобы перейти с level → level+1.
      // Прогрессия рассчитана на длительный grind:
      //   ур.0→1: 200, ур.1→2: 400, ур.2→3: 700, ур.3→4: 1100, ...
      //   каждый следующий уровень требует на +(150*level) больше базовых 200.
      // Это даёт ~5–10 минут активного боя на ранние уровни и часы на поздние.
      return 200 + 150 * level + 50 * level * level
    },
    heroMasteryProgress(heroId) {
      const m = get().heroMastery?.[heroId] || { hits: 0, level: 0 }
      const need = get().heroMasteryNeed(m.level)
      // hits, накопленные после прошлого уровня
      let prevTotal = 0
      for (let l = 0; l < m.level; l++) prevTotal += get().heroMasteryNeed(l)
      const cur = Math.max(0, m.hits - prevTotal)
      return { level: m.level, cur, need, total: m.hits }
    },
    _addHeroMasteryHits(heroId, hits) {
      if (!hits || hits <= 0) return
      const s = get()
      const cur = s.heroMastery?.[heroId] || { hits: 0, level: 0 }
      let total = (cur.hits || 0) + hits
      let level = cur.level || 0
      // Подняли несколько уровней за тик (на случай большого hits)
      // защищаем от бесконечного цикла:
      for (let i = 0; i < 50; i++) {
        const need = get().heroMasteryNeed(level)
        let prevTotal = 0
        for (let l = 0; l < level; l++) prevTotal += get().heroMasteryNeed(l)
        if (total - prevTotal >= need) {
          level += 1
        } else {
          break
        }
      }
      const next = { hits: total, level }
      set({ heroMastery: { ...(s.heroMastery || {}), [heroId]: next } })
      if (level > (cur.level || 0)) {
        const hero = getHero(heroId)
        if (hero) get()._toast?.(`Мастерство ${hero.name}: ур.${level}`)
      }
    },

    // ===== Снаряжение =====
    // Все надетые предметы (плоский список) — по всем героям.
    // Используем для глобальных эффектов (например, прибавки к золоту).
    getEquippedGear() {
      const s = get()
      const eq = s.gearEquipped || {}
      const bag = s.gearBag || []
      const out = []
      for (const heroId of Object.keys(eq)) {
        const slots = eq[heroId] || {}
        for (const slot of Object.keys(slots)) {
          const it = bag.find(g => g.id === slots[slot])
          if (it) out.push(it)
        }
      }
      return out
    },
    // Предметы, надетые на конкретного героя.
    getHeroGear(heroId) {
      const s = get()
      const slots = (s.gearEquipped || {})[heroId] || {}
      const bag = s.gearBag || []
      const out = []
      for (const slot of Object.keys(slots)) {
        const it = bag.find(g => g.id === slots[slot])
        if (it) out.push(it)
      }
      return out
    },
    // Бонусы конкретного героя от его шмота.
    getHeroGearBonuses(heroId) {
      return applyGearBonuses(get().getHeroGear(heroId))
    },
    // Глобальные «общеотрядные» бонусы шмота: золото и hp от всех надетых
    // предметов в отряде. Урон/скорость/крит/ярость — индивидуальные.
    getPartyGearBonuses() {
      const s = get()
      const party = s.party || []
      const sum = { gold: 0, hp: 0 }
      for (const id of party) {
        const b = applyGearBonuses(s.getHeroGear(id))
        sum.gold += b.gold || 0
        sum.hp   += b.hp   || 0
      }
      return sum
    },
    // Backcompat для общего вью «Сводка» (можно показать суммарно).
    getGearBonuses() {
      return applyGearBonuses(get().getEquippedGear())
    },
    // Уже ли надет предмет где-либо?
    isGearEquipped(itemId) {
      const eq = get().gearEquipped || {}
      for (const heroId of Object.keys(eq)) {
        const slots = eq[heroId] || {}
        for (const slot of Object.keys(slots)) {
          if (slots[slot] === itemId) return { heroId, slot }
        }
      }
      return null
    },
    // Надеть предмет на героя. Если на этом слоте у героя уже что-то — заменим.
    // Если предмет уже надет на другом герое — снимем его там.
    equipGearOn(heroId, itemId) {
      const s = get()
      const item = (s.gearBag || []).find(g => g.id === itemId)
      if (!item) return false
      const eq = { ...(s.gearEquipped || {}) }
      // Убираем предмет везде, где он мог быть надет
      for (const hid of Object.keys(eq)) {
        const slots = { ...(eq[hid] || {}) }
        for (const sl of Object.keys(slots)) {
          if (slots[sl] === itemId) delete slots[sl]
        }
        eq[hid] = slots
      }
      const heroSlots = { ...(eq[heroId] || {}) }
      heroSlots[item.slot] = itemId
      eq[heroId] = heroSlots
      set({ gearEquipped: eq })
      saveState(get())
      return true
    },
    // Снять конкретный слот у героя.
    unequipHeroSlot(heroId, slot) {
      const s = get()
      const eq = { ...(s.gearEquipped || {}) }
      const heroSlots = { ...(eq[heroId] || {}) }
      delete heroSlots[slot]
      eq[heroId] = heroSlots
      set({ gearEquipped: eq })
      saveState(get())
    },
    // Старые имена — оставлены как тонкие обёртки для совместимости.
    equipGear(itemId) {
      // Без героя — надеть на текущего лидера партии (на всякий случай).
      const heroId = (get().party || [])[0]
      if (!heroId) return false
      return get().equipGearOn(heroId, itemId)
    },
    unequipSlot(slot) {
      const s = get()
      const eq = { ...(s.gearEquipped || {}) }
      // снимаем у всех героев, у кого этот слот занят
      for (const hid of Object.keys(eq)) {
        const slots = { ...(eq[hid] || {}) }
        delete slots[slot]
        eq[hid] = slots
      }
      set({ gearEquipped: eq })
      saveState(get())
    },
    sellGear(itemId) {
      const s = get()
      const item = (s.gearBag || []).find(g => g.id === itemId)
      if (!item) return false
      const bag = (s.gearBag || []).filter(g => g.id !== itemId)
      // если был надет — снимаем у всех
      const eq = { ...(s.gearEquipped || {}) }
      for (const hid of Object.keys(eq)) {
        const slots = { ...(eq[hid] || {}) }
        for (const sl of Object.keys(slots)) {
          if (slots[sl] === itemId) delete slots[sl]
        }
        eq[hid] = slots
      }
      // продажа за руду по редкости
      const oreReward = { common: 5, rare: 20, epic: 60, legendary: 180 }
      const ore = oreReward[item.rarity] || 5
      set({ gearBag: bag, gearEquipped: eq, ore: (s.ore || 0) + ore })
      get()._toast?.(`+${ore} руды за разбор`)
      saveState(get())
      return true
    },
    // Реролл одного аффикса в кузнице за руду.
    rerollGearAffix(itemId, affixIdx) {
      const s = get()
      const bag = s.gearBag || []
      const idx = bag.findIndex(g => g.id === itemId)
      if (idx < 0) return false
      const item = bag[idx]
      const cost = REROLL_COST[item.rarity] || 50
      if ((s.ore || 0) < cost) {
        get()._toast?.('Не хватает руды')
        return false
      }
      const next = rerollAffixData(item, affixIdx)
      const newBag = [...bag]
      newBag[idx] = next
      set({ gearBag: newBag, ore: s.ore - cost })
      saveState(get())
      return true
    },
    // ===== Питомцы =====
    // Выдать яйцо питомца (из ивент-боссов/сундуков).
    grantPetEgg(n = 1) {
      const s = get()
      set({ petEggs: (s.petEggs || 0) + n })
      saveState(get())
    },
    // Вылупить одно яйцо → случайный питомец. forcedRarity опционально.
    hatchEgg(forcedRarity = null) {
      const s = get()
      if ((s.petEggs || 0) <= 0) return null
      const petId = rollPetFromEgg(forcedRarity)
      const pets = { ...(s.pets || {}) }
      let dup = false
      if (pets[petId]) {
        // дубликат → +1 уровень
        pets[petId] = { level: Math.min(PET_MAX_LEVEL, (pets[petId].level || 1) + 1) }
        dup = true
      } else {
        pets[petId] = { level: 1 }
      }
      const next = { petEggs: (s.petEggs || 0) - 1, pets }
      // если активного нет — назначим первого
      if (!s.activePet) next.activePet = petId
      set(next)
      const def = getPet(petId)
      get()._toast?.(dup ? `${def?.name}: +1 уровень` : `Новый питомец: ${def?.name}!`)
      audio.sfxFanfare?.()
      saveState(get())
      return { petId, dup }
    },
    setActivePet(petId) {
      const s = get()
      if (petId && !s.pets?.[petId]) return false
      set({ activePet: petId })
      saveState(get())
      return true
    },
    petUpgradeCostNow(petId) {
      const s = get()
      const def = getPet(petId)
      const inst = s.pets?.[petId]
      if (!def || !inst) return null
      return petUpgradeCost(def.rarity, inst.level || 1)
    },
    upgradePet(petId) {
      const s = get()
      const def = getPet(petId)
      const inst = s.pets?.[petId]
      if (!def || !inst) return false
      if ((inst.level || 1) >= PET_MAX_LEVEL) {
        get()._toast?.('Максимальный уровень')
        return false
      }
      const cost = petUpgradeCost(def.rarity, inst.level || 1)
      if (s.gold < cost) {
        get()._toast?.('Не хватает золота')
        return false
      }
      set({
        gold: s.gold - cost,
        pets: { ...s.pets, [petId]: { level: (inst.level || 1) + 1 } },
      })
      saveState(get())
      return true
    },

    // ===== Город / База =====
    cityBuildingLevel(id) { return get().cityLevels?.[id] || 0 },
    cityMaxLevel() { return maxBuildingLevel(get().maxStage || get().stage || 1) },
    cityUpgradeCost(id) {
      const lvl = (get().cityLevels?.[id] || 0) + 1
      const b = getBuilding(id)
      if (!b) return null
      return b.cost(lvl)
    },
    getCityBonusesNow() { return getCityBonuses(get().cityLevels || {}) },
    canUpgradeBuilding(id) {
      const s = get()
      const b = getBuilding(id)
      if (!b) return false
      const lvl = s.cityLevels?.[id] || 0
      if (lvl >= s.cityMaxLevel()) return false
      const cost = b.cost(lvl + 1)
      return s.gold >= cost.gold && (s.ore || 0) >= cost.ore
    },
    upgradeBuilding(id) {
      const s = get()
      const b = getBuilding(id)
      if (!b) return false
      const lvl = s.cityLevels?.[id] || 0
      if (lvl >= s.cityMaxLevel()) {
        get()._toast?.('Нужно пройти дальше, чтобы качать выше')
        return false
      }
      const cost = b.cost(lvl + 1)
      if (s.gold < cost.gold || (s.ore || 0) < cost.ore) {
        get()._toast?.('Не хватает ресурсов')
        return false
      }
      set({
        gold: s.gold - cost.gold,
        ore: (s.ore || 0) - cost.ore,
        cityLevels: { ...(s.cityLevels || {}), [id]: lvl + 1 },
      })
      saveState(get())
      return true
    },
    // Тик пассивной добычи руды (зовётся в game loop).
    tickCity(dt) {
      const s = get()
      const rate = getCityBonuses(s.cityLevels || {}).oresPerSec || 0
      if (rate <= 0) return
      const acc = (s._oreAcc || 0) + rate * (dt / 1000)
      const whole = Math.floor(acc)
      if (whole >= 1) {
        s._oreAcc = acc - whole
        set({ ore: (s.ore || 0) + whole })
      } else {
        s._oreAcc = acc
      }
    },

    // ===== Battle Pass =====
    // Гарантирует, что bp инициализирован и совпадает с активным сезоном.
    // Если сезон сменился — сбрасываем прогресс.
    _ensureSeason() {
      const s = get()
      const active = getActiveSeason()
      const bp = s.bp || {}
      if (bp.seasonId !== active.id) {
        set({
          bp: {
            seasonId: active.id,
            startedAt: Date.now(),
            xp: 0,
            level: 0,
            premium: false,
            claimedFree: [],
            claimedPremium: [],
          },
        })
        return get().bp
      }
      // Если сезон закончился — стартуем новый цикл этого же сезона.
      if (bp.startedAt && Date.now() - bp.startedAt > SEASON_DURATION_MS) {
        set({
          bp: {
            ...bp,
            startedAt: Date.now(),
            xp: 0,
            level: 0,
            premium: false,
            claimedFree: [],
            claimedPremium: [],
          },
        })
        return get().bp
      }
      return bp
    },
    bpStatus() {
      const bp = get()._ensureSeason()
      const cur = bp.level || 0
      const need = bpXpNeeded(cur)
      // xp в текущем уровне
      let used = 0
      for (let l = 0; l < cur; l++) used += bpXpNeeded(l)
      const inLevel = Math.max(0, (bp.xp || 0) - used)
      return {
        season: getActiveSeason(),
        level: cur,
        xp: bp.xp || 0,
        inLevel,
        need,
        premium: !!bp.premium,
        startedAt: bp.startedAt || 0,
        timeLeftMs: Math.max(0, (bp.startedAt || Date.now()) + SEASON_DURATION_MS - Date.now()),
      }
    },
    // Возвращает награду с уже применённым масштабом по прогрессу игрока.
    bpRewardAt(level, track) {
      const r = BP_REWARDS[level - 1]
      if (!r) return null
      const base = track === 'premium' ? r.premium : r.free
      const s = get()
      const scale = rewardScale({
        stage: s.stage, maxStage: s.maxStage, ngLevel: s.ngLevel,
      })
      return scaleReward(base, scale)
    },
    addBpXp(xp) {
      if (!xp || xp <= 0) return
      const bp = get()._ensureSeason()
      let total = (bp.xp || 0) + xp
      let level = bp.level || 0
      // up-уровни (защита от инфинит-цикла)
      for (let i = 0; i < 200; i++) {
        if (level >= BP_MAX_LEVEL) break
        let used = 0
        for (let l = 0; l < level; l++) used += bpXpNeeded(l)
        const need = bpXpNeeded(level)
        if (total - used >= need) level += 1
        else break
      }
      const next = { ...bp, xp: total, level }
      set({ bp: next })
      if (level > (bp.level || 0)) {
        get()._toast?.(`Battle Pass: уровень ${level}`)
      }
    },
    buyBpPremium() {
      const s = get()
      const bp = get()._ensureSeason()
      if (bp.premium) return false
      if (s.gems < PREMIUM_COST_GEMS) {
        get()._toast?.('Не хватает алмазов')
        return false
      }
      set({
        gems: s.gems - PREMIUM_COST_GEMS,
        bp: { ...bp, premium: true },
      })
      get()._toast?.('Премиум Battle Pass активирован')
      saveState(get())
      return true
    },
    bpClaim(level, track) {
      // track: 'free' | 'premium'
      const s = get()
      const bp = get()._ensureSeason()
      if (level > (bp.level || 0)) return false
      if (track === 'premium' && !bp.premium) return false
      const claimedKey = track === 'premium' ? 'claimedPremium' : 'claimedFree'
      const claimed = bp[claimedKey] || []
      if (claimed.includes(level)) return false
      const r = BP_REWARDS[level - 1]
      if (!r) return false
      const baseReward = track === 'premium' ? r.premium : r.free
      // Масштабируем по прогрессу игрока
      const reward = scaleReward(baseReward, rewardScale({
        stage: s.stage, maxStage: s.maxStage, ngLevel: s.ngLevel,
      }))
      // Применяем награду
      const patch = {}
      const heroForGearIfNeeded = null
      switch (reward.type) {
        case 'gold':   patch.gold = (s.gold || 0) + reward.amount; break
        case 'gems':   patch.gems = (s.gems || 0) + reward.amount; break
        case 'ore':    patch.ore  = (s.ore  || 0) + reward.amount; break
        case 'shards': patch.artifactShards = (s.artifactShards || 0) + reward.amount; break
        case 'chest_common':    patch.gold = (s.gold || 0); break
        case 'chest_rare':      break
        case 'chest_epic':      break
        case 'chest_legendary': break
        case 'gear_rare':
        case 'gear_epic':
        case 'gear_legendary': {
          const rarity = reward.type.replace('gear_', '')
          // зальём после set
          set({ ...patch })
          get()._dropGear({ rarity, silent: false })
          patch._gearDone = true
          break
        }
        case 'hero': {
          const heroId = reward.heroId
          const hero = HEROES.find(h => h.id === heroId || h.id.startsWith(heroId + '_'))
          if (hero) {
            if (!s.unlockedHeroes.includes(hero.id)) {
              patch.unlockedHeroes = [...s.unlockedHeroes, hero.id]
              patch.heroLevels = { ...s.heroLevels, [hero.id]: 1 }
              if (s.party.length < PARTY_SIZE) patch.party = [...s.party, hero.id]
              get()._toast?.(`Эксклюзив сезона: ${hero.name}!`)
              audio.sfxFanfare?.()
            } else {
              // герой уже есть — компенсируем гемами
              patch.gems = (s.gems || 0) + 200
              get()._toast?.('У тебя уже есть этот герой — +200💎')
            }
          }
          break
        }
        case 'skin':
        default:
          break
      }
      // chest-награды: эмулируем как «откроется автоматически» — выдаём
      // через openChest аналог. Чтобы не плодить лишнюю логику, конвертируем
      // в тосты + соответствующие ресурсы простым набором.
      if (reward.type.startsWith('chest_')) {
        const tier = reward.type.replace('chest_', '')
        const grant = {
          common:    { gold: 200,  ore: 6 },
          rare:      { gold: 1500, ore: 18 },
          epic:      { gold: 8000, ore: 40 },
          legendary: { gold: 50000, ore: 110 },
        }[tier] || { gold: 0, ore: 0 }
        patch.gold = (patch.gold ?? s.gold ?? 0) + grant.gold
        patch.ore  = (patch.ore  ?? s.ore  ?? 0) + grant.ore
        get()._toast?.(`+${grant.gold}🪙 +${grant.ore}⛏ из ${tier}-сундука`)
      }

      const newClaimed = [...claimed, level]
      const nextBp = { ...bp, [claimedKey]: newClaimed }
      // если сделали выдачу шмота через _dropGear, у нас уже set отработал.
      set({ ...patch, bp: nextBp })
      saveState(get())
      return true
    },

    // ===== Ивент-боссы =====
    _ensureEventBoss() {
      const s = get()
      const now = Date.now()
      const def = pickActiveEventBoss(now)
      const cur = s.eventBoss
      if (cur && cur.bossId === def.id) {
        // тот же босс — проверим истёк ли цикл
        const cycleMs = (cur.cycleHours || def.cycleHours) * 3600_000
        if (now - cur.startedAt < cycleMs) return cur
      }
      // запускаем новый цикл — пересчитываем maxHp от текущего DPS
      const dps = Math.max(1, get().getCurrentDps())
      const cycleSec = def.cycleHours * 3600
      const minHp = 50_000 * (1 + 0.5 * Math.max(0, (s.maxStage || s.stage || 1) - 1))
      const maxHp = Math.max(minHp, Math.floor(dps * cycleSec * def.hpDpsMul))
      const fresh = {
        bossId: def.id,
        startedAt: now,
        cycleHours: def.cycleHours,
        maxHp,
        damage: 0,
        attempts: 0,
        lastAttackAt: 0,
        claimed: [],
      }
      set({ eventBoss: fresh })
      return fresh
    },
    eventBossStatus() {
      const cur = get()._ensureEventBoss()
      const def = getEventBoss(cur.bossId)
      const now = Date.now()
      const cycleMs = (cur.cycleHours || def.cycleHours) * 3600_000
      const left = Math.max(0, cur.startedAt + cycleMs - now)
      const cdLeft = Math.max(0, (cur.lastAttackAt || 0) + (def.cooldownSec || 0) * 1000 - now)
      return {
        def,
        cur,
        left,
        cdLeft,
        attemptsLeft: Math.max(0, (def.maxAttempts || 0) - (cur.attempts || 0)),
        damagePct: cur.maxHp ? Math.min(1, cur.damage / cur.maxHp) : 0,
      }
    },
    eventBossAttack() {
      const status = get().eventBossStatus()
      if (status.left <= 0) {
        get()._toast?.('Цикл этого ивент-босса завершён')
        return false
      }
      if (status.cdLeft > 0) {
        get()._toast?.('Перезарядка между атаками')
        return false
      }
      if (status.attemptsLeft <= 0) {
        get()._toast?.('На сегодня попыток больше нет')
        return false
      }
      const def = status.def
      const dps = Math.max(1, get().getCurrentDps())
      // Лёгкий мульт за уровень развития
      const stageMul = 1 + 0.05 * Math.max(0, (get().maxStage || get().stage || 1) - 1)
      const dealt = Math.max(1, Math.round(dps * (def.attackSeconds || 30) * stageMul))
      const cur = get().eventBoss
      const newDamage = Math.min(cur.maxHp, (cur.damage || 0) + dealt)
      set({
        eventBoss: {
          ...cur,
          damage: newDamage,
          attempts: (cur.attempts || 0) + 1,
          lastAttackAt: Date.now(),
        },
      })
      get()._toast?.(`Удар по ${def.name}: −${fmtSimple(dealt)} HP`)
      audio.sfxFanfare?.()
      get().addBpXp(50) // BP-награда за участие
      saveState(get())
      return { dealt, total: newDamage }
    },
    eventBossClaim(thresholdIdx) {
      const s = get()
      const status = get().eventBossStatus()
      const def = status.def
      const cur = status.cur
      const reward = (def.rewards || [])[thresholdIdx]
      if (!reward) return false
      if (status.damagePct < (reward.atPct || 0)) {
        get()._toast?.('Урон ещё не достиг порога')
        return false
      }
      if ((cur.claimed || []).includes(thresholdIdx)) return false
      const sc = rewardScale({ stage: s.stage, maxStage: s.maxStage, ngLevel: s.ngLevel })
      const gold   = Math.floor((reward.gold   || 0) * sc)
      const ore    = Math.floor((reward.ore    || 0) * sc)
      const shards = Math.floor((reward.shards || 0) * sc)
      const gems   = Math.floor((reward.gems   || 0) * sc)
      const next = {
        gold: (s.gold || 0) + gold,
        ore:  (s.ore  || 0) + ore,
        artifactShards: (s.artifactShards || 0) + shards,
        gems: (s.gems || 0) + gems,
        eventBoss: { ...cur, claimed: [...(cur.claimed || []), thresholdIdx] },
      }
      set(next)
      // Дроп шмота, если задан
      if (reward.gear) {
        get()._dropGear({ rarity: reward.gear })
      }
      // Шанс яйца питомца с порогов ивент-босса (выше порог — выше шанс)
      const eggChance = 0.15 + (reward.atPct || 0) * 0.5  // 0.15..0.55
      if (Math.random() < eggChance) {
        get().grantPetEgg(1)
        get()._toast?.('Получено яйцо питомца! 🥚')
      }
      get()._toast?.(`Награда ${Math.round((reward.atPct || 0) * 100)}%: +${fmtSimple(gold)}🪙 +${fmtSimple(shards)}✦`)
      saveState(get())
      return true
    },

    // Покупка оружия из каталога магазина — создаёт уникальный gear-предмет в bag.
    // Доступно только для предметов с `inShop: true`. Цена — алмазами.
    buyCatalogWeapon(id) {
      const s = get()
      const def = getCatalogWeaponDef(id)
      if (!def || !def.inShop) return false
      const currency = def.currency || 'gems'
      if (currency === 'gems' && s.gems < def.cost) {
        get()._toast?.('Не хватает алмазов')
        return false
      }
      if (currency === 'gold' && s.gold < def.cost) {
        get()._toast?.('Не хватает золота')
        return false
      }
      const item = {
        id: 'gw_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36).slice(-4),
        slot: 'weapon',
        rarity: def.rarity,
        setId: null,
        affixes: def.affixes.map(a => ({ ...a })),
        catalogId: def.id,
        catalogName: def.name,
      }
      set({
        gold: s.gold - (currency === 'gold' ? def.cost : 0),
        gems: s.gems - (currency === 'gems' ? def.cost : 0),
        gearBag: [...(s.gearBag || []), item],
      })
      saveState(get())
      get()._toast?.(`Куплено: ${def.name}`)
      return true
    },

    // Дроп: добавить случайный gear с заданными опциями.
    // opts.silent — не показывать тост (используется при выпадении из сундука,
    // там показ всех наград идёт в RevealModal).
    _dropGear(opts = {}) {
      // С шансом 25% подменяем «случайное» оружие на именованное из каталога
      // соответствующей редкости (это и есть «выбивание оружия из каталога»).
      // Не для слотов кроме weapon — там логика прежняя.
      let item
      const wantSlot = opts.slot
      const wantRarity = opts.rarity
      if ((!wantSlot || wantSlot === 'weapon') && Math.random() < 0.25) {
        // Выбираем редкость для именованного оружия
        const rarity = wantRarity || (() => {
          const r = Math.random()
          if (r < 0.55) return 'common'
          if (r < 0.85) return 'rare'
          if (r < 0.97) return 'epic'
          return 'legendary'
        })()
        const pool = WEAPON_CATALOG.filter(w => w.rarity === rarity)
        if (pool.length > 0) {
          const def = pool[Math.floor(Math.random() * pool.length)]
          item = {
            id: 'gw_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36).slice(-4),
            slot: 'weapon',
            rarity: def.rarity,
            setId: null,
            affixes: def.affixes.map(a => ({ ...a })),
            catalogId: def.id,
            catalogName: def.name,
          }
        }
      }
      if (!item) {
        item = rollGear(opts)
      }
      const s = get()
      // Ограничение размера сумки — после 100 предметов отбрасываем самые слабые common.
      let bag = [...(s.gearBag || []), item]
      if (bag.length > 100) {
        bag = bag
          .filter(g => g.rarity !== 'common' || Object.values(s.gearEquipped || {})
            .some(slots => Object.values(slots).includes(g.id)))
          .slice(-100)
        if (bag.length > 100) bag = bag.slice(-100)
      }
      set({ gearBag: bag })
      if (!opts.silent) {
        const def = { common: 'обычный', rare: 'редкий', epic: 'эпический', legendary: 'легендарный' }[item.rarity]
        const name = item.catalogName ? ` «${item.catalogName}»` : ''
        get()._toast?.(`Снаряжение${name}: ${def} предмет`)
      }
      return item
    },
    _addHeroMasteryHits(heroId, hits) {
      if (!hits || hits <= 0) return
      const s = get()
      const cur = s.heroMastery?.[heroId] || { hits: 0, level: 0 }
      let total = (cur.hits || 0) + hits
      let level = cur.level || 0
      // Подняли несколько уровней за тик (на случай большого hits)
      // защищаем от бесконечного цикла:
      for (let i = 0; i < 50; i++) {
        const need = get().heroMasteryNeed(level)
        let prevTotal = 0
        for (let l = 0; l < level; l++) prevTotal += get().heroMasteryNeed(l)
        if (total - prevTotal >= need) {
          level += 1
        } else {
          break
        }
      }
      const next = { hits: total, level }
      set({ heroMastery: { ...(s.heroMastery || {}), [heroId]: next } })
      if (level > (cur.level || 0)) {
        const hero = getHero(heroId)
        if (hero) get()._toast?.(`Мастерство ${hero.name}: ур.${level}`)
      }
    },


    canAscend(heroId) {
      const s = get()
      const hero = getHero(heroId)
      if (!hero) return false
      if (!s.unlockedHeroes.includes(heroId)) return false
      const stars = s.heroStarsOf(heroId)
      if (stars >= MAX_STARS) return false
      const need = starShardCost(stars)
      const haveShards = s.heroShardsOf(heroId)
      const goldNeed = starGoldCost(hero, stars)
      const baseOk = haveShards >= need && s.gold >= goldNeed
      // Дополнительные требования для эволюции 5★ → 6★
      if (stars === 5) {
        const mythTotal = (s.heroShards || {})
          ? Object.entries(s.heroShards).reduce((sum, [hid, n]) => {
              const h = getHero(hid)
              return sum + (h?.rarity === 'mythic' ? n : 0)
            }, 0)
          : 0
        const oreOk = (s.ore || 0) >= SIX_STAR_ORE_COST
        return baseOk && mythTotal >= SIX_STAR_MYTHIC_SHARDS && oreOk
      }
      return baseOk
    },
    ascendHero(heroId) {
      const s = get()
      const hero = getHero(heroId)
      if (!hero) return { ok: false, reason: 'notfound' }
      if (!s.unlockedHeroes.includes(heroId)) return { ok: false, reason: 'locked' }
      const stars = s.heroStarsOf(heroId)
      if (stars >= MAX_STARS) return { ok: false, reason: 'max' }
      const needShards = starShardCost(stars)
      const needGold = starGoldCost(hero, stars)
      const haveShards = s.heroShardsOf(heroId)
      if (haveShards < needShards) return { ok: false, reason: 'shards' }
      if (s.gold < needGold) return { ok: false, reason: 'gold' }

      // Особая логика 5★ → 6★: тратим 1 осколок мифика и руду.
      let next = {
        gold: s.gold - needGold,
        heroShards: { ...s.heroShards, [heroId]: haveShards - needShards },
        heroStars:  { ...s.heroStars,  [heroId]: stars + 1 },
      }
      if (stars === 5) {
        // Найдём первый мифик с осколками и снимем 1.
        let mythHero = null
        for (const [hid, n] of Object.entries(s.heroShards || {})) {
          const h = getHero(hid)
          if (h && h.rarity === 'mythic' && (n || 0) >= SIX_STAR_MYTHIC_SHARDS) {
            mythHero = hid
            break
          }
        }
        if (!mythHero) return { ok: false, reason: 'mythic_shards' }
        if ((s.ore || 0) < SIX_STAR_ORE_COST) return { ok: false, reason: 'ore' }
        next.heroShards = {
          ...next.heroShards,
          [mythHero]: (s.heroShards[mythHero] || 0) - SIX_STAR_MYTHIC_SHARDS,
        }
        next.ore = (s.ore || 0) - SIX_STAR_ORE_COST
      }

      set(next)
      saveState(get())
      audio.sfxLevelUp?.()
      if (stars === 5) {
        get()._toast?.(`${hero.name}: Пробуждённая форма! ★6 + новая ульта`)
      } else {
        get()._toast?.(`${hero.name}: ${'⭐'.repeat(stars + 1)}`)
      }
      return { ok: true, stars: stars + 1 }
    },

    canAwaken(heroId) {
      const s = get()
      const lvl = s.heroLevels?.[heroId] || 1
      if (lvl < AWAKENING_LEVEL) return false
      if (s.heroAwake?.[heroId]) return false // уже выбран
      return s.unlockedHeroes.includes(heroId)
    },
    awakenHero(heroId, pathId) {
      const s = get()
      const hero = getHero(heroId)
      if (!hero) return false
      if (!s.canAwaken(heroId)) return false
      const allowed = getAwakeningPaths(hero.role).some(p => p.id === pathId)
      if (!allowed) return false
      set({ heroAwake: { ...s.heroAwake, [heroId]: pathId } })
      saveState(get())
      get()._toast?.(`${hero.name}: пробуждение — ${pathId}`)
      return true
    },

    // ===== рейды =====
    startRaid(id) {
      const s = get()
      if (s.raidActive) return { ok: false, reason: 'busy' }
      const cd = s.raidCooldowns[id] || 0
      if (cd > Date.now()) return { ok: false, reason: 'cooldown' }
      const raid = getRaid(id)
      if (!raid) return { ok: false, reason: 'notfound' }
      const startedAt = Date.now()
      // Соберём "босса рейда" с реальной HP, чтобы можно было бить.
      // HP подбираем из minDps × duration с запасом, чтобы выжить надо около минимально.
      const maxHp = Math.ceil(raid.minDps * raid.duration * 0.9)
      // Уведомление: рейд закончится через duration сек.
      notifyRaidDone(new Date(startedAt + raid.duration * 1000), raid.name)
      set({
        raidActive: {
          id,
          startedAt,
          endsAt: startedAt + raid.duration * 1000,
          dpsAccum: 0,
          ticks: 0,
          boss: { uid: 'r_' + id + '_' + startedAt, name: raid.name, sprite: raid.sprite, hp: maxHp, maxHp, isBoss: true },
          dpsSnapshot: 0,
        },
      })
      return { ok: true }
    },
    tickRaid() {
      const s = get()
      if (!s.raidActive) return
      const now = Date.now()
      const raid = getRaid(s.raidActive.id)
      const a = s.raidActive
      // Один игровой кадр ~ 16ms. Берём текущий dps и снимаем его пропорционально времени.
      // Используем performance.now diff между предыдущим тиком (хранится в _raidLastTick).
      const last = a._lastTick || a.startedAt
      const dt = Math.max(0, now - last)
      // Тротлинг — set не чаще ~150мс, чтобы не плодить ребиндинги UI.
      if (dt < 150 && now < a.endsAt - 50) return
      const dps = s.getCurrentDps()
      const dmg = Math.max(0, Math.round(dps * (dt / 1000)))
      const boss = a.boss || null
      const newHp = boss ? Math.max(0, boss.hp - dmg) : 0
      const next = {
        ...a,
        _lastTick: now,
        dpsAccum: a.dpsAccum + dps,
        ticks: a.ticks + 1,
        dpsSnapshot: dps,
        boss: boss ? { ...boss, hp: newHp } : null,
      }
      // Босс убит — победа
      if (boss && newHp <= 0) {
        get()._finishRaid(raid, true)
        return
      }
      // Время вышло — проигрыш
      if (now >= a.endsAt) {
        get()._finishRaid(raid, false)
        return
      }
      set({ raidActive: next })
    },
    _finishRaid(raid, success) {
      const s = get()
      const cooldown = { ...s.raidCooldowns, [raid.id]: Date.now() + raid.cooldown }
      // отменяем запланированное уведомление — игрок и так в игре
      cancelRaidDone()
      if (success) {
        const drop = raid.rewardMin + Math.floor(Math.random() * (raid.rewardMax - raid.rewardMin + 1))
        // Эскалация: +1 стак за победу
        const stacks = (s.raidEscalation?.[raid.id] || 0) + 1
        set({
          raidActive: null,
          raidCooldowns: cooldown,
          gold: s.gold + raid.rewardGold,
          mats: { ...s.mats, [raid.material]: s.mats[raid.material] + drop },
          raidEscalation: { ...s.raidEscalation, [raid.id]: stacks },
          _lastRaidResult: { ok: true, raidId: raid.id, name: raid.name, gold: raid.rewardGold, material: raid.material, drop, escalation: stacks },
        })
        get()._toast?.(`Рейд "${raid.name}" пройден! +${drop} ${raid.material} · ${stacks} стак`)
        // Гарантированный дроп gear с шансом на эпик/легендарку
        const r = Math.random()
        const rarity = r < 0.10 ? 'legendary' : r < 0.40 ? 'epic' : 'rare'
        get()._dropGear({ rarity })
        get()._bumpStat('raidsCompleted', 1)
        get().addBpXp(300)
        get()._bumpGoldEarned(raid.rewardGold)
      } else {
        set({
          raidActive: null,
          raidCooldowns: cooldown,
          _lastRaidResult: { ok: false, raidId: raid.id, name: raid.name },
        })
        get()._toast?.(`Рейд "${raid.name}" провален. Прокачайтесь и попробуйте снова.`)
      }
      saveState(get())
    },

    // Удар по боссу рейда (тап в раунде).
    raidTap() {
      const s = get()
      const a = s.raidActive
      if (!a || !a.boss) return
      const dmg = s.getTapDamage()
      const newHp = Math.max(0, a.boss.hp - dmg)
      set({ raidActive: { ...a, boss: { ...a.boss, hp: newHp } } })
      // ярость растёт
      const bonus = 1 + s.getBonuses().rage
      set({ rage: Math.min(100, s.rage + 1.4 * bonus) })
      if (newHp <= 0) {
        const raid = getRaid(a.id)
        if (raid) get()._finishRaid(raid, true)
      }
    },

    // мост к UI для всплывашек
    _toast: null,
    setToaster(fn) { set({ _toast: fn }) },

    // ===== статистика =====
    _bumpStat(key, delta = 1) {
      const s = get()
      set({ stats: { ...s.stats, [key]: (s.stats?.[key] || 0) + delta } })
    },
    _bumpGoldEarned(amount) {
      if (!amount) return
      const s = get()
      set({ stats: { ...s.stats, goldEarnedTotal: (s.stats?.goldEarnedTotal || 0) + amount } })
    },

    // ===== профиль / промокоды =====
    setNickname(name) {
      const s = get()
      const nick = String(name || '').slice(0, 24).trim()
      set({ profile: { ...s.profile, nickname: nick } })
      saveState(get())
    },
    setAvatar(role) {
      const s = get()
      const allowed = ['melee', 'ranged', 'mage', 'support']
      const av = allowed.includes(role) ? role : 'melee'
      set({ profile: { ...s.profile, avatar: av } })
      saveState(get())
    },

    // Привязка профиля Telegram (Mini App). tg — объект пользователя или null.
    // Если у игрока ещё не задан ник, подставляем имя из Telegram.
    setTelegramProfile(tg) {
      const s = get()
      if (!tg || !tg.id) {
        set({ profile: { ...s.profile, telegram: null } })
        saveState(get())
        return
      }
      const telegram = {
        id: tg.id,
        firstName: String(tg.first_name || tg.firstName || '').slice(0, 64),
        lastName: String(tg.last_name || tg.lastName || '').slice(0, 64),
        username: String(tg.username || '').slice(0, 64),
        photoUrl: String(tg.photo_url || tg.photoUrl || ''),
      }
      const autoName = (telegram.username || telegram.firstName || '').slice(0, 24).trim()
      const nextProfile = { ...s.profile, telegram }
      if (!s.profile.nickname && autoName) nextProfile.nickname = autoName
      set({ profile: nextProfile })
      saveState(get())
    },

    // Применить облачный сейв поверх текущего состояния (после входа на новом
    // устройстве). Сохраняем профиль Telegram текущей сессии, остальное берём
    // из облака. Затем фиксируем локально, но НЕ пушим повторно в облако.
    applyCloudSave(cloud) {
      if (!cloud || typeof cloud !== 'object') return false
      const s = get()
      const initStage = cloud.stage ?? s.stage ?? 1
      const initWave = cloud.wave ?? s.wave ?? 1
      const merged = {
        ...DEFAULT_STATE,
        ...cloud,
        // профиль Telegram оставляем от текущего входа
        profile: { ...(cloud.profile || {}), telegram: s.profile?.telegram || cloud.profile?.telegram || null },
        // боевые поля пересобираем, их не переносим из облака
        enemies: freshLineup(initStage, initWave, cloud.ngLevel || 0),
        targetIdx: 0,
        raidActive: null,
        dungeonRun: null,
        rage: 0,
        superActive: false,
        superEndsAt: 0,
        dpsWindow: [],
      }
      if (!merged.maxStage || merged.maxStage < merged.stage) merged.maxStage = merged.stage
      set(merged)
      // пишем только локально, чтобы не словить конфликт с тем же сейвом
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...cloud, savedAt: cloud.savedAt || Date.now() })) } catch {}
      return true
    },

    // Промокоды — заранее заданный набор. После активации награда
    // отправляется письмом в Почту, чтобы игрок её "забрал".
    // ===== календарь логинов =====
    _todayKey() {
      const d = new Date()
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
    canClaimToday() {
      const s = get()
      if (!s.loginCalendar) return false
      if (s.loginCalendar.streak >= CALENDAR_DAYS) return false
      return s.loginCalendar.lastClaimedDate !== get()._todayKey()
    },
    nextCalendarDay() {
      const s = get()
      return Math.min(CALENDAR_DAYS, (s.loginCalendar?.streak || 0) + 1)
    },
    claimCalendarDay() {
      const s = get()
      if (!s.canClaimToday()) return { ok: false, reason: 'already' }
      const day = s.nextCalendarDay()
      const def = getCalendarDay(day)
      if (!def) return { ok: false, reason: 'done' }
      const today = get()._todayKey()
      // Награда уходит письмом, чтобы было ощущение «забрал»
      const lines = []
      if (def.gold)   lines.push(`+${fmtSimple(def.gold)} 🪙`)
      if (def.gems)   lines.push(`+${def.gems} 💎`)
      if (def.shards) lines.push(`+${def.shards} осколков`)
      if (def.ore)    lines.push(`+${def.ore} руды`)
      if (def.legendaryChest) lines.push(`+1 легендарный сундук`)

      get().sendMail({
        title: `Календарь · день ${day}`,
        body: 'Регулярная награда. ' + (lines.join(', ')),
        gold: def.gold || 0,
        gems: def.gems || 0,
        shards: def.shards || 0,
      })

      // Если был легендарный — просто докинем 1 эпический сундук-эквивалент в почту через осколки + гемы
      if (def.legendaryChest) {
        get().sendMail({
          title: 'Сундук Великого пути',
          body: 'Финальная награда календаря. Открой и наслаждайся.',
          gold: 100000, gems: 60, shards: 20,
        })
      }

      const claimed = Array.isArray(s.loginCalendar?.claimedDays) ? s.loginCalendar.claimedDays : []
      set({
        loginCalendar: {
          streak: day,
          lastClaimedDate: today,
          claimedDays: [...claimed, day],
        },
        // руда выдаётся напрямую — приятный буст
        ore: (s.ore || 0) + (def.ore || 0),
      })
      saveState(get())
      // Запланируем напоминание на завтра 09:00 локального времени
      try {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(9, 0, 0, 0)
        notifyDailyReady(tomorrow)
      } catch {}
      return { ok: true, day, def }
    },

    redeemPromo(code) {
      const s = get()
      const norm = String(code || '').trim().toUpperCase()
      if (!norm) return { ok: false, reason: 'empty' }
      const list = s.stats?.promosUsed || []
      if (list.includes(norm)) return { ok: false, reason: 'used' }
      const def = PROMO_CODES[norm]
      if (!def) return { ok: false, reason: 'invalid' }
      // Отправим письмо
      get().sendMail({
        title: `Промокод "${norm}"`,
        body: def.message || 'Награда за промокод. Заберите в Почте!',
        gold: def.gold || 0,
        gems: def.gems || 0,
        shards: def.shards || 0,
      })
      set({
        stats: { ...s.stats, promosUsed: [...list, norm] },
      })
      saveState(get())
      return { ok: true }
    },

    // ===== подземелье =====
    enterChapter(chapterId, startStage = 1) {
      const s = get()
      const ch = getChapter(chapterId)
      if (!ch) return false
      // Не пускаем во вторую главу, если первая не пройдена.
      if (chapterId > 1) {
        const prev = s.dungeonChapterClears[chapterId - 1]
        if (!prev?.completed) return false
      }
      const lineup = buildDungeonLineup(chapterId, startStage)
      set({
        dungeonRun: {
          chapterId,
          stage: startStage,
          prevWorldEnemies: s.enemies,
          prevTargetIdx: s.targetIdx,
        },
        enemies: lineup,
        targetIdx: 0,
      })
      get()._toast?.(`${ch.short} · стадия ${startStage}`)
      return true
    },

    nextDungeonStage() {
      const s = get()
      if (!s.dungeonRun) return false
      const next = s.dungeonRun.stage + 1
      if (next > STAGES_PER_CHAPTER) {
        // Глава пройдена — ниже в _enemyKilled выдаём награду.
        return false
      }
      const lineup = buildDungeonLineup(s.dungeonRun.chapterId, next)
      set({
        dungeonRun: { ...s.dungeonRun, stage: next },
        enemies: lineup,
        targetIdx: 0,
      })
      return true
    },

    exitDungeon() {
      const s = get()
      if (!s.dungeonRun) return
      // Возвращаем мировых врагов
      const restore = (s.dungeonRun.prevWorldEnemies && s.dungeonRun.prevWorldEnemies.length)
        ? s.dungeonRun.prevWorldEnemies
        : freshLineup(s.stage, s.wave)
      set({
        dungeonRun: null,
        enemies: restore,
        targetIdx: Math.min(s.dungeonRun.prevTargetIdx || 0, Math.max(0, restore.length - 1)),
      })
    },

    isStageUnlocked(chapterId, stage) {
      const s = get()
      if (chapterId > 1) {
        const prev = s.dungeonChapterClears[chapterId - 1]
        if (!prev?.completed) return false
      }
      const cl = s.dungeonChapterClears[chapterId]
      const maxOpen = (cl?.stage || 0) + 1
      return stage <= maxOpen
    },

    // ===== почта =====
    sendMail({ title, body, gold = 0, gems = 0, shards = 0 }) {
      const s = get()
      const id = 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
      const item = { id, title, body, gold, gems, shards, ts: Date.now(), claimed: false }
      set({ mail: [item, ...s.mail] })
      saveState(get())
      return id
    },
    claimMail(id) {
      const s = get()
      const m = s.mail.find(x => x.id === id)
      if (!m || m.claimed) return false
      const updated = s.mail.map(x => x.id === id ? { ...x, claimed: true } : x)
      set({
        mail: updated,
        gold: s.gold + (m.gold || 0),
        gems: s.gems + (m.gems || 0),
        artifactShards: s.artifactShards + (m.shards || 0),
      })
      saveState(get())
      return true
    },
    claimAllMail() {
      const s = get()
      let gold = s.gold, gems = s.gems, shards = s.artifactShards
      const updated = s.mail.map(m => {
        if (m.claimed) return m
        gold += m.gold || 0; gems += m.gems || 0; shards += m.shards || 0
        return { ...m, claimed: true }
      })
      set({ mail: updated, gold, gems, artifactShards: shards })
      saveState(get())
    },
    deleteReadMail() {
      set({ mail: get().mail.filter(m => !m.claimed) })
      saveState(get())
    },
    unreadMailCount() {
      return get().mail.filter(m => !m.claimed).length
    },

    // ===== артефакты =====
    artifactLevel(id) { return get().artifactLevels?.[id] || 0 },
    upgradeArtifactCost(id) {
      const lv = get().artifactLevel(id)
      const next = lv + 1
      return artifactUpgradeCost(next)
    },
    upgradeArtifact(id) {
      const s = get()
      const art = getArtifact(id)
      if (!art) return false
      const cost = s.upgradeArtifactCost(id)
      if (s.artifactShards < cost) return false
      const lv = s.artifactLevel(id) + 1
      set({
        artifactShards: s.artifactShards - cost,
        artifactLevels: { ...s.artifactLevels, [id]: lv },
      })
      saveState(get())
      audio.sfxLevelUp()
      return true
    },

    // ===== Активность в игре =====
    // Зовётся каждый кадр, передаём dt в мс. Прибавляем только если окно
    // активно. После каждых 30 минут активной игры — отправляем письмо.
    tickActivity(dt) {
      const s = get()
      const cur = (s.activitySessionMs || 0) + Math.max(0, dt)
      const before = Math.floor((s.activitySessionMs || 0) / (30 * 60 * 1000))
      const after  = Math.floor(cur / (30 * 60 * 1000))
      if (after > before) {
        const stage = Math.max(1, after) // 1, 2, 3, ...
        get()._sendActivityReward(stage)
      }
      set({ activitySessionMs: cur })
    },

    _sendActivityReward(stage) {
      const s = get()
      // Награды нарастают: чем дольше сессия — тем щедрее.
      const gold = 800 * Math.min(20, stage)
      const gems = stage <= 1 ? 2 : stage <= 3 ? 5 : 10
      const shards = stage <= 2 ? 1 : 3
      const ore = 10 + Math.min(80, stage * 4)

      get().sendMail({
        title: `Награда за активность · ${stage * 30} мин`,
        body: `Спасибо, что играете! Заберите подарок: +${gold} 🪙, +${gems} 💎, +${shards} осколков. Руда зачислена сразу: +${ore}.`,
        gold,
        gems,
        shards,
      })

      // Руду прибавляем сразу — ощущается «приятный буст».
      set({
        ore: (s.ore || 0) + ore,
        activitySessionAwarded: (s.activitySessionAwarded || 0) + 1,
      })
      get()._toast?.(`+${ore} руды за активность`)
      saveState(get())
    },

    resetActivitySession() {
      set({ activitySessionMs: 0, activitySessionAwarded: 0 })
    },

    addActivityMs(ms) {
      // Утилита для тестов/инжекта
      const s = get()
      get().tickActivity(ms)
    },

    // ===== СЮЖЕТ =====
    markStorySeen(id) {
      const s = get()
      if (!id) return
      const list = Array.isArray(s.storySeen) ? s.storySeen : []
      if (list.includes(id)) return
      set({ storySeen: [...list, id] })
      saveState(get())
    },

    // ===== ПРЕСТИЖ =====
    prestigeReward() {
      const s = get()
      const stage = Math.max(0, (s.maxStage || s.stage) - 2)
      // 1, 3, 6, 10, 15... (треугольные числа)
      const base = Math.max(0, Math.floor(stage * (stage + 1) / 2))
      // NG+ дополнительно умножает награду
      const ngMult = 1 + 0.5 * (s.ngLevel || 0)
      return Math.floor(base * ngMult)
    },
    // Прогрессивный порог: каждый следующий престиж требует уйти дальше.
    prestigeStageRequired() {
      const s = get()
      const n = s.prestigeCount || 0
      // 1-й престиж — зона 3, 2-й — 5, 3-й — 7, далее +2 за каждый.
      return 3 + n * 2
    },
    canPrestige() {
      const s = get()
      const reach = (s.maxStage || s.stage)
      // Учитываем NG: прохождение виткa тоже считается «уход дальше».
      const effective = reach + 20 * (s.ngLevel || 0)
      return effective >= s.prestigeStageRequired()
    },
    prestigeReset() {
      const s = get()
      if (!s.canPrestige()) return false
      const reward = s.prestigeReward()
      // Сбрасываем прогресс, оставляем: героев (без уровней), души, престиж, таланты,
      // артефакты, оружие — на нашей версии "мягкого" престижа.
      const heroLevels = {}
      for (const id of s.unlockedHeroes) heroLevels[id] = 1
      // Призмы душ открываются после 3 престижей и копятся как 10% от прироста душ.
      const newPrestigeCount = (s.prestigeCount || 0) + 1
      const prismGain = newPrestigeCount >= 3 ? Math.max(1, Math.floor(reward * 0.10)) : 0
      set({
        gold: 0,
        gems: s.gems, // гемы сохраняем
        ore: 0,
        artifactShards: s.artifactShards, // оставляем
        stage: 1,
        maxStage: 1,
        wave: 1,
        ngLevel: 0,
        baseDmg: 1,
        tapLevel: 1,
        passiveLevel: 0,
        weaponTier: 0,
        weaponSharp: {},
        weaponRunes: {},
        heroLevels,
        // Душа сохраняется и пополняется
        souls: (s.souls || 0) + reward,
        prestigeCount: newPrestigeCount,
        soulPrisms: (s.soulPrisms || 0) + prismGain,
        // Таланты не сбрасываются — это мета-прогресс.
        // Война начинается заново
        enemies: freshLineup(1, 1, 0),
        targetIdx: 0,
        rage: 0,
      })
      if (prismGain > 0) {
        get()._toast?.(`Реинкарнация! +${reward} душ, +${prismGain}🔮 призм`)
      } else {
        get()._toast?.(`Реинкарнация! +${reward} душ`)
      }
      saveState(get())
      return true
    },

    // ===== ПРИЗМЫ ДУШ — мета-апгрейды без потолка =====
    // Каждый уровень даёт +1% к статистике, цена растёт 1.4^level.
    // Доступно после 3 престижей.
    soulPrismCost(stat) {
      const s = get()
      const lvl = s.soulPrismLevels?.[stat] || 0
      return Math.ceil(Math.pow(1.4, lvl))
    },
    soulPrismLevel(stat) { return get().soulPrismLevels?.[stat] || 0 },
    upgradeSoulPrism(stat) {
      const s = get()
      const cost = s.soulPrismCost(stat)
      if ((s.soulPrisms || 0) < cost) return false
      const lvl = s.soulPrismLevel(stat) + 1
      set({
        soulPrisms: (s.soulPrisms || 0) - cost,
        soulPrismLevels: { ...s.soulPrismLevels, [stat]: lvl },
      })
      saveState(get())
      get()._toast?.(`Призма ${stat}: ур.${lvl}`)
      return true
    },
    // Сумма бонусов от призм — каждый уровень = +1% к статистике.
    getSoulPrismBonuses() {
      const s = get()
      const lv = s.soulPrismLevels || {}
      return {
        dmg:  (lv.dmg  || 0) * 0.01,
        gold: (lv.gold || 0) * 0.01,
        crit: (lv.crit || 0) * 0.01,
        rage: (lv.rage || 0) * 0.01,
      }
    },

    // ===== ТАЛАНТЫ =====
    talentLevel(branchId, nodeId) {
      return get().talents?.[branchId]?.[nodeId] || 0
    },
    canUpgradeTalent(branchId, nodeId) {
      const s = get()
      const node = getTalent(branchId, nodeId)
      if (!node) return false
      if (node.requires) {
        if (s.talentLevel(branchId, node.requires) <= 0) return false
      }
      const lv = s.talentLevel(branchId, nodeId)
      if (lv >= (node.max || 1)) return false
      const cost = node.cost || 1
      return (s.talentPoints || 0) >= cost
    },
    upgradeTalent(branchId, nodeId) {
      const s = get()
      const node = getTalent(branchId, nodeId)
      if (!node) return false
      if (!s.canUpgradeTalent(branchId, nodeId)) return false
      const cost = node.cost || 1
      const lv = s.talentLevel(branchId, nodeId)
      const branch = s.talents?.[branchId] || {}
      set({
        talentPoints: (s.talentPoints || 0) - cost,
        talents: {
          ...s.talents,
          [branchId]: { ...branch, [nodeId]: lv + 1 },
        },
      })
      saveState(get())
      return true
    },
    resetTalents(forFree = false) {
      const s = get()
      // Возвращаем все вложенные очки.
      let returnedPts = 0
      for (const branch of TALENT_BRANCHES) {
        const t = s.talents?.[branch.id] || {}
        for (const node of branch.nodes) {
          const lv = t[node.id] || 0
          returnedPts += lv * (node.cost || 1)
        }
      }
      // Стоимость сброса (если не бесплатно): 50 гемов, либо 1 душа.
      if (!forFree) {
        if (s.gems < 50 && (s.souls || 0) < 1) return false
        if (s.gems >= 50) set({ gems: s.gems - 50 })
        else set({ souls: (s.souls || 0) - 1 })
      }
      set({
        talents: {},
        talentPoints: (s.talentPoints || 0) + returnedPts,
      })
      saveState(get())
      return true
    },

    // ===== настройки =====
    setSetting(key, value) {
      const s = get()
      set({ settings: { ...s.settings, [key]: value } })
      saveState(get())
    },

    // ===== магазин =====
    openChest(rarity) {
      const s = get()
      const def = CHESTS[rarity]
      if (!def) return { ok: false, reason: 'notfound' }
      if (def.currency === 'gems' && s.gems < def.cost) return { ok: false, reason: 'gems' }
      if (def.currency === 'gold' && s.gold < def.cost) return { ok: false, reason: 'gold' }

      // 1) Гарантированные: золото и руда.
      const reward = {
        gold: def.guaranteedGold || 0,
        ore: def.guaranteedOre || 0,
        gems: 0,
        shards: 0,
        hero: null, dup: false, levelUp: 0,
      }

      // 2) Ролл героя по шансу heroChance.
      const heroRoll = Math.random()
      if (heroRoll < (def.heroChance || 0)) {
        // Выберем редкость героя по распределению.
        const r = Math.random()
        let acc = 0
        let pickedRarity = null
        for (const [k, p] of Object.entries(def.heroRarityChances || {})) {
          acc += p
          if (r <= acc) { pickedRarity = k; break }
        }
        if (pickedRarity) {
          // Раньше премиум-героев из сундуков исключали полностью.
          // Теперь они могут выпасть, но шанс задан в heroRarityChances.
          // Сезонные герои НЕ выпадают из сундуков — они выдаются только
          // как финальная награда премиум-трека Battle Pass.
          const pool = HEROES.filter(h => h.rarity === pickedRarity && h.rarity !== 'season')
          if (pool.length > 0) {
            const hero = pool[Math.floor(Math.random() * pool.length)]
            reward.hero = hero
            const owned = s.unlockedHeroes.includes(hero.id)
            reward.dup = owned
            if (owned) reward.levelUp = 1
          } else {
            // герои этой редкости все собраны / нет — компенсация осколками
            reward.shards += def.fallbackShards
            reward.gold   += def.fallbackGold
          }
        }
      }
      // Если не повезло на героя — добавим небольшую "утешительную" руду
      if (!reward.hero) {
        reward.ore += Math.ceil((def.guaranteedOre || 0) * 0.4)
      }

      const next = {
        gold: s.gold - (def.currency === 'gold' ? def.cost : 0) + reward.gold,
        gems: s.gems - (def.currency === 'gems' ? def.cost : 0) + reward.gems,
        ore:  (s.ore || 0) + reward.ore,
        artifactShards: s.artifactShards + reward.shards,
      }

      // 3) Шанс выпадения снаряжения. Чем «жирнее» сундук — тем выше шанс
      // и шанс на хорошую редкость шмота.
      const gearChances = {
        common:    { chance: 0.25, distrib: { common: 0.85, rare: 0.15 } },
        rare:      { chance: 0.45, distrib: { common: 0.40, rare: 0.50, epic: 0.10 } },
        epic:      { chance: 0.70, distrib: { rare: 0.40, epic: 0.50, legendary: 0.10 } },
        legendary: { chance: 1.00, distrib: { rare: 0.10, epic: 0.55, legendary: 0.35 } },
      }
      const gc = gearChances[rarity]
      reward.gear = []
      if (gc && Math.random() < gc.chance) {
        // легендарка может выдать 2 предмета сразу
        const items = (rarity === 'legendary' && Math.random() < 0.35) ? 2 : 1
        for (let i = 0; i < items; i++) {
          const r = Math.random()
          let acc = 0
          let pickedR = 'common'
          for (const [k, p] of Object.entries(gc.distrib)) {
            acc += p
            if (r <= acc) { pickedR = k; break }
          }
          // Не вызываем _dropGear, чтобы не дублировать тосты.
          // Делаем вручную и добавим в bag через store.
          reward.gear.push({ rarity: pickedR })
        }
      }

      if (reward.hero) {
        if (reward.dup) {
          const cur = s.heroLevels[reward.hero.id] || 1
          next.heroLevels = { ...s.heroLevels, [reward.hero.id]: cur + 1 }
          // Дубликат превращается в осколки этого героя для звёзд.
          const dupShards = { common: 5, rare: 10, epic: 20, legendary: 35, mythic: 60, premium: 80 }
          const shardMul = 1 + (getCityBonuses(s.cityLevels || {}).shardChance || 0)
          const add = Math.ceil((dupShards[reward.hero.rarity] || 5) * shardMul)
          const prev = s.heroShards?.[reward.hero.id] || 0
          next.heroShards = { ...s.heroShards, [reward.hero.id]: prev + add }
          reward.heroShards = add
        } else {
          next.unlockedHeroes = [...s.unlockedHeroes, reward.hero.id]
          next.heroLevels = { ...s.heroLevels, [reward.hero.id]: 1 }
          if (s.party.length < PARTY_SIZE) {
            next.party = [...s.party, reward.hero.id]
          }
        }
      }

      set(next)
      saveState(get())
      get()._bumpStat('chestsOpened', 1); audio.sfxChestOpen(); get().addBpXp(80)
      // Выдаём вышедшие предметы шмота ПОСЛЕ set(next), чтобы они
      // легли в bag и не были стёрты другим set().
      if (reward.gear?.length) {
        for (const g of reward.gear) {
          const item = get()._dropGear({ rarity: g.rarity, silent: true })
          // запомним id для красивого reveal в UI
          g.id = item?.id
        }
      }
      // Шанс яйца питомца из дорогих сундуков
      const eggChance = { common: 0, rare: 0.02, epic: 0.06, legendary: 0.15 }[rarity] || 0
      if (eggChance && Math.random() < eggChance) {
        get().grantPetEgg(1)
        reward.petEgg = true
      }
      return { ok: true, reward }
    },

    // Массовое открытие сундуков (x10 / x30 / x50). Открывает count штук,
    // агрегирует все награды в один набор и делает ОДИН пересчёт состояния —
    // это убирает лаги от множественных set() и анимаций.
    openChestBulk(rarity, count) {
      const s0 = get()
      const def = CHESTS[rarity]
      if (!def) return { ok: false, reason: 'notfound' }
      const totalCost = (def.cost || 0) * count
      if (def.currency === 'gems' && s0.gems < totalCost) return { ok: false, reason: 'gems' }
      if (def.currency === 'gold' && s0.gold < totalCost) return { ok: false, reason: 'gold' }

      const gearChances = {
        common:    { chance: 0.25, distrib: { common: 0.85, rare: 0.15 } },
        rare:      { chance: 0.45, distrib: { common: 0.40, rare: 0.50, epic: 0.10 } },
        epic:      { chance: 0.70, distrib: { rare: 0.40, epic: 0.50, legendary: 0.10 } },
        legendary: { chance: 1.00, distrib: { rare: 0.10, epic: 0.55, legendary: 0.35 } },
      }
      const dupShards = { common: 5, rare: 10, epic: 20, legendary: 35, mythic: 60, premium: 80 }

      // Агрегаторы
      let addGold = 0, addOre = 0, addShards = 0
      const heroResults = []      // [{ hero, dup }]
      const gearRarities = []     // ['epic', 'rare', ...]
      // Рабочие копии, чтобы корректно считать dup для героев, выпавших в этой же пачке
      const unlocked = new Set(s0.unlockedHeroes)
      const heroLevels = { ...s0.heroLevels }
      const heroShards = { ...s0.heroShards }
      let party = [...s0.party]

      for (let n = 0; n < count; n++) {
        addGold += def.guaranteedGold || 0
        addOre  += def.guaranteedOre || 0

        let gotHero = null
        if (Math.random() < (def.heroChance || 0)) {
          const r = Math.random()
          let acc = 0, pickedRarity = null
          for (const [k, p] of Object.entries(def.heroRarityChances || {})) {
            acc += p
            if (r <= acc) { pickedRarity = k; break }
          }
          if (pickedRarity) {
            const pool = HEROES.filter(h => h.rarity === pickedRarity && h.rarity !== 'season')
            if (pool.length > 0) {
              gotHero = pool[Math.floor(Math.random() * pool.length)]
            } else {
              addShards += def.fallbackShards
              addGold   += def.fallbackGold
            }
          }
        }

        if (gotHero) {
          const owned = unlocked.has(gotHero.id)
          if (owned) {
            heroLevels[gotHero.id] = (heroLevels[gotHero.id] || 1) + 1
            const add = dupShards[gotHero.rarity] || 5
            heroShards[gotHero.id] = (heroShards[gotHero.id] || 0) + add
            heroResults.push({ hero: gotHero, dup: true })
          } else {
            unlocked.add(gotHero.id)
            heroLevels[gotHero.id] = 1
            if (party.length < PARTY_SIZE) party.push(gotHero.id)
            heroResults.push({ hero: gotHero, dup: false })
          }
        } else {
          addOre += Math.ceil((def.guaranteedOre || 0) * 0.4)
        }

        // gear
        const gc = gearChances[rarity]
        if (gc && Math.random() < gc.chance) {
          const items = (rarity === 'legendary' && Math.random() < 0.35) ? 2 : 1
          for (let i = 0; i < items; i++) {
            const r = Math.random()
            let acc = 0, pickedR = 'common'
            for (const [k, p] of Object.entries(gc.distrib)) {
              acc += p
              if (r <= acc) { pickedR = k; break }
            }
            gearRarities.push(pickedR)
          }
        }
      }

      // Применяем всё одним set
      set({
        gold: s0.gold - (def.currency === 'gold' ? totalCost : 0) + addGold,
        gems: s0.gems - (def.currency === 'gems' ? totalCost : 0),
        ore:  (s0.ore || 0) + addOre,
        artifactShards: (s0.artifactShards || 0) + addShards,
        unlockedHeroes: Array.from(unlocked),
        heroLevels,
        heroShards,
        party,
      })

      // Выдаём gear после set (он сам делает set по gearBag)
      for (const gr of gearRarities) {
        get()._dropGear({ rarity: gr, silent: true })
      }

      get()._bumpStat('chestsOpened', count)
      audio.sfxChestOpen()
      get().addBpXp(80 * count)
      saveState(get())

      return {
        ok: true,
        bulk: true,
        count,
        rarity,
        summary: {
          gold: addGold,
          ore: addOre,
          shards: addShards,
          heroes: heroResults,
          gearCount: gearRarities.length,
          gearRarities,
        },
      }
    },

    // Открыть сокровищный сундук (без героев) — гарантированные ресурсы.
    openTreasureChest(id) {
      const s = get()
      const def = TREASURE_CHESTS[id]
      if (!def) return { ok: false, reason: 'notfound' }
      if (def.currency === 'gems' && s.gems < def.cost) return { ok: false, reason: 'gems' }
      if (def.currency === 'gold' && s.gold < def.cost) return { ok: false, reason: 'gold' }
      const reward = { gold: def.gold || 0, ore: def.ore || 0, gems: 0, shards: def.shards || 0, hero: null, dup: false, levelUp: 0, gear: [] }
      // Treasure-сундуки гарантированно дают 1–3 предмета шмота
      // среднего качества в зависимости от стоимости.
      const tier = (def.cost >= 6) ? 'l' : (def.cost >= 12000) ? 'm' : 's'
      const cfg = {
        s: { count: 1, distrib: { common: 0.55, rare: 0.40, epic: 0.05 } },
        m: { count: 2, distrib: { common: 0.20, rare: 0.55, epic: 0.22, legendary: 0.03 } },
        l: { count: 3, distrib: { rare: 0.30, epic: 0.55, legendary: 0.15 } },
      }[tier]
      for (let i = 0; i < cfg.count; i++) {
        const r = Math.random()
        let acc = 0
        let pickedR = 'common'
        for (const [k, p] of Object.entries(cfg.distrib)) {
          acc += p
          if (r <= acc) { pickedR = k; break }
        }
        reward.gear.push({ rarity: pickedR })
      }
      set({
        gold: s.gold - (def.currency === 'gold' ? def.cost : 0) + reward.gold,
        gems: s.gems - (def.currency === 'gems' ? def.cost : 0),
        ore:  (s.ore || 0) + reward.ore,
        artifactShards: s.artifactShards + reward.shards,
      })
      // Дроп шмота после set, чтобы не был стёрт.
      for (const g of reward.gear) {
        const item = get()._dropGear({ rarity: g.rarity, silent: true })
        g.id = item?.id
      }
      get()._bumpStat('chestsOpened', 1); audio.sfxChestOpen(); get().addBpXp(80)
      saveState(get())
      return { ok: true, reward }
    },

    // Открыть боссовый сундук — шанс выбить материал из drops.
    openBossChest(id) {
      const s = get()
      const def = BOSS_CHESTS[id]
      if (!def) return { ok: false, reason: 'notfound' }
      if (def.currency === 'gems' && s.gems < def.cost) return { ok: false, reason: 'gems' }
      if (def.currency === 'gold' && s.gold < def.cost) return { ok: false, reason: 'gold' }
      const reward = { gold: def.gold || 0, ore: def.ore || 0, shards: def.shards || 0, gems: 0, hero: null, dup: false, levelUp: 0, mat: null, matCount: 0, gear: [] }

      // Взвешенный пик
      const drops = def.drops || []
      const totalW = drops.reduce((a, x) => a + (x.weight || 0), 0)
      let r = Math.random() * totalW
      let pick = drops[drops.length - 1]
      for (const d of drops) {
        if (r < (d.weight || 0)) { pick = d; break }
        r -= (d.weight || 0)
      }
      const cnt = (pick.min || 1) + Math.floor(Math.random() * Math.max(1, (pick.max || pick.min || 1) - (pick.min || 1) + 1))
      reward.mat = pick.material
      reward.matCount = cnt

      const newMats = { ...s.mats, [pick.material]: (s.mats?.[pick.material] || 0) + cnt }

      // Боссовый сундук гарантировано даёт 1 эпик-предмет, на дорогих
      // сундуках — шанс на легендарку.
      {
        const r2 = Math.random()
        const isPremium = (def.cost || 0) >= 60
        const pickedR = isPremium
          ? (r2 < 0.40 ? 'legendary' : r2 < 0.85 ? 'epic' : 'rare')
          : (r2 < 0.10 ? 'legendary' : r2 < 0.55 ? 'epic' : 'rare')
        reward.gear.push({ rarity: pickedR })
      }

      set({
        gold: s.gold - (def.currency === 'gold' ? def.cost : 0) + reward.gold,
        gems: s.gems - (def.currency === 'gems' ? def.cost : 0),
        ore:  (s.ore || 0) + reward.ore,
        artifactShards: s.artifactShards + reward.shards,
        mats: newMats,
      })
      for (const g of reward.gear) {
        const item = get()._dropGear({ rarity: g.rarity, silent: true })
        g.id = item?.id
      }
      get()._bumpStat('chestsOpened', 1); audio.sfxChestOpen(); get().addBpXp(80)
      saveState(get())
      return { ok: true, reward }
    },

    // Активация буста: boostId — ключ в BOOSTS (dmg, gold, dmg_long, ...).
    activateBoost(boostId) {
      const s = get()
      const def = BOOSTS[boostId]
      if (!def) return false
      if (s.gems < def.cost) return false
      const now = Date.now()

      // Индивидуальный таймер именно для этого буста (продлеваем, если активен).
      const active = { ...(s.boosts?.active || {}) }
      const cur = active[boostId] || 0
      active[boostId] = (cur > now ? cur : now) + def.duration * 1000

      // Пересчитываем агрегаты по типу из активных таймеров — чтобы
      // getTapDamage/getHeroAtk/награда учитывали максимальный множитель.
      const nextBoosts = { ...s.boosts, active }
      const dmgMult = activeBoostMult(nextBoosts, 'dmg', now)
      const goldMult = activeBoostMult(nextBoosts, 'gold', now)
      // Самый поздний таймер среди активных бустов данного типа.
      const latest = (kind) => Object.keys(active).reduce((mx, id) => {
        const d = BOOSTS[id]
        if (d && d.type === kind && active[id] > mx) return active[id]
        return mx
      }, 0)
      nextBoosts.dmgBoostUntil = latest('dmg')
      nextBoosts.goldBoostUntil = latest('gold')
      nextBoosts.dmgBoostMult = dmgMult
      nextBoosts.goldBoostMult = goldMult

      set({ gems: s.gems - def.cost, boosts: nextBoosts })
      saveState(get())
      return true
    },

    // Покупка временного ускорения боя.
    // method: 'gems' (200💎) или 'ad' (бесплатно за просмотр рекламы — демо).
    // mult — множитель скорости, durationMs — длительность.
    buySpeedBoost(method = 'gems', opts = {}) {
      const s = get()
      const cost = opts.cost ?? 200
      const mult = opts.mult ?? 2
      const durationMs = opts.durationMs ?? 15 * 60 * 1000
      if (method === 'gems') {
        if (s.gems < cost) {
          get()._toast?.('Не хватает алмазов')
          return false
        }
        set({ gems: s.gems - cost })
      }
      // method === 'ad' — пока без реальной интеграции SDK, демо: просто включаем
      const now = Date.now()
      const cur = s.boosts?.speedBoostUntil || 0
      // Если буст уже активен — продлеваем; иначе стартуем заново
      const newUntil = (cur > now ? cur : now) + durationMs
      set({
        boosts: {
          ...s.boosts,
          speedBoostUntil: newUntil,
          speedBoostMult: mult,
        },
      })
      get()._toast?.(method === 'ad'
        ? `Скорость x${mult} включена за рекламу`
        : `Скорость x${mult} куплена`)
      saveState(get())
      return true
    },

    // Обмен гемов на ресурс
    convertGems(target, amount) {
      const s = get()
      const def = CONVERTS[target]
      if (!def) return false
      const total = def.cost * amount
      if (s.gems < total) return false
      const result = def.amount * amount
      const next = { gems: s.gems - total }
      if (target === 'gold')   next.gold = s.gold + result
      if (target === 'shards') next.artifactShards = s.artifactShards + result
      set(next)
      saveState(get())
      return true
    },

    // Покупка пакета гемов (имитация)
    buyGemPack(packId) {
      const s = get()
      const p = GEM_PACKS.find(x => x.id === packId)
      if (!p) return false
      set({ gems: s.gems + p.gems })
      get()._toast?.(`+${p.gems}💎 куплено`)
      saveState(get())
      return true
    },

    // ===== оффлайн-награда =====
    // "Просмотр" — что бы получили, не зачисляя.
    peekOffline() {
      const s = get()
      const savedAt = s.savedAt || 0
      if (!savedAt) return null
      const dt = Math.min(OFFLINE_CAP_MS, Date.now() - savedAt)
      if (dt < 30_000) return null
      const dps = s.getPartyDps() + s.getPassiveDps()
      const target = s.enemies[s.targetIdx]
      const goldPerDmg = target ? target.reward / Math.max(1, target.maxHp) : 0.001
      const offlineMul = 1 + (s.getBonuses().offline || 0)
      const gained = Math.floor(dps * (dt / 1000) * 0.6 * goldPerDmg * offlineMul)
      if (gained <= 0) return null
      return { gold: gained, seconds: Math.floor(dt / 1000) }
    },

    // Зачислить оффлайн-награду.
    claimOffline() {
      const s = get()
      const r = s.peekOffline()
      if (!r) {
        saveState(get())
        return null
      }
      set({ gold: s.gold + r.gold })
      // обновим savedAt — иначе при следующем вызове получим то же время
      saveState(get())
      return r
    },

    // ===== БАШНЯ =====
    // Максимальная HP героя в башне.
    _heroMaxHp(heroId) {
      const s = get()
      const hero = getHero(heroId)
      if (!hero) return 100
      const base = HERO_BASE_HP[hero.role] || 90
      const lvl = s.heroLevels?.[heroId] || 1
      const stars = s.heroStars?.[heroId] || 0
      const hpBon = 1 + (s.getBonuses().hp || 0) // в башне с noHeal hp=0 → 1
      // Уровень добавляет 4% за каждый уровень, звёзды по 15%
      const lvlMult = 1 + (lvl - 1) * 0.04
      const starMult = 1 + stars * 0.15
      // Башенные баффы: +HP отряду
      const buffs = s.tower?.run?.buffs || []
      const buffMods = towerBuffMods(buffs)
      const buffMult = 1 + (buffMods.hp || 0)
      return Math.max(50, Math.round(base * lvlMult * starMult * hpBon * buffMult))
    },

    _initPartyHp() {
      const s = get()
      const m = {}
      for (const id of s.party || []) {
        const max = s._heroMaxHp(id)
        m[id] = { hp: max, maxHp: max }
      }
      return m
    },

    _healPartyPct(pct) {
      const s = get()
      const run = s.tower?.run
      if (!run?.partyHp) return
      const m = { ...run.partyHp }
      for (const id of Object.keys(m)) {
        const cur = m[id]
        if (!cur) continue
        m[id] = { ...cur, hp: Math.min(cur.maxHp, Math.round(cur.hp + cur.maxHp * pct)) }
      }
      set({ tower: { ...s.tower, run: { ...run, partyHp: m } } })
    },

    // Войти в башню. Сохраняет текущих врагов мира и начинает с чек-поинта.
    enterTower() {
      const s = get()
      if (s.dungeonRun) return { ok: false, reason: 'busy' }
      if (s.tower?.run) return { ok: false, reason: 'busy' }
      const startFloor = Math.max(1, s.tower?.checkpoint || 1)
      const enemy = buildTowerEnemy(startFloor)
      const partyHp = get()._initPartyHp()
      set({
        tower: {
          ...s.tower,
          run: {
            startedAt: Date.now(),
            prevWorldEnemies: s.enemies,
            prevTargetIdx: s.targetIdx,
            partyHp,
            lastAtkAt: performance.now(),
            buffs: [],
            pendingChest: null,
          },
          floor: startFloor,
        },
        enemies: [enemy],
        targetIdx: 0,
      })
      saveState(get())
      return { ok: true, floor: startFloor }
    },

    // Выйти из башни без поражения. Сохраняем чек-поинт = floor.
    exitTower() {
      const s = get()
      if (!s.tower?.run) return false
      const restore = s.tower.run.prevWorldEnemies?.length
        ? s.tower.run.prevWorldEnemies
        : freshLineup(s.stage, s.wave)
      const checkpoint = Math.max(s.tower.checkpoint || 1, Math.floor(s.tower.floor / TOWER.checkpointEvery) * TOWER.checkpointEvery + 1)
      set({
        tower: {
          ...s.tower,
          checkpoint,
          run: null,
        },
        enemies: restore,
        targetIdx: s.tower.run.prevTargetIdx || 0,
      })
      saveState(get())
      return true
    },

    // Поражение — то же самое, что выход, но с тостом и без бонуса чек-поинта вверх.
    _towerDefeat(reason = 'Отряд пал') {
      const s = get()
      if (!s.tower?.run) return
      const restore = s.tower.run.prevWorldEnemies?.length
        ? s.tower.run.prevWorldEnemies
        : freshLineup(s.stage, s.wave)
      // Чек-поинт остаётся прежним (последний пройденный десяток).
      set({
        tower: {
          ...s.tower,
          run: null,
        },
        enemies: restore,
        targetIdx: s.tower.run.prevTargetIdx || 0,
      })
      get()._toast?.(`${reason} · откат к этажу ${get().tower.checkpoint}`)
      saveState(get())
    },

    // Прошли этаж — обновляем награды и переходим выше.
    // Зовётся из _enemyKilled, когда мы внутри башни (s.tower.run).
    _towerFloorCleared(target) {
      const s = get()
      if (!s.tower?.run) return
      const floor = s.tower.floor
      const reward = towerFloorReward(floor)
      const wk = weekKey()
      const bestThisWeek = s.tower.weekKey === wk ? Math.max(s.tower.bestThisWeek || 0, floor) : floor
      const bestFloor = Math.max(s.tower.bestFloor || 0, floor)

      // Башенные баффы
      const buffs = s.tower.run.buffs || []
      const buffMods = towerBuffMods(buffs)
      const goldMul = 1 + (buffMods.gold || 0)
      const enemyHpMul = 1 + (buffMods.enemyHp || 0)

      // Падение осколка случайному герою из отряда.
      let heroShardsPatch = s.heroShards
      let shardHero = null
      if (reward.heroShard && s.party?.length) {
        const pickedId = s.party[Math.floor(Math.random() * s.party.length)]
        const cur = s.heroShards?.[pickedId] || 0
        heroShardsPatch = { ...s.heroShards, [pickedId]: cur + 1 }
        shardHero = pickedId
      }

      const nextFloor = floor + 1
      let enemy = buildTowerEnemy(nextFloor)
      if (enemyHpMul !== 1) {
        const newMax = Math.max(1, Math.ceil(enemy.maxHp * enemyHpMul))
        enemy = { ...enemy, hp: newMax, maxHp: newMax }
      }

      // Хил отряда между этажами: 25% от макс, на чек-поинте — полный.
      const isCheckpoint = floor % TOWER.checkpointEvery === 0
      const heal = isCheckpoint ? 1.0 : 0.25
      const oldHp = s.tower.run.partyHp || {}
      const newPartyHp = {}
      for (const id of Object.keys(oldHp)) {
        const cur = oldHp[id]
        if (!cur) continue
        newPartyHp[id] = { ...cur, hp: Math.min(cur.maxHp, Math.round(cur.hp + cur.maxHp * heal)) }
      }

      // Каждые 25 — выпадает сундук с выбором.
      let pendingChest = null
      if (nextFloor % 25 === 0 || (floor % 25 === 0 && floor > 0)) {
        // На самом этаже-завершении 25/50/75/100 — открываем выбор после прохода.
        if (floor % 25 === 0 && floor > 0) {
          pendingChest = rollTowerChest()
        }
      }
      // Гарантированные награды каждые 100
      let bonusShards = 0
      let bonusMat = null
      if (floor % 100 === 0 && floor > 0) {
        bonusShards = 5
        const mats = ['dragon', 'lich', 'golem', 'titan', 'hydra', 'archon', 'demon']
        bonusMat = mats[Math.floor(Math.random() * mats.length)]
      }
      const matsPatch = bonusMat
        ? { ...s.mats, [bonusMat]: (s.mats[bonusMat] || 0) + 1 }
        : s.mats

      set({
        gold: s.gold + Math.ceil(reward.gold * goldMul),
        heroShards: heroShardsPatch,
        artifactShards: s.artifactShards + bonusShards,
        mats: matsPatch,
        tower: {
          ...s.tower,
          floor: nextFloor,
          bestFloor,
          bestThisWeek,
          weekKey: wk,
          powerShards: (s.tower.powerShards || 0) + reward.powerShards,
          run: { ...s.tower.run, partyHp: newPartyHp, lastAtkAt: performance.now(), pendingChest },
        },
        enemies: [enemy],
        targetIdx: 0,
      })
      // Чек-поинт каждые 10 этажей
      if (floor % TOWER.checkpointEvery === 0) {
        set({ tower: { ...get().tower, checkpoint: floor + 1 } })
        get()._toast?.(`Чек-поинт: этаж ${floor + 1}`)
      }
      if (reward.powerShards > 0) {
        get()._toast?.(`+${reward.powerShards}✦ частиц силы`)
      }
      if (shardHero) {
        const h = getHero(shardHero)
        if (h) get()._toast?.(`+1 осколок героя ${h.name}`)
      }
      if (bonusMat) {
        get()._toast?.(`Этаж ${floor}: +5 осколков артефактов и 1 ${bonusMat}`)
      }
      if (pendingChest) {
        get()._toast?.(`Этаж ${floor}: сундук с бонусом — выбери один!`)
      }
      saveState(get())
    },

    // Применить выбранный бафф из сундука.
    applyTowerChestPick(buffId) {
      const s = get()
      if (!s.tower?.run?.pendingChest) return false
      const opts = s.tower.run.pendingChest
      const def = (opts.find(o => o.id === buffId)) || TOWER_BUFFS.find(o => o.id === buffId)
      if (!def) return false

      let nextRun = { ...s.tower.run, pendingChest: null }

      // Спецбонусы — мгновенные действия
      if (def.kind === 'special') {
        const partyHp = nextRun.partyHp || {}
        const m = { ...partyHp }
        if (def.stat === 'fullHeal') {
          for (const id of Object.keys(m)) {
            m[id] = { ...m[id], hp: m[id].maxHp }
          }
        } else if (def.stat === 'reviveOne') {
          // Найдём первого мёртвого и оживим до 50% HP
          for (const id of Object.keys(m)) {
            if (m[id].hp <= 0) {
              m[id] = { ...m[id], hp: Math.round(m[id].maxHp * 0.5) }
              break
            }
          }
        }
        nextRun = { ...nextRun, partyHp: m }
      } else {
        nextRun = { ...nextRun, buffs: [...(nextRun.buffs || []), def] }
      }

      set({ tower: { ...s.tower, run: nextRun } })
      get()._toast?.(`Бафф: ${def.name}`)
      saveState(get())
      return true
    },

    // Тик атак врага этажа по отряду. Зовётся в game-loop'е.
    _towerAcc: 0,
    tickTower(dt) {
      const s = get()
      if (!s.tower?.run) return
      // Бьём только если враг жив.
      const enemy = s.enemies[0]
      if (!enemy || enemy.hp <= 0) return
      const floor = s.tower.floor
      const isBoss = !!enemy.isBoss
      const isBig = floor % 100 === 0
      const interval = towerEnemyInterval(floor, isBoss, isBig)
      const last = s.tower.run.lastAtkAt || performance.now()
      const now = performance.now()
      if (now - last < interval) return
      // Цель — случайный живой герой
      const partyHp = s.tower.run.partyHp || {}
      const alive = Object.entries(partyHp).filter(([, v]) => v && v.hp > 0)
      if (!alive.length) {
        get()._towerDefeat('Отряд пал')
        return
      }
      const [pickedId, info] = alive[Math.floor(Math.random() * alive.length)]
      const dmg = towerEnemyAtk(floor, isBoss, isBig)
      const newHp = Math.max(0, info.hp - dmg)
      const next = { ...partyHp, [pickedId]: { ...info, hp: newHp } }
      set({ tower: { ...s.tower, run: { ...s.tower.run, partyHp: next, lastAtkAt: now } } })
      // Если кто-то умер — чекаем поражение
      if (newHp <= 0) {
        const stillAlive = Object.values(next).some(x => x && x.hp > 0)
        if (!stillAlive) {
          get()._towerDefeat('Отряд пал')
          return
        } else {
          const h = getHero(pickedId)
          if (h) get()._toast?.(`${h.name} пал`)
        }
      }
    },

    // Получить активные модификаторы текущего этажа башни (или []).
    getTowerModifiers() {
      const s = get()
      if (!s.tower?.run) return []
      return modifiersAt(s.tower.floor)
    },

    // ===== BOSS RUSH =====
    canStartBossRush() {
      const s = get()
      if (s.bossRushActive) return false
      if (s.dungeonRun || s.tower?.run || s.raidActive) return false
      return Date.now() >= (s.bossRushCooldown || 0)
    },
    startBossRush() {
      const s = get()
      if (!s.canStartBossRush()) return false
      const partyDps = s.getPartyDps() + s.getPassiveDps()
      const enemy = buildRushBoss(0, partyDps)
      const startedAt = Date.now()
      set({
        bossRushActive: {
          startedAt,
          endsAt: startedAt + BOSS_RUSH.duration * 1000,
          killed: 0,
          partyDps,
          prevWorldEnemies: s.enemies,
          prevTargetIdx: s.targetIdx,
        },
        enemies: [enemy],
        targetIdx: 0,
      })
      saveState(get())
      return true
    },
    finishBossRush() {
      const s = get()
      if (!s.bossRushActive) return null
      const r = s.bossRushActive
      const restore = r.prevWorldEnemies?.length
        ? r.prevWorldEnemies
        : freshLineup(s.stage, s.wave, s.ngLevel || 0)
      const rewards = bossRushRewards(r.killed)
      const matsPatch = { ...s.mats }
      for (const k of Object.keys(rewards.mats)) {
        matsPatch[k] = (matsPatch[k] || 0) + rewards.mats[k]
      }
      set({
        bossRushActive: null,
        bossRushCooldown: Date.now() + BOSS_RUSH.cooldown,
        enemies: restore,
        targetIdx: r.prevTargetIdx || 0,
        gems: s.gems + (rewards.gems || 0),
        artifactShards: s.artifactShards + (rewards.shards || 0),
        gloryStars: (s.gloryStars || 0) + (rewards.stars || 0),
        mats: matsPatch,
      })
      get()._toast?.(`Boss Rush: ${r.killed} боссов · +${rewards.stars}⭐ +${rewards.gems}💎`)
      saveState(get())
      return { killed: r.killed, rewards }
    },
    // Вызывается при добивании босса в раше (внутри _enemyKilled)
    _bossRushAdvance() {
      const s = get()
      if (!s.bossRushActive) return
      const next = s.bossRushActive.killed + 1
      // Если вышло время — финиш.
      if (Date.now() >= s.bossRushActive.endsAt) {
        set({ bossRushActive: { ...s.bossRushActive, killed: next } })
        get().finishBossRush()
        return
      }
      const enemy = buildRushBoss(next, s.bossRushActive.partyDps)
      set({
        bossRushActive: { ...s.bossRushActive, killed: next },
        enemies: [enemy],
        targetIdx: 0,
      })
    },
    // Тик таймера. Зовётся в основном loop.
    tickBossRush() {
      const s = get()
      if (!s.bossRushActive) return
      if (Date.now() >= s.bossRushActive.endsAt) {
        get().finishBossRush()
      }
    },

    // ===== ЭСКАЛАЦИЯ РЕЙДОВ =====
    raidEscalationStacks(raidId) {
      return get().raidEscalation?.[raidId] || 0
    },
    // +5% к minDps и rewardGold/rewardMin/rewardMax за каждый стак.
    getEscalatedRaid(raidId) {
      const r = getRaid(raidId)
      if (!r) return null
      const stacks = get().raidEscalationStacks(raidId)
      const mult = 1 + 0.05 * stacks
      return {
        ...r,
        minDps: Math.ceil(r.minDps * mult),
        rewardGold: Math.ceil(r.rewardGold * mult),
        rewardMin: Math.max(r.rewardMin, Math.ceil(r.rewardMin * mult)),
        rewardMax: Math.max(r.rewardMax, Math.ceil(r.rewardMax * mult)),
        _escalation: stacks,
      }
    },

    // ===== ЭКСПЕДИЦИИ =====
    isExpeditionRunning(id) {
      const e = get().expeditions?.[id]
      return !!(e && e.endsAt > Date.now())
    },
    canClaimExpedition(id) {
      const e = get().expeditions?.[id]
      return !!(e && e.endsAt <= Date.now() && !e.claimed)
    },
    expeditionInfo(id) { return get().expeditions?.[id] || null },
    // Запустить экспедицию. heroIds — выбранные герои (должно совпадать с e.heroes).
    startExpedition(id, heroIds) {
      const s = get()
      const def = getExpedition(id)
      if (!def) return false
      if (s.isExpeditionRunning(id)) return false
      if ((s.maxStage || s.stage) < def.minStage) return false
      if (!Array.isArray(heroIds) || heroIds.length !== def.heroes) return false
      // Проверяем, что все герои принадлежат игроку
      for (const hid of heroIds) if (!s.unlockedHeroes.includes(hid)) return false
      const startedAt = Date.now()
      // Город (Гильдия) ускоряет экспедиции — уменьшаем длительность.
      const expedSpeed = getCityBonuses(s.cityLevels || {}).expedSpeed || 0
      const duration = Math.max(60_000, Math.round(def.duration * (1 - Math.min(0.8, expedSpeed))))
      set({
        expeditions: {
          ...s.expeditions,
          [id]: {
            startedAt,
            endsAt: startedAt + duration,
            heroes: heroIds,
            claimed: false,
          },
        },
      })
      saveState(get())
      return true
    },
    // Забрать награду готовой экспедиции.
    claimExpedition(id) {
      const s = get()
      if (!s.canClaimExpedition(id)) return null
      const def = getExpedition(id)
      if (!def) return null
      const r = def.reward
      const matsPatch = { ...s.mats }
      if (r.mat) matsPatch[r.mat] = (matsPatch[r.mat] || 0) + 1
      set({
        gold: s.gold + (r.gold || 0),
        ore: (s.ore || 0) + (r.ore || 0),
        artifactShards: s.artifactShards + (r.shards || 0),
        gems: s.gems + (r.gems || 0),
        gloryStars: (s.gloryStars || 0) + (r.stars || 0),
        mats: matsPatch,
        expeditions: {
          ...s.expeditions,
          [id]: { ...s.expeditions[id], claimed: true },
        },
      })
      saveState(get())
      get()._toast?.(`Экспедиция "${def.name}" завершена!`)
      return r
    },

    // ============================================================
    // ===== Событие «Фестиваль Звездопада» =====
    // ============================================================

    // Гарантирует актуальное окно события и дневные ключи. Возвращает event-объект.
    _ensureEvent() {
      const s = get()
      const win = eventWindow(Date.now())
      let ev = s.event || {}
      let changed = false
      if (ev.cycle !== win.cycle) {
        ev = {
          cycle: win.cycle, tokens: 0, totalTokens: 0, claimedMilestones: [],
          jump: { dayKey: '', attemptsUsed: 0, best: ev?.jump?.best || 0 },
          slot: { dayKey: '', freeUsed: 0 },
        }
        changed = true
      }
      const dk = dayKey()
      if (ev.jump?.dayKey !== dk) {
        ev = { ...ev, jump: { ...ev.jump, dayKey: dk, attemptsUsed: 0 } }
        changed = true
      }
      if (ev.slot?.dayKey !== dk) {
        ev = { ...ev, slot: { ...ev.slot, dayKey: dk, freeUsed: 0 } }
        changed = true
      }
      if (changed) set({ event: ev })
      return get().event
    },

    // Статус события для UI: время до конца, активно ли.
    eventStatus() {
      const win = eventWindow(Date.now())
      const ev = get().event || {}
      return {
        active: true,
        endsAt: win.endsAt,
        msLeft: Math.max(0, win.endsAt - Date.now()),
        tokens: ev.tokens || 0,
        totalTokens: ev.totalTokens || 0,
      }
    },

    // Сколько попыток прыжков осталось сегодня.
    eventJumpAttemptsLeft() {
      const ev = get()._ensureEvent()
      return Math.max(0, JUMP_DAILY_ATTEMPTS - (ev.jump?.attemptsUsed || 0))
    },

    // Начать попытку прыжков — списывает одну попытку. Возвращает ok.
    eventStartJump() {
      const ev = get()._ensureEvent()
      if ((ev.jump?.attemptsUsed || 0) >= JUMP_DAILY_ATTEMPTS) return { ok: false, reason: 'no_attempts' }
      set({ event: { ...ev, jump: { ...ev.jump, attemptsUsed: (ev.jump.attemptsUsed || 0) + 1 } } })
      saveState(get())
      return { ok: true }
    },

    // Завершить попытку прыжков с результатом tiles (сколько плит пройдено).
    // Начисляет звёздную пыль + золото (с масштабом). Обновляет лучший результат.
    eventFinishJump(tiles = 0) {
      const s = get()
      const ev = s._ensureEvent()
      const t = Math.max(0, Math.floor(tiles))
      const tokens = t * JUMP_TOKENS_PER_TILE
      const scale = rewardScale({ stage: s.stage, maxStage: s.maxStage, ngLevel: s.ngLevel })
      const gold = Math.floor(t * JUMP_GOLD_PER_TILE * scale)
      const best = Math.max(ev.jump?.best || 0, t)
      set({
        gold: s.gold + gold,
        event: {
          ...ev,
          tokens: (ev.tokens || 0) + tokens,
          totalTokens: (ev.totalTokens || 0) + tokens,
          jump: { ...ev.jump, best },
        },
      })
      if (t > 0) { audio.sfxLevelUp() } 
      get()._bumpGoldEarned(gold)
      get().addBpXp(20 + t * 2)
      saveState(get())
      return { ok: true, tiles: t, tokens, gold, best, newBest: t >= best }
    },

    // Сколько бесплатных прокруток автомата осталось сегодня.
    eventSlotFreeLeft() {
      const ev = get()._ensureEvent()
      return Math.max(0, SLOT_FREE_PER_DAY - (ev.slot?.freeUsed || 0))
    },

    // Можно ли крутить автомат указанной оплатой ('free'|'tokens'|'gems').
    eventCanSpin(pay) {
      const s = get()
      const ev = s._ensureEvent()
      if (pay === 'free') return (ev.slot?.freeUsed || 0) < SLOT_FREE_PER_DAY
      if (pay === 'tokens') return (ev.tokens || 0) >= SLOT_COST_TOKENS
      if (pay === 'gems') return (s.gems || 0) >= SLOT_GEM_COST
      return false
    },

    // Крутить Звёздный автомат. pay: 'free'|'tokens'|'gems'.
    // Возвращает { ok, item, amount, hero?, dup?, gearItem? } — UI проигрывает анимацию.
    eventSpinSlot(pay = 'free') {
      const s = get()
      const ev = s._ensureEvent()
      // оплата
      if (!s.eventCanSpin(pay)) return { ok: false, reason: pay }

      const patch = {}
      let nextEvent = { ...ev, slot: { ...ev.slot } }
      if (pay === 'free') {
        nextEvent.slot.freeUsed = (ev.slot?.freeUsed || 0) + 1
      } else if (pay === 'tokens') {
        nextEvent.tokens = (ev.tokens || 0) - SLOT_COST_TOKENS
      } else if (pay === 'gems') {
        patch.gems = (s.gems || 0) - SLOT_GEM_COST
      }

      // выбор приза
      const pick = weightedPick(SLOT_ITEMS)
      const scale = rewardScale({ stage: s.stage, maxStage: s.maxStage, ngLevel: s.ngLevel })
      const result = { ok: true, itemId: pick.id, kind: pick.kind, label: pick.label, icon: pick.icon, color: pick.color }

      if (pick.kind === 'gold') {
        const amt = Math.floor((pick.min + Math.random() * (pick.max - pick.min)) * scale)
        patch.gold = (patch.gold ?? s.gold) + amt
        result.amount = amt
        get()._bumpGoldEarned(amt)
      } else if (pick.kind === 'ore') {
        const amt = Math.floor((pick.min + Math.random() * (pick.max - pick.min)) * scale)
        patch.ore = (s.ore || 0) + amt
        result.amount = amt
      } else if (pick.kind === 'shards') {
        const amt = Math.floor((pick.min + Math.random() * (pick.max - pick.min)) * Math.max(1, scale * 0.6))
        patch.artifactShards = (s.artifactShards || 0) + amt
        result.amount = amt
      } else if (pick.kind === 'gems') {
        const amt = Math.floor(pick.min + Math.random() * (pick.max - pick.min))
        patch.gems = (patch.gems ?? s.gems) + amt
        result.amount = amt
      } else if (pick.kind === 'tokens') {
        const amt = Math.floor(pick.min + Math.random() * (pick.max - pick.min))
        nextEvent.tokens = (nextEvent.tokens || 0) + amt
        nextEvent.totalTokens = (nextEvent.totalTokens || 0) + amt
        result.amount = amt
      }

      patch.event = nextEvent
      set(patch)

      // gear/hero выдаём после set (они делают собственные set по bag/heroes)
      if (pick.kind === 'gear') {
        const gi = weightedIndex(pick.gearWeights || [1])
        const rarity = (pick.gearRarity || ['rare'])[gi] || 'rare'
        const item = get()._dropGear({ rarity, silent: true })
        result.gearItem = item
        result.rarity = item?.rarity || rarity
      } else if (pick.kind === 'hero') {
        const gi = weightedIndex(pick.heroWeights || [1])
        const rarity = (pick.heroRarity || ['rare'])[gi] || 'rare'
        const r = get()._grantRandomHero(rarity)
        result.hero = r?.hero || null
        result.dup = r?.dup || false
        result.rarity = r?.hero?.rarity || rarity
      }

      audio.sfxChestOpen()
      get().addBpXp(40)
      saveState(get())
      return result
    },

    // Выдать случайного героя заданной редкости (или ближайшей доступной).
    // Дубликат → осколки. Возвращает { hero, dup }.
    _grantRandomHero(rarity) {
      const s = get()
      const order = ['mythic', 'legendary', 'epic', 'rare', 'common']
      let pool = []
      let startIdx = order.indexOf(rarity)
      if (startIdx < 0) startIdx = order.indexOf('rare')
      for (let i = startIdx; i < order.length; i++) {
        pool = HEROES.filter(h => h.rarity === order[i])
        if (pool.length) break
      }
      if (!pool.length) return null
      const hero = pool[Math.floor(Math.random() * pool.length)]
      const owned = s.unlockedHeroes.includes(hero.id)
      if (owned) {
        const dupShards = { common: 5, rare: 10, epic: 20, legendary: 35, mythic: 60, premium: 80 }
        const add = dupShards[hero.rarity] || 5
        set({
          heroLevels: { ...s.heroLevels, [hero.id]: (s.heroLevels[hero.id] || 1) + 1 },
          heroShards: { ...s.heroShards, [hero.id]: (s.heroShards?.[hero.id] || 0) + add },
        })
        return { hero, dup: true, shards: add }
      }
      const party = s.party.length < PARTY_SIZE ? [...s.party, hero.id] : s.party
      set({
        unlockedHeroes: [...s.unlockedHeroes, hero.id],
        heroLevels: { ...s.heroLevels, [hero.id]: 1 },
        party,
      })
      audio.sfxFanfare()
      return { hero, dup: false }
    },

    // Список порогов трека с состоянием для UI.
    eventMilestones() {
      const ev = get()._ensureEvent()
      const total = ev.totalTokens || 0
      const claimed = ev.claimedMilestones || []
      return EVENT_MILESTONES.map((m, idx) => ({
        ...m, idx,
        reached: total >= m.need,
        claimed: claimed.includes(idx),
        canClaim: total >= m.need && !claimed.includes(idx),
      }))
    },

    // Забрать награду порога трека. idx — индекс в EVENT_MILESTONES.
    eventClaimMilestone(idx) {
      const s = get()
      const ev = s._ensureEvent()
      const m = EVENT_MILESTONES[idx]
      if (!m) return { ok: false, reason: 'notfound' }
      if ((ev.totalTokens || 0) < m.need) return { ok: false, reason: 'locked' }
      if ((ev.claimedMilestones || []).includes(idx)) return { ok: false, reason: 'claimed' }

      const r = m.reward || {}
      const scale = rewardScale({ stage: s.stage, maxStage: s.maxStage, ngLevel: s.ngLevel })
      const patch = {
        event: { ...ev, claimedMilestones: [...(ev.claimedMilestones || []), idx] },
      }
      const granted = { gold: 0, gems: 0, ore: 0, shards: 0, tokens: 0 }
      if (r.gold)   { granted.gold = Math.floor(r.gold * scale); patch.gold = s.gold + granted.gold; get()._bumpGoldEarned(granted.gold) }
      if (r.gems)   { granted.gems = r.gems; patch.gems = (patch.gems ?? s.gems) + r.gems }
      if (r.ore)    { granted.ore = Math.floor(r.ore * scale); patch.ore = (s.ore || 0) + granted.ore }
      if (r.shards) { granted.shards = Math.floor(r.shards * Math.max(1, scale * 0.6)); patch.artifactShards = (s.artifactShards || 0) + granted.shards }
      if (r.tokens) { granted.tokens = r.tokens; patch.event.tokens = (patch.event.tokens || ev.tokens || 0) + r.tokens }

      set(patch)

      if (r.eggs) { get().grantPetEgg(r.eggs); granted.eggs = r.eggs }
      if (r.gear) { const item = get()._dropGear({ rarity: r.gear, silent: true }); granted.gearItem = item }
      if (r.hero) { const h = get()._grantRandomHero(r.hero); granted.hero = h?.hero || null; granted.dup = h?.dup || false }

      audio.sfxFanfare()
      get().addBpXp(120)
      saveState(get())
      return { ok: true, reward: r, granted, label: m.label }
    },

    // сброс прогресса
    hardReset() {
      try { localStorage.removeItem(SAVE_KEY) } catch {}
      set({
        ...DEFAULT_STATE,
        enemies: freshLineup(1, 1),
        targetIdx: 0,
      })
    },
  }
})
