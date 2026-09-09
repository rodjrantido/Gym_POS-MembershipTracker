import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('\n❌ ERROR: DATABASE_URL is not set in your .env file!');
  console.error('Please add your Aiven connection string to .env, like:');
  console.error('DATABASE_URL=postgres://avnadmin:YOUR_PASSWORD@YOUR_HOST:PORT/defaultdb?sslmode=require\n');
  process.exit(1);
}

// Strip sslmode so pg doesn't override rejectUnauthorized with strict verify
const cleanDbUrl = databaseUrl.replace(/[?&]sslmode=[^&]+/, '');

const pool = new Pool({
  connectionString: cleanDbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

async function runMigration() {
  console.log('🚀 Starting Aiven PostgreSQL Setup & Migration...');

  // 1. Create Tables
  console.log('\n📦 Step 1: Creating tables in Aiven PostgreSQL...');
  await pool.query(`
    -- 1. Staff Accounts
    CREATE TABLE IF NOT EXISTS staff_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. Members
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      plan TEXT DEFAULT 'Monthly (₱500)',
      status TEXT DEFAULT 'ACTIVE',
      start_date DATE DEFAULT CURRENT_DATE,
      expires_at DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
      photo_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. Inventory
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      price NUMERIC(10, 2) NOT NULL,
      stock INTEGER DEFAULT 0,
      threshold INTEGER DEFAULT 5,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 4. Day Passers
    CREATE TABLE IF NOT EXISTS day_passers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      raw_date DATE DEFAULT CURRENT_DATE,
      date TEXT,
      time TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 5. Transactions
    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id TEXT PRIMARY KEY,
      customer_id TEXT,
      customer_type TEXT,
      total_amount NUMERIC(10, 2) NOT NULL,
      status TEXT DEFAULT 'PAID',
      items JSONB DEFAULT '[]'::jsonb,
      date TEXT,
      time TEXT,
      paid_date TEXT,
      paid_time TEXT,
      was_unpaid BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Tables created successfully in Aiven!');

  if (!supabase) {
    console.log('⚠️ Supabase credentials not found. Skipping data migration from Supabase.');
    await pool.end();
    return;
  }

  // 2. Migrate Staff Accounts
  console.log('\n🔑 Step 2: Migrating Staff Accounts...');
  const { data: staffData, error: staffErr } = await supabase.from('staff_accounts').select('*');
  if (staffErr) {
    console.warn('Could not read staff_accounts from Supabase:', staffErr.message);
  } else if (staffData?.length) {
    for (const staff of staffData) {
      await pool.query(
        `INSERT INTO staff_accounts (username, password, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO NOTHING`,
        [staff.username, staff.password, staff.role || 'staff']
      );
    }
    console.log(`✅ Migrated ${staffData.length} staff account(s).`);
  } else {
    // Ensure at least a default admin account exists
    await pool.query(
      `INSERT INTO staff_accounts (username, password, role)
       VALUES ('admin', 'admin123', 'admin')
       ON CONFLICT (username) DO NOTHING`
    );
    console.log('ℹ️ Created default staff account (admin / admin123).');
  }

  // 3. Migrate Members
  console.log('\n👥 Step 3: Migrating Members...');
  const { data: memberData, error: memberErr } = await supabase.from('members').select('*');
  if (memberErr) {
    console.warn('Could not read members from Supabase:', memberErr.message);
  } else if (memberData?.length) {
    for (const m of memberData) {
      await pool.query(
        `INSERT INTO members (id, name, phone, plan, status, start_date, expires_at, photo_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           plan = EXCLUDED.plan,
           status = EXCLUDED.status,
           start_date = EXCLUDED.start_date,
           expires_at = EXCLUDED.expires_at,
           photo_url = EXCLUDED.photo_url`,
        [
          m.id,
          m.name,
          m.phone,
          m.plan || 'Monthly (₱500)',
          m.status || 'ACTIVE',
          m.start_date || null,
          m.expires_at || null,
          m.photo_url || null,
          m.created_at || new Date(),
        ]
      );
    }
    console.log(`✅ Migrated ${memberData.length} member(s).`);
  } else {
    console.log('ℹ️ No members found in Supabase to migrate.');
  }

  // 4. Migrate Inventory
  console.log('\n📦 Step 4: Migrating Inventory...');
  const { data: invData, error: invErr } = await supabase.from('inventory').select('*');
  if (invErr) {
    console.warn('Could not read inventory from Supabase:', invErr.message);
  } else if (invData?.length) {
    for (const item of invData) {
      await pool.query(
        `INSERT INTO inventory (id, name, category, price, stock, threshold, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           price = EXCLUDED.price,
           stock = EXCLUDED.stock,
           threshold = EXCLUDED.threshold`,
        [
          item.id,
          item.name,
          item.category,
          parseFloat(item.price),
          parseInt(item.stock, 10),
          parseInt(item.threshold, 10),
          item.created_at || new Date(),
        ]
      );
    }
    console.log(`✅ Migrated ${invData.length} inventory item(s).`);
  } else {
    console.log('ℹ️ No inventory items found in Supabase to migrate.');
  }

  // 5. Migrate Day Passers
  console.log('\n🎟️ Step 5: Migrating Day Passers...');
  const { data: dayPassData, error: dpErr } = await supabase.from('day_passers').select('*');
  if (dpErr) {
    console.warn('Could not read day_passers from Supabase:', dpErr.message);
  } else if (dayPassData?.length) {
    for (const dp of dayPassData) {
      await pool.query(
        `INSERT INTO day_passers (id, name, status, raw_date, date, time, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           status = EXCLUDED.status,
           raw_date = EXCLUDED.raw_date,
           date = EXCLUDED.date,
           time = EXCLUDED.time`,
        [
          dp.id,
          dp.name,
          dp.status || 'ACTIVE',
          dp.raw_date || null,
          dp.date || null,
          dp.time || null,
          dp.created_at || new Date(),
        ]
      );
    }
    console.log(`✅ Migrated ${dayPassData.length} day passer(s).`);
  } else {
    console.log('ℹ️ No day passers found in Supabase to migrate.');
  }

  // 6. Migrate Transactions
  console.log('\n💰 Step 6: Migrating Transactions...');
  const { data: txData, error: txErr } = await supabase.from('transactions').select('*');
  if (txErr) {
    console.warn('Could not read transactions from Supabase:', txErr.message);
  } else if (txData?.length) {
    for (const tx of txData) {
      const itemsJson = typeof tx.items === 'string' ? tx.items : JSON.stringify(tx.items || []);
      await pool.query(
        `INSERT INTO transactions (
          transaction_id, customer_id, customer_type, total_amount,
          status, items, date, time, paid_date, paid_time, was_unpaid, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (transaction_id) DO UPDATE SET
          customer_id = EXCLUDED.customer_id,
          customer_type = EXCLUDED.customer_type,
          total_amount = EXCLUDED.total_amount,
          status = EXCLUDED.status,
          items = EXCLUDED.items,
          date = EXCLUDED.date,
          time = EXCLUDED.time,
          paid_date = EXCLUDED.paid_date,
          paid_time = EXCLUDED.paid_time,
          was_unpaid = EXCLUDED.was_unpaid`,
        [
          tx.transaction_id,
          tx.customer_id,
          tx.customer_type,
          parseFloat(tx.total_amount),
          tx.status,
          itemsJson,
          tx.date,
          tx.time,
          tx.paid_date || null,
          tx.paid_time || null,
          tx.was_unpaid || false,
          tx.created_at || new Date(),
        ]
      );
    }
    console.log(`✅ Migrated ${txData.length} transaction(s).`);
  } else {
    console.log('ℹ️ No transactions found in Supabase to migrate.');
  }

  console.log('\n🎉 ALL DATA MIGRATED TO AIVEN POSTGRESQL SUCCESSFULLY!');
  await pool.end();
}

runMigration().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
