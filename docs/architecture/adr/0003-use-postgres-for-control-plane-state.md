# ADR-0003: Use Postgres for Control Plane State

## Status

Accepted

## Date

2026-07-01

## Context

The control plane needs durable, queryable, relational state for organizations, projects, environments, deployments, secrets metadata, backup plans, backup records, restore jobs, audit events, usage events, quotas, API keys, and webhooks.

The project already uses Supabase OSS as a Postgres-centered runtime. Using PostgreSQL for control-plane state keeps the architecture consistent, avoids unnecessary data infrastructure early, and gives us strong relational modeling, transactions, constraints, indexes, and audit/event storage.

## Decision

Use **PostgreSQL as the canonical control-plane database**.

The control-plane database is separate from managed runtime/application databases.

## Consequences

### Positive

- Strong consistency and relational integrity.
- Mature tooling and operational familiarity.
- Excellent fit for control-plane records and audit trails.
- Supports RLS if needed for platform multi-tenancy.
- Works well with migrations and type generation.
- Keeps early architecture simple.

### Negative

- High-volume telemetry or analytics may eventually need a separate analytical store.
- Event-streaming workloads may eventually need NATS, Kafka, or similar tools.
- Control-plane Postgres must be backed up and monitored carefully.

### Risks

- Mixing runtime and control-plane databases could create confusion.
- Storing raw secrets in the control-plane DB would be unsafe.
- Overusing Postgres as a queue/event bus could become limiting at scale.

## Data ownership

The control-plane database owns platform state:

```text
organizations
organization_memberships
platform_users
projects
project_environments
runtime_instances
runtime_services
deployments
deployment_events
secret_refs
backup_plans
backups
backup_events
restore_jobs
restore_events
observability_targets
audit_events
usage_events
quota_limits
api_keys
webhooks
```

Managed Supabase runtime databases own application state for the projects they serve.

## Alternatives considered

### Use Supabase runtime database as the control-plane database

Rejected because the platform state should not be mixed with arbitrary customer/application runtime state.

### Use a document database

Rejected for v1 because control-plane state is relational and transactional.

### Use event sourcing as the only source of truth

Rejected for v1 because it adds complexity before the basic control-plane model is proven.

### Use ClickHouse for control-plane state

Rejected for canonical state. ClickHouse may later be useful for analytics or high-volume usage/audit queries.

## Follow-up actions

- Define initial control-plane schema.
- Add migrations for control-plane database.
- Add audit event model early.
- Add backup plan for control-plane database itself.
- Define retention policies for audit and usage events.
