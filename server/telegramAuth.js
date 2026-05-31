import crypto from 'crypto'

// Проверка подлинности данных Telegram токеном бота (HMAC-SHA256).
// Документация: https://core.telegram.org/widgets/login#checking-authorization
//
// Telegram отдаёт набор полей + поле hash. Мы пересобираем "data_check_string"
// из всех полей кроме hash (отсортированных по ключу), считаем HMAC секретным
// ключом, производным от токена бота, и сравниваем с присланным hash.
// Если совпало — данные настоящие и не подделаны.

const MAX_AUTH_AGE_SEC = 24 * 60 * 60 // данные старше суток считаем протухшими

// ----- Login Widget (вход в обычном браузере) -----
// Здесь секретный ключ = SHA256(botToken).
export function verifyLoginWidget(data, botToken) {
  if (!data || typeof data !== 'object' || !data.hash) return null
  const { hash, ...fields } = data

  const checkString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n')

  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')

  if (!safeEqualHex(hmac, String(hash))) return null

  // Защита от переигрывания старых данных.
  const authDate = Number(fields.auth_date || 0)
  if (authDate && Date.now() / 1000 - authDate > MAX_AUTH_AGE_SEC) return null

  return normalizeUser(fields)
}

// ----- Mini App (вход внутри Telegram через initData) -----
// Здесь секретный ключ = HMAC-SHA256("WebAppData", botToken).
export function verifyInitData(initData, botToken) {
  if (!initData || typeof initData !== 'string') return null

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const checkString = [...params.entries()]
    .map(([k, v]) => [k, v])
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')

  if (!safeEqualHex(hmac, hash)) return null

  const authDate = Number(params.get('auth_date') || 0)
  if (authDate && Date.now() / 1000 - authDate > MAX_AUTH_AGE_SEC) return null

  // В initData данные пользователя приходят JSON-строкой в поле "user".
  try {
    const user = JSON.parse(params.get('user') || '{}')
    if (!user || !user.id) return null
    return normalizeUser(user)
  } catch {
    return null
  }
}

function normalizeUser(u) {
  const id = Number(u.id)
  if (!id) return null
  return {
    id,
    firstName: String(u.first_name || '').slice(0, 64),
    lastName: String(u.last_name || '').slice(0, 64),
    username: String(u.username || '').slice(0, 64),
    photoUrl: String(u.photo_url || '').slice(0, 512),
  }
}

// Сравнение хэшей в постоянном времени (без утечки по времени).
function safeEqualHex(a, b) {
  try {
    const ba = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ba.length !== bb.length) return false
    return crypto.timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}
