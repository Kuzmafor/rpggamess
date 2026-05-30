// Boss Rush. 2 минуты — бить столько боссов, сколько успеешь.
// Кулдаун — 22 часа (раз в день).
// Награда: материалы рейдов, осколки артефактов, гемы и НОВАЯ валюта — "звёзды славы" (gloryStars).
// Звёзды славы — пока нигде больше не выпадают, тратятся в Грифон-мерчанте (заход 2).

import { ZONE_BOSSES } from './enemies.js'

export const BOSS_RUSH = {
  duration: 120, // секунд
  cooldown: 22 * 60 * 60 * 1000, // 22 часа
  // Базовая HP босса в раше = от твоего DPS, чтобы убивался за ~5-8 секунд при первом боссе.
  // С каждым последующим боссом HP растёт по 1.35.
  hpExp: 1.35,
  baseHpFromDps: 5,
}

export function buildRushBoss(idx, partyDps) {
  const b = ZONE_BOSSES[idx % ZONE_BOSSES.length]
  const baseHp = Math.max(800, Math.ceil(partyDps * BOSS_RUSH.baseHpFromDps))
  const hp = Math.ceil(baseHp * Math.pow(BOSS_RUSH.hpExp, idx))
  return {
    ...b,
    isBoss: true,
    uid: `rush_${idx}_${Date.now()}`,
    hp, maxHp: hp,
    reward: 0,
    element: 'dark',
    phases: [], phasesActive: [],
    shield: 0, enrage: false, roleLock: null,
    statuses: {},
  }
}

// Выпадение материалов и звёзд славы за каждого добитого босса.
// Чем больше боссов — тем выше дроп (растёт по 1.18 от номера).
export function bossRushRewards(killedCount) {
  const stars = 0
  const out = {
    stars: 0,
    gems: 0,
    shards: 0,
    mats: {},
  }
  // Каждые 2 босса — 1 материал случайного рейда.
  const matCount = Math.floor(killedCount / 2)
  const matKeys = ['dragon', 'lich', 'golem', 'titan', 'hydra', 'archon', 'demon', 'phoenix', 'warden']
  for (let i = 0; i < matCount; i++) {
    const k = matKeys[Math.floor(Math.random() * matKeys.length)]
    out.mats[k] = (out.mats[k] || 0) + 1
  }
  // Звёзды славы: 1 за каждые 3 босса
  out.stars = Math.floor(killedCount / 3)
  // Бонус: за 5+, 10+, 15+ — порционально гемы и осколки
  if (killedCount >= 5)  { out.gems += 1; out.shards += 2 }
  if (killedCount >= 10) { out.gems += 2; out.shards += 5 }
  if (killedCount >= 15) { out.gems += 5; out.shards += 10 }
  if (killedCount >= 20) { out.gems += 10; out.shards += 20; out.stars += 5 }
  return out
}
