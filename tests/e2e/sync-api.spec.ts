import { test, expect } from '@playwright/test';

const BASE_URL = process.env.MOCK_SERVER_URL || 'http://127.0.0.1:54321';

test.describe('Newborn Tracker Mock DB & Sync E2E Suite', () => {
  const familyCode = 'maya-playwright-family';

  test.beforeEach(async ({ request }) => {
    // Reset test table before each test
    const res = await request.post(`${BASE_URL}/api/test/reset`);
    expect(res.ok()).toBeTruthy();
  });

  test('health check returns ok with Postgres database name', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/health`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.database).toBe('baby_tracker_test');
    expect(data.backend).toBe('fincrawler-postgres-1');
  });

  test('upserts newborn tracker family record into Postgres', async ({ request }) => {
    const payload = {
      family_code: familyCode,
      state_data: {
        version: 1,
        profile: {
          name: 'Maya Lin',
          birthDate: '2026-09-01',
        },
        feeds: [
          {
            id: 'feed-pw-1',
            feedType: 'bottle',
            amountOz: 3.5,
            startTime: new Date().toISOString(),
          },
        ],
        diapers: [
          {
            id: 'diaper-pw-1',
            status: 'wet',
            timestamp: new Date().toISOString(),
          },
        ],
        sleepSessions: [],
        temperatures: [],
        growthRecords: [],
        appointments: [],
        healthNotes: [],
      },
    };

    // Upsert
    const upsertRes = await request.post(`${BASE_URL}/rest/v1/baby_tracker_families`, {
      data: payload,
      headers: {
        Prefer: 'resolution=merge-duplicates',
      },
    });
    expect(upsertRes.status()).toBe(201);
    const upserted = await upsertRes.json();
    expect(upserted.family_code).toBe(familyCode);
    expect(upserted.state_data.profile.name).toBe('Maya Lin');

    // Query back from PostgREST endpoint
    const queryRes = await request.get(
      `${BASE_URL}/rest/v1/baby_tracker_families?select=*&family_code=eq.${familyCode}`
    );
    expect(queryRes.ok()).toBeTruthy();
    const rows = await queryRes.json();
    expect(rows.length).toBe(1);
    expect(rows[0].family_code).toBe(familyCode);
    expect(rows[0].state_data.feeds.length).toBe(1);
    expect(rows[0].state_data.feeds[0].amountOz).toBe(3.5);
  });

  test('multi-caregiver state merging in Postgres', async ({ request }) => {
    // 1. Caregiver 1 logs nursing feed
    const momState = {
      version: 1,
      profile: { name: 'Maya Lin' },
      feeds: [
        {
          id: 'feed-mom-1',
          feedType: 'nursing',
          leftDurationMinutes: 15,
          rightDurationMinutes: 10,
        },
      ],
      diapers: [],
      sleepSessions: [],
      temperatures: [],
      growthRecords: [],
      appointments: [],
      healthNotes: [],
      updatedAt: '2026-09-20T10:00:00Z',
    };

    await request.post(`${BASE_URL}/rest/v1/baby_tracker_families`, {
      data: { family_code: familyCode, state_data: momState, updated_at: momState.updatedAt },
    });

    // 2. Caregiver 2 logs diaper change and merges with existing feed
    const dadState = {
      ...momState,
      diapers: [
        {
          id: 'diaper-dad-1',
          status: 'dirty',
          pooColor: 'mustard_yellow',
        },
      ],
      updatedAt: '2026-09-20T10:15:00Z',
    };

    await request.post(`${BASE_URL}/rest/v1/baby_tracker_families`, {
      data: { family_code: familyCode, state_data: dadState, updated_at: dadState.updatedAt },
    });

    // 3. Verify server state has both the feed and the diaper
    const getRes = await request.get(
      `${BASE_URL}/rest/v1/baby_tracker_families?select=*&family_code=eq.${familyCode}`
    );
    const data = (await getRes.json())[0].state_data;
    expect(data.feeds.length).toBe(1);
    expect(data.feeds[0].id).toBe('feed-mom-1');
    expect(data.diapers.length).toBe(1);
    expect(data.diapers[0].id).toBe('diaper-dad-1');
  });

  test('deletes family record when requested', async ({ request }) => {
    // Insert
    await request.post(`${BASE_URL}/rest/v1/baby_tracker_families`, {
      data: {
        family_code: 'temp-family',
        state_data: { profile: { name: 'Temporary Baby' } },
      },
    });

    // Delete
    const delRes = await request.delete(
      `${BASE_URL}/rest/v1/baby_tracker_families?family_code=eq.temp-family`
    );
    expect(delRes.status()).toBe(204);

    // Verify deleted
    const verifyRes = await request.get(
      `${BASE_URL}/rest/v1/baby_tracker_families?select=*&family_code=eq.temp-family`
    );
    expect(await verifyRes.json()).toEqual([]);
  });
});
