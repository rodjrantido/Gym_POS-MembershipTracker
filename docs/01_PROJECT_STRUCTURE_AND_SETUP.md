# 📁 STEP 1: Project Setup & Folder Architecture

This guide explains how to start a new React project from scratch and how to organize its folders so it never gets messy.

---

## 1. Initializing a Modern React Project (with Vite)

We use **Vite** because it is the fastest, cleanest standard tool for building React apps today.

### Open your terminal (PowerShell / Command Prompt) and run:

```bash
# 1. Create a new Vite React app (replace 'my-new-app' with your project name)
npm create vite@latest my-new-app -- --template react

# 2. Enter the new project folder
cd my-new-app

# 3. Install core dependencies
npm install

# 4. Install essential packages (Icons & Database client)
npm install lucide-react @supabase/supabase-js

# 5. Install Tailwind CSS (for easy modern styling)
npm install -D tailwindcss @tailwindcss/vite

# 6. Start the local development server
npm run dev
```

---

## 2. Setting Up Tailwind CSS

In modern Vite projects (`tailwindcss v4`):

1. In `vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

2. In `src/index.css`:

```css
@import "tailwindcss";
```

---

## 3. The Gold Standard Folder Structure

A professional React application separates **what things look like (UI)** from **how data is fetched (API)** and **how math/dates work (Utils)**.

```text
my-new-app/
├── public/                 # Static assets (Favicons, Logos, Manifest, PWA icons)
│   ├── favicon.svg
│   ├── manifest.json
│   └── sw.js
│
├── src/
│   ├── components/         # Reusable UI building blocks (Buttons, Inputs, Modals, Cards)
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Badge.jsx
│   │   └── Header.jsx
│   │
│   ├── screens/            # Full-page views organized by feature
│   │   ├── auth/           # Login, Signup
│   │   │   └── LoginScreen.jsx
│   │   ├── home/           # Dashboard, POS Station
│   │   │   ├── DashboardScreen.jsx
│   │   │   └── SelectCustomerScreen.jsx
│   │   ├── members/        # Member management
│   │   │   ├── MembersScreen.jsx
│   │   │   ├── MemberDetailScreen.jsx
│   │   │   └── AddMemberScreen.jsx
│   │   └── stocks/         # Inventory management
│   │       ├── StockScreen.jsx
│   │       └── AddItemScreen.jsx
│   │
│   ├── services/           # Data & Database Layer (Supabase queries)
│   │   └── api.js          # All database fetch, insert, update, delete functions
│   │
│   ├── utils/              # Helper functions (Timezone dates, calculations, sanitizers)
│   │   └── dateUtils.js
│   │
│   ├── constants/          # Colors, theme tokens, pricing presets
│   │   └── theme.js
│   │
│   ├── supabase.js         # Single shared Supabase client instance
│   ├── App.jsx             # Root component (holds central state & navigation router)
│   ├── index.css           # Global Tailwind stylesheet
│   └── main.jsx            # Entry point where React mounts to the HTML
│
├── .env                    # Local API keys (DO NOT commit to public Git!)
├── .gitignore              # Files Git should ignore (node_modules, .env)
├── index.html              # Base HTML template
├── package.json            # Project dependencies & scripts
└── vite.config.js          # Vite configuration
```

---

## 4. Rule of Thumb for Where Code Belongs

| If you are writing...                              | Put it in...             | Example                                   |
| :------------------------------------------------- | :----------------------- | :---------------------------------------- |
| A reusable visual piece (used in multiple screens) | `src/components/`        | `Button.jsx`, `Badge.jsx`, `Input.jsx`    |
| An entire page / view                              | `src/screens/<feature>/` | `DashboardScreen.jsx`, `StockScreen.jsx`  |
| Code that touches Supabase                         | `src/services/api.js`    | `fetchMembers()`, `updateItemStock()`     |
| Date or calculation logic                          | `src/utils/`             | `getLocalDateString()`, `addDaysToDate()` |
| App-wide state & page router                       | `src/App.jsx`            | Screen switcher (`switch (view)`)         |
