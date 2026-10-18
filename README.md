# Beej Dost (پاکستان بیج دوست)

> **Pakistan National Seed Exchange & Marketplace**  
> A Progressive Web Application (PWA) connecting smallholders, organic growers, and community seed keepers across Pakistan to preserve agricultural heritage varieties, foster climate-resilient farming, and enable secure direct seed exchanges.

---

## 🌾 Platform Highlights

- **Heritage & Climate-Resilient Seeds**: Variety discovery tailored to Pakistan's agro-ecological zones (Sindh canal & delta, Punjab fertile plains, KP valleys, Balochistan drylands, Gilgit-Baltistan highlands, Azad Kashmir, and Islamabad).
- **Trilingual & Script-Aware**: Native support for **English** (LTR), **Urdu** (RTL, Nastaliq typography), and **Shahmukhi Punjabi** (RTL) with dynamic bidirectional document formatting.
- **PWA & Offline Capability**: Installable on Android, iOS, and Desktop. Service worker precaches static assets while strictly isolating and never caching private authentication or sensitive farmer communications.
- **Multi-Tier Security Architecture**: Strict Row-Level Security (RLS) across all tables, zero client secret leakage, tamper-proof administrative authorization, and mandatory moderation audit logs.
- **Edge Deployment Ready**: Optimized for Cloudflare Pages static hosting with automated Single Page Application (SPA) routing via `_redirects` and hardened HTTP security headers via `_headers`.

---

## 📚 Production Documentation Package

| Document | Purpose |
| :--- | :--- |
| [**Final Project Setup Guide**](file:///e:/beej-dost/docs/FINAL_PROJECT_SETUP_GUIDE.md) | **Primary manual**: Step-by-step installation, Supabase remote configuration, migrations, admin bootstrap, Cloudflare Pages deployment, DNS, and maintenance. |
| [**Production Deployment Checklist**](file:///e:/beej-dost/docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md) | Practical deployment checklist with PASS / BLOCKED status, responsible roles, and launch approval gate. |
| [**Security & Operations Runbook**](file:///e:/beej-dost/docs/SECURITY_AND_OPERATIONS_RUNBOOK.md) | Operational runbook for secret rotation, abuse moderation, account suspension, storage security, and incident response. |
| [**Testing & Acceptance Guide**](file:///e:/beej-dost/docs/TESTING_AND_ACCEPTANCE.md) | Automated verification suite documentation and 17 real-world manual acceptance scenarios. |
| [**Admin Setup Guide**](file:///e:/beej-dost/docs/ADMIN_SETUP.md) | Zero-trust administrator provisioning guide and elevation SQL scripts. |
| [**Auth Settings Guide**](file:///e:/beej-dost/docs/AUTH_SETTINGS.md) | Supabase dashboard authentication settings, email templates, and redirect URL whitelists. |

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework & Build** | React 18, Vite 6, TypeScript (strict mode) |
| **Routing** | React Router v7 (`createBrowserRouter`) |
| **State & Forms** | React Hook Form, Zod schema validation |
| **Internationalization** | i18next, react-i18next, browser language detector (EN, UR, PA) |
| **Backend & Database** | Supabase (PostgreSQL 16, Auth, Storage, Realtime) |
| **Database Testing** | PGlite (PostgreSQL 16 WebAssembly engine) |
| **PWA & Caching** | `vite-plugin-pwa`, Workbox service worker |
| **Testing** | Vitest 3, React Testing Library, Playwright 1.50 |
| **Deployment** | Cloudflare Pages static edge hosting |

---

## 💻 Local Setup & Quickstart (Windows & Unix)

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher (`v20.18.0` LTS recommended)
- **npm**: `v10.0.0` or higher
- **Git**

### 2. Clone and Install Dependencies
In PowerShell:
```powershell
cd e:\beej-dost
npm ci
```
*(Use `npm install` if lockfile dependencies are updated)*.

### 3. Configure Local Environment Variables
Create your local `.env` from the template:
```powershell
Copy-Item .env.example .env
```

Configure your credentials in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_ENV=development
VITE_APP_NAME="Beej Dost"
VITE_APP_URL=http://localhost:5173
```
> **Security Rule:** Never put the `SUPABASE_SERVICE_ROLE_KEY` into `.env` or client code.

### 4. Start the Development Server
```powershell
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Verification Pipeline Commands

All verification scripts are registered in `package.json`:

```powershell
# 1. Type Safety Check (TypeScript strict mode)
npm run typecheck

# 2. Linting & Code Quality (ESLint 9)
npm run lint

# 3. Unit, Component, and Database Security Tests (Vitest + PGlite)
npm test

# 4. Playwright End-to-End Tests (Chromium & Mobile Pixel 5)
npm run test:e2e

# 5. Production Build (Rollup chunk optimization + PWA Service Worker)
npm run build

# 6. Preview Production Bundle Locally
npm run preview
```

---

## 📁 Repository Structure

```
beej-dost/
├── docs/                        # Complete architecture, setup, security, and testing guides
│   ├── FINAL_PROJECT_SETUP_GUIDE.md
│   ├── PRODUCTION_DEPLOYMENT_CHECKLIST.md
│   ├── SECURITY_AND_OPERATIONS_RUNBOOK.md
│   ├── TESTING_AND_ACCEPTANCE.md
│   ├── ADMIN_SETUP.md
│   └── AUTH_SETTINGS.md
├── e2e/                         # Playwright end-to-end test suite
│   └── release_audit.spec.ts
├── public/                      # Static assets and edge hosting directives
│   ├── _redirects               # Cloudflare Pages SPA rewrite rule (/* -> /index.html 200)
│   ├── _headers                 # Production HTTP security headers & cache policies
│   ├── manifest.webmanifest     # PWA Web App Manifest
│   ├── offline.html             # Trilingual offline fallback page
│   └── icons/                   # PWA 192x192, 512x512, and maskable icons
├── src/
│   ├── components/              # AppLayout, Header, BottomNav, Footer, OfflineBanner
│   ├── features/
│   │   ├── admin/               # Admin operations console, confirmation modal, moderation
│   │   ├── auth/                # Login, Register, Forgot Password, Reset Password, Suspension
│   │   ├── home/                # Home page, hero search, province filters, featured seeds
│   │   ├── listings/            # Marketplace search, listing details, create/edit listing
│   │   ├── messages/            # Direct keeper conversations, WhatsApp consent modal
│   │   └── profile/             # Farmer profile, verified keeper badge, farming type
│   ├── i18n/                    # Dictionaries (en.json, ur.json, pa.json), formatters, RTL config
│   ├── lib/                     # Zod environment validation, Supabase client factory
│   ├── router/                  # React Router v7 routes with ProtectedRoute guards
│   ├── styles/                  # Mobile-first design system and theme variables
│   └── test/                    # Vitest suites (DB security, auth, admin, listings, messages)
├── supabase/
│   └── migrations/              # 9 ordered SQL migrations (000001 through 000009)
├── .env.example                 # Environment configuration template
├── eslint.config.js             # ESLint 9 flat configuration
├── tsconfig.json                # Strict TypeScript configuration
├── vite.config.ts               # Vite build, Rollup manualChunks, and Workbox PWA configuration
└── vitest.config.ts             # Vitest test configuration
```

---

## ☁️ Production Deployment Summary

Beej Dost is deployed to **Cloudflare Pages** backed by **Supabase Cloud**:

1. **Build Preset**: Framework: `Vite`, Command: `npm run build`, Output: `dist`.
2. **Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_ENV=production`.
3. **Database Migrations**: Apply migrations `20260216000001` through `20260216000009` in order.
4. **Admin Bootstrap**: Execute elevation SQL in Supabase Dashboard SQL Editor for the initial administrator.
5. **Full Walkthrough**: Refer to [Final Project Setup Guide](file:///e:/beej-dost/docs/FINAL_PROJECT_SETUP_GUIDE.md).

---

## 📄 License & Community

Beej Dost is built to support sustainable agriculture, biodiversity preservation, and food sovereignty for farming communities in Pakistan.
"# beej-dost" 
