# Beej Dost — Secure Initial Administrator Setup Guide

This guide describes how to provision the initial platform administrator for **Beej Dost** safely and securely.

---

## 1. Zero-Trust Security Invariants

Beej Dost enforces a strict **Zero-Trust Administrative Model**:

1. **Immutable Client Boundaries:** Administrator status can **NEVER** be registered from the frontend or elevated through client-side API requests.
2. **`app_metadata` Isolation:** Authorization checks rely exclusively on trusted JWT `app_metadata` (`role === 'admin'` or `is_admin === true`). User-editable `user_metadata` or unprivileged columns in `public.profiles` are never trusted for authorization.
3. **No Secret Keys in Frontend:** The Supabase `service_role` key must **NEVER** be placed in `.env` under any `VITE_` prefix, committed to Git, or exposed to the browser.
4. **JWT Session Lifecycle:** When an account is promoted to administrator, its existing browser JWT session token does not automatically contain the new claims. **The user must sign out and sign back in** to obtain a fresh JWT containing the administrative claims.

---

## 2. Step-by-Step Administrator Provisioning

### Step 1: Register Normal Account
1. Open the Beej Dost web application (e.g. `http://localhost:5173/register` or `https://beejdost.pk/register`).
2. Fill out the registration form with your intended administrator email (e.g. `admin@beejdost.pk`), password, and location details.
3. If email confirmations are enabled in your Supabase project, click the verification link in your email to confirm the account.

---

### Step 2: Elevate Account to Administrator

Choose either **Method A** (CLI Bootstrap Script) or **Method B** (Supabase Dashboard SQL Console).

#### Method A: Using the Secure Admin Bootstrap Script (Recommended)
Run the server-side bootstrap script by passing your `SUPABASE_SERVICE_ROLE_KEY` as an environment variable and providing your registered email:

```bash
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key" node scripts/bootstrap-admin.mjs --email=admin@beejdost.pk
```

Or target by user UUID:
```bash
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key" node scripts/bootstrap-admin.mjs --user-id=11111111-1111-1111-1111-111111111111
```

The script will:
- Connect to Supabase Auth Admin API using the secure service role.
- Find your registered user.
- Add `role: 'admin'` and `is_admin: true` to the user's `raw_app_meta_data`.
- Mark `is_verified_keeper: true` on their profile.
- Re-fetch the user to cryptographically verify the promotion.

#### Method B: Manual Supabase Dashboard SQL Editor (No Script Required)
If you do not have or do not wish to use the service role key locally, elevate the account directly in the Supabase Dashboard:

1. Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Select your project -> Click **SQL Editor** -> **New Query**.
3. Run the following statement (replace with your registered email):

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin", "is_admin": true}'::jsonb
WHERE email = 'admin@beejdost.pk';
```

---

### Step 3: Refresh Session Token
1. In the web application, if you are currently logged in, click **Sign Out**.
2. Log back in at `/login` with your administrator email and password.
3. Supabase Auth will generate a new JWT session containing `app_metadata.role = "admin"`.

---

### Step 4: Verify Administrator Access
1. In the application header, click on your profile or navigate to `/admin`.
2. Confirm the **Operations Console** displays with:
   - Green **Configured** system status banner
   - Listing moderation queue
   - Reports resolution queue
   - Seed keeper verification tools
3. To verify via CLI script:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" node scripts/bootstrap-admin.mjs --email=admin@beejdost.pk --verify
   ```

---

## 3. Revoking Administrator Privileges

To safely revoke administrator status from an account:

### Via CLI Script:
```bash
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" node scripts/bootstrap-admin.mjs --email=admin@beejdost.pk --revoke
```

### Via Supabase SQL Console:
```sql
UPDATE auth.users
SET raw_app_meta_data = (raw_app_meta_data - 'role') || '{"is_admin": false}'::jsonb
WHERE email = 'admin@beejdost.pk';
```

The revoked user must sign out to terminate their administrative session.
