import "server-only";

import { Pool, type QueryResultRow } from "pg";

// Direct Postgres, as the database owner. It bypasses row level security the
// same way the secret key does, which is what an admin panel needs: it reads
// auth.users for emails, every rating, and every Showdown match — none of which
// the publishable key can see. That is also exactly why every caller of this
// module must have passed requireAdmin() first (lib/dal.ts).
//
// `server-only` turns an accidental Client Component import into a build error
// rather than a leaked connection string.
function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set — see .env");
  return new Pool({
    connectionString,
    // Supabase terminates TLS with its own CA, which the default verification
    // chain rejects. The connection is still encrypted.
    ssl: { rejectUnauthorized: false },
    // Serverless: each instance holds its own pool, so keep each one small.
    max: 3,
  });
}

// `next dev` re-evaluates modules on every hot reload, which would leak a new
// pool each time. Stash it on globalThis so reloads reuse the same one.
const globalForDb = globalThis as typeof globalThis & { pool?: Pool };

export const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export async function query<T extends QueryResultRow>(text: string, params?: unknown[]) {
  const { rows } = await pool.query<T>(text, params);
  return rows;
}

export async function one<T extends QueryResultRow>(text: string, params?: unknown[]) {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
