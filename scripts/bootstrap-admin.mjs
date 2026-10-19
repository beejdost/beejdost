/**
 * Beej Dost — Secure Initial Administrator Bootstrap Script
 *
 * This trusted server-side script securely promotes a designated user account
 * to Administrator by setting trusted `app_metadata` (`role: 'admin'`, `is_admin: true`).
 *
 * CRITICAL SECURITY INVARIANTS:
 * 1. Administrator privileges must NEVER be set or read via user_metadata (which is user-editable).
 * 2. The Supabase service-role key MUST NEVER be included in frontend code, committed to git, or printed.
 * 3. The target user must be explicitly specified by email or user UUID. Never guess or use defaults.
 * 4. The promoted user must sign out and sign back in to refresh their JWT session token.
 *
 * Usage:
 *   # Promote user by email:
 *   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" node scripts/bootstrap-admin.mjs --email=admin@beejdost.pk
 *
 *   # Promote user by UUID:
 *   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" node scripts/bootstrap-admin.mjs --user-id=11111111-1111-1111-1111-111111111111
 *
 *   # Verify user admin status:
 *   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" node scripts/bootstrap-admin.mjs --email=admin@beejdost.pk --verify
 *
 *   # Revoke admin status:
 *   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" node scripts/bootstrap-admin.mjs --email=admin@beejdost.pk --revoke
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse command-line arguments
const args = process.argv.slice(2);
let targetEmail = '';
let targetUserId = '';
let isRevoke = false;
let isVerifyOnly = false;

for (const arg of args) {
  if (arg.startsWith('--email=')) {
    targetEmail = arg.slice('--email='.length).trim();
  } else if (arg.startsWith('--user-id=')) {
    targetUserId = arg.slice('--user-id='.length).trim();
  } else if (arg === '--revoke') {
    isRevoke = true;
  } else if (arg === '--verify') {
    isVerifyOnly = true;
  }
}

// Load Supabase URL and Service Role Key from environment or .env
let supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
    if ((key === 'VITE_SUPABASE_URL' || key === 'SUPABASE_URL') && !supabaseUrl) {
      supabaseUrl = val;
    }
    if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !serviceRoleKey) {
      serviceRoleKey = val;
    }
  }
}

async function run() {
  console.log('====================================================');
  console.log('Beej Dost — Administrator Provisioning Utility');
  console.log('====================================================\n');

  if (!targetEmail && !targetUserId) {
    console.error('ERROR: You must specify an explicit user target.');
    console.error('Usage:');
    console.error('  node scripts/bootstrap-admin.mjs --email=<registered_user_email>');
    console.error('  node scripts/bootstrap-admin.mjs --user-id=<user_uuid>');
    console.error('  node scripts/bootstrap-admin.mjs --email=<registered_user_email> --revoke');
    process.exit(1);
  }

  if (!supabaseUrl) {
    console.error('ERROR: Supabase URL is not configured.');
    console.error('Please set VITE_SUPABASE_URL in your root .env file.');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.warn('NOTE: SUPABASE_SERVICE_ROLE_KEY was not found in environment.');
    console.warn('To use the automated Admin API bootstrap, pass SUPABASE_SERVICE_ROLE_KEY:');
    console.warn('  SUPABASE_SERVICE_ROLE_KEY="your-key" node scripts/bootstrap-admin.mjs --email=' + (targetEmail || targetUserId) + '\n');
    console.warn('----------------------------------------------------');
    console.warn('MANUAL DASHBOARD SQL ALTERNATIVE (No Service Role Key Required):');
    console.warn('----------------------------------------------------');
    console.warn('1. Open your Supabase Project Dashboard -> SQL Editor.');
    console.warn('2. Run this trusted query to grant administrator access:\n');
    if (targetEmail) {
      console.warn(`   UPDATE auth.users`);
      console.warn(`   SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin", "is_admin": true}'::jsonb`);
      console.warn(`   WHERE email = '${targetEmail}';\n`);
    } else {
      console.warn(`   UPDATE auth.users`);
      console.warn(`   SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin", "is_admin": true}'::jsonb`);
      console.warn(`   WHERE id = '${targetUserId}';\n`);
    }
    console.warn('3. Ensure the user signs out and signs back in to refresh their session JWT.\n');
    process.exit(0);
  }

  // Initialize administrative Supabase client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Locate the user
  let user = null;
  if (targetUserId) {
    const { data, error } = await supabase.auth.admin.getUserById(targetUserId);
    if (error || !data.user) {
      console.error(`ERROR: User with UUID "${targetUserId}" not found.`);
      process.exit(1);
    }
    user = data.user;
  } else {
    // List users and find matching email
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) {
      console.error(`ERROR listing users: ${error.message}`);
      process.exit(1);
    }
    user = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (!user) {
      console.error(`ERROR: User with email "${targetEmail}" was not found.`);
      console.error('Please register this account on the web application (/register) first.');
      process.exit(1);
    }
  }

  const existingAppMeta = user.app_metadata || {};
  const currentIsAdmin = Boolean(
    existingAppMeta.role === 'admin' || existingAppMeta.is_admin === true
  );

  console.log(`Target User ID: ${user.id}`);
  console.log(`Target Email:   ${user.email || 'N/A'}`);
  console.log(`Current Status: ${currentIsAdmin ? 'ADMINISTRATOR' : 'Regular User'}\n`);

  if (isVerifyOnly) {
    if (currentIsAdmin) {
      console.log('✓ Verification Success: User has verified administrator claims in app_metadata.');
    } else {
      console.log('✗ User does not have administrator claims.');
    }
    return;
  }

  if (isRevoke) {
    if (!currentIsAdmin) {
      console.log('User is not an administrator. Nothing to revoke.');
      return;
    }

    const updatedAppMeta = { ...existingAppMeta };
    delete updatedAppMeta.role;
    updatedAppMeta.is_admin = false;

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: updatedAppMeta,
    });

    if (updateError) {
      console.error(`ERROR revoking admin privileges: ${updateError.message}`);
      process.exit(1);
    }

    console.log('✓ Successfully revoked administrator privileges.');
    console.log('The user must sign out to invalidate their administrative JWT.');
    return;
  }

  // Promote to administrator
  const newAppMeta = {
    ...existingAppMeta,
    role: 'admin',
    is_admin: true,
  };

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: newAppMeta,
  });

  if (updateError) {
    console.error(`ERROR updating user app_metadata: ${updateError.message}`);
    process.exit(1);
  }

  // Also verify keeper flag in public profiles
  try {
    await supabase
      .from('profiles')
      .update({ is_verified_keeper: true })
      .eq('id', user.id);
  } catch {
    // Non-fatal if profiles table trigger handles it
  }

  // Verify the change was applied
  const { data: verifyData } = await supabase.auth.admin.getUserById(user.id);
  const verifiedMeta = verifyData?.user?.app_metadata || {};
  const verifySuccess = verifiedMeta.role === 'admin' && verifiedMeta.is_admin === true;

  if (verifySuccess) {
    console.log('====================================================');
    console.log('✓ SUCCESS: User promoted to Administrator successfully!');
    console.log('====================================================');
    console.log(`User Email:   ${user.email}`);
    console.log(`User UUID:    ${user.id}`);
    console.log(`Claim Added:  app_metadata.role = "admin", app_metadata.is_admin = true\n`);
    console.log('REQUIRED NEXT STEPS FOR THE ADMINISTRATOR:');
    console.log('1. If the administrator is currently signed in, they MUST SIGN OUT and SIGN BACK IN.');
    console.log('   (JWT session tokens are cached client-side; re-authenticating issues a fresh JWT with admin claims).');
    console.log('2. Once signed back in, navigate to "/admin" to access the Operations Console.');
    console.log('3. All administrative moderation RPCs and RLS policies are now accessible.\n');
  } else {
    console.error('WARNING: Verification failed. Please inspect user app_metadata in Supabase Dashboard.');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal execution error:', err.message);
  process.exit(1);
});
