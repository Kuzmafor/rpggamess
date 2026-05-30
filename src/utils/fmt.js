// Форматирование больших чисел: K, M, B, T, qa, qi, sx, sp, oc, no, dc,
// далее двух-буквенные суффиксы aa, ab, ac... до zz.
//
// Разрядность: каждые 1000 — следующий суффикс.
// 1e3 K · 1e6 M · 1e9 B · 1e12 T · 1e15 qa · 1e18 qi · 1e21 sx · 1e24 sp ·
// 1e27 oc · 1e30 no · 1e33 dc · далее aa(1e36), ab(1e39), ac(1e42)...

const SHORT = [
  '',    // 0
  'K',   // 1e3
  'M',   // 1e6
  'B',   // 1e9
  'T',   // 1e12
  'qa',  // 1e15
  'qi',  // 1e18
  'sx',  // 1e21
  'sp',  // 1e24
  'oc',  // 1e27
  'no',  // 1e30
  'dc',  // 1e33
]

// Дополнительные суффиксы: aa, ab, ac ... az, ba, bb, ...
function abcSuffix(idx) {
  const a = Math.floor(idx / 26)
  const b = idx % 26
  return String.fromCharCode(97 + a) + String.fromCharCode(97 + b)
}

function suffix(i) {
  if (i < SHORT.length) return SHORT[i]
  return abcSuffix(i - SHORT.length)
}

export function fmt(n) {
  if (n == null || isNaN(n)) return '0'
  const sign = n < 0 ? '-' : ''
  let v = Math.abs(n)
  if (v < 1000) return sign + Math.floor(v).toString()
  let i = 0
  while (v >= 1000 && i < 999) {
    v /= 1000
    i++
  }
  const decimals = v < 10 ? 2 : v < 100 ? 1 : 0
  return sign + v.toFixed(decimals) + suffix(i)
}
