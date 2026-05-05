# Phase 1 — Supabase Setup

This is a **manual setup you (the developer) must do once** before the
Phase 1 code changes go live. It takes about 10 minutes.

## 1. Create a Supabase project

1. Go to <https://supabase.com> → **New project**.
2. Pick a name (e.g. `edu-insight-meet`), a strong DB password, and a region
   close to your users (Singapore for Vietnam).
3. Wait ~2 minutes for the project to provision.

## 2. Run the schema migrations

Open the Supabase **SQL Editor** (left sidebar → SQL).

1. Run [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql)
   — paste the file contents and click **Run**. This creates the `profiles`,
   `organizations`, `meetings`, `meeting_participants`, and
   `behavior_events` tables, plus the trigger that auto-creates a profile
   row whenever someone signs up.
2. Run [`supabase/migrations/0002_rls.sql`](../supabase/migrations/0002_rls.sql)
   — this enables Row-Level Security on all tables and installs the
   policies. Without this step, your data would be world-readable.

Verify in the **Table Editor**:
- `profiles`, `organizations`, `meetings`, `meeting_participants`,
  `behavior_events` all exist.
- The shield icon next to each table name is filled (RLS enabled).

## 3. Configure email auth

The defaults are mostly fine, but check:

1. **Authentication → Providers → Email** — enabled.
2. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` for dev
     (add your production URL later, e.g. `https://eduinsight.vercel.app`).
   - Redirect URLs: add `http://localhost:3000/**` and your prod URL.
3. (Optional but recommended for prod) **Authentication → Email Templates**:
   replace the default Supabase branding with your own.

For dev convenience, you can disable email confirmation:
**Authentication → Providers → Email** → uncheck "Confirm email".
Re-enable it before launching to real users.

## 4. Copy the API credentials

1. **Settings → API**.
2. Copy **Project URL** and **anon public** key.
3. Open `.env.local` and fill them in:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

4. Restart the dev server.

> **Do not commit** real keys. The anon key is safe to expose to the browser
> by design (RLS protects the data), but never check the **service role**
> key into the repo.

## 5. Smoke-test the connection

In the dev server's browser console:

```js
const { createBrowserClient } = await import('/_next/static/chunks/...')
// or simpler — open any page, then in console:
console.log(window.next?.router)
```

Easier: just sign up through the new Phase 1 auth UI once it lands.
For now, you can validate the SQL by running this in the Supabase SQL editor:

```sql
select * from auth.users;
select * from profiles;
```

Both return 0 rows initially; sign up later should add 1 row to each.

## 6. What happens next

Once you've finished steps 1–4 and restarted the dev server, tell me
"Supabase ready". I will then:

- Replace `AuthContext` to use Supabase Auth (email/password, sessions
  in HttpOnly cookies).
- Update `/api/meet/token` to verify the Supabase JWT and derive
  `participant identity` from it instead of trusting client input.
- Make `behavior_events` write through Supabase (with IndexedDB as an
  offline cache).
- Migrate the History page to read from Postgres (with cross-device sync).

Until then, the app keeps working with the Phase 0 localStorage auth.
The Supabase code is gated on the `NEXT_PUBLIC_SUPABASE_URL` env var.
