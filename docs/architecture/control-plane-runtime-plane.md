# Control Plane / Runtime Plane

## Purpose

This document defines the most important architectural boundary in Open Backend Cloud: the separation between the **control plane** and the **runtime plane**.

## Summary

```text
Runtime plane = Supabase OSS backend stacks.
Control plane = the platform that manages those stacks.
```

The platform must not blur these boundaries.

## Runtime plane

The runtime plane is what application developers use to build products.

It is composed of managed Supabase OSS stacks.

Runtime plane capabilities include:

- PostgreSQL;
- Auth;
- PostgREST / generated REST APIs;
- Realtime;
- Storage;
- Edge Functions;
- Studio;
- database migrations;
- generated types;
- local development workflow.

## Control plane

The control plane is what platform operators and automation use to manage runtime instances.

Control plane capabilities include:

- organizations;
- users and memberships;
- projects;
- environments;
- preview environments;
- runtime instance registry;
- provisioning;
- deployment orchestration;
- migration workflow management;
- secret references;
- backup plans;
- backup jobs;
- restore jobs;
- observability targets;
- health checks;
- audit logs;
- usage events;
- quotas;
- platform RBAC;
- management API;
- CLI;
- admin console;
- runbooks.

## Why separation matters

The runtime plane and control plane have different security, reliability, and lifecycle needs.

### Runtime plane data

Runtime data is application/customer data.

Examples:

- user profiles for an app;
- tenant data for an app;
- uploaded files for an app;
- application events;
- application-specific tables.

### Control plane data

Control-plane data is platform management data.

Examples:

- platform organizations;
- projects;
- environments;
- runtime URLs;
- secret references;
- deployment records;
- backup records;
- restore jobs;
- audit events;
- usage events;
- RBAC assignments.

Control-plane state must not be casually stored inside arbitrary managed runtime projects.

## Ownership table

| Capability | Runtime plane owner | Control plane owner |
|---|---:|---:|
| Application database | Yes | No |
| App Auth | Yes | No |
| App APIs | Yes | No |
| App Realtime | Yes | No |
| App Storage | Yes | No |
| Edge Functions | Yes | No, except deployment orchestration |
| Project registry | No | Yes |
| Environment registry | No | Yes |
| Provisioning | No | Yes |
| Deployment records | No | Yes |
| Secret references | No | Yes |
| Raw secret storage | No | No, use secrets manager |
| Backup metadata | No | Yes |
| Restore workflow | No | Yes |
| Observability targets | No | Yes |
| Audit events for platform actions | No | Yes |
| Team/RBAC for platform | No | Yes |
| Usage/quotas | No | Yes |

## Example lifecycle

### Create project

```text
User/API/CLI requests project creation
  -> control plane creates project record
  -> control plane creates default environments
  -> provisioner creates Supabase runtime for selected environment
  -> secrets manager stores runtime secrets
  -> control plane stores secret references
  -> runtime health check runs
  -> audit event recorded
```

### Deploy migration

```text
Git change contains migration
  -> CI validates migration
  -> control API records deployment
  -> deployer applies migration to target runtime
  -> post-migration checks run
  -> deployment event recorded
  -> audit event recorded
```

### Create backup

```text
Schedule/API/CLI requests backup
  -> backup manager validates target environment
  -> backup process runs against runtime database
  -> backup artifact stored offsite/object storage
  -> backup metadata recorded in control plane
  -> verification runs
  -> audit event recorded
```

### Restore backup

```text
User/API/CLI requests restore
  -> control plane verifies authorization
  -> restore job created
  -> target environment selected or created
  -> backup artifact restored
  -> verification runs
  -> runtime health check runs
  -> restore job status updated
  -> audit event recorded
```

## Security boundary

The control plane may need privileged access to runtimes, but that access must be carefully constrained.

Rules:

- runtime service-role keys are secret values, not ordinary configuration;
- service-role keys must not be exposed to the admin frontend;
- secret values should live in a secrets manager;
- the control-plane database should store secret references only;
- privileged operations must go through backend services;
- privileged operations must generate audit events;
- production-destructive actions require additional safeguards.

## Environment types

Supported environment kinds:

```text
local
preview
dev
staging
production
```

### local

Used by a developer on a workstation.

### preview

Ephemeral environment created for a branch, pull request, demo, or temporary test.

### dev

Shared development environment.

### staging

Production-like validation environment.

### production

Customer-facing or real-data environment.

## Runtime instance states

Suggested lifecycle states:

```text
requested
provisioning
healthy
degraded
failed
suspended
deleting
deleted
```

## Deployment states

Suggested deployment states:

```text
created
queued
running
succeeded
failed
rolled_back
canceled
```

## Backup states

Suggested backup states:

```text
scheduled
running
succeeded
failed
expired
verified
verification_failed
```

## Restore states

Suggested restore states:

```text
requested
running
succeeded
failed
verification_failed
canceled
```

## Design rule

When uncertain about whether a capability belongs to the runtime plane or control plane, ask:

> Is this an application backend capability, or is this a platform management capability?

Application backend capability -> runtime plane.

Platform management capability -> control plane.
