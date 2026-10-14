# Beej Dost (پاکستان بیج دوست)

> **Phase 1: Project Foundation**  
> Pakistan-wide agricultural seed exchange and marketplace Progressive Web Application (PWA). Connecting smallholders, organic growers, and community seed keepers to preserve heritage varieties and strengthen climate-resilient farming.

---

## 🌾 Platform Highlights

- **Heritage & Climate-Resilient Seeds**: Variety discovery optimized for local agro-ecological zones (Sindh canal & delta, Punjab fertile plains, KP valleys, Balochistan drylands, Gilgit-Baltistan highlands).
- **Trilingual & Script-Aware**: English (LTR), Urdu (RTL), and Shahmukhi Punjabi (RTL) with dynamic bidirectional document formatting.
- **PWA & Offline Capability**: Installable on Android, iOS, and Desktop. Service worker precaches static assets while strictly isolating and never caching private authentication or sensitive farmer communications.
- **Cloudflare Pages Static Deployment**: Single Page Application (SPA) routing prepared with `_redirects` rules.
- **Strict Quality Standard**: Strict TypeScript mode, zero unhandled rejections, accessible labels with keyboard navigation, automated Vitest and React Testing Library suites.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework & Build** | React 18, Vite 6, TypeScript (strict mode) |
| **Routing** | React Router v7 (`createBrowserRouter`) |
| **State & Forms** | React Hook Form, Zod schema validation |
| **Internationalization** | i18next, react-i18next, language detector (EN, UR, PA) |
| **Backend & Auth** | Supabase JavaScript Client (`@supabase/supabase-js`) |
| **PWA & Caching** | `vite-plugin-pwa`, Workbox service worker |
| **Styling** | Vanilla CSS responsive design system (Mobile-First, Emerald & Amber theme) |
| **Testing** | Vitest, React Testing Library, JSDOM, Playwright |
| **Deployment** | Cloudflare Pages static site hosting |

---

## 📁 Feature-Based Directory Structure

```
beej-dost/
├── public/
│   ├── _redirects               # Cloudflare Pages SPA rewrite rule
│   ├── favicon.svg              # SVG brand icon
│   └── icons/                   # PWA 192x192, 512x512, maskable icons
├── src/
│   ├── components/
│   │   ├── common/              # EmptyState, ErrorState, LoadingState, NotFound, LanguageSwitcher, PWAInstallPrompt
│   │   └── layout/              # AppLayout, Header, BottomNav, Footer
│   ├── features/
│   │   ├── admin/               # Platform health, metrics, security audit
│   │   ├── auth/                # LoginPage, RegisterPage with Zod validation
│   │   ├── home/                # HomePage, hero, stats, feature pillars
│   │   ├── listings/            # SearchPage, ListingDetailsPage, CreateListingPage, MyListingsPage
│   │   ├── messages/            # MessagesPage, direct keeper inquiry threads
│   │   └── profile/             # ProfilePage, farmer verification badge
│   ├── hooks/                   # usePWAInstall
│   ├── i18n/
│   │   ├── locales/             # en.json, ur.json, pa.json dictionaries
│   │   └── config.ts            # RTL/LTR detection and document attribute sync
│   ├── lib/
│   │   ├── env.ts               # Zod environment variable parsing
│   │   └── supabase.ts          # Supabase client factory and status checker
│   ├── router/
│   │   ├── routes.tsx           # Route declarations with Suspense
│   │   └── AppRouter.tsx        # Router provider initialization
│   ├── styles/
│   │   ├── variables.css        # Design tokens, palette, spacing, typography
│   │   └── index.css            # Mobile-first styles, touch targets, resets
│   ├── test/                    # Vitest setup, i18n RTL tests, route tests
│   ├── types/                   # TypeScript interfaces (SeedListing, Profile, etc.)
│   ├── App.tsx                  # Root application component
│   ├── main.tsx                 # Entry mount with React StrictMode
│   └── vite-env.d.ts            # Vite environment definitions
├── .env.example                 # Environment configuration template
├── eslint.config.js             # ESLint 9 flat configuration
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # Strict TypeScript configuration for app
├── tsconfig.node.json           # TypeScript configuration for build tools
├── vite.config.ts               # Vite & PWA Workbox caching configuration
└── vitest.config.ts             # Vitest test runner configuration
```

---

## 💻 Windows Setup & Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Git**
- **PowerShell** or Command Prompt

### 2. Clone and Install Dependencies
In PowerShell:
```powershell
git clone <repository-url> beej-dost
cd beej-dost
npm install
```

### 3. Configure Environment Variables
Create your local `.env` from the template:
```powershell
Copy-Item .env.example .env
```

Open `.env` and configure your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_ENV=development
```
> **Security Note**: Never commit `.env` or production keys to version control. `.env` and `.env*.local` are explicitly ignored by `.gitignore`.

### 4. Start the Development Server
```powershell
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing, Linting & Type Checking

### Run Automated Unit & Route Tests
Runs Vitest with React Testing Library across language direction tests and all route rendering tests:
```powershell
npm run test
```

### Run Type Checking
Runs TypeScript compiler in strict mode with `--noEmit`:
```powershell
npm run typecheck
```

### Run ESLint
Inspects code for lint issues, unused variables, and forbidden `any` types:
```powershell
npm run lint
```
To automatically fix fixable issues:
```powershell
npm run lint:fix
```

### Run Playwright End-to-End Tests
```powershell
npm run test:e2e
```

---

## 🏗️ Production Build & Verification

To compile the application bundle:
```powershell
npm run build
```
This runs `tsc -b` for strict type verification followed by `vite build` to generate the production assets in `dist/`.

To preview the built production bundle locally:
```powershell
npm run preview
```

---

## ☁️ Cloudflare Pages Static Deployment

Beej Dost is built for zero-maintenance, edge-accelerated static deployment on **Cloudflare Pages**:

1. **Build Configuration**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
   - **Node.js Version**: `20` or higher
2. **Environment Variables**:
   In Cloudflare Pages Dashboard -> Settings -> Environment Variables, configure:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_ENV` (`production`)
3. **SPA Routing**:
   The `public/_redirects` file is automatically deployed to the root of `dist/` containing:
   ```
   /*    /index.html   200
   ```
   This ensures direct access to `/search`, `/listings/:id`, `/messages`, and `/admin` routes correctly resolves to the single-page application without 404 errors.

---

## 🔒 Service Worker & Privacy Policy

The PWA service worker is configured via Workbox with explicit privacy rules:
- **Precached Assets**: Public static files only (HTML, CSS, JS, fonts, static SVGs/PNGs).
- **Public Fonts Cache**: Google Fonts stylesheets and webfonts cached via StaleWhileRevalidate / CacheFirst.
- **STRICT PRIVACY EXCLUSION**: The Service Worker configuration explicitly routes all Supabase Auth endpoints (`/auth/*`), private chat and message tables (`/rest/v1/messages*`, `/rest/v1/user_profiles*`, `/rest/v1/direct_messages*`), and realtime WebSockets through `NetworkOnly`. **No private user data or sensitive communications are ever stored in a public browser cache.**

---

## 🌐 Language & Direction (RTL / LTR)

Beej Dost supports 3 national and regional languages of Pakistan:
- **English (`en`)**: Direction `ltr`, default font family *Plus Jakarta Sans*.
- **Urdu (`ur`)**: Direction `rtl`, font family *Noto Nastaliq Urdu* / *Noto Sans Arabic*.
- **Punjabi - Shahmukhi script (`pa`)**: Direction `rtl`, font family *Noto Nastaliq Urdu* / *Noto Sans Arabic*.

Language selection persists across sessions in `localStorage` under `beej_dost_language`. Switching languages immediately updates `document.documentElement.lang`, `document.documentElement.dir`, and CSS layout classes.
