# Beej Dost — Authentication & Profile Security Configuration

This document specifies the Supabase Auth configuration, URL redirect whitelist, security boundaries, and tested vs. untested scenarios for **Beej Dost (Phase 3)**.

---

## 1. Supabase Dashboard Auth Settings

To operate Beej Dost with real email/password authentication and email verification, configure the Supabase project dashboard as follows:

### Authentication -> Providers -> Email
| Setting | Recommended Value | Rationale |
| :--- | :--- | :--- |
| **Enable Email provider** | **Enabled (ON)** | Primary authentication mechanism for Pakistani farmers and seed savers. |
| **Confirm email** | **Enabled (ON)** | Required by project specifications: unconfirmed accounts must not be treated as verified. |
| **Secure email change** | **Enabled (ON)** | Requires confirming both old and new addresses when changing email. |
| **Enable phone/SMS auth** | **Disabled (OFF)** | Explicitly forbidden in requirements (no SMS/phone OTP requirement). |
| **Minimum password length** | **8 characters** | Enforced client-side via Zod and server-side via Supabase Auth. |

---

## 2. Redirect URLs Whitelist

Configure these in **Authentication -> URL Configuration** in the Supabase Dashboard:

### Site URL
- **Production:** `https://beejdost.pk`
- **Staging / Preview:** `https://staging.beejdost.pk`
- **Local Development:** `http://localhost:5173`

### Additional Redirect URLs
```
http://localhost:5173/auth/callback
http://localhost:5173/reset-password
https://beejdost.pk/auth/callback
https://beejdost.pk/reset-password
https://*.pages.dev/auth/callback
https://*.pages.dev/reset-password
```

---

## 3. Email Templates Setup

In **Authentication -> Email Templates**:

### 1. Confirm signup
- **Subject:** `Verify your Beej Dost Farmer Account / اپنے کسان اکاؤنٹ کی تصدیق کریں`
- **Body:**
```html
<h2>Welcome to Beej Dost — پاکستان بیج دوست</h2>
<p>Thank you for registering to preserve and exchange agricultural heritage seeds.</p>
<p>Click the link below to confirm your email address and activate your account:</p>
<p><a href="{{ .SiteURL }}/auth/callback?code={{ .TokenHash }}">Confirm My Email Address</a></p>
<p>If you did not create this account, please disregard this email.</p>
```

### 2. Reset password
- **Subject:** `Reset Your Beej Dost Password / پاس ورڈ دوبارہ ترتیب دیں`
- **Body:**
```html
<h2>Beej Dost Password Reset Request</h2>
<p>We received a request to reset the password for your Beej Dost farmer account.</p>
<p><a href="{{ .SiteURL }}/reset-password">Choose New Password</a></p>
<p>This link is valid for 1 hour. If you did not request this change, your account remains secure.</p>
```

---

## 4. Architecture & Security Boundaries

### 1. Database Provisioning & Security Enforcement
- **Trigger `handle_new_user()`:** When a user signs up via `auth.users`, a database trigger (`AFTER INSERT ON auth.users`) automatically creates their row in `public.profiles` using registration metadata (`full_name`, `province`, `district`, `tehsil`, `village`, `phone`, `farming_type`, `preferred_language`).
- **Immutability of Permissions:** Database trigger `prevent_profile_self_escalation()` strictly forbids normal users from modifying `is_verified_keeper` or `is_suspended` in `public.profiles`.
- **Admin Verification:** Administrator privileges are NEVER read from client state or unprivileged table columns. They are strictly derived from verified JWT `app_metadata` (`role === 'admin'` or `is_admin === true`) set only by database superusers/service role.
- **Passwords:** Passwords are never stored or handled in application tables; they reside exclusively in Supabase's encrypted internal auth vault (`auth.users.encrypted_password`).

### 2. Anti-Enumeration & Privacy Shielding
- **Login Errors:** Invalid email and wrong password both return `auth.invalidCredentials` ("Invalid email or password. Please try again."). This prevents attackers from probing which phone/email combinations exist on the platform.
- **Password Reset:** Submitting a reset email returns `auth.resetLinkSent` ("If an account exists with this email address, a password reset link has been sent.") regardless of account presence.
- **Unconfirmed Accounts:** When Supabase indicates `Email not confirmed`, the platform displays an alert with an explicit resend confirmation button instead of allowing unverified logins.

### 3. Route Protection as UX Feature
- `<ProtectedRoute>` prevents unauthorized navigation in the single-page application UI and retains intended destination via `?redirectTo=...`.
- The actual authorization boundary is enforced at the database level by Row-Level Security (RLS) on each table (`listings`, `messages`, `reports`, `favorites`).

### 4. Account Suspension
- If an account is suspended (`profile.is_suspended === true`), the user is immediately logged out and redirected to `/suspended`.
- The `/suspended` page provides clear explanation of restrictions and appeals contact (`support@beejdost.pk`).

### 5. Trilingual Localization & RTL
- All auth text, error messages, form fields, and status badges are translated into:
  - English (`en` — LTR)
  - Urdu (`ur` — RTL)
  - Punjabi Shahmukhi (`pa` — RTL)
- `i18n.on('languageChanged')` synchronously updates `document.documentElement.lang`, `document.documentElement.dir`, and CSS classes (`rtl` / `ltr`).
- Updating `preferredLanguage` in the user's profile automatically synchronizes the interface language.

---

## 5. Report: Tested vs. Untested Scenarios

### Automated Tested Scenarios (55 passing Vitest tests)
| # | Scenario | Test Location | Status |
| :--- | :--- | :--- | :--- |
| 1 | Registration Zod validation: checks minimum name length, email format, password minimum 8 chars, district requirement | `auth_flows.test.tsx` | **PASS** |
| 2 | Registration password matching: rejects mismatched confirmation password | `auth_flows.test.tsx` | **PASS** |
| 3 | Login anti-enumeration: displays generic invalid credentials message on bad credentials | `auth_flows.test.tsx` | **PASS** |
| 4 | Login unconfirmed account handling: detects unconfirmed error, presents notice, provides resend button | `auth_flows.test.tsx` | **PASS** |
| 5 | Password reset non-leaking notice: displays generic message on forgot-password submission | `auth_flows.test.tsx` | **PASS** |
| 6 | Reset password Zod validation: enforces 8 character minimum on new password | `auth_flows.test.tsx` | **PASS** |
| 7 | Session restoration: restores authenticated state, user profile, and confirmation status from session | `auth_flows.test.tsx` | **PASS** |
| 8 | Protected route redirection: redirects unauthenticated user from protected routes to `/login?redirectTo=...` | `auth_flows.test.tsx`, `routes.test.tsx` | **PASS** |
| 9 | Suspended account notice: renders `/suspended` page with policy info and appeal email | `auth_flows.test.tsx` | **PASS** |
| 10 | Admin route boundary: blocks authenticated non-admin user from accessing `requireAdmin` route | `auth_flows.test.tsx` | **PASS** |
| 11 | Expired confirmation link: `/auth/callback?error_code=otp_expired` displays expired state with resend action | `auth_flows.test.tsx` | **PASS** |
| 12 | Urdu localization: sets `dir="rtl"` and `lang="ur"` with `.rtl` class | `auth_flows.test.tsx`, `i18n.test.ts` | **PASS** |
| 13 | Punjabi Shahmukhi localization: sets `dir="rtl"` and `lang="pa"` with `.rtl` class | `auth_flows.test.tsx`, `i18n.test.ts` | **PASS** |
| 14 | English localization: sets `dir="ltr"` and `lang="en"` with `.ltr` class | `auth_flows.test.tsx`, `i18n.test.ts` | **PASS** |
| 15 | Postgres RLS security policies & triggers: 23 tests verifying public, keeper, and admin RLS constraints | `database_security.test.ts` | **PASS** |

### Untested / External Scenarios (Requiring Live Supabase & SMTP Server)
| # | Scenario | Reason Untested Locally | Production Mitigation |
| :--- | :--- | :--- | :--- |
| 1 | Third-party SMTP mail server delivery (e.g. Gmail/Resend/SendGrid delivery latency or spam filtering) | Requires live external mail transport server with public DNS SPF/DKIM records. | Supabase provides custom SMTP settings; verified via Supabase Dashboard test emails. |
| 2 | Real browser click-through from desktop Outlook / mobile mail client | Requires physical inbox access. | Tested via mock callback URL with PKCE token and error hashes. |
| 3 | Captcha / Cloudflare Turnstile bot deterrence | Phase 3 specification did not mandate Captcha challenge integration. | Supabase supports enabling Turnstile/hCaptcha in Dashboard -> Auth -> Bot Protection. |
