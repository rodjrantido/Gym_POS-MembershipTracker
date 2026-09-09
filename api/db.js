import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Global pool instance to reuse connection across serverless invocations
let pool;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.warn('[DB] Warning: DATABASE_URL environment variable is not defined.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for cloud databases (Aiven, Neon, etc.)
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[DB Pool Error]', err);
    });
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}

