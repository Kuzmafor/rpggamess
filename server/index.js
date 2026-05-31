import express from 'express'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { verifyLoginWidget, verifyInitData } from './telegramAuth.js'
import { hasDb, initDb, getSave, putSave, getLeaderboard, getRank, creditGems, claimPendingGems } from './db.js'

// Источник истины по гем-пакам и ценам в Telegram Stars — на сервере,
// чтобы клиент не мог подменить цену/количество.
const GEM_PACKS = {
  p0: { gems: 20,    stars: 1,  label: 'Пробный' },
  p1: { gems: 50,    stars: 1,  label: 'Стартовый' },
  p2: { gems: 280,   stars: 2,  label: 'Любительский' },
  p3: { gems: 720,   stars: 3,  label: 'Героический' },
  p4: { gems: 2000,  stars: 5,  label: 'Эпический' },
  p5: { gems: 6500,  stars: 10, label: 'Легендарный' },
  p6: { gems: 18000, stars: 20, label: 'Архонтский' },
}

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

// ---------- Telegram Stars: оплата гемов ----------
// Вызов Bot API.
async function tgApi(method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return r.json()
}

// Создать ссылку на оплату гем-пака за Telegram Stars (валюта XTR).
// Клиент (Mini App) откроет её через Telegram.WebApp.openInvoice.
app.post('/api/stars/invoice', requireAuth, async (req, res) => {
  if (!BOT_TOKEN) return res.status(503).json({ error: 'payments_unavailable' })
  const { packId } = req.body || {}
  const pack = GEM_PACKS[packId]
  if (!pack) return res.status(400).json({ error: 'bad_pack' })
  try {
    // payload вернётся к нам в successful_payment — кладём id игрока и пак.
    const payload = JSON.stringify({ tgId: req.tgId, packId })
    const resp = await tgApi('createInvoiceLink', {
      title: `${pack.gems} гемов`,
      description: `Пакет «${pack.label}» — ${pack.gems} гемов для Blade of Fate`,
      payload,
      currency: 'XTR',                 // Telegram Stars
      prices: [{ label: `${pack.gems} гемов`, amount: pack.stars }],
    })
    if (!resp.ok) {
      console.error('createInvoiceLink error', resp)
      return res.status(502).json({ error: 'invoice_failed' })
    }
    res.json({ link: resp.result })
  } catch (e) {
    console.error('invoice error', e)
    res.status(500).json({ error: 'server_error' })
  }
})

// Забрать гемы, начисленные после успешной оплаты (клиент опрашивает после
// закрытия окна оплаты и периодически при синхронизации).
app.get('/api/stars/pending', requireAuth, async (req, res) => {
  if (!hasDb()) return res.json({ gems: 0 })
  try {
    const gems = await claimPendingGems(req.tgId)
    res.json({ gems })
  } catch (e) {
    console.error('pending gems error', e)
    res.status(500).json({ error: 'server_error' })
  }
})

// Webhook Telegram: обязателен для приёма платежей.
// Telegram шлёт сюда pre_checkout_query (нужно подтвердить за 10 сек) и
// successful_payment (начисляем гемы). Защита — секретный токен в пути.
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'hook'
app.post(`/api/tg/webhook/${WEBHOOK_SECRET}`, async (req, res) => {
  const update = req.body || {}
  try {
    // 1) Предпроверка перед списанием звёзд — отвечаем ok.
    if (update.pre_checkout_query) {
      await tgApi('answerPreCheckoutQuery', {
        pre_checkout_query_id: update.pre_checkout_query.id,
        ok: true,
      })
      return res.json({ ok: true })
    }
    // 2) Успешная оплата — начисляем гемы.
    const sp = update.message?.successful_payment
    if (sp) {
      let payload = {}
      try { payload = JSON.parse(sp.invoice_payload || '{}') } catch {}
      const pack = GEM_PACKS[payload.packId]
      const tgId = Number(payload.tgId) || update.message.from?.id
      if (pack && tgId) {
        await creditGems(tgId, pack.gems, {
          chargeId: sp.telegram_payment_charge_id,
          packId: payload.packId,
          stars: pack.stars,
        })
      }
      return res.json({ ok: true })
    }
    res.json({ ok: true })
  } catch (e) {
    console.error('webhook error', e)
    res.json({ ok: true }) // всегда 200, чтобы Telegram не ретраил бесконечно
  }
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
