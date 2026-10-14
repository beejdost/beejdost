# Beej Dost — Database Security & Authorization Design (Phase 2)

## 1. Security Overview & Threat Model

Beej Dost connects smallholder farmers, seed savers, and agricultural researchers across Pakistan. The database handles sensitive information (phone numbers, physical villages/districts, direct inquiry messages, seed fraud reports).

### Core Security Objectives
1. **Zero-Trust Client Roles**: No role or permission is ever accepted from client-side parameters, URL parameters, or user-editable profile columns (`user_metadata`).
2. **Defensive Row Level Security (RLS)**: Enabled and strictly enforced on all 10 application tables. Anonymous users can never read private profiles, internal reports, or direct conversations.
3. **Privilege Escalation Immunity**: Users cannot elevate themselves to verified seed keeper or administrator. Database triggers and functions intercept and reject unauthorized modifications.
4. **Anti-Impersonation Messaging**: Direct buyer-seller conversations enforce atomic participant linkage. A buyer cannot fake a seller's identity or invent conversation members.
5. **Whistleblower / Reporter Shield**: Reports filed by users are strictly hidden from reported sellers and arbitrary users to prevent intimidation.
6. **No Client Service-Role Key**: The `SUPABASE_SERVICE_ROLE_KEY` is strictly prohibited from client browsers and client bundles.

---

## 2. Table & Entity Architecture

| Entity | Primary Key | Critical Constraints | Foreign Keys |
|---|---|---|---|
| `public.profiles` | `id` (UUID) | Maps to `auth.users.id`. Protected `is_verified_keeper`, `is_suspended` | References `auth.users(id)` |
| `public.crops` | `id` (UUID) | Unique slug, localized names (`name_en`, `name_ur`, `name_pa`), category check | None |
| `public.listings` | `id` (UUID) | Quantity > 0 kg, price >= 0 (if sale/both), valid harvest year, seed condition | References `profiles(id)`, `crops(id)` |
| `public.listing_images` | `id` (UUID) | Storage path required, display order | References `listings(id)` |
| `public.conversations` | `id` (UUID) | Single conversation per buyer-listing pair | References `listings(id)`, `profiles(id)` |
| `public.conversation_members` | `id` (UUID) | Role IN ('buyer', 'seller'), unique (`conversation_id`, `user_id`) | References `conversations(id)`, `profiles(id)` |
| `public.messages` | `id` (UUID) | Non-empty content, sender must be active member | References `conversations(id)`, `profiles(id)` |
| `public.favorites` | `id` (UUID) | Unique (`user_id`, `listing_id`) | References `profiles(id)`, `listings(id)` |
| `public.reports` | `id` (UUID) | Valid reason enum, reporter ownership | References `profiles(id)`, `listings(id)` |
| `public.moderation_actions` | `id` (UUID) | Admin-only access, audit trail | References `profiles(id)` |

---

## 3. Row Level Security (RLS) Policy Matrix

| Table | Operation | Anonymous (`anon`) | Authenticated (`authenticated`) | Platform Admin |
|---|---|---|---|---|
| `profiles` | SELECT | ❌ Denied | Own profile only (`auth.uid() = id`) | ✅ All profiles |
| `public_profiles` (View) | SELECT | ✅ Non-suspended | ✅ Non-suspended | ✅ All profiles |
| `profiles` | INSERT | ❌ Denied | Own profile only (`id = auth.uid()`, not suspended) | ✅ Allowed |
| `profiles` | UPDATE | ❌ Denied | Own profile (trigger blocks verified/suspended flags) | ✅ Allowed |
| `crops` | SELECT | ✅ Approved crops | ✅ Approved crops | ✅ All crops |
| `crops` | INSERT / UPDATE / DELETE | ❌ Denied | ❌ Denied | ✅ Allowed |
| `listings` | SELECT | ✅ Active non-suspended listings | Active listings + own listings | ✅ All listings |
| `listings` | INSERT | ❌ Denied | Own listings (`seller_id = auth.uid()`, not suspended) | ✅ Allowed |
| `listings` | UPDATE / DELETE | ❌ Denied | Own listings only (not suspended) | ✅ Allowed |
| `listing_images` | SELECT | ✅ Images for active listings | Images for active/own listings | ✅ All images |
| `listing_images` | INSERT / DELETE | ❌ Denied | Own listing images (not suspended) | ✅ Allowed |
| `conversations` | SELECT | ❌ Denied | Active conversation members only | ✅ Allowed |
| `conversations` | INSERT | ❌ Denied | Managed via `start_conversation` RPC | ✅ Allowed |
| `conversation_members` | SELECT | ❌ Denied | Participants of shared conversation | ✅ Allowed |
| `conversation_members` | INSERT | ❌ Denied | Atomic verification via `start_conversation` RPC | ✅ Allowed |
| `messages` | SELECT | ❌ Denied | Verified conversation members only | ✅ Allowed |
| `messages` | INSERT | ❌ Denied | Verified member (`sender_id = auth.uid()`, not suspended) | ✅ Allowed |
| `messages` | UPDATE / DELETE | ❌ Denied | ❌ Denied (immutable chat record) | ✅ Allowed |
| `favorites` | ALL | ❌ Denied | Own favorites only (`user_id = auth.uid()`) | ✅ Allowed |
| `reports` | SELECT | ❌ Denied | Own filed reports (`reporter_id = auth.uid()`) | ✅ All reports |
| `reports` | INSERT | ❌ Denied | Authenticated users (`reporter_id = auth.uid()`) | ✅ Allowed |
| `reports` | UPDATE / DELETE | ❌ Denied | ❌ Denied | ✅ Allowed |
| `moderation_actions` | ALL | ❌ Denied | ❌ Denied | ✅ All actions |

---

## 4. Administrator Provisioning Guide

### How Administrators are Identified
Administrators are **NEVER** identified by a column on the `public.profiles` table or by client-supplied metadata. The database verifies administrator privileges strictly through Supabase Auth `app_metadata`:
```sql
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_claims TEXT;
BEGIN
  v_claims := current_setting('request.jwt.claims', true);
  IF v_claims IS NULL OR v_claims = '' THEN
    RETURN FALSE;
  END IF;

  RETURN COALESCE(
    (v_claims::jsonb -> 'app_metadata' ->> 'role') = 'admin'
    OR
    (v_claims::jsonb -> 'app_metadata' ->> 'is_admin')::boolean = true,
    false
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;
```

### Provisioning the Initial Administrator Securely
To promote a trusted user to administrator, run the following server-side command through the Supabase Dashboard SQL Editor or via Supabase Admin CLI / management script with server credentials:

```sql
-- Step 1: Promote user in auth.users app_metadata
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin", "is_admin": true}'::jsonb
WHERE email = 'admin@beejdost.pk';

-- Step 2: Ensure profile reflects verified keeper status
UPDATE public.profiles
SET is_verified_keeper = TRUE
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@beejdost.pk');
```

Alternatively, using the Supabase JavaScript Server SDK in a secure server-side Node.js script (using `SUPABASE_SERVICE_ROLE_KEY`):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side environment variable only
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function provisionAdmin(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'admin', is_admin: true }
  });
  if (error) throw error;
  return data;
}
```

> **Security Warning**: `SUPABASE_SERVICE_ROLE_KEY` has full superuser access bypassing RLS. It must NEVER be exposed in `.env`, client code, or browser builds.

---

## 5. Storage Bucket Policies

1. **`listing-images`**:
   - Bucket configuration: `public: true`, `max_file_size: 5MB`, MIME types: `image/jpeg`, `image/png`, `image/webp`.
   - Path convention: `<user_id>/<listing_id>/<filename>`.
   - Upload policy: Users can only upload under their own `auth.uid()`, provided their account is not suspended.
   - Delete policy: Restricted to the file owner or an administrator.

2. **`avatars`**:
   - Bucket configuration: `public: true`, `max_file_size: 2MB`, MIME types: `image/jpeg`, `image/png`, `image/webp`.
   - Path convention: `<user_id>/avatar.<ext>`.
   - Restricted to `auth.uid()`.

3. **`private-docs` (Seed Certification Verification)**:
   - Bucket configuration: `public: false` (strictly private), `max_file_size: 10MB`, MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
   - Access: Strictly limited to the uploader (`auth.uid()`) and platform administrators (`auth.is_admin()`).

---

## 6. Seed Certification Verification Workflow

1. When a user creates a seed listing, they may declare `claimed_certified = TRUE` and provide `certification_details` (e.g., registration number, FSC&RD lab batch, organic certifying body).
2. The database forces `is_verified_certified = FALSE` on initial insert.
3. Database trigger `trg_protect_listing_certification` prohibits non-administrators from altering `is_verified_certified` or any review metadata.
4. An administrator audits the documentation in `private-docs` and executes an administrative review:
   ```sql
   UPDATE public.listings
   SET
     is_verified_certified = TRUE,
     certification_verified_by = auth.uid(),
     certification_verified_at = now(),
     certification_review_notes = 'Verified with Federal Seed Certification & Registration Department'
   WHERE id = '<listing_uuid>';
   ```
5. The administrator action is logged in `public.moderation_actions` for auditability.

---

## 7. Untested Edge Cases & Future Phase Considerations

1. **High-Frequency Rate Limiting on Messages**:
   - Current protection: Prevents unauthorized and suspended users from messaging.
   - Future enhancement: Enforce rate-limiting triggers (e.g., maximum 30 messages per minute per user) or Supabase edge middleware to prevent spam.
2. **Real-time Webhook Push Notifications**:
   - Integration with Supabase Realtime will require verifying that channel authorization filters match RLS policies.
3. **Automated Virus / Malware Scanning in Storage**:
   - Storage policies enforce MIME types and size limits; production deployment should integrate an asynchronous edge function to scan uploaded attachments before final publication.
