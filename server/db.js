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
  await p.query(
    `INSERT INTO saves (tg_id, data, saved_at, updated_at, name, photo_url, score, max_stage, prestige, ng_level)
     VALUES ($1, $2, $3, now(), $4, $5, $6, $7, $8, $9)
     ON CONFLICT (tg_id)
     DO UPDATE SET data = EXCLUDED.data, saved_at = EXCLUDED.saved_at, updated_at = now(),
       name = EXCLUDED.name, photo_url = EXCLUDED.photo_url, score = EXCLUDED.score,
       max_stage = EXCLUDED.max_stage, prestige = EXCLUDED.prestige, ng_level = EXCLUDED.ng_level`,
    [tgId, data, savedAt, name, photoUrl, score, maxStage, prestige, ngLevel],
  )
  return true
}

// Топ игроков по очкам. Возвращает массив строк рейтинга.
export async function getLeaderboard(limit = 100) {
  const p = getPool()
  if (!p) return []
  const r = await p.query(
    `SELECT tg_id, name, photo_url, score, max_stage, prestige, ng_level
     FROM saves
     WHERE score > 0
     ORDER BY score DESC, max_stage DESC, updated_at ASC
     LIMIT $1`,
    [limit],
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
