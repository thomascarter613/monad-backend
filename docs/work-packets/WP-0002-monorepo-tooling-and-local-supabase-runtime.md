# WP-0002: Monorepo Tooling and Local Supabase Runtime

Status: Implemented as repository foundation layer 2  
Date: 2026-07-01

## Goal

Create the first executable repository foundation for Open Backend Cloud.

WP-0001 established the product and architecture source of truth. WP-0002 makes the repository runnable by adding monorepo tooling, local quality checks, Supabase CLI scripts, a local Supabase runtime template, baseline migrations, seed data, pgTAP tests, generated-type plumbing, and a CI workflow.

## Scope

WP-0002 creates:

- Bun workspace configuration.
- TypeScript strict-mode configuration.
- Biome formatting and linting.
- Lefthook local git hooks.
- Basic CI checks.
- Stable top-level directories for apps, services, packages, infrastructure, and policies.
- Local Supabase runtime configuration.
- Initial Supabase migration.
- Initial Supabase seed data.
- Initial Supabase pgTAP test.
- Placeholder generated database types.
- Documentation for local runtime usage.

## Out of scope

WP-0002 does not create:

- the control-plane database schema;
- project/environment registry APIs;
- runtime provisioning automation;
- backup manager;
- observability stack;
- secrets manager;
- admin console;
- platform CLI;
- preview environments;
- production Kubernetes deployment.

Those belong to later work packets.

## Files created or changed

```text
package.json
tsconfig.json
biome.json
lefthook.yml
.editorconfig
.gitignore
.env.example
bunfig.toml
.github/workflows/ci.yml
scripts/check-foundation.ts
scripts/check-doc-links.ts
apps/*/README.md
services/*/README.md
packages/*/package.json
packages/*/src/index.ts
supabase/config.toml
supabase/seed.sql
supabase/migrations/20260701210000_init_runtime_foundation.sql
supabase/tests/00_foundation.pgtap.sql
supabase/functions/runtime-health/index.ts
docs/development/local-supabase-runtime.md
docs/work-packets/WP-0002-monorepo-tooling-and-local-supabase-runtime.md
```

## Commands

Install dependencies:

```bash
bun install
```

Run repository checks:

```bash
bun run check
```

Start the local Supabase runtime:

```bash
bun run supabase:start
```

Show runtime status:

```bash
bun run supabase:status
```

Reset the database and apply migrations and seed data:

```bash
bun run supabase:reset
```

Run database tests:

```bash
bun run supabase:test
```

Generate local database types:

```bash
bun run supabase:types
```

Verify the runtime after startup:

```bash
bun run verify:runtime
```

Stop the runtime:

```bash
bun run supabase:stop
```

## Acceptance criteria

WP-0002 is accepted when:

- `bun install` succeeds.
- `bun run check` succeeds.
- `bun run supabase:start` starts the local Supabase stack.
- `bun run supabase:status` prints local URLs and keys.
- `bun run supabase:reset` applies the committed migration and seed data.
- `bun run supabase:test` passes the pgTAP foundation test.
- `bun run supabase:types` regenerates `packages/database/src/generated/supabase.ts`.
- No secrets are committed.
- The source-of-truth docs identify WP-0003 as the next implementation step.

## Design notes

The local Supabase runtime is intentionally minimal. Its purpose is to prove the developer workflow, not to implement the final platform schema. The control-plane schema begins in WP-0003.

The `runtime_metadata` table is a safe canary table used to validate migrations, seed data, RLS, tests, and type generation.

## Next work packet

Recommended next work packet:

```text
WP-0003: Control-Plane Data Model and Database Package
```

WP-0003 should define the canonical platform database model for organizations, projects, environments, runtime instances, deployments, backups, restore jobs, secrets metadata, audit events, usage events, quotas, API keys, and webhooks.
