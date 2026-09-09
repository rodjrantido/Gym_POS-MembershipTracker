import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Global pool instance to reuse connection across serverless invocations
let pool;

export function getPool() {
  if (!pool) {
    const rawUrl = process.env.DATABASE_URL || '';
    if (!rawUrl) {
      console.warn('[DB] Warning: DATABASE_URL environment variable is not defined.');
    }

    // Strip sslmode param from URL so pg doesn't override rejectUnauthorized
    const cleanUrl = rawUrl.replace(/[?&]sslmode=[^&]+/, '');

    pool = new Pool({
      connectionString: cleanUrl,
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
