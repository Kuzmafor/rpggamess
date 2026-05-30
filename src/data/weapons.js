// Эволюция оружия: длинная линейка от деревянного меча до космических артефактов.
// dmgMult — множитель к базовому DPS.
// cost     — золото за эволюцию (растёт экспоненциально).
// sprite   — SVG-спрайт. Новые ступени переиспользуют существующие спрайты
//            с разной подкраской/glow (это позволяет не рисовать каждый раз новый SVG,
//            но визуально оружие явно отличается за счёт цвета и подписи).
// glow     — цвет ореола. Используется и в карточке, и в WeaponHud в арене.

export const WEAPONS = [
  // ===== Базовый путь (Деревянный → Серебряный) =====
  { tier: 0,  sprite: 'w_wood',   name: 'Деревянный меч',      icon: '🪵', dmgMult: 1,       cost: 0,           glow: '#9c8b6b' },
  { tier: 1,  sprite: 'w_wood',   name: 'Грубый меч',           icon: '🪵', dmgMult: 1.6,     cost: 250,         glow: '#b89c6e' },
  { tier: 2,  sprite: 'w_steel',  name: 'Стальной меч',         icon: '🗡️', dmgMult: 2.5,     cost: 500,         glow: '#c9d4dd' },
  { tier: 3,  sprite: 'w_steel',  name: 'Закалённая сталь',     icon: '🗡️', dmgMult: 4,       cost: 1500,        glow: '#dde6ef' },
  { tier: 4,  sprite: 'w_silver', name: 'Серебряный клинок',    icon: '⚔️', dmgMult: 6,       cost: 5000,        glow: '#e8eef7' },
  { tier: 5,  sprite: 'w_silver', name: 'Лунное серебро',       icon: '⚔️', dmgMult: 9,       cost: 12000,       glow: '#dfe6ff' },

  // ===== Стихийный путь =====
  { tier: 6,  sprite: 'w_fire',   name: 'Огненный клинок',      icon: '🔥', dmgMult: 15,      cost: 30000,       glow: '#ff7a2a' },
  { tier: 7,  sprite: 'w_fire',   name: 'Пламя инферно',        icon: '🔥', dmgMult: 22,      cost: 75000,       glow: '#ff5a2a' },
  { tier: 8,  sprite: 'w_ice',    name: 'Ледяной клинок',       icon: '❄️', dmgMult: 35,      cost: 200000,      glow: '#67d6ff' },
  { tier: 9,  sprite: 'w_ice',    name: 'Морозная буря',        icon: '❄️', dmgMult: 52,      cost: 460000,      glow: '#9fe1ff' },
  { tier: 10, sprite: 'w_storm',  name: 'Грозовой клинок',      icon: '⚡', dmgMult: 80,      cost: 1200000,     glow: '#ffd84a' },
  { tier: 11, sprite: 'w_storm',  name: 'Молот тысячи бурь',    icon: '⚡', dmgMult: 120,     cost: 2700000,     glow: '#ffe864' },

  // ===== Тёмный / световой путь =====
  { tier: 12, sprite: 'w_shadow', name: 'Теневой клинок',       icon: '🌑', dmgMult: 180,     cost: 7000000,     glow: '#a072ff' },
  { tier: 13, sprite: 'w_shadow', name: 'Клинок пустоты',       icon: '🌑', dmgMult: 260,     cost: 16000000,    glow: '#7c5cff' },
  { tier: 14, sprite: 'w_shadow', name: 'Жнец Бездны',          icon: '⚜️', dmgMult: 380,     cost: 38000000,    glow: '#5e3dff' },

  // ===== Финал — мифические артефакты =====
  { tier: 15, sprite: 'w_fate',   name: 'Клинок Судьбы',        icon: '🌟', dmgMult: 550,     cost: 40000000,    glow: '#ffe27a' },
  { tier: 16, sprite: 'w_fate',   name: 'Меч Рассвета',         icon: '☀️', dmgMult: 800,     cost: 90000000,    glow: '#ffe27a' },
  { tier: 17, sprite: 'w_fate',   name: 'Эон-клинок',           icon: '✨', dmgMult: 1150,    cost: 220000000,   glow: '#ffd166' },
  { tier: 18, sprite: 'w_fate',   name: 'Вечный меч',           icon: '🛡️', dmgMult: 1700,    cost: 520000000,   glow: '#fff4b8' },

  // ===== «Постгейм» — космические артефакты =====
  { tier: 19, sprite: 'w_fate',   name: 'Звёздный клинок',      icon: '⭐', dmgMult: 2500,    cost: 1300000000,  glow: '#ffe27a' },
  { tier: 20, sprite: 'w_fate',   name: 'Меч Сияния',           icon: '🌠', dmgMult: 3700,    cost: 3300000000,  glow: '#ffffe0' },
  { tier: 21, sprite: 'w_fate',   name: 'Метеоритный клинок',   icon: '☄️', dmgMult: 5500,    cost: 8200000000,  glow: '#ffb37a' },
  { tier: 22, sprite: 'w_fate',   name: 'Клинок Космоса',       icon: '🌌', dmgMult: 8200,    cost: 21000000000, glow: '#7c5cff' },
  { tier: 23, sprite: 'w_fate',   name: 'Меч Времени',          icon: '🕰️', dmgMult: 12500,   cost: 53000000000, glow: '#67d6ff' },
  { tier: 24, sprite: 'w_fate',   name: 'Альфа-клинок',         icon: '𝒜',  dmgMult: 19000,   cost: 130000000000,glow: '#ff7a2a' },
  { tier: 25, sprite: 'w_fate',   name: 'Омега-клинок',         icon: 'Ω',  dmgMult: 28500,   cost: 320000000000,glow: '#ffd166' },
];

export function getWeapon(tier) {
  return WEAPONS[Math.max(0, Math.min(tier, WEAPONS.length - 1))];
}
