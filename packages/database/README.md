# `@open-backend-cloud/database`

Shared database-facing types and schema constants.

This package intentionally separates:

- generated Supabase runtime types in `src/generated/supabase.ts`
- control-plane schema constants and record shapes in `src/control-plane.ts`

The control-plane database manages organizations, projects, environments,
runtime instances, deployments, backups, restores, secret references, audit
events, usage events, quotas, API keys, and webhooks.

Production control-plane state must live in a dedicated control-plane
Postgres database. During early local development, the local Supabase
Postgres instance may host the `platform` schema for convenience.
