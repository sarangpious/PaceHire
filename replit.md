# PaceHire

A hiring platform built with Next.js 14 App Router and Supabase auth.

## Run & Operate

- `pnpm --filter @workspace/pacehire run dev` — run PaceHire dev server (port 3000)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: Next.js 14 App Router, Tailwind CSS v3, `@tailwindcss/forms`
- **Auth/DB**: Supabase (`@supabase/ssr`)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/pacehire/` — Next.js 14 App Router frontend
  - `app/` — App Router pages and layouts
  - `app/auth/callback/route.ts` — Supabase PKCE auth callback (redirects to /dashboard)
  - `lib/supabase/client.ts` — browser Supabase client
  - `lib/supabase/server.ts` — server Supabase client (uses `next/headers` cookies)
  - `middleware.ts` — session refresh + route protection
  - `tailwind.config.ts` — custom colour palette via CSS variables
  - `.env.local.example` — required env var template
- `artifacts/api-server/` — Express 5 API server
- `lib/` — shared workspace libraries (API spec, Zod schemas, DB, API client)

## Architecture decisions

- Supabase auth uses PKCE flow via `@supabase/ssr` — no custom JWT handling
- Middleware refreshes the session on every request and guards `/dashboard` and `/templates`
- CSS custom properties drive the full colour palette; Tailwind references them via `var(--color-*)` — change a variable once, changes everywhere
- Next.js 14 peer-dep warning for React 19 is benign — Next 14 works with React 19

## Product

Hiring platform. Auth-gated dashboard and templates. Supabase handles identity.

## User preferences

_Populate as you build._

## Gotchas

- **Env vars required before first run**: copy `.env.local.example` → `.env.local` and fill in your Supabase project URL and anon key. Without them, middleware will log errors on every request (but the server still starts).
- Tailwind v3 is used (not v4) — `@tailwindcss/forms` requires v3 and Next.js 14 sets up PostCSS with v3 conventions.
- `pnpm --filter @workspace/pacehire run dev` — NOT `pnpm dev` at the workspace root.
- Always run codegen after OpenAPI spec changes: `pnpm --filter @workspace/api-spec run codegen`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
