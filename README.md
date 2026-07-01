# Open Backend Cloud

> Working name: **Open Backend Cloud**. The name is intentionally temporary and can be changed globally later.

Open Backend Cloud is a free/open-source, self-hostable backend platform control plane built around **Supabase OSS** as the runtime plane.

The goal is not to fork or replace Supabase. The goal is to provide a Supabase Cloud-like developer and operations experience on user-owned infrastructure by combining Supabase OSS with best-of-breed free/open-source infrastructure, operations, security, CI/CD, observability, backup, governance, and platform-management tools.

## Core thesis

Supabase OSS provides the backend runtime:

- PostgreSQL
- Auth
- PostgREST / generated APIs
- Realtime
- Storage
- Edge Functions
- Studio
- local development workflow
- database migrations and configuration-as-code primitives

Open Backend Cloud provides the missing platform layer:

- organizations, projects, and environments
- runtime provisioning
- deployment orchestration
- secrets management
- backups, restore, and PITR strategy
- observability
- audit logging
- security and policy gates
- CI/CD workflows
- preview environments and branching workflows
- management API
- CLI
- admin console
- usage, quotas, and future billing hooks
- production runbooks and governance

## Why this exists

Self-hosted Supabase is powerful, but it is not the same thing as Supabase Cloud. Self-hosted Supabase is best treated as a single-project backend stack. Platform-only cloud features such as branching, advanced metrics beyond logs, managed backups/PITR, analytics/vector buckets, ETL, and the platform management API are not part of the normal self-hosted configuration.

Open Backend Cloud exists to reconstruct that missing platform layer using FOSS components.

## Architecture posture

```text
Supabase OSS = runtime plane
Open Backend Cloud = control plane
FOSS infrastructure = infrastructure plane
```

The platform should wrap, orchestrate, secure, monitor, and govern Supabase OSS. It should avoid unnecessary forks and should treat upstream Supabase as a first-class dependency.

## Repository status

Current stage: **WP-0002: Monorepo Tooling and Local Supabase Runtime**.

This repository now contains source-of-truth docs, monorepo tooling, local quality checks, and a source-controlled local Supabase runtime template.

## Current source-of-truth docs

- [Documentation Index](docs/00-index.md)
- [Product Charter](docs/product/product-charter.md)
- [v1 Scope](docs/product/v1-scope.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Control Plane / Runtime Plane](docs/architecture/control-plane-runtime-plane.md)
- [ADR-0001: Use Supabase OSS as Runtime Plane](docs/architecture/adr/0001-use-supabase-oss-as-runtime-plane.md)
- [ADR-0002: Build FOSS Control Plane Around Supabase](docs/architecture/adr/0002-build-foss-control-plane-around-supabase.md)
- [ADR-0003: Use Postgres for Control Plane State](docs/architecture/adr/0003-use-postgres-for-control-plane-state.md)
- [ADR-0004: Use GitOps for Runtime Deployment](docs/architecture/adr/0004-use-gitops-for-runtime-deployment.md)
- [Local Supabase Runtime](docs/development/local-supabase-runtime.md)
- [WP-0002: Monorepo Tooling and Local Supabase Runtime](docs/work-packets/WP-0002-monorepo-tooling-and-local-supabase-runtime.md)



## Local development quickstart

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

Inspect runtime status:

```bash
bun run supabase:status
```

Reset the database, apply migrations, and seed data:

```bash
bun run supabase:reset
```

Run database tests and regenerate database types:

```bash
bun run supabase:test
bun run supabase:types
```

Stop the runtime:

```bash
bun run supabase:stop
```

## v1 direction

v1 should prove that a developer/operator can:

1. create a platform project;
2. create environments for that project;
3. provision a Supabase OSS runtime;
4. manage configuration and secrets safely;
5. apply migrations through a governed workflow;
6. observe runtime health, logs, metrics, and failures;
7. create and verify backups;
8. restore an environment from backup;
9. audit privileged actions;
10. create preview environments for development workflows;
11. operate the system through API, CLI, and admin UI.

## Non-goals for v1

v1 should not attempt to provide full Supabase Cloud parity. It should not initially include global multi-region hosting, complex billing, enterprise marketplace functionality, true zero-copy branching, or highly abstracted multi-cloud infrastructure. Those are later-stage capabilities.

## References

- Supabase product overview: https://supabase.com/
- Supabase self-hosting docs: https://supabase.com/docs/guides/self-hosting
- Supabase local development docs: https://supabase.com/docs/guides/local-development/overview
- Supabase CLI config docs: https://supabase.com/docs/guides/local-development/cli/config
- Supabase CLI reference: https://supabase.com/docs/reference/cli/introduction
