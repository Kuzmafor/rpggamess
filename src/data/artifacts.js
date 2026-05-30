// Артефакты — пассивные бонусы.
// На уровне 1 даёт base, каждый следующий уровень — +per (аддитивно к множителю).
// До soft cap = 50 — линейный рост, после — логарифмический slope:
//   bonus(L) = base + per * (cap-1) + per * 2 * log10(1 + (L - cap))
// Прокачка стоит shards (растёт по 1.5 до cap, после 1.65).
//
// Каждые 5 уровней герой получает уровень "созвездия" — мини-апгрейд эффекта.
// Уровень созвездия = floor(level / 5). Каждый уровень созвездия добавляет
// +20% к bonus.

const ARTIFACT_SOFT_CAP = 50

export const ARTIFACTS = [
  { id: 'amulet',   name: 'Амулет ярости',     icon: 'flame',    desc: 'Урон героев',         stat: 'dmg',  base: 0.05, per: 0.04, color: '#ff7a2a' },
  { id: 'helm',     name: 'Шлем стража',       icon: 'shield',   desc: 'HP отряда',           stat: 'hp',   base: 0.06, per: 0.04, color: '#67d6ff' },
  { id: 'ring',     name: 'Кольцо алчности',   icon: 'gold',     desc: 'Получаемое золото',   stat: 'gold', base: 0.05, per: 0.04, color: '#ffd166' },
  { id: 'lens',     name: 'Линза охотника',    icon: 'crown',    desc: 'Шанс крита',          stat: 'crit', base: 0.04, per: 0.03, color: '#a072ff' },
  { id: 'horn',     name: 'Рог битвы',         icon: 'bolt',     desc: 'Прирост ярости',      stat: 'rage', base: 0.06, per: 0.05, color: '#ffe27a' },
  { id: 'idol',     name: 'Идол судьбы',       icon: 'gem',      desc: 'Все статы',           stat: 'all',  base: 0.02, per: 0.02, color: '#7c5cff' },
];

export function getArtifact(id) {
  return ARTIFACTS.find(a => a.id === id);
}

// Базовый бонус по уровню (без созвездий).
function rawArtifactBonus(art, level) {
  if (!art || !level) return 0;
  if (level <= ARTIFACT_SOFT_CAP) {
    return art.base + art.per * (level - 1);
  }
  const atCap = art.base + art.per * (ARTIFACT_SOFT_CAP - 1);
  const extra = level - ARTIFACT_SOFT_CAP;
  return atCap + art.per * 2 * Math.log10(1 + extra);
}

export function constellationLevel(level) {
  return Math.floor((level || 0) / 5);
}

// Итоговый бонус с учётом созвездий: +20% к bonus за каждый уровень созвездия.
export function artifactBonus(art, level) {
  if (!art || !level) return 0;
  const raw = rawArtifactBonus(art, level)
  const cMul = 1 + 0.2 * constellationLevel(level)
  return raw * cMul;
}

export function artifactUpgradeCost(level) {
  if (level <= ARTIFACT_SOFT_CAP) {
    return Math.floor(3 * Math.pow(1.5, level - 1));
  }
  const atCap = 3 * Math.pow(1.5, ARTIFACT_SOFT_CAP - 1)
  const extra = level - ARTIFACT_SOFT_CAP;
  return Math.floor(atCap * Math.pow(1.65, extra));
}

export const ARTIFACT_SOFT_CAP_LEVEL = ARTIFACT_SOFT_CAP;
