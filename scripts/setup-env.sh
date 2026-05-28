#!/usr/bin/env bash
# setup-env.sh — checks that required environment variables are present.
# Run this before starting the PaceHire dev server if you're not using .env.local.
# In production (Replit Deployments), set these in the Secrets manager.

REQUIRED_VARS=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  NEXT_PUBLIC_SITE_URL
)

MISSING=0

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "WARNING: $VAR is not set."
    MISSING=$((MISSING + 1))
  else
    echo "OK: $VAR is set."
  fi
done

if [ "$MISSING" -gt 0 ]; then
  echo ""
  echo "$MISSING required variable(s) missing."
  echo "Add them to Replit Secrets (Tools → Secrets) or to artifacts/pacehire/.env.local"
  exit 1
else
  echo ""
  echo "All required environment variables are set."
fi
