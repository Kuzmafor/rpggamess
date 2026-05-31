import pg from 'pg'

// Подключение к Postgres (на Render — встроенная база, строка в DATABASE_URL).
// Если DATABASE_URL не задан, облачные сейвы отключаются (сервер всё равно
// раздаёт игру, прогресс хранится только локально в браузере).

const { Pool } = pg

let pool = null

export function hasDb() {
  return !!process.env.DATABASE_URL
}

export function getPool() {
  if (!hasDb()) return null
  if (pool) return pool
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Render требует SSL для внешних подключений; для внутренних безвреден.
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
  })
  return pool
}

// Создаём таблицу сейвов при старте, если её ещё нет.
export async function initDb() {
  const p = getPool()
  if (!p) return
  await p.query(`
    CREATE TABLE IF NOT EXISTS saves (
      tg_id      BIGINT PRIMARY KEY,
      data       JSONB NOT NULL,
      saved_at   BIGINT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  // Поля для рейтинга (мягкая миграция существующей таблицы).
  await p.query(`ALTER TABLE saves ADD COLUMN IF NOT EXISTS name TEXT`)
  await p.query(`ALTER TABLE saves ADD COLUMN IF NOT EXISTS photo_url TEXT`)
  await p.query(`ALTER TABLE saves ADD COLUMN IF NOT EXISTS score BIGINT NOT NULL DEFAULT 0`)
  await p.query(`ALTER TABLE saves ADD COLUMN IF NOT EXISTS max_stage INT NOT NULL DEFAULT 1`)
  await p.query(`ALTER TABLE saves ADD COLUMN IF NOT EXISTS prestige INT NOT NULL DEFAULT 0`)
  await p.query(`ALTER TABLE saves ADD COLUMN IF NOT EXISTS ng_level INT NOT NULL DEFAULT 0`)
  await p.query(`CREATE INDEX IF NOT EXISTS saves_score_idx ON saves (score DESC)`)
  // Сезон, к которому относится текущий score игрока.
  await p.query(`ALTER TABLE saves ADD COLUMN IF NOT EXISTS season_index INT NOT NULL DEFAULT 0`)
  await p.query(`CREATE INDEX IF NOT EXISTS saves_season_idx ON saves (season_index, score DESC)`)
  // Отметка уже рассчитанных (выданных) сезонов — чтобы не наградить дважды.
  await p.query(`
    CREATE TABLE IF NOT EXISTS settled_seasons (
      season_index INT PRIMARY KEY,
      settled_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  // Очередь начисления гемов после оплаты Telegram Stars. Гемы кладём сюда
  // при successful_payment, а клиент забирает их при следующей синхронизации.
  await p.query(`
    CREATE TABLE IF NOT EXISTS pending_gems (
      tg_id      BIGINT PRIMARY KEY,
      gems       BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  // Лог платежей — защита от повторной обработки одного платежа.
  await p.query(`
    CREATE TABLE IF NOT EXISTS payments (
      charge_id  TEXT PRIMARY KEY,
      tg_id      BIGINT NOT NULL,
      pack_id    TEXT,
      stars      INT,
      gems       BIGINT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
}

// Добавить гемы в очередь начисления игроку (после оплаты).
// Идемпотентно по charge_id: повторный платёж не начислится дважды.
export async function creditGems(tgId, gems, payment = {}) {
  const p = getPool()
  if (!p) return false
  const chargeId = payment.chargeId || ('manual_' + tgId + '_' + Date.now())
  // Пишем платёж; при конфликте (повтор) — выходим, не начисляя повторно.
  const ins = await p.query(
    `INSERT INTO payments (charge_id, tg_id, pack_id, stars, gems)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (charge_id) DO NOTHING`,
    [chargeId, tgId, payment.packId || null, payment.stars || null, gems],
  )
  if (ins.rowCount === 0) return false // уже обработан
  await p.query(
    `INSERT INTO pending_gems (tg_id, gems, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (tg_id) DO UPDATE SET gems = pending_gems.gems + EXCLUDED.gems, updated_at = now()`,
    [tgId, gems],
  )
  return true
}

// Забрать (и обнулить) накопленные гемы игрока. Возвращает число гемов.
export async function claimPendingGems(tgId) {
  const p = getPool()
  if (!p) return 0
  // Атомарно: читаем текущее значение и обнуляем одним запросом через CTE.
  const r = await p.query(
    `WITH cur AS (SELECT gems FROM pending_gems WHERE tg_id = $1 FOR UPDATE)
     UPDATE pending_gems SET gems = 0, updated_at = now()
     WHERE tg_id = $1
     RETURNING (SELECT gems FROM cur) AS taken`,
    [tgId],
  )
  return r.rows.length ? Number(r.rows[0].taken) || 0 : 0
}

// Прочитать сейв игрока. Возвращает { data, savedAt } или null.
export async function getSave(tgId) {
  const p = getPool()
  if (!p) return null
  const r = await p.query('SELECT data, saved_at FROM saves WHERE tg_id = $1', [tgId])
  if (!r.rows.length) return null
  return { data: r.rows[0].data, savedAt: Number(r.rows[0].saved_at) }
}

// Записать/обновить сейв игрока (upsert) вместе с полями рейтинга.
export async function putSave(tgId, data, savedAt, meta = {}) {
  const p = getPool()
  if (!p) return false
  const name = String(meta.name || '').slice(0, 48)
  const photoUrl = String(meta.photoUrl || '').slice(0, 512)
  const score = Math.max(0, Math.floor(Number(meta.score) || 0))
  const maxStage = Math.max(1, Math.floor(Number(meta.maxStage) || 1))
  const prestige = Math.max(0, Math.floor(Number(meta.prestige) || 0))
  const ngLevel = Math.max(0, Math.floor(Number(meta.ngLevel) || 0))
  const seasonIndex = Math.max(0, Math.floor(Number(meta.seasonIndex) || 0))
  await p.query(
    `INSERT INTO saves (tg_id, data, saved_at, updated_at, name, photo_url, score, max_stage, prestige, ng_level, season_index)
     VALUES ($1, $2, $3, now(), $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (tg_id)
     DO UPDATE SET data = EXCLUDED.data, saved_at = EXCLUDED.saved_at, updated_at = now(),
       name = EXCLUDED.name, photo_url = EXCLUDED.photo_url, score = EXCLUDED.score,
       max_stage = EXCLUDED.max_stage, prestige = EXCLUDED.prestige, ng_level = EXCLUDED.ng_level,
       season_index = EXCLUDED.season_index`,
    [tgId, data, savedAt, name, photoUrl, score, maxStage, prestige, ngLevel, seasonIndex],
  )
  return true
}

// Топ игроков ТЕКУЩЕГО сезона по очкам.
export async function getLeaderboard(limit = 100, seasonIndex = null) {
  const p = getPool()
  if (!p) return []
  const where = seasonIndex == null ? 'score > 0' : 'score > 0 AND season_index = $2'
  const params = seasonIndex == null ? [limit] : [limit, seasonIndex]
  const r = await p.query(
    `SELECT tg_id, name, photo_url, score, max_stage, prestige, ng_level
     FROM saves
     WHERE ${where}
     ORDER BY score DESC, max_stage DESC, updated_at ASC
     LIMIT $1`,
    params,
  )
  return r.rows.map((row, i) => ({
    rank: i + 1,
    tgId: Number(row.tg_id),
    name: row.name || 'Игрок',
    photoUrl: row.photo_url || '',
    score: Number(row.score),
    maxStage: Number(row.max_stage),
    prestige: Number(row.prestige),
    ngLevel: Number(row.ng_level),
  }))
}

// Рассчитать (выдать награды) завершившийся сезон ровно один раз.
// Возвращает true если расчёт произошёл сейчас.
export async function settleSeasonOnce(seasonIndex, rewardFn) {
  const p = getPool()
  if (!p) return false
  // Пытаемся пометить сезон рассчитанным; если уже есть — выходим.
  const ins = await p.query(
    `INSERT INTO settled_seasons (season_index) VALUES ($1) ON CONFLICT DO NOTHING`,
    [seasonIndex],
  )
  if (ins.rowCount === 0) return false
  // Берём топ-100 завершившегося сезона и начисляем гемы по месту.
  const top = await p.query(
    `SELECT tg_id FROM saves WHERE score > 0 AND season_index = $1
     ORDER BY score DESC, max_stage DESC, updated_at ASC LIMIT 100`,
    [seasonIndex],
  )
  for (let i = 0; i < top.rows.length; i++) {
    const tgId = Number(top.rows[i].tg_id)
    const gems = rewardFn(i + 1)
    if (gems > 0) {
      await creditGems(tgId, gems, { chargeId: `season_${seasonIndex}_${tgId}`, packId: 'season', stars: 0 })
    }
  }
  return true
}

// Позиция конкретного игрока в общем рейтинге (1-based) или null.
export async function getRank(tgId) {
  const p = getPool()
  if (!p) return null
  const r = await p.query(
    `SELECT (SELECT COUNT(*) FROM saves s2 WHERE s2.score > s1.score) + 1 AS rank,
            score, max_stage, prestige, ng_level, name, photo_url
     FROM saves s1 WHERE tg_id = $1`,
    [tgId],
  )
  if (!r.rows.length) return null
  const row = r.rows[0]
  return {
    rank: Number(row.rank),
    score: Number(row.score),
    maxStage: Number(row.max_stage),
    prestige: Number(row.prestige),
    ngLevel: Number(row.ng_level),
    name: row.name || 'Игрок',
    photoUrl: row.photo_url || '',
  }
}
