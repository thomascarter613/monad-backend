# WP-0003: Control-Plane Data Model and Database Package

## Status

Implemented.

## Goal

Establish the first canonical data model for the Open Backend Cloud control
plane.

WP-0001 defined the product and architecture. WP-0002 created repo tooling
and a local Supabase runtime. WP-0003 creates the platform state model that
future services, APIs, CLI commands, admin screens, workers, and governance
checks will use.

## Scope

WP-0003 creates:

- a `platform` Postgres schema
- initial platform enums
- initial platform tables
- indexes and core constraints
- RLS enabled defensively on platform tables
- pgTAP tests for schema presence and relationships
- TypeScript database constants and record interfaces
- TypeScript domain references
- TypeScript event names and event envelope types
- documentation for the control-plane data model
- a schema validation script

## Created files

```txt
docs/architecture/control-plane-data-model.md
docs/database/control-plane-schema.md
docs/work-packets/WP-0003-control-plane-data-model-and-database-package.md
packages/database/src/control-plane.ts
packages/domain/src/control-plane.ts
packages/events/src/control-plane-events.ts
scripts/check-control-plane-schema.ts
supabase/migrations/20260701213000_init_control_plane_schema.sql
supabase/tests/01_control_plane_schema.pgtap.sql
```

## Modified files

```txt
README.md
AGENTS.md
package.json
packages/database/src/index.ts
packages/database/README.md
packages/domain/src/index.ts
packages/domain/README.md
packages/events/src/index.ts
packages/events/README.md
packages/sdk/src/index.ts
packages/sdk/README.md
scripts/check-foundation.ts
docs/00-index.md
```

## Data model areas

```txt
organizations
organization_memberships
projects
project_environments
runtime_instances
runtime_services
deployments
deployment_events
secrets
secret_versions
backup_plans
backups
restore_jobs
audit_events
usage_events
quota_limits
api_keys
webhooks
```

## Acceptance criteria

WP-0003 is complete when:

- the control-plane schema migration exists
- the platform schema includes the required tables
- the platform schema includes core enums
- RLS is enabled on platform tables
- secrets store external references rather than raw secret values
- pgTAP tests validate the schema shape
- TypeScript packages expose database/domain/event types
- documentation explains the control-plane/runtime-plane boundary
- `bun run control-plane:check` passes
- `bun run check` includes the control-plane schema check

## Non-goals

WP-0003 does not implement:

- the control API
- provisioning workers
- production RBAC policies
- admin UI screens
- backup execution
- deployment execution
- preview environment automation

## Next work packet

```txt
WP-0004: Control API Skeleton and Platform Service Boundaries
```

WP-0004 should create the first `services/control-api` implementation with
health, organizations, projects, environments, and audit endpoints backed by
the data model introduced here.
