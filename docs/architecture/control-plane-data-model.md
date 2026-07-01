# Control-Plane Data Model

## Purpose

The control-plane data model is the canonical state model for the platform
that manages Supabase OSS runtime environments.

It tracks platform facts such as:

- organizations
- organization memberships
- projects
- environments
- runtime instances
- runtime services
- deployments
- deployment events
- secret references
- backup plans
- backups
- restore jobs
- audit events
- usage events
- quotas
- API keys
- webhooks

## Boundary

The control-plane database is not the same thing as a customer runtime
database.

```txt
Control-plane database:
  Owns platform metadata and operations state.

Supabase runtime database:
  Owns customer application data for a specific project environment.
```

During local development, the local Supabase Postgres instance may host the
`platform` schema so the project can move quickly with one local database.
In production, control-plane state should live in a dedicated Postgres
database that is operationally isolated from managed customer runtimes.

## Schema

The initial schema lives in:

- [`../../supabase/migrations/20260701213000_init_control_plane_schema.sql`](../../supabase/migrations/20260701213000_init_control_plane_schema.sql)

The schema uses the `platform` namespace.

## Core hierarchy

```txt
organization
  └── project
        └── environment
              └── runtime_instance
                    └── runtime_service
```

## Organization model

Organizations are the top-level tenant boundary for the platform itself.

Important tables:

- `platform.organizations`
- `platform.organization_memberships`

Initial roles:

- `owner`
- `admin`
- `developer`
- `viewer`
- `billing_admin`
- `security_admin`
- `ops_admin`

## Project and environment model

Projects model Supabase Cloud-like project ownership.

Environments model runtime deployments such as:

- `local`
- `dev`
- `staging`
- `production`
- `preview`

A preview environment is expected to be short-lived and tied to pull request
or branch workflows in a later work packet.

## Runtime model

A runtime instance is the platform record for a concrete Supabase OSS stack.

Runtime services are tracked individually so the platform can later expose
health, logs, versions, and routing for services such as:

- Postgres
- Auth
- PostgREST
- Realtime
- Storage
- Edge Functions
- Studio
- API gateway

## Secrets model

The `platform.secrets` table stores references to external secret systems.
It must not store raw secret values.

Accepted initial providers:

- `sops_age`
- `openbao`
- `external_secrets`
- `environment`
- `manual`

## Backup and restore model

The backup model separates backup plans from concrete backup artifacts.

```txt
backup_plan
  └── backup
        └── restore_job
```

Restore jobs always name a target environment. Destructive restore modes must
require explicit confirmation in the management API and UI in later work.

## Audit model

`platform.audit_events` is the canonical evidence trail for platform actions.
Every privileged operation should emit an audit event.

Examples:

- `project.created`
- `environment.created`
- `environment.provisioned`
- `secret.created`
- `secret.rotated`
- `backup.started`
- `backup.succeeded`
- `restore.started`
- `restore.succeeded`
- `deployment.started`
- `deployment.succeeded`
- `migration.applied`

## RLS posture

WP-0003 enables row level security on control-plane tables as a defensive
default.

Fine-grained platform access policies are intentionally deferred to a later
authorization/RBAC work packet. Until those policies exist, privileged access
should happen through backend services, not directly from browsers.

## Related files

- [`../../packages/database/src/control-plane.ts`](../../packages/database/src/control-plane.ts)
- [`../../packages/domain/src/control-plane.ts`](../../packages/domain/src/control-plane.ts)
- [`../../packages/events/src/control-plane-events.ts`](../../packages/events/src/control-plane-events.ts)
- [`../work-packets/WP-0003-control-plane-data-model-and-database-package.md`](../work-packets/WP-0003-control-plane-data-model-and-database-package.md)
