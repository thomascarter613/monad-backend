# Architecture Overview

## Architecture summary

Open Backend Cloud is a three-plane platform:

```text
+-------------------------------------------------------+
| Control Plane                                         |
|                                                       |
| organizations, projects, environments, deployments,   |
| backups, restores, secrets metadata, usage, audit,    |
| management API, CLI, admin console                    |
+--------------------------+----------------------------+
                           |
                           v
+-------------------------------------------------------+
| Runtime Plane                                         |
|                                                       |
| Supabase OSS stacks: Postgres, Auth, PostgREST,       |
| Realtime, Storage, Edge Functions, Studio             |
+--------------------------+----------------------------+
                           |
                           v
+-------------------------------------------------------+
| Infrastructure Plane                                  |
|                                                       |
| Docker Compose, k3s/Kubernetes, OpenTofu, Argo CD,    |
| Caddy/Kong, OpenBao/SOPS, Prometheus/Grafana/Loki,    |
| pgBackRest/WAL-G, object storage                      |
+-------------------------------------------------------+
```

## Key architectural decision

Supabase OSS is the runtime plane. Open Backend Cloud is the control plane around it.

This means:

- Supabase owns the application backend runtime capabilities.
- Open Backend Cloud owns management, orchestration, operations, and governance.
- FOSS infrastructure tools provide deployment, secrets, observability, backups, and automation.

## Runtime plane responsibilities

The runtime plane provides the actual backend capabilities developers use in applications:

- PostgreSQL database;
- Auth;
- PostgREST / generated REST APIs;
- Realtime;
- Storage;
- Edge Functions;
- Studio;
- local Supabase workflow;
- database migrations and generated types.

## Control plane responsibilities

The control plane manages many runtime instances and their lifecycle.

Responsibilities:

- organizations and users;
- team membership and roles;
- projects;
- environments;
- runtime instance registry;
- provisioning;
- deployment records;
- migration workflow orchestration;
- secret references;
- backup plans;
- backup jobs;
- restore jobs;
- observability targets;
- usage events and quotas;
- audit logging;
- management API;
- CLI;
- admin console.

## Infrastructure plane responsibilities

The infrastructure plane runs and supports the control and runtime planes.

Initial direction:

```text
Local/dev:
  Docker Compose
  Supabase CLI
  SOPS/age
  local scripts

Production-capable direction:
  k3s/Kubernetes
  OpenTofu
  Argo CD
  Caddy or Kong
  OpenBao
  External Secrets Operator
  Prometheus
  Grafana
  Loki
  OpenTelemetry
  GlitchTip
  Uptime Kuma
  pgBackRest
  WAL-G where needed
```

## Control-plane database

The control-plane database is separate from managed customer/runtime databases.

It stores platform state such as:

```text
organizations
organization_memberships
users
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
backup_events
restore_jobs
restore_events
observability_targets
audit_events
usage_events
quotas
api_keys
webhooks
```

This separation avoids mixing platform state with application data.

## Managed runtime instance

A managed runtime instance is a Supabase OSS stack associated with one platform environment.

Example environment mapping:

```text
Project: acme-crm
  dev        -> Supabase runtime A
  staging    -> Supabase runtime B
  production -> Supabase runtime C
  pr-184     -> Supabase runtime D, ephemeral preview
```

Each environment should have:

- runtime URL;
- API URL;
- Studio URL;
- database connection secret reference;
- anon key secret reference;
- service-role key secret reference;
- health status;
- deployment history;
- migration history;
- backup plan;
- audit trail.

## Deployment model

The preferred deployment model is GitOps-first.

Desired flow:

```text
Git change
  -> CI validates
  -> manifests/config generated
  -> Argo CD reconciles target state
  -> health checks verify runtime
  -> deployment event recorded
  -> audit event recorded
```

The platform should preserve a clear distinction between desired state and observed state.

## Data durability model

Backups and restore are first-class product features.

A production-ready environment should have:

- backup plan;
- backup schedule;
- retention policy;
- backup status;
- restore test record;
- restore runbook;
- audit trail.

PITR support should be designed around PostgreSQL WAL archiving and tooling such as pgBackRest or WAL-G.

## Observability model

Every control-plane service and managed runtime should be observable.

Minimum signals:

- health checks;
- structured logs;
- metrics;
- traces where practical;
- backup status;
- deployment status;
- migration status;
- runtime service status;
- alerts for failed critical operations.

## Security model

Security starts with these rules:

- service-role keys never go to client-side code;
- raw secrets do not live in Git;
- secret references are stored in the control plane;
- production actions require authorization and audit events;
- RLS is mandatory for exposed application tables;
- migrations and policies must be tested;
- destructive operations require explicit safeguards;
- dependencies and containers are scanned in CI.

## Preview environment model

Preview environments should initially be implemented as isolated ephemeral Supabase runtimes.

Baseline approach:

```text
Pull request opened
  -> create preview environment record
  -> provision isolated Supabase runtime
  -> apply migrations
  -> load seed data
  -> publish preview URLs/keys securely
  -> run validation
  -> destroy environment when PR closes
```

Later enhancements may include sanitized production snapshots, branch diffs, database cloning, and quota-aware cleanup.

## Architectural priorities

Build order should follow this principle:

```text
Reliability before UI.
Backups before branching.
Audit before admin actions.
RLS tests before exposing data.
CLI/API before dashboard.
Preview environments after provisioning works.
Billing/quotas after usage metering exists.
```
