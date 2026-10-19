# humor-admin

Admin dashboard for [humor-project](https://github.com/routsiddharth/humor-project). Same Supabase database, separate app.

| Area | Path | Access |
|---|---|---|
| Statistics | `/` | Turing scoreboard (AI vs human in blind Showdown), activity, heatmap, star distributions, critic spectrum, divisive jokes, Elo ladder, AI funnel, categories |
| Users / profiles | `/users`, `/users/[id]` | **Read** |
| AI-generated media | `/media`, `/media/new`, `/media/[id]`, `/media/generations` | **Create / read / update / delete** (AI jokes); read (Gemini ledger) |
| Upvotes / downvotes / ratings | `/votes` | **Read** — star ratings and Showdown head-to-head picks |

## The login wall

Every route except `/login` and `/auth/callback` requires a Google session (via Supabase Auth) whose
`profiles.is_superadmin` is `TRUE`. It is enforced three times:

1. **`proxy.ts`** — runs before every request (pages, Server Action POSTs, route handlers) and redirects to
   `/login` unless the session is valid *and* the profile is a superadmin.
2. **`requireAdmin()`** (`lib/dal.ts`) — every page calls it; it re-verifies the JWT with Supabase
   (`getUser()`, never `getSession()`) and reads `is_superadmin` from the database.
3. **`assertAdmin()`** — every Server Action and every data function in `lib/*.ts` calls it before any query.

The flag cannot be self-granted: migration `0012_superadmin.sql` in humor-project removes client `UPDATE`
on the column and adds a trigger that rejects changes from `anon`/`authenticated`.

## Setup

```bash
cp ../humor-project/.env .env      # same variables as the public site
npm install
npm run dev                        # http://localhost:3001
npm run grant-admin -- you@columbia.edu            # after that account has signed in once
npm run grant-admin -- someone@columbia.edu --revoke
```

Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL` (server-only,
direct Postgres), `GEMINI_API_KEY` (server-only, for “Draft with Gemini”).

Supabase → Authentication → URL Configuration → Redirect URLs must include this app's origin
(e.g. `https://humor-admin.vercel.app/**` and `http://localhost:3001/**`), or Google sign-in lands on the
public site instead.
