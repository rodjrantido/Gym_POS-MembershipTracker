# 🐘 STEP 7: Aiven Free Tier PostgreSQL Setup & Serverless Architecture Guide

Aiven provides high-performance, enterprise-grade cloud databases. Their **Free Tier PostgreSQL** gives you:

- **5 GB of storage** (10x larger than typical 500MB free tiers).
- **Zero inactivity pause**: Unlike Supabase Free Tier which sleeps if inactive for 7 days, Aiven services stay continuously online.
- **Pure Standard PostgreSQL**: Full compatibility with standard SQL, extensions, indexing, and tools.

---

## 1. Why We Need a Serverless API Layer (`api/`)

Before setting up Aiven, understand this critical architectural concept:

```
❌ WRONG (Insecure & Technically Impossible):
React Browser App  ──(Cannot make raw TCP socket connections)──>  Aiven PostgreSQL (Port 5432)
                   └── Exposing master database password in browser is dangerous!

✅ CORRECT (Modern Serverless Architecture):
React Browser App  ──(HTTP / fetch('/api/members'))──>  Vercel Serverless Function  ──(TCP / pg.Pool)──>  Aiven PostgreSQL
```

- **PostgreSQL Wire Protocol**: PostgreSQL communicates via raw TCP sockets on port 5432. Web browsers can only make HTTP/HTTPS or WebSocket requests.
- **Security**: Your database credentials (`DATABASE_URL`) must **never** be exposed in client-side code. The serverless functions run safely on the server side where credentials stay 100% secret.
- **Zero Extra Cost**: Vercel hosts both your frontend and your `/api` serverless functions together in one repository for free.

---

## 2. Creating Your Aiven Free Tier Service

1. Go to **[aiven.io](https://aiven.io)** and click **Try free** (sign up with Google or GitHub).
2. Once inside the Aiven Console, click **Create service**.
3. Select **PostgreSQL**.
4. Choose the **Free Plan** (5 GB storage, 1 CPU, 1 GB RAM).
5. Choose a Cloud Provider and Region closest to you (e.g., _AWS or Google Cloud_ in _Singapore / ap-southeast-1_).
6. Give your service a name (e.g., `gym-pos-db`).
7. Click **Create service**. Wait ~2-3 minutes for the service state to change from _Rebuilding_ to _Running_ (green indicator).

---

## 3. Getting Your Connection String (Service URI)

1. On your service's **Overview** tab, scroll down to **Connection information**.
2. Look for the row labeled **Service URI**.
3. It looks like this:
   ```text
   postgres://avnadmin:YOUR_PASSWORD@your-host-name.aivencloud.com:PORT/defaultdb?sslmode=require
   ```
4. Click the **Copy** button.

---

## 4. Setting Up Local Environment Variables (`.env`)

In your project root directory, add `DATABASE_URL` to your `.env` file:

```env
# Aiven PostgreSQL Connection String
DATABASE_URL=postgres://avnadmin:YOUR_PASSWORD@your-host-name.aivencloud.com:PORT/defaultdb?sslmode=require
```

> ⚠️ **Important Security Rule**: Ensure `.env` is listed in your `.gitignore` file so your secret database credentials are never committed to GitHub!

---

## 5. Setting Up the Database Pool (`api/db.js`)

Install the PostgreSQL driver:

```bash
npm install pg dotenv
```

Create `api/db.js` to manage a pooled database connection that works in both serverless and local environments:

```javascript
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for Aiven SSL connections
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}
```

---

## 6. Creating Database Tables

You can create tables using either method:

### Method A: Run the Migration Script (Fastest & Automatic)

Run the built-in migration script. It connects to Aiven, creates all tables, and automatically copies your existing data from Supabase:

```bash
npm run migrate:aiven
```

### Method B: Aiven Web Query Editor

In your Aiven Console, go to **Query Editor** on the left menu, paste this SQL and click **Run**:

```sql
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
```

---

## 7. Creating Serverless API Endpoints (`api/`)

Each file inside `api/` automatically becomes an HTTP endpoint when deployed to Vercel:

| Endpoint            | File                  | Purpose                                      | Supported Methods              |
| :------------------ | :-------------------- | :------------------------------------------- | :----------------------------- |
| `/api/auth`         | `api/auth.js`         | Staff login verification                     | `POST`                         |
| `/api/members`      | `api/members.js`      | Member management, pause/unpause, renewals   | `GET`, `POST`, `PUT`, `DELETE` |
| `/api/inventory`    | `api/inventory.js`    | Stock tracking, restocking, duplicate checks | `GET`, `POST`, `PUT`, `DELETE` |
| `/api/daypassers`   | `api/daypassers.js`   | Day pass entries                             | `GET`, `POST`, `DELETE`        |
| `/api/transactions` | `api/transactions.js` | POS sales and mark unpaid as paid            | `GET`, `POST`, `PUT`           |

### Example Serverless Handler (`api/members.js` snippet):

```javascript
import { query } from "./db.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const result = await query(
      "SELECT * FROM members ORDER BY created_at DESC",
    );
    return res.status(200).json(result.rows);
  }

  if (req.method === "POST") {
    const { id, name, phone, plan, status, start_date, expires_at, photo_url } =
      req.body;
    const result = await query(
      `INSERT INTO members (id, name, phone, plan, status, start_date, expires_at, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, name, phone, plan, status, start_date, expires_at, photo_url],
    );
    return res.status(201).json(result.rows[0]);
  }

  // Handle PUT, DELETE, etc.
}
```

---

## 8. Local Development Without Separate Servers (`api/_devMiddleware.js`)

When running locally with `npm run dev`, Vite acts as a static development server. To let your React app call `/api/*` without starting a separate Express server, a custom Vite middleware in `api/_devMiddleware.js` intercepts `/api/*` and runs the handlers directly in Node:

```javascript
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { apiDevMiddleware } from "./api/_devMiddleware.js";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiDevMiddleware(), // Runs your API handlers seamlessly during npm run dev!
  ],
});
```

---

## 9. Configuring Vercel for Production Deployment

When deploying your project to Vercel:

1. Push your latest code to GitHub:
   ```bash
   git add .
   git commit -m "Migrate to Aiven PostgreSQL"
   git push origin main
   ```
2. Go to your **[Vercel Dashboard](https://vercel.com/)** and select your project.
3. Click **Settings** $\rightarrow$ **Environment Variables**.
4. Add the variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Aiven Service URI (`postgres://avnadmin:...@...aivencloud.com:PORT/defaultdb?sslmode=require`)
5. Click **Save**.
6. Go to the **Deployments** tab and click **Redeploy** (or trigger a new commit).
7. Your app and all serverless API endpoints are now live with Aiven Free Tier PostgreSQL!

---

## 10. Summary Checklist for Future Projects

When building your next project with Aiven PostgreSQL:

- [ ] **1. Create Aiven Service**: Pick Free Tier PostgreSQL, choose closest region, copy Service URI.
- [ ] **2. Add `.env`**: Set `DATABASE_URL=...` (keep it secret).
- [ ] **3. Install `pg` & `dotenv`**: Run `npm install pg dotenv`.
- [ ] **4. Build `api/db.js`**: Setup pooled database connection with `ssl: { rejectUnauthorized: false }`.
- [ ] **5. Write Serverless Routes**: Create files under `api/` for each feature.
- [ ] **6. Hook Vite Middleware**: Use `apiDevMiddleware()` so `npm run dev` runs frontend and backend together.
- [ ] **7. Set Vercel Env**: Add `DATABASE_URL` in Vercel project settings before deploying.
