# ⚡ STEP 3: Supabase Backend & Database Setup

Supabase provides your database (PostgreSQL), authentication, file storage, and realtime sync without needing to write a separate Node/Express backend server.

---

## 1. Creating Your Project on Supabase

1. Go to **[supabase.com](https://supabase.com)** and log in with your GitHub account.
2. Click **"New project"**.
3. Choose an Organization, enter a **Name** (e.g., `gym_pos`), and set a **Database Password** (save this password in your notes).
4. Choose the region closest to your users (e.g., *Southeast Asia / Singapore*).
5. Click **Create new project** and wait ~1-2 minutes for it to provision.

---

## 2. Getting Your API Keys & Setting Up `.env`

1. In your Supabase project dashboard, click the ⚙️ **Project Settings** icon (bottom left).
2. Click **API** under Configuration.
3. Find:
   * **Project URL**: e.g., `https://abcdefg.supabase.co`
   * **Project API keys** $\rightarrow$ `anon` / `public`: e.g., `eyJhbGciOi...`
4. In your project root, create a file named `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   > 💡 **Notice the `VITE_` prefix!** In Vite projects, environment variables accessible in the browser MUST start with `VITE_`.

---

## 3. Initializing the Client (`src/supabase.js`)

Create `src/supabase.js` to initialize a single connection instance used across the entire app:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing! Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
```

---

## 4. Creating Tables in SQL Editor

In your Supabase dashboard, click **SQL Editor** on the left menu, paste the SQL statements below, and click **Run**:

```sql
-- 1. Staff Accounts
create table if not exists public.staff_accounts (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  role text default 'STAFF',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Members
create table if not exists public.members (
  id text primary key,
  name text not null,
  phone text,
  plan text not null,
  status text default 'ACTIVE',
  start_date date not null,
  expires_at date not null,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Inventory / Products
create table if not exists public.inventory (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(10,2) not null,
  stock integer default 0 not null,
  threshold integer default 5 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Transactions (Sales History)
create table if not exists public.transactions (
  transaction_id text primary key,
  customer_id text,
  customer_type text,
  total_amount numeric(10,2) not null,
  status text default 'PAID',
  items jsonb default '[]'::jsonb,
  date text,
  time text,
  paid_date text,
  paid_time text,
  was_unpaid boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

---

## 5. Row Level Security (RLS): The #1 Reason Queries Fail

By default, Supabase enables **Row Level Security (RLS)** on newly created tables. If RLS is ON and you haven't created policies, Supabase will silently return **empty arrays `[]`** or **401 Unauthorized errors** to your app!

### For Direct-Client Apps (Fastest Setup):
Either disable RLS for your tables in SQL Editor:
```sql
alter table public.staff_accounts disable row level security;
alter table public.members disable row level security;
alter table public.inventory disable row level security;
alter table public.transactions disable row level security;
```

Or enable an open policy:
```sql
create policy "Allow all access" on public.members for all using (true) with check (true);
```

---

## 6. Enabling Realtime Sync (Instant Updates on Multiple Devices)

To make changes on your phone appear on your laptop immediately without refreshing:
1. In Supabase, go to **Database** $\rightarrow$ **Replication**.
2. Click **Source** $\rightarrow$ `supabase_realtime`.
3. Toggle ON the tables you want to sync in real time (`members`, `inventory`, `transactions`).
