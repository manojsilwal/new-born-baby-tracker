#!/usr/bin/env node
/**
 * Seeds two caregiver accounts + shared baby sample data for live testing.
 *
 * Admin:     manojsilwal1@gmail.com
 * Caregiver: sanjeevkhatri29@gmail.com
 *
 * Usage: node scripts/seed_test_family.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bvhdrwyxzjcoyqzmtean.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2aGRyd3l4empjb3lxem10ZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjU0MDQsImV4cCI6MjA4OTMwMTQwNH0.PKwoLB5u_WeM6pmFH06sJbRk0DeWY4B3k6Ox-yspaL8';

const ADMIN_EMAIL = 'manojsilwal1@gmail.com';
const CAREGIVER_EMAIL = 'sanjeevkhatri29@gmail.com';
/** Shared test password for both demo accounts — change after verifying. */
const TEST_PASSWORD = 'BabyTrack2026!';
const FAMILY_CODE = 'baby-demo-family';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function ensureUser(email, displayName) {
  // Try sign in first
  const signIn = await supabase.auth.signInWithPassword({ email, password: TEST_PASSWORD });
  if (signIn.data.user) {
    console.log(`✓ Signed in existing user: ${email} (${signIn.data.user.id})`);
    return signIn.data.user;
  }

  const signUp = await supabase.auth.signUp({
    email,
    password: TEST_PASSWORD,
    options: { data: { display_name: displayName } },
  });

  if (signUp.error) {
    console.error(`✗ Could not create ${email}:`, signUp.error.message);
    if (signIn.error) console.error('  Also sign-in failed:', signIn.error.message);
    return null;
  }

  if (signUp.data.user) {
    console.log(`✓ Created / registered: ${email} (${signUp.data.user.id})`);
    if (!signUp.data.session) {
      console.log('  ⚠ No session (email confirm may be required). Trying sign-in…');
      const retry = await supabase.auth.signInWithPassword({ email, password: TEST_PASSWORD });
      if (retry.data.user) return retry.data.user;
      console.log('  → User exists but needs email confirmation or password reset in Supabase Auth.');
    }
    return signUp.data.user;
  }
  return null;
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}
function minutesAgo(m) {
  return new Date(Date.now() - m * 60 * 1000).toISOString();
}
function daysAgo(d) {
  return new Date(Date.now() - d * 24 * 3600 * 1000).toISOString().split('T')[0];
}

function buildSampleState(adminUser, caregiverUser) {
  const admin = {
    userId: adminUser.id,
    displayName: 'Manoj (Admin)',
    role: 'admin',
    email: ADMIN_EMAIL,
  };
  const caregiver = {
    userId: caregiverUser.id,
    displayName: 'Sanjeev',
    role: 'caregiver',
    email: CAREGIVER_EMAIL,
  };

  const birthDate = daysAgo(10);

  const events = [
    {
      id: randomUUID(),
      type: 'feeding',
      feedType: 'nursing',
      startTime: hoursAgo(1.5),
      endTime: hoursAgo(1.2),
      leftDurationSeconds: 720,
      rightDurationSeconds: 540,
      totalDurationSeconds: 1260,
      lastActiveSide: 'right',
      note: 'Admin logged morning nurse',
      recordedBy: admin,
      createdAt: hoursAgo(1.2),
      updatedAt: hoursAgo(1.2),
    },
    {
      id: randomUUID(),
      type: 'diaper',
      timestamp: minutesAgo(40),
      hasPee: true,
      peeColor: 'pale-yellow',
      hasPoop: false,
      note: 'Sanjeev logged wet diaper',
      recordedBy: caregiver,
      createdAt: minutesAgo(40),
      updatedAt: minutesAgo(40),
    },
    {
      id: randomUUID(),
      type: 'feeding',
      feedType: 'bottle',
      startTime: hoursAgo(3),
      endTime: hoursAgo(2.85),
      volumeMl: 74,
      bottleType: 'expressed',
      note: 'Sanjeev gave expressed milk bottle',
      recordedBy: caregiver,
      createdAt: hoursAgo(2.85),
      updatedAt: hoursAgo(2.85),
    },
    {
      id: randomUUID(),
      type: 'sleep',
      startTime: hoursAgo(5),
      endTime: hoursAgo(3.5),
      durationSeconds: 5400,
      note: 'Admin logged nap',
      recordedBy: admin,
      createdAt: hoursAgo(3.5),
      updatedAt: hoursAgo(3.5),
    },
    {
      id: randomUUID(),
      type: 'temperature',
      timestamp: hoursAgo(6),
      temperatureCelsius: 36.8,
      note: 'Normal temp — admin check',
      recordedBy: admin,
      createdAt: hoursAgo(6),
      updatedAt: hoursAgo(6),
    },
    // Near-duplicate pair (~5 min apart): caregiver + admin diaper — sync should keep admin
    {
      id: randomUUID(),
      type: 'diaper',
      timestamp: minutesAgo(8),
      hasPee: true,
      hasPoop: true,
      poopConsistency: 'seedy',
      poopColor: 'mustard-yellow',
      note: 'Caregiver duplicate (should lose to admin within 10m)',
      recordedBy: caregiver,
      createdAt: minutesAgo(8),
      updatedAt: minutesAgo(8),
    },
    {
      id: randomUUID(),
      type: 'diaper',
      timestamp: minutesAgo(5),
      hasPee: true,
      hasPoop: true,
      poopConsistency: 'seedy',
      poopColor: 'mustard-yellow',
      note: 'Admin version of same diaper window (should win)',
      recordedBy: admin,
      createdAt: minutesAgo(5),
      updatedAt: minutesAgo(5),
    },
  ];

  return {
    schemaVersion: 1,
    profile: { name: 'Baby Aria', birthDate },
    settings: {
      theme: 'system',
      bottleUnit: 'oz',
      temperatureUnit: 'F',
      weightUnit: 'lb_oz',
      lengthUnit: 'in',
      headUnit: 'in',
      familySyncCode: FAMILY_CODE,
      autoSyncEnabled: true,
      lastSyncedAt: new Date().toISOString(),
      memberRole: 'admin',
    },
    activeTimers: { nursing: null, sleep: null },
    events,
    appointments: [
      {
        id: randomUUID(),
        title: '2-week checkup',
        providerName: 'Dr. Patel',
        dateTime: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        location: 'Pediatric Clinic',
        questions: ['Weight gain?', 'Feeding schedule?'],
        isCompleted: false,
        recordedBy: admin,
        createdAt: hoursAgo(24),
        updatedAt: hoursAgo(24),
      },
    ],
    growthRecords: [
      {
        id: randomUUID(),
        timestamp: hoursAgo(48),
        weightGrams: 3600,
        lengthCm: 52,
        headCircumferenceCm: 35.5,
        notes: 'Back above birth weight',
        recordedBy: admin,
        createdAt: hoursAgo(48),
        updatedAt: hoursAgo(48),
      },
    ],
    healthNotes: [
      {
        id: randomUUID(),
        timestamp: hoursAgo(20),
        category: 'advice',
        title: 'Paced bottle feeding',
        details: 'Pediatrician suggested pausing mid-bottle for burps.',
        recordedBy: caregiver,
        createdAt: hoursAgo(20),
        updatedAt: hoursAgo(20),
      },
    ],
    familyMembers: [admin, caregiver],
  };
}

async function uploadFamilyState(state) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/baby_tracker_families`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      family_code: FAMILY_CODE,
      state_data: state,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  console.log(`✓ Uploaded shared state to family code: ${FAMILY_CODE}`);
}

async function main() {
  console.log('Seeding test family…\n');

  const adminUser = await ensureUser(ADMIN_EMAIL, 'Manoj (Admin)');
  const caregiverUser = await ensureUser(CAREGIVER_EMAIL, 'Sanjeev');

  if (!adminUser || !caregiverUser) {
    console.error('\nFailed to ensure both users. Enable Email auth in Supabase and disable Confirm email, then retry.');
    process.exit(1);
  }

  const state = buildSampleState(adminUser, caregiverUser);
  await uploadFamilyState(state);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ready to test at: https://newborn-tracker-mocha.vercel.app

Admin login
  email:    ${ADMIN_EMAIL}
  password: ${TEST_PASSWORD}
  role:     admin (create was seeded; join with code below if prompted)

Caregiver login
  email:    ${CAREGIVER_EMAIL}
  password: ${TEST_PASSWORD}
  role:     caregiver

Family code (join / Settings sync):  ${FAMILY_CODE}

What to verify
  • Today / History show “Recorded by Manoj (Admin)” vs “Sanjeev”
  • After Sync, the near-duplicate diaper keeps the admin note
  • Growth + appointment + health note present for Baby Aria
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
