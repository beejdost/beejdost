// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

describe('Database Security & RLS Policy Suite (PostgreSQL 16+ via PGlite)', () => {
  let db: PGlite;

  // Test User UUIDs
  const adminId = '11111111-1111-1111-1111-111111111111';
  const sellerAliceId = '22222222-2222-2222-2222-222222222222';
  const buyerBobId = '33333333-3333-3333-3333-333333333333';
  const strangerCharlieId = '44444444-4444-4444-4444-444444444444';
  const suspendedDaveId = '55555555-5555-5555-5555-555555555555';

  let cropId: string;
  let aliceListingId: string;
  let conversationId: string;

  // Helper to switch acting user identity
  const asUser = async (userId: string | null, isAdmin = false) => {
    if (!userId) {
      // Anonymous caller
      await db.exec(`
        SET ROLE anon;
        RESET request.jwt.claims;
        RESET request.jwt.claim.sub;
      `);
      return;
    }

    const claims = JSON.stringify({
      sub: userId,
      role: 'authenticated',
      ...(isAdmin ? { app_metadata: { role: 'admin' } } : {}),
    });

    await db.exec(`
      SET ROLE authenticated;
      SET request.jwt.claims = '${claims}';
      SET request.jwt.claim.sub = '${userId}';
    `);
  };

  const asSuperuser = async () => {
    await db.exec(`
      RESET ROLE;
      RESET request.jwt.claims;
      RESET request.jwt.claim.sub;
    `);
  };

  beforeAll(async () => {
    db = new PGlite();

    // Setup Supabase-compatible roles
    await db.exec(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
          CREATE ROLE anon NOLOGIN;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated NOLOGIN;
        END IF;
      END $$;

      GRANT USAGE ON SCHEMA public TO anon, authenticated;
      CREATE SCHEMA IF NOT EXISTS storage;
      GRANT USAGE ON SCHEMA storage TO anon, authenticated;
    `);

    // Load and run ordered migrations
    const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    const files = [
      '20260216000001_core_schema.sql',
      '20260216000002_functions_and_rpc.sql',
      '20260216000003_rls_security_policies.sql',
      '20260216000004_storage_policies.sql',
      '20260216000005_seed_data.sql',
    ];

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      await db.exec(sql);
    }

    // Force RLS on all tables so rules apply strictly across all roles
    await db.exec(`
      ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.crops FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.listings FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.listing_images FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.conversations FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.conversation_members FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.favorites FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.reports FORCE ROW LEVEL SECURITY;
      ALTER TABLE public.moderation_actions FORCE ROW LEVEL SECURITY;

      GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
      GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
      GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, anon;
    `);

    // Seed test profiles as superuser
    await asSuperuser();
    await db.exec(`
      INSERT INTO public.profiles (id, full_name, phone, province, district, farming_type, is_verified_keeper, is_suspended)
      VALUES
        ('${adminId}', 'Platform Admin', '03001111111', 'punjab', 'Lahore', 'seedSaver', TRUE, FALSE),
        ('${sellerAliceId}', 'Alice Seed Keeper', '03002222222', 'punjab', 'Gujranwala', 'organic', TRUE, FALSE),
        ('${buyerBobId}', 'Bob Buyer', '03003333333', 'sindh', 'Matiari', 'conventional', FALSE, FALSE),
        ('${strangerCharlieId}', 'Charlie Stranger', '03004444444', 'khyberPakhtunkhwa', 'Swat', 'conventional', FALSE, FALSE),
        ('${suspendedDaveId}', 'Suspended Dave', '03005555555', 'balochistan', 'Pishin', 'conventional', FALSE, TRUE);
    `);

    // Fetch crop id
    const cropRes = await db.query<{ id: string }>(
      "SELECT id FROM public.crops WHERE slug = 'basmati-rice' LIMIT 1;"
    );
    cropId = cropRes.rows[0]!.id;

    // Create initial listing by Alice
    await asUser(sellerAliceId);
    const listingRes = await db.query<{ id: string }>(`
      INSERT INTO public.listings (
        seller_id, crop_id, variety_name, variety_type, seed_condition,
        listing_type, quantity_kg, price_per_kg, harvest_year, province,
        district, description, status, claimed_certified
      ) VALUES (
        '${sellerAliceId}', '${cropId}', 'Pure Basmati 370', 'heirloom', 'cleaned',
        'sale', 100.00, 350.00, 2025, 'punjab',
        'Gujranwala', 'Finest lineage heritage Basmati seeds with 90% germination.', 'active', TRUE
      ) RETURNING id;
    `);
    aliceListingId = listingRes.rows[0]!.id;

    // Bob starts conversation with Alice using start_conversation RPC
    await asUser(buyerBobId);
    const convRes = await db.query<{ start_conversation: string }>(`
      SELECT public.start_conversation('${aliceListingId}') AS start_conversation;
    `);
    conversationId = convRes.rows[0]!.start_conversation;

    // Bob sends a message to Alice
    await db.query(`
      SELECT public.send_message('${conversationId}', 'Hello Alice, is Basmati 370 available?');
    `);
  });

  // --------------------------------------------------------------------------
  // Anonymous Access Checks
  // --------------------------------------------------------------------------
  describe('Anonymous Access Rules', () => {
    it('allows anonymous users to read approved crops', async () => {
      await asUser(null);
      const res = await db.query('SELECT slug, name_en, name_ur, name_pa FROM public.crops;');
      expect(res.rows.length).toBeGreaterThanOrEqual(10);
    });

    it('allows anonymous users to read active listings', async () => {
      await asUser(null);
      const res = await db.query<{ id: string; variety_name: string }>(`
        SELECT id, variety_name FROM public.listings WHERE id = '${aliceListingId}';
      `);
      expect(res.rows.length).toBe(1);
      expect(res.rows[0]!.variety_name).toBe('Pure Basmati 370');
    });

    it('DENIES anonymous users from reading private profiles and phone numbers directly', async () => {
      await asUser(null);
      const res = await db.query('SELECT id, phone FROM public.profiles;');
      expect(res.rows.length).toBe(0);
    });

    it('DENIES anonymous users from viewing chat messages or conversations', async () => {
      await asUser(null);
      const msgRes = await db.query('SELECT * FROM public.messages;');
      expect(msgRes.rows.length).toBe(0);

      const convRes = await db.query('SELECT * FROM public.conversations;');
      expect(convRes.rows.length).toBe(0);
    });

    it('DENIES anonymous users from reading reports or moderation logs', async () => {
      await asUser(null);
      const repRes = await db.query('SELECT * FROM public.reports;');
      expect(repRes.rows.length).toBe(0);

      const modRes = await db.query('SELECT * FROM public.moderation_actions;');
      expect(modRes.rows.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Profile Privacy & Privilege Escalation Checks
  // --------------------------------------------------------------------------
  describe('Profile Privacy & Anti-Privilege Escalation', () => {
    it('allows users to read only their own full profile', async () => {
      await asUser(buyerBobId);
      const res = await db.query<{ id: string; phone: string }>('SELECT id, phone FROM public.profiles;');
      expect(res.rows.length).toBe(1);
      expect(res.rows[0]!.id).toBe(buyerBobId);
      expect(res.rows[0]!.phone).toBe('03003333333');
    });

    it('provides public, sanitized profile data through public_profiles view', async () => {
      await asUser(buyerBobId);
      const res = await db.query<{ id: string; full_name: string }>(
        `SELECT id, full_name FROM public.public_profiles WHERE id = '${sellerAliceId}';`
      );
      expect(res.rows.length).toBe(1);
      expect(res.rows[0]!.full_name).toBe('Alice Seed Keeper');
    });

    it('DENIES regular user from self-promoting to verified keeper or unsuspending themselves', async () => {
      await asUser(buyerBobId);
      await expect(
        db.query(`
          UPDATE public.profiles
          SET is_verified_keeper = TRUE
          WHERE id = '${buyerBobId}';
        `)
      ).rejects.toThrow(/Only administrators can modify verification or suspension status/i);
    });

    it('ALLOWS administrator to verify a seed keeper', async () => {
      await asUser(adminId, true);
      await db.query(`
        UPDATE public.profiles
        SET is_verified_keeper = TRUE
        WHERE id = '${buyerBobId}';
      `);

      const check = await db.query<{ is_verified_keeper: boolean }>(`
        SELECT is_verified_keeper FROM public.profiles WHERE id = '${buyerBobId}';
      `);
      expect(check.rows[0]!.is_verified_keeper).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Listing Authorization & Certification Verification
  // --------------------------------------------------------------------------
  describe('Listing Security & Certification Controls', () => {
    it('DENIES User B (Bob) from modifying User A (Alice) listing', async () => {
      await asUser(buyerBobId);
      // Update with non-matching seller returns 0 rows updated due to RLS
      const res = await db.query(`
        UPDATE public.listings
        SET price_per_kg = 1.00
        WHERE id = '${aliceListingId}';
      `);
      expect(res.affectedRows).toBe(0);

      // Verify price was unchanged
      await asSuperuser();
      const check = await db.query<{ price_per_kg: string }>(`
        SELECT price_per_kg FROM public.listings WHERE id = '${aliceListingId}';
      `);
      expect(Number(check.rows[0]!.price_per_kg)).toBe(350.00);
    });

    it('DENIES seller from setting is_verified_certified on their own listing', async () => {
      await asUser(sellerAliceId);
      await expect(
        db.query(`
          UPDATE public.listings
          SET is_verified_certified = TRUE
          WHERE id = '${aliceListingId}';
        `)
      ).rejects.toThrow(/Only administrators can verify seed certification/i);
    });

    it('ALLOWS administrator to verify seed certification with metadata audit trail', async () => {
      await asUser(adminId, true);
      await db.query(`
        UPDATE public.listings
        SET
          is_verified_certified = TRUE,
          certification_verified_by = '${adminId}',
          certification_verified_at = now(),
          certification_review_notes = 'Verified against FSC&RD seed registry'
        WHERE id = '${aliceListingId}';
      `);

      const check = await db.query<{ is_verified_certified: boolean; certification_review_notes: string }>(`
        SELECT is_verified_certified, certification_review_notes
        FROM public.listings
        WHERE id = '${aliceListingId}';
      `);
      expect(check.rows[0]!.is_verified_certified).toBe(true);
      expect(check.rows[0]!.certification_review_notes).toBe('Verified against FSC&RD seed registry');
    });

    it('DENIES suspended users from creating listings', async () => {
      await asUser(suspendedDaveId);
      await expect(
        db.query(`
          INSERT INTO public.listings (
            seller_id, crop_id, variety_name, variety_type, seed_condition,
            listing_type, quantity_kg, price_per_kg, harvest_year, province,
            district, description, status
          ) VALUES (
            '${suspendedDaveId}', '${cropId}', 'Suspended Crop', 'desi', 'raw',
            'sale', 50.00, 100.00, 2025, 'balochistan',
            'Pishin', 'Should be rejected by RLS.', 'active'
          );
        `)
      ).rejects.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // Private Messaging & Impersonation Prevention
  // --------------------------------------------------------------------------
  describe('Private Messaging & Impersonation Protection', () => {
    it('ALLOWS conversation members (Alice and Bob) to view their messages', async () => {
      await asUser(sellerAliceId);
      const aliceView = await db.query<{ content: string }>(`
        SELECT content FROM public.messages WHERE conversation_id = '${conversationId}';
      `);
      expect(aliceView.rows.length).toBe(1);
      expect(aliceView.rows[0]!.content).toContain('Hello Alice');

      await asUser(buyerBobId);
      const bobView = await db.query<{ content: string }>(`
        SELECT content FROM public.messages WHERE conversation_id = '${conversationId}';
      `);
      expect(bobView.rows.length).toBe(1);
    });

    it('DENIES third party (Charlie) from reading private messages between Alice and Bob', async () => {
      await asUser(strangerCharlieId);
      const charlieView = await db.query<{ content: string }>(`
        SELECT content FROM public.messages WHERE conversation_id = '${conversationId}';
      `);
      expect(charlieView.rows.length).toBe(0);
    });

    it('DENIES third party (Charlie) from posting into Alice and Bob conversation', async () => {
      await asUser(strangerCharlieId);
      await expect(
        db.query(`
          INSERT INTO public.messages (conversation_id, sender_id, content)
          VALUES ('${conversationId}', '${strangerCharlieId}', 'Intruder message');
        `)
      ).rejects.toThrow();
    });

    it('PREVENTS buyer from starting a conversation on their own listing', async () => {
      await asUser(sellerAliceId);
      await expect(
        db.query(`
          SELECT public.start_conversation('${aliceListingId}');
        `)
      ).rejects.toThrow(/Cannot start a conversation on your own listing/i);
    });

    it('PREVENTS buyer from bypassing start_conversation RPC or forging membership', async () => {
      await asUser(buyerBobId);
      // Direct insertion into conversations without atomic member creation is blocked by RLS
      await expect(
        db.query(`
          INSERT INTO public.conversations (listing_id, created_by)
          VALUES ('${aliceListingId}', '${buyerBobId}')
          RETURNING id;
        `)
      ).rejects.toThrow(/row-level security/i);

      // Direct insertion into conversation_members with forged seller role is rejected
      await expect(
        db.query(`
          INSERT INTO public.conversation_members (conversation_id, user_id, role)
          VALUES ('${conversationId}', '${strangerCharlieId}', 'seller');
        `)
      ).rejects.toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // Reports & Whistleblower Privacy
  // --------------------------------------------------------------------------
  describe('Reports & Whistleblower Identity Protection', () => {
    let reportId: string;

    it('allows authenticated user (Bob) to file a report', async () => {
      await asUser(buyerBobId);
      const res = await db.query<{ id: string }>(`
        INSERT INTO public.reports (reporter_id, listing_id, reason, details)
        VALUES ('${buyerBobId}', '${aliceListingId}', 'misleading_seed_claim', 'Germination rate test was lower than advertised.')
        RETURNING id;
      `);
      expect(res.rows.length).toBe(1);
      reportId = res.rows[0]!.id;
    });

    it('ALLOWS the reporter (Bob) to view their own filed report', async () => {
      await asUser(buyerBobId);
      const res = await db.query<{ id: string }>(`
        SELECT id, details FROM public.reports WHERE id = '${reportId}';
      `);
      expect(res.rows.length).toBe(1);
    });

    it('DENIES reported seller (Alice) or unrelated user (Charlie) from viewing the report or reporter identity', async () => {
      await asUser(sellerAliceId);
      const aliceReportView = await db.query(`SELECT * FROM public.reports WHERE id = '${reportId}';`);
      expect(aliceReportView.rows.length).toBe(0);

      await asUser(strangerCharlieId);
      const charlieReportView = await db.query(`SELECT * FROM public.reports WHERE id = '${reportId}';`);
      expect(charlieReportView.rows.length).toBe(0);
    });

    it('ALLOWS platform administrator to view and resolve reports', async () => {
      await asUser(adminId, true);
      const adminReportView = await db.query<{ id: string; reporter_id: string }>(`
        SELECT id, reporter_id FROM public.reports WHERE id = '${reportId}';
      `);
      expect(adminReportView.rows.length).toBe(1);
      expect(adminReportView.rows[0]!.reporter_id).toBe(buyerBobId);

      // Admin resolves report and logs moderation action
      await db.query(`
        UPDATE public.reports SET status = 'resolved' WHERE id = '${reportId}';
      `);

      await db.query(`
        INSERT INTO public.moderation_actions (admin_id, action_type, target_type, target_id, reason)
        VALUES ('${adminId}', 'resolve_report', 'report', '${reportId}', 'Seller contacted and corrected germination percentage.');
      `);
    });
  });

  // --------------------------------------------------------------------------
  // Moderation Audit Log Security
  // --------------------------------------------------------------------------
  describe('Moderation Actions Security', () => {
    it('DENIES non-admin users from reading or writing moderation actions', async () => {
      await asUser(buyerBobId);
      const res = await db.query('SELECT * FROM public.moderation_actions;');
      expect(res.rows.length).toBe(0);

      await expect(
        db.query(`
          INSERT INTO public.moderation_actions (admin_id, action_type, target_type, target_id, reason)
          VALUES ('${buyerBobId}', 'suspend_user', 'profile', '${sellerAliceId}', 'Rogue suspension attempt');
        `)
      ).rejects.toThrow();
    });
  });
});
