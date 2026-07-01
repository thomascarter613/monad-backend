# Service Boundaries

## Purpose

This document defines the first platform service boundaries for Open Backend Cloud.

The platform should avoid becoming a single undifferentiated backend. Each service should own a clear operational responsibility.

## Initial Services

### `services/control-api`

The Control API is the first public/internal HTTP API for the platform control plane.

Responsibilities:

- organizations
- projects
- environments
- runtime metadata
- audit event access
- future management API surface
- future CLI/API client surface

It should not directly perform heavy provisioning, backup, restore, or deployment work. It should validate intent, record control-plane state, and trigger workflows or desired-state changes.

### `services/provisioner`

Future service.

Responsibilities:

- runtime provisioning
- Supabase runtime instance creation
- environment provisioning
- infrastructure coordination
- GitOps desired-state generation
- provisioning workflow activities

The provisioner should eventually be driven by durable workflows.

### `services/worker`

Future service.

Responsibilities:

- background jobs
- usage aggregation
- webhook dispatch
- periodic reconciliation
- maintenance tasks

This service may use BullMQ/Valkey first and Temporal later for durable workflows.

### `services/backup-manager`

Future service.

Responsibilities:

- backup plan execution
- pgBackRest integration
- PITR coordination
- backup verification
- restore job orchestration

Backups should be implemented before branching and preview-environment sophistication.

### `services/secrets-manager`

Future service.

Responsibilities:

- secret metadata
- secret references
- OpenBao integration
- SOPS/age integration
- secret rotation coordination
- secret audit events

The platform should not store raw secret values in the control-plane database.

### `services/observability-manager`

Future service.

Responsibilities:

- metrics integration
- logs integration
- traces integration
- service health aggregation
- dashboard link generation
- uptime checks
- incident signals

## Package Boundaries

### `packages/domain`

Owns canonical domain types and shared business language.

### `packages/database`

Owns control-plane database access, schema helpers, and persistence boundaries.

### `packages/events`

Owns canonical event names and event payload conventions.

### `packages/config`

Owns shared configuration loading and environment parsing.

### `packages/sdk`

Owns future typed API clients for the Control API and Management API.

## Boundary Doctrine

The Control API should not become the entire platform.

The Control API should expose platform intent and control-plane state.

Long-running, failure-prone, or irreversible operations should eventually move through durable workflows.

Preferred flow:

```text
API request
  -> validate intent
  -> write control-plane state
  -> emit audit event
  -> trigger workflow or desired-state change
  -> reconcile runtime
  -> record observed state
```

## Build-Order Doctrine

- Reliability before UI.
- Backups before branching.
- Audit before admin actions.
- RLS tests before exposing data.
- API/CLI before dashboard.
- Preview environments after provisioning works.
- Billing/quotas after usage metering exists.
