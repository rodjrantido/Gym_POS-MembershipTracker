# 🛠️ THE FULL-STACK PROJECT CREATION BLUEPRINT

### A Step-by-Step Guide to Building Production React + Supabase Apps from Scratch

This comprehensive handbook is designed to be your reference manual for building any future full-stack web application completely on your own.

---

## 📑 Table of Contents

1. [The 5-Minute High-Level Mental Model](#1-the-5-minute-high-level-mental-model)
2. [Project Setup & Dependencies (Vite + Tailwind)](#2-project-setup--dependencies)
3. [Folder Structure & Clean Architecture](#3-folder-structure--clean-architecture)
4. [Git & GitHub Version Control](#4-git--github-version-control)
5. [Supabase Database & Backend Configuration](#5-supabase-database--backend-configuration)
6. [Writing the API Connection Layer (`api.js`)](#6-writing-the-api-connection-layer)
7. [Writing React & JSX Code (Components, State, Hooks)](#7-writing-react--jsx-code)
8. [Timezone-Safe Date Handling (Avoiding 1-Day Lag)](#8-timezone-safe-date-handling)
9. [Deploying to Vercel & PWA Executable Installation](#9-deploying-to-vercel--pwa-installation)
10. [New Project Launch Checklist](#10-new-project-launch-checklist)

---

## 1. The 5-Minute High-Level Mental Model

Modern web development consists of 4 distinct parts working together:

```text
[ Browser / Phone ]
       │
       ▼
[ React & JSX (UI) ] ──▶ [ State (Memory) ]
       │
       ▼
[ api.js (Service) ]
       │
       ▼
[ Supabase (Postgres Database, Storage, Auth) ]
```

1. **The User Interface (React / JSX)**: What the user sees on screen (buttons, cards, inputs).
2. **State (`useState`)**: The temporary memory of your app (what's in the cart, who is logged in, search filters).
3. **The API Layer (`api.js`)**: Clean helper functions that talk to your database (`fetchMembers()`, `updateStock()`).
4. **The Database (Supabase)**: Permanent cloud storage that persists even when the user closes their device.

---

## 2. Project Setup & Dependencies

Open your terminal in the folder where you keep your projects and run:

```bash
# 1. Initialize modern React app with Vite
npm create vite@latest my-app -- --template react

# 2. Navigate into project
cd my-app

# 3. Install core packages
npm install

# 4. Install essential libraries:
#    - lucide-react: Modern icons
#    - @supabase/supabase-js: Official database client
npm install lucide-react @supabase/supabase-js

# 5. Install Tailwind CSS v4
npm install -D tailwindcss @tailwindcss/vite
```

### Configure Vite for Tailwind (`vite.config.js`):

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### In `src/index.css`:

```css
@import "tailwindcss";
```

---

## 3. Folder Structure & Clean Architecture

Keep your code organized into these standard folders:

```text
my-app/
├── public/                 # Favicons, PWA icons, manifest.json, sw.js
├── src/
│   ├── components/         # Reusable UI widgets (Buttons, Inputs, Badges, Modals)
│   ├── screens/            # Full-page screens grouped by feature (auth, members, stocks)
│   ├── services/           # Database queries (api.js)
│   ├── utils/              # Helper functions (dateUtils.js, math, formatters)
│   ├── constants/          # Colors, themes, static presets
│   ├── supabase.js         # Initialized Supabase client
│   ├── App.jsx             # Top-level state & screen router
│   ├── main.jsx            # React root mount
│   └── index.css           # Global stylesheet
├── .env                    # Local secrets (never commit to GitHub!)
├── .gitignore              # Files ignored by Git
└── package.json            # Scripts & libraries
```

---

## 4. Git & GitHub Version Control

### Step 1: Create `.gitignore` (FIRST!)

Before making any commits, ensure `.gitignore` contains:

```gitignore
node_modules
dist
.env
.env.local
.DS_Store
```

### Step 2: Initialize & Link to GitHub

1. Create a repository on [github.com/new](https://github.com/new). Leave "Add README" unchecked.
2. In terminal:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### Step 3: Daily 3-Command Push Workflow

Whenever you finish adding or fixing a feature:

```bash
git add .
git commit -m "Describe what was added or fixed"
git push
```

---

## 5. Supabase Database & Backend Configuration

### Step 1: Create a Project

- Go to [supabase.com](https://supabase.com) $\rightarrow$ New project.
- Name your project and choose your region.

### Step 2: Set Environment Variables (`.env`)

From **Project Settings $\rightarrow$ API**, copy URL and Anon key into `.env`:

```env
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Step 3: Initialize Client (`src/supabase.js`)

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
```

### Step 4: Create Tables (SQL Editor)

```sql
-- Example: Members Table
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

-- Crucial: Disable RLS for direct client projects to prevent silent query blocks
alter table public.members disable row level security;
```

---

## 6. Writing the API Connection Layer (`src/services/api.js`)

Centralize all database calls into clean async functions:

```javascript
import { supabase } from "../supabase";

// 1. Fetch
export async function fetchMembers() {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// 2. Insert
export async function insertMember(member) {
  const { data, error } = await supabase
    .from("members")
    .insert([member])
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// 3. Update
export async function updateMember(memberId, updates) {
  const { data, error } = await supabase
    .from("members")
    .update(updates)
    .eq("id", memberId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// 4. Delete
export async function deleteMember(memberId) {
  const { error } = await supabase.from("members").delete().eq("id", memberId);
  if (error) throw error;
}
```

---

## 7. Writing React & JSX Code

### Rule #1: Hooks Order (No Conditional Hooks!)

Always declare all `useState` and `useEffect` calls at the very top of your component:

```jsx
export const MyScreen = ({ item }) => {
  // ✅ 1. Hooks first:
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ 2. Early returns after:
  if (!item) return null;

  return <div>{item.title}</div>;
};
```

### Rule #2: Controlled Inputs

Bind every input value to state with an `onChange`:

```jsx
<input
  type="text"
  value={formData.name}
  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white"
/>
```

### Rule #3: Duplicate Checking

Before saving an item, always check existing state:

```jsx
const isDuplicate = inventory.some(
  (item) => item.name.trim().toLowerCase() === newName.trim().toLowerCase(),
);

if (isDuplicate) {
  alert("A product with this name already exists!");
  return;
}
```

---

## 8. Timezone-Safe Date Handling (Avoiding 1-Day Lag)

### Why JavaScript Dates Bug Out:

- `.toISOString()` converts local time to **UTC (Greenwich Mean Time)**. In Asian/Pacific timezones (UTC+8), morning hours convert to **yesterday in UTC**, resulting in dates that are 1 day behind!
- `new Date("YYYY-MM-DD")` is parsed at **UTC midnight**, which shifts back by 1 day when viewed locally.

### The Solution: Use Dedicated Local Date Helpers (`dateUtils.js`)

```javascript
// Get YYYY-MM-DD in local time (never UTC)
export function getLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Parse YYYY-MM-DD at LOCAL midnight
export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

// Add days safely in local calendar
export function addDaysToDate(baseDate, days = 30) {
  const d = parseLocalDate(baseDate);
  d.setDate(d.getDate() + Number(days));
  return getLocalDateString(d);
}

// Calculate remaining days accurately
export function calculateDaysRemaining(expiryStr) {
  if (!expiryStr) return 0;
  const expiry = parseLocalDate(expiryStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}
```

---

## 9. Deploying to Vercel & PWA Installation

### Deploy to Vercel:

1. Go to **[vercel.com](https://vercel.com)** $\rightarrow$ **Add New...** $\rightarrow$ **Project**.
2. Select your GitHub repository and click **Import**.
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. Done! Every future `git push` will auto-deploy!

### Native PWA Executable Installation (No Browser Badges):

1. In `public/manifest.json`: Ensure you have `display: "standalone"`, plus `192x192` and `512x512` **PNG** icons with `purpose: "any maskable"`.
2. In `public/sw.js`: Add a basic service worker.
3. In `src/main.jsx`: Register `navigator.serviceWorker.register('/sw.js')`.
4. On client device: Open the live Vercel link $\rightarrow$ click **"Install App"** (in Chrome address bar on PC, or Chrome menu on Android).

---

---

## 10. Advanced Alternative: Aiven Free Tier PostgreSQL (5GB Storage & Zero Sleep)

If you need larger database storage (5GB vs. 500MB) and want to avoid inactivity pauses:

1. **Aiven PostgreSQL Free Tier**: Create a free PostgreSQL cluster at [aiven.io](https://aiven.io).
2. **Serverless API Layer (`api/`)**: Browsers cannot speak raw PostgreSQL TCP. Instead, create lightweight serverless endpoints in `/api/*.js` using `pg.Pool`.
3. **Local Dev Without Extra Servers**: Use `apiDevMiddleware()` in `vite.config.js` so `npm run dev` handles both frontend and API routes concurrently.
4. **Vercel Deployment**: In Vercel Project Settings, add `DATABASE_URL` as an environment variable. Vercel automatically deploys your `/api` endpoints as serverless functions.
5. **Read the Full Step-by-Step Guide**: See [`docs/07_AIVEN_POSTGRES_SETUP.md`](docs/07_AIVEN_POSTGRES_SETUP.md) for complete copy-paste code.

---

## 11. New Project Launch Checklist

Use this quick checklist every time you start a new project:

- [ ] Run `npm create vite@latest <name> -- --template react`
- [ ] Install dependencies (`lucide-react`, `tailwindcss`, plus backend drivers `pg` or `@supabase/supabase-js`)
- [ ] Create `.gitignore` (`node_modules`, `.env`, `dist`)
- [ ] Set up database (Supabase or Aiven Free Tier)
- [ ] Add `.env` with connection credentials
- [ ] Create API layer (`src/services/api.js`) and serverless routes if using Aiven
- [ ] Create `src/utils/dateUtils.js` for timezone-safe calendar calculations
- [ ] Initialize Git repository (`git init`, `git add .`, `git commit`, `git remote add origin`)
- [ ] Push to GitHub (`git push -u origin main`)
- [ ] Deploy to Vercel with Environment Variables added

---

_Happy Coding! With this blueprint, you have the exact professional recipe to build and scale your next web app independently._
