# AGENTS.md

This file defines the working rules for AI assistants and human contributors operating on this repository.

## Project identity

This repository is for **Open Backend Cloud**, a FOSS Supabase Cloud-like backend platform.

The platform uses **Supabase OSS as the runtime plane** and adds a separate **control plane** for project management, environments, provisioning, deployments, secrets, backups, observability, auditability, CI/CD, governance, and developer workflows.

## Prime directive

Do not treat this project as merely “self-host Supabase.”

Treat it as:

```text
Supabase OSS runtime
+ FOSS cloud/control-plane layer
+ production operations layer
+ developer workflow layer
+ governance/security layer
```

## Operating principles

1. **Supabase OSS is the runtime plane.**
   - Avoid unnecessary forks.
   - Prefer wrapping and orchestrating upstream Supabase.
   - Keep runtime customizations explicit and documented.

2. **The control plane is ours.**
   - Organizations, projects, environments, provisioning, deployment history, backups, restores, secrets metadata, audit logs, usage, policies, and platform RBAC belong to the control plane.

3. **Postgres-first, RLS-first, GitOps-first.**
   - Use PostgreSQL as canonical control-plane state.
   - Use RLS and tests for tenant and user isolation.
   - Use Git as the source of truth for declarative runtime configuration whenever practical.

4. **Reliability before UI.**
   - Backups before branching.
   - Audit before admin actions.
   - Observability before complex automation.
   - API/CLI before dashboard-driven magic.

5. **FOSS-first.**
   - Prefer OSI-style open-source licenses when possible.
   - Avoid core dependencies that are merely source-available unless explicitly approved and documented.
   - Document license caveats for every major dependency.

6. **No hidden platform state.**
   - Important configuration should be represented in source control, the control-plane database, or the secrets manager.
   - Avoid manual-only state trapped in dashboards.

7. **Every privileged action should be auditable.**
   - Provisioning, deployment, backup, restore, secret rotation, production migration, project deletion, environment deletion, and role changes must produce audit events.

## Documentation rules

When adding or changing architecture, update the relevant source-of-truth docs:

- `docs/product/product-charter.md`
- `docs/product/v1-scope.md`
- `docs/architecture/overview.md`
- `docs/architecture/control-plane-runtime-plane.md`
- `docs/architecture/adr/*.md`

Create an ADR when a decision is significant, durable, expensive to reverse, or affects future implementation structure.

## ADR rules

ADRs should include:

- Status
- Date
- Context
- Decision
- Consequences
- Alternatives considered
- Follow-up actions

ADR statuses:

- Proposed
- Accepted
- Superseded
- Deprecated

Do not silently rewrite accepted ADRs to mean something materially different. Create a new ADR that supersedes the older one.

## Implementation style

Prefer copy-pasteable, reproducible work packets.

Each work packet should include:

- goal
- scope
- out-of-scope items
- files created/changed
- commands to run
- acceptance criteria
- validation steps
- commit message
- handoff notes

## Current work packets

### WP-0001: Repository Foundation and Product Charter

Status: implemented by these initial docs.

Purpose:

- establish the source-of-truth product and architecture foundation;
- define runtime/control-plane split;
- accept first architecture decisions;
- prepare for WP-0002.

### WP-0002: Monorepo Tooling and Local Supabase Runtime

Status: implemented.

Purpose:

- add monorepo tooling;
- add local development commands;
- initialize a source-controlled Supabase runtime template;
- make Supabase configuration, migrations, seed data, tests, and generated types reproducible;
- add first CI/local sanity checks.

### WP-0003: Control-Plane Data Model and Database Package

Status: next.

Expected purpose:

- define the canonical control-plane data model;
- create migrations for organizations, projects, environments, runtime instances, deployments, backups, restore jobs, secrets metadata, audit events, usage events, quotas, API keys, and webhooks;
- add database package boundaries and typed query conventions;
- add initial control-plane RLS/security posture.

## Safety rules

Do not commit secrets.
Do not expose service-role keys to frontend code.
Do not add production-destructive commands without confirmation gates.
Do not define a table exposed through Supabase APIs without RLS policy planning.
Do not add a dependency as a core platform dependency without checking its license.

## Preferred default stack direction

These are defaults, not permanent decisions:

```text
Runtime: Supabase OSS
Control-plane database: PostgreSQL
Backend services: TypeScript on Bun, likely Elysia/Hono
Infrastructure: Docker Compose first, k3s/Kubernetes later
IaC: OpenTofu
GitOps: Argo CD
Secrets: SOPS/age locally, OpenBao later
Backups: pgBackRest first, WAL-G if needed
Observability: OpenTelemetry, Prometheus, Grafana, Loki, GlitchTip, Uptime Kuma
Jobs: Valkey + BullMQ first, Temporal later for durable workflows
Events: Postgres event tables first, NATS later, Kafka only if needed
Admin UI: Refine/custom app later
Docs: Markdown-first, docs site later
```

## Handoff rule

At the end of each major step, update documentation or create a handoff note that explains:

- what changed;
- why it changed;
- what is now true;
- how to validate it;
- what the next recommended step is.
