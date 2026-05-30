// Сундуки в башне: каждые 25 этажей выпадает выбор из 3 случайных бонусов.
// Бонусы действуют только до конца текущего забега (до выхода или поражения).
// Бонусы складываются: можно взять несколько одноразово.

export const TOWER_BUFFS = [
  { id: 'dmgX',     name: '+25% урона',         desc: 'Весь отряд бьёт сильнее.', kind: 'mult', stat: 'dmg', value: 0.25 },
  { id: 'dmgXX',    name: '+50% урона',         desc: 'Серьёзный буст к урону.',  kind: 'mult', stat: 'dmg', value: 0.50 },
  { id: 'hpX',      name: '+30% HP отряда',     desc: 'Отряд держится дольше.',   kind: 'mult', stat: 'hp',  value: 0.30 },
  { id: 'hpHeal',   name: 'Полное восстановление', desc: 'Воскрешает павших и хилит до полного.', kind: 'special', stat: 'fullHeal' },
  { id: 'critX',    name: '+15% шанса крита',   desc: 'Критов больше, проще пробивать боссов.', kind: 'add', stat: 'crit', value: 0.15 },
  { id: 'rageX',    name: '+50% к ярости',      desc: 'Супер копится быстрее.',   kind: 'add', stat: 'rage', value: 0.50 },
  { id: 'speedX',   name: '+25% скорости атак', desc: 'Герои бьют чаще.',         kind: 'mult', stat: 'speed', value: 0.25 },
  { id: 'goldX',    name: '+50% золота',        desc: 'Больше дохода с этажей.',  kind: 'add', stat: 'gold', value: 0.50 },
  { id: 'shrink',   name: '−20% HP врагам',     desc: 'Враги слабее на этом забеге.', kind: 'mult', stat: 'enemyHp', value: -0.20 },
  { id: 'revive',   name: 'Возрождение павшего', desc: 'Один павший герой оживает с 50% HP.', kind: 'special', stat: 'reviveOne' },
]

// Случайный выбор 3 разных бонусов
export function rollTowerChest() {
  const pool = [...TOWER_BUFFS]
  const out = []
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool[idx])
    pool.splice(idx, 1)
  }
  return out
}

// Сумма множителей выбранных баффов на отряд (для урона/скорости/HP).
export function towerBuffMods(buffs) {
  const out = { dmg: 0, hp: 0, speed: 0, enemyHp: 0, gold: 0, crit: 0, rage: 0 }
  for (const b of buffs || []) {
    const def = TOWER_BUFFS.find(x => x.id === b.id) || b
    if (def.stat in out) {
      out[def.stat] += def.value || 0
    }
  }
  return out
}
