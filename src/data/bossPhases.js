// Фазы боссов. Список фаз с триггером по доле HP — фаза активируется
// когда HP падает ниже threshold (1 -> 0). Эффекты:
//   shield        — урон x0.45 пока не снят (исчезает на следующей фазе)
//   enrage        — у босса входящий мульт уменьшается, его пассивная регенерация ярости — x2
//   summonAdds    — добавляет миньонов в шеренгу (n штук)
//   roleLock      — по этой цели работают ТОЛЬКО герои указанной роли (тапы тоже отключены)
//
// Босс попадает к фазе по индексу — самая верхняя ещё не активная фаза с
// thresholdPct >= currentHpPct активируется. Активированные складываются стеком.

export const BOSS_PHASES = {
  boss_troll: [
    { atPct: 0.6, type: 'enrage',   message: 'Тролль приходит в ярость' },
  ],
  boss_golem: [
    { atPct: 0.7, type: 'shield',   message: 'Голем закрылся щитом' },
    { atPct: 0.4, type: 'summonAdds', count: 1, message: 'Голем призывает осколок' },
  ],
  boss_skullking: [
    { atPct: 0.66, type: 'summonAdds', count: 2, message: 'Костяной король поднимает скелетов' },
    { atPct: 0.33, type: 'roleLock', role: 'mage', message: 'Костяная аура: только маги наносят урон' },
  ],
  boss_firedemon: [
    { atPct: 0.7, type: 'shield',   message: 'Огненный щит впитывает удары' },
    { atPct: 0.5, type: 'enrage',   message: 'Демон в ярости' },
    { atPct: 0.25, type: 'summonAdds', count: 2, message: 'Призваны имп-метатели' },
  ],
  boss_icehydra: [
    { atPct: 0.66, type: 'summonAdds', count: 2, message: 'Гидра отращивает головы' },
    { atPct: 0.33, type: 'shield',   message: 'Ледяной панцирь' },
  ],
  boss_stormtitan: [
    { atPct: 0.75, type: 'enrage',   message: 'Гром усиливается' },
    { atPct: 0.5,  type: 'roleLock', role: 'ranged', message: 'Молния заземлена: бьют только стрелки' },
    { atPct: 0.25, type: 'shield',   message: 'Грозовой барьер' },
  ],
  boss_shadowarchon: [
    { atPct: 0.66, type: 'roleLock', role: 'mage',   message: 'Архонт ставит контр-чары: только маги' },
    { atPct: 0.5,  type: 'summonAdds', count: 2, message: 'Из теней выходят слуги' },
    { atPct: 0.25, type: 'roleLock', role: 'melee', message: 'Финальная аура: только ближний бой' },
  ],
}

export function getPhasesForSprite(sprite) {
  return BOSS_PHASES[sprite] || []
}

// Стихии боссов и их слабости.
export const BOSS_ELEMENT = {
  boss_troll:        'poison',
  boss_golem:        'light',
  boss_skullking:    'dark',
  boss_firedemon:    'fire',
  boss_icehydra:     'ice',
  boss_stormtitan:   'lightning',
  boss_shadowarchon: 'dark',
}

// Стихии обычных мобов (для треугольника слабостей в обычных волнах).
export const COMMON_ELEMENT = {
  goblin:       'poison',
  skeleton:     'dark',
  orc:          'fire',
  wolf:         'ice',
  ghost:        'dark',
  kobold:       'poison',
  darkmage:     'dark',
  zombie:       'poison',
  imp:          'fire',
  imp_thrower:  'fire',
}
