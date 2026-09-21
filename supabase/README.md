# Supabase setup

## 1. Enable Email auth

Dashboard → **Authentication** → **Providers** → enable **Email**.

For easier testing, turn off **Confirm email** under Auth settings so signup can enter the app immediately.

## 2. Apply schema

Run the SQL in [`migrations/001_normalized_baby_tracker.sql`](migrations/001_normalized_baby_tracker.sql) in the Supabase SQL Editor.

This creates:

- `profiles` / `user_settings` (per user)
- `babies` + `baby_members` with **exactly one `admin`** per baby (unique partial index)
- Care tables with `created_by`
- RPCs: `create_baby`, `join_baby_by_invite_code`
- RLS so only members see a baby’s data

Until this migration is applied, the app still works via the legacy `baby_tracker_families` JSON blob and local storage (create/join family code still works; you are marked admin when you create).

## 3. Duplicate rule (app + sync)

Same care type within **10 minutes** → keep the **admin’s** entry; caregiver duplicate is dropped on merge/sync. Every event stores **Recorded by** name + role for the UI.
