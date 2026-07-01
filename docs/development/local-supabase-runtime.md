# Local Supabase Runtime

This document explains the WP-0002 local Supabase runtime workflow.

## Purpose

The local runtime proves that Open Backend Cloud can use Supabase OSS as a reproducible runtime plane. It is not the final control-plane database implementation.

The runtime currently validates:

- local Supabase startup;
- source-controlled configuration;
- source-controlled migrations;
- seed data;
- pgTAP tests;
- generated TypeScript database types;
- a minimal Edge Function home.

## Requirements

Install:

- Docker or a Docker-compatible container runtime;
- Bun;
- Git.

The Supabase CLI is run through the local dev dependency or `bunx supabase` scripts in `package.json`.

## Install dependencies

```bash
bun install
```

## Start Supabase locally

```bash
bun run supabase:start
```

The local runtime uses the official Supabase CLI convention: `supabase/config.toml` configures the project, and Docker containers run the local services.

## Inspect status

```bash
bun run supabase:status
```

This prints local URLs and local development keys. Treat the service-role key as sensitive even in development.

For environment-variable output:

```bash
bun run supabase:status:env
```

## Reset the database

```bash
bun run supabase:reset
```

This recreates the local database, applies migrations from `supabase/migrations`, and runs `supabase/seed.sql`.

## Run database tests

```bash
bun run supabase:test
```

The foundation test lives at:

```text
supabase/tests/00_foundation.pgtap.sql
```

It verifies that the first runtime canary table exists, has expected columns, has RLS enabled, and receives seed data.

## Generate types

```bash
bun run supabase:types
```

This regenerates:

```text
packages/database/src/generated/supabase.ts
```

The committed file is a placeholder so a clean checkout typechecks before the runtime is started. After the runtime is running, regenerate and commit the real generated output when schema changes are intentional.

## Stop Supabase

```bash
bun run supabase:stop
```

To stop and delete local data volumes:

```bash
bun run supabase:stop:clean
```

Use the clean stop command carefully. It destroys local runtime state.

## Important security rules

- Do not commit `.env.local`.
- Do not commit real service-role keys.
- Do not expose service-role keys to frontend code.
- Do not add tables exposed through Supabase APIs without RLS planning.
- Do not bypass migrations with manual-only schema changes.

## Current runtime schema

WP-0002 creates one canary table:

```text
public.runtime_metadata
```

This table exists only to validate the development workflow. The control-plane data model starts in WP-0003.

## Troubleshooting

If the runtime fails to start, check:

```bash
bun run supabase:status
```

If containers are stuck, stop them:

```bash
bun run supabase:stop
```

If you need a clean local reset:

```bash
bun run supabase:stop:clean
bun run supabase:start
bun run supabase:reset
```

If generated types fail, make sure the local runtime is running first:

```bash
bun run supabase:start
bun run supabase:types
```
