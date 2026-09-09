# 🚀 STEP 6: Vercel Deployment & PWA Installation

This guide explains how to host your project on Vercel and configure it as an installable desktop and mobile app (PWA) without browser badges.

---

## 1. Hosting on Vercel (Continuous Deployment)

Vercel provides free, high-performance hosting that automatically redeploys every time you push code to GitHub.

### Step-by-Step Vercel Deployment:

1. Go to **[vercel.com](https://vercel.com)** and sign in with your GitHub account.
2. Click **"Add New..."** $\rightarrow$ **Project**.
3. Under _Import Git Repository_, find your GitHub repository and click **Import**.
4. **Configure Project**:
   - Framework Preset: `Vite` (automatically detected).
   - Root Directory: `./`
5. **Add Environment Variables** (Critical!):
   Expand the _Environment Variables_ section and add:
   - **Key**: `VITE_SUPABASE_URL` | **Value**: Your Supabase project URL
   - **Key**: `VITE_SUPABASE_ANON_KEY` | **Value**: Your Supabase Anon public key
6. Click **Deploy**.
7. In ~30 seconds, your app will be live at `https://your-project.vercel.app`!

---

## 2. Converting the Web App into an Installable App (PWA)

To make the app installable like a native desktop executable or mobile app without opening a browser tab:

### 1. The Web App Manifest (`public/manifest.json`)

```json
{
  "id": "my-app-pwa",
  "name": "KUYAJEFF'S GYM",
  "short_name": "KUYAJEFF'S GYM",
  "description": "Gym Management & POS System",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#09090b",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 2. The Service Worker (`public/sw.js`)

A service worker enables offline capability and qualifies your app for native WebAPK generation:

```javascript
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
```

### 3. Registering the Service Worker (`src/main.jsx`)

```javascript
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("ServiceWorker registration failed: ", err);
    });
  });
}
```

---

## 3. How to Remove the Browser Badge Icon on Android & Windows

If you add a website as a regular bookmark shortcut, Android/Chrome places a small Chrome logo in the corner of your app icon.

### To install it as a pure app with NO browser badge:

1. Ensure your app has:
   - Valid `192x192` and `512x512` **PNG icons** in `manifest.json`.
   - A registered **Service Worker**.
   - Served over **HTTPS** (automatic on Vercel).
2. On Android phone: Open link in Chrome $\rightarrow$ Tap `⋮` $\rightarrow$ Tap **"Install App"** (NOT "Add to Home Screen shortcut").
3. On Windows PC / Laptop: Open link in Chrome or Edge $\rightarrow$ Click the **Install Icon** in the URL address bar.
4. It will now launch in its own standalone window with your custom logo and no browser UI!
