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
}

// Прочитать сейв игрока. Возвращает { data, savedAt } или null.
export async function getSave(tgId) {
  const p = getPool()
  if (!p) return null
  const r = await p.query('SELECT data, saved_at FROM saves WHERE tg_id = $1', [tgId])
  if (!r.rows.length) return null
  return { data: r.rows[0].data, savedAt: Number(r.rows[0].saved_at) }
}

// Записать/обновить сейв игрока (upsert).
export async function putSave(tgId, data, savedAt) {
  const p = getPool()
  if (!p) return false
  await p.query(
    `INSERT INTO saves (tg_id, data, saved_at, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (tg_id)
     DO UPDATE SET data = EXCLUDED.data, saved_at = EXCLUDED.saved_at, updated_at = now()`,
    [tgId, data, savedAt],
  )
  return true
}
