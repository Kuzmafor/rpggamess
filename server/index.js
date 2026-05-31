import express from 'express'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { verifyLoginWidget, verifyInitData } from './telegramAuth.js'
import { hasDb, initDb, getSave, putSave, getLeaderboard, getRank } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')

const PORT = process.env.PORT || 3000
const BOT_TOKEN = process.env.BOT_TOKEN || ''
// Секрет для подписи сессионных токенов. Если не задан — генерируем разовый
// (сессии сбросятся при рестарте, но безопасность сохраняется).
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')
const SESSION_TTL_SEC = 30 * 24 * 60 * 60 // 30 дней

if (!BOT_TOKEN) {
  console.warn('[warn] BOT_TOKEN не задан — проверка входа Telegram недоступна.')
}
if (!hasDb()) {
  console.warn('[warn] DATABASE_URL не задан — облачные сейвы отключены.')
}

const app = express()
app.use(express.json({ limit: '2mb' }))

// ---------- Сессионные токены (компактный подписанный JWT-подобный формат) ----------
function signSession(tgId) {
  const payload = Buffer.from(
    JSON.stringify({ id: tgId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC }),
  ).toString('base64url')
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

function verifySession(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null
  const [payload, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (!data.id || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null
    return data.id
  } catch {
    return null
  }
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const tgId = verifySession(token)
  if (!tgId) return res.status(401).json({ error: 'unauthorized' })
  req.tgId = tgId
  next()
}

// ---------- API ----------

// Вход: принимаем либо Login Widget data, либо Mini App initData.
// Возвращаем профиль + сессионный токен для последующих запросов сейвов.
app.post('/api/auth/telegram', (req, res) => {
  if (!BOT_TOKEN) return res.status(503).json({ error: 'auth_unavailable' })

  const { widget, initData } = req.body || {}
  let user = null
  if (initData) user = verifyInitData(initData, BOT_TOKEN)
  else if (widget) user = verifyLoginWidget(widget, BOT_TOKEN)

  if (!user) return res.status(401).json({ error: 'invalid_signature' })

  const token = signSession(user.id)
  res.json({ user, token })
})

// Загрузить облачный сейв текущего игрока.
app.get('/api/save', requireAuth, async (req, res) => {
  if (!hasDb()) return res.status(503).json({ error: 'storage_unavailable' })
  try {
    const save = await getSave(req.tgId)
    if (!save) return res.json({ save: null })
    res.json({ save: save.data, savedAt: save.savedAt })
  } catch (e) {
    console.error('getSave error', e)
    res.status(500).json({ error: 'server_error' })
  }
})

// Считаем рейтинговый счёт из сейва. Прогресс измеряем по этапу, New Game+
// и престижам — это устойчивые показатели общего продвижения игрока.
function computeScore(save) {
  if (!save || typeof save !== 'object') return { score: 0, maxStage: 1, prestige: 0, ngLevel: 0 }
  const maxStage = Math.max(1, Math.floor(Number(save.maxStage || save.stage || 1)))
  const ngLevel = Math.max(0, Math.floor(Number(save.ngLevel || 0)))
  const prestige = Math.max(0, Math.floor(Number(save.prestigeCount || 0)))
  // Каждый круг New Game+ и престиж весят как большой прогресс по этапам.
  const score = maxStage + ngLevel * 100000 + prestige * 10000
  return { score, maxStage, prestige, ngLevel }
}

function saveName(save) {
  const p = save?.profile || {}
  const tg = p.telegram || {}
  return (p.nickname || tg.username || tg.firstName || 'Игрок').toString().slice(0, 48)
}
function savePhoto(save) {
  return (save?.profile?.telegram?.photoUrl || '').toString().slice(0, 512)
}

// Сохранить облачный сейв. Применяем стратегию "новее по savedAt побеждает",
// чтобы случайно не затереть более свежий прогресс с другого устройства.
app.put('/api/save', requireAuth, async (req, res) => {
  if (!hasDb()) return res.status(503).json({ error: 'storage_unavailable' })
  const { save, savedAt } = req.body || {}
  if (!save || typeof save !== 'object') return res.status(400).json({ error: 'bad_payload' })
  const ts = Number(savedAt) || Date.now()
  try {
    const existing = await getSave(req.tgId)
    if (existing && existing.savedAt > ts) {
      // На сервере уже более свежий сейв — отдаём его, не перезаписывая.
      return res.json({ ok: false, conflict: true, save: existing.data, savedAt: existing.savedAt })
    }
    const meta = { ...computeScore(save), name: saveName(save), photoUrl: savePhoto(save) }
    await putSave(req.tgId, save, ts, meta)
    res.json({ ok: true, savedAt: ts })
  } catch (e) {
    console.error('putSave error', e)
    res.status(500).json({ error: 'server_error' })
  }
})

// Таблица лидеров (топ игроков). Открыта без авторизации — только публичные поля.
app.get('/api/leaderboard', async (_req, res) => {
  if (!hasDb()) return res.json({ board: [] })
  try {
    const board = await getLeaderboard(100)
    res.json({ board })
  } catch (e) {
    console.error('leaderboard error', e)
    res.status(500).json({ error: 'server_error' })
  }
})

// Позиция текущего игрока в рейтинге.
app.get('/api/leaderboard/me', requireAuth, async (req, res) => {
  if (!hasDb()) return res.json({ me: null })
  try {
    const me = await getRank(req.tgId)
    res.json({ me })
  } catch (e) {
    console.error('rank error', e)
    res.status(500).json({ error: 'server_error' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: hasDb(), auth: !!BOT_TOKEN })
})

// ---------- Статика игры ----------
app.use(express.static(DIST))
// SPA-фолбэк: любой не-API маршрут отдаёт index.html.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(DIST, 'index.html'))
})

initDb()
  .catch((e) => console.error('initDb error', e))
  .finally(() => {
    app.listen(PORT, () => console.log(`Blade of Fate server on :${PORT}`))
  })
