# v1 Scope

## Version goal

v1 should deliver the first serious open-source Supabase Cloud-like control plane for self-hosted Supabase OSS.

The goal is not full cloud parity. The goal is a reliable, understandable, auditable platform that proves the control-plane model works.

## v1 theme

```text
A reproducible, observable, restorable, governable Supabase OSS platform.
```

## v1 must include

### 1. Repository and documentation foundation

Status: WP-0001.

Required:

- source-of-truth README;
- contributor/agent operating instructions;
- product charter;
- v1 scope;
- architecture overview;
- runtime/control-plane split;
- initial accepted ADRs.

### 2. Monorepo tooling and local Supabase runtime

Status: WP-0002, next.

Required:

- package/tooling baseline;
- local development commands;
- local Supabase OSS stack;
- version-controlled Supabase config;
- migrations directory;
- seed data path;
- generated types path;
- initial local sanity checks.

### 3. Control-plane database

Required:

- organizations;
- memberships;
- projects;
- environments;
- runtime instances;
- deployments;
- secrets metadata;
- backup plans;
- backups;
- restore jobs;
- audit events;
- usage events;
- API keys.

### 4. Project and environment registry

Required:

- create/list/read projects;
- create/list/read environments;
- model environment kind: local, dev, staging, production, preview;
- track runtime URL and service health;
- track ownership and lifecycle state.

### 5. Secrets management baseline

Required:

- secret references in control-plane database;
- no raw service-role keys in frontend code;
- local SOPS/age-compatible direction;
- production OpenBao-compatible direction;
- audit events for secret changes.

### 6. Runtime provisioning v0

Required:

- deterministic Supabase runtime template;
- environment variable rendering from secret refs;
- runtime health check;
- runtime registration in the control-plane database;
- Docker Compose first;
- Kubernetes-ready design later.

### 7. Deployment and migration workflow

Required:

- migration files are versioned;
- migrations can be tested locally;
- migrations can be applied to an environment;
- migration application creates deployment/audit events;
- unsafe migration checks are documented and partially automated.

### 8. Backup and restore baseline

Required:

- backup plan model;
- backup job model;
- restore job model;
- database backup command path;
- restore into a non-production environment;
- restore verification step;
- audit events for backup and restore.

### 9. Observability baseline

Required:

- health checks;
- structured logs;
- basic metrics;
- runtime dashboards direction;
- backup/deployment/migration failure visibility;
- OpenTelemetry-compatible service instrumentation direction.

### 10. Audit logging

Required:

- append-only audit event model;
- audit events for privileged platform actions;
- request/correlation ID strategy;
- actor/resource/action structure.

### 11. Security baseline

Required:

- secret scanning;
- dependency/container scanning direction;
- RLS-first policy model;
- service-role key handling rules;
- CORS/origin policy direction;
- production admin access rules;
- license review expectations.

### 12. Management API

Required:

- API to manage orgs/projects/environments;
- API to trigger provision/deploy/backup/restore operations;
- API to inspect health, audit events, and deployment status;
- authn/authz model documented.

### 13. CLI

Required:

- project commands;
- environment commands;
- deploy/migrate commands;
- backup/restore commands;
- logs/status commands.

### 14. Admin console

Required:

- organizations;
- projects;
- environments;
- runtime health;
- deployments;
- backups/restores;
- audit log;
- secrets metadata;
- team membership basics.

### 15. Preview environments baseline

Required:

- create isolated preview environment;
- apply migrations;
- load seed data;
- provide preview URLs and keys;
- destroy preview environment;
- track lifecycle in control plane.

## v1 should include if practical

- basic usage rollups;
- quota model without enforcement complexity;
- basic RBAC roles;
- function deployment tracking;
- storage bucket metadata and policy tracking;
- lightweight templates/starters.

## v1 should not include

- full Supabase Cloud parity;
- true zero-copy branching;
- global multi-region control plane;
- full billing engine;
- marketplace;
- enterprise SSO;
- autoscaling abstraction;
- hosted SaaS product packaging;
- deep database performance tuning automation;
- complicated plugin system.

## v1 release gate

Do not call the project v1 until these are true:

- a clean checkout can run local checks;
- local Supabase runtime starts;
- Supabase config/migrations are versioned;
- control-plane database can model projects and environments;
- at least one runtime can be provisioned from code;
- migrations can be applied through a documented workflow;
- backups can be created;
- restores can be tested into a safe environment;
- logs/metrics/health are visible;
- privileged actions are audited;
- RLS/security test strategy exists and has initial coverage;
- API and CLI can perform core operations;
- admin UI can inspect core platform state;
- preview environment workflow exists at least in baseline form;
- all core operations have runbooks.

## Work packet sequence

### WP-0001: Repository Foundation and Product Charter

Creates the source-of-truth product and architecture docs.

Files:

```text
README.md
AGENTS.md
docs/00-index.md
docs/product/product-charter.md
docs/product/v1-scope.md
docs/architecture/overview.md
docs/architecture/control-plane-runtime-plane.md
docs/architecture/adr/0001-use-supabase-oss-as-runtime-plane.md
docs/architecture/adr/0002-build-foss-control-plane-around-supabase.md
docs/architecture/adr/0003-use-postgres-for-control-plane-state.md
docs/architecture/adr/0004-use-gitops-for-runtime-deployment.md
```

Acceptance criteria:

- all source-of-truth docs exist;
- runtime/control-plane/infrastructure-plane split is documented;
- v1 scope is explicit;
- next work packet is identified;
- ADRs 0001 through 0004 are accepted.

### WP-0002: Monorepo Tooling and Local Supabase Runtime

Next work packet.

Expected files may include:

```text
package.json
bun.lockb
biome.json
lefthook.yml
.editorconfig
.gitignore
.env.example
scripts/check.sh
scripts/dev/supabase-start.sh
scripts/dev/supabase-stop.sh
scripts/dev/supabase-reset.sh
supabase/config.toml
supabase/migrations/.gitkeep
supabase/functions/.gitkeep
supabase/seed.sql
packages/database/README.md
.github/workflows/check.yml
```

Expected commands:

```text
bun install
bun run format
bun run lint
bun run check
bun run supabase:start
bun run supabase:status
bun run supabase:stop
```

Expected acceptance criteria:

- monorepo tooling exists;
- local Supabase runtime can be initialized;
- Supabase configuration is version-controlled;
- local commands are documented;
- CI sanity check exists;
- generated type path is defined.
