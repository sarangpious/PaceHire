---
name: Supabase credentials in Replit
description: Why env vars don't reach server-side Supabase code and what to do instead
---

`process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local` and appear correct when read via `fs.readFileSync`, but they do NOT reliably reach Next.js server-side runtime code (middleware, Route Handlers, Server Components) in Replit's environment. The middleware was receiving `undefined` or a corrupted value, causing Supabase to return `401 Invalid API key`.

**Why:** Replit's process environment does not consistently expose `.env.local` values to child processes at runtime the way a local dev machine would. `NEXT_PUBLIC_*` vars are supposed to be inlined at build time, but in Replit dev mode this doesn't always happen for middleware (Edge Runtime).

**How to apply:** Hardcode the Supabase URL, anon key, and site URL as module-level constants in every file that needs them:
- `middleware.ts`
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `app/auth/signin/route.ts`
- `app/auth/callback/route.ts`

The anon key is safe to hardcode — it is a public JWT for the `anon` role, not a service-role secret. Do NOT hardcode the Supabase service role key if it is ever added.

Remove any `env:` block from `next.config.mjs` that tries to re-expose these vars — it is redundant and misleading.
