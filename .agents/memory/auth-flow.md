---
name: Auth flow architecture
description: How sign-in works in PaceHire and why it's structured this way
---

## Flow

1. User clicks "Sign in with Google" button (`GoogleSignInButton.tsx`)
2. Button does `window.location.href = '/auth/signin'` — a plain client-side navigation
3. `app/auth/signin/route.ts` (GET) calls `supabase.auth.signInWithOAuth` server-side, returns a `307` redirect to Google's OAuth URL
4. Google redirects back to `/auth/callback?code=...`
5. `app/auth/callback/route.ts` (GET) calls `exchangeCodeForSession(code)`, sets session cookies, redirects to `/dashboard`
6. Middleware on `/dashboard` calls `getUser()` — succeeds because cookies are set — allows access

## Why server-initiated OAuth

The app runs inside a Replit canvas iframe. Client-side `window.location.href = googleUrl` was silently failing because Google refuses iframe embedding (`X-Frame-Options: SAMEORIGIN`). Moving OAuth initiation to the server means the redirect to Google happens as an HTTP `307`, which the browser follows at the top level regardless of iframe context.

## Middleware exclusion

`/auth/callback` is excluded from the middleware matcher so `getUser()` is never called mid-PKCE-exchange, which would consume the code-verifier cookie before the callback route can use it.
