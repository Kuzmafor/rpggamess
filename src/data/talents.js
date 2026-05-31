// Дерево талантов: 4 ветки. Каждый узел требует очки талантов
// и опционально предыдущий узел в той же ветке.
// effect — описание для UI; в сторе бонус считается через talentBonuses().

export const TALENT_BRANCHES = [
  {
    id: 'fighter', label: 'Боец', color: '#ff7a2a', icon: 'tabBattle',
    desc: 'Сила тапа, урон отряда и крит шанс.',
    nodes: [
      { id: 'f1', label: 'Жёсткий тап',     cost: 1, max: 5, tap: 0.08 },
      { id: 'f2', label: 'Боевая школа',    cost: 1, max: 5, dmg: 0.05, requires: 'f1' },
      { id: 'f3', label: 'Точный удар',     cost: 1, max: 5, crit: 0.02, requires: 'f1' },
      { id: 'f4', label: 'Берсерк',         cost: 2, max: 5, dmg: 0.08, requires: 'f2' },
      { id: 'f5', label: 'Король арены',    cost: 3, max: 3, dmg: 0.15, crit: 0.03, requires: 'f4' },
    ],
  },
  {
    id: 'mage', label: 'Маг', color: '#a072ff', icon: 'flame',
    desc: 'Усиление ультов, ярость и крит.',
    nodes: [
      { id: 'm1', label: 'Чтение рун',      cost: 1, max: 5, rage: 0.05 },
      { id: 'm2', label: 'Магия удачи',     cost: 1, max: 5, crit: 0.03, requires: 'm1' },
      { id: 'm3', label: 'Школа стихий',    cost: 2, max: 5, dmg: 0.05, rage: 0.05, requires: 'm1' },
      { id: 'm4', label: 'Поток силы',      cost: 2, max: 5, dmg: 0.08, requires: 'm3' },
      { id: 'm5', label: 'Архимаг',         cost: 3, max: 3, dmg: 0.10, crit: 0.05, rage: 0.05, requires: 'm4' },
    ],
  },
  {
    id: 'merchant', label: 'Торговец', color: '#ffd166', icon: 'gold',
    desc: 'Больше золота и оффлайн-выгода.',
    nodes: [
      { id: 't1', label: 'Меркантильность', cost: 1, max: 5, gold: 0.05 },
      { id: 't2', label: 'Торговля',        cost: 1, max: 5, gold: 0.08, requires: 't1' },
      { id: 't3', label: 'Связи',           cost: 1, max: 5, offline: 0.10, requires: 't1' },
      { id: 't4', label: 'Барыга',          cost: 2, max: 5, gold: 0.10, requires: 't2' },
      { id: 't5', label: 'Король рынка',    cost: 3, max: 3, gold: 0.15, offline: 0.10, requires: 't4' },
    ],
  },
  {
    id: 'smith', label: 'Кузнец', color: '#67d6ff', icon: 'ore',
    desc: 'Добыча руды и эффект оружия.',
    nodes: [
      { id: 's1', label: 'Шахтёр',          cost: 1, max: 5, ore: 0.10 },
      { id: 's2', label: 'Мастер',          cost: 1, max: 5, ore: 0.15, requires: 's1' },
      { id: 's3', label: 'Острая заточка',  cost: 2, max: 5, weapon: 0.04, requires: 's1' },
      { id: 's4', label: 'Алхимик руды',    cost: 2, max: 5, ore: 0.10, weapon: 0.03, requires: 's2' },
      { id: 's5', label: 'Великий кузнец',  cost: 3, max: 3, weapon: 0.10, ore: 0.20, requires: 's4' },
    ],
  },
]

export function getTalent(branchId, nodeId) {
  const b = TALENT_BRANCHES.find(x => x.id === branchId)
  if (!b) return null
  return b.nodes.find(n => n.id === nodeId) || null
}

// Подсчёт совокупных бонусов от всех вложенных талантов.
// talents — мапа { [branchId]: { [nodeId]: level } }
export function talentBonuses(talents) {
  const acc = { dmg: 0, gold: 0, crit: 0, rage: 0, ore: 0, weapon: 0, offline: 0, tap: 0 }
  for (const branch of TALENT_BRANCHES) {
    const branchT = talents?.[branch.id] || {}
    for (const node of branch.nodes) {
      const lv = branchT[node.id] || 0
      if (lv <= 0) continue
      for (const k of Object.keys(acc)) {
        if (node[k]) acc[k] += node[k] * lv
      }
    }
  }
  return acc
}
