# ADR-0002: Build FOSS Control Plane Around Supabase

## Status

Accepted

## Date

2026-07-01

## Context

Supabase OSS provides a backend runtime, but self-hosted Supabase does not include every platform capability provided by Supabase Cloud.

A serious self-hosted platform needs additional capabilities:

- organizations;
- projects;
- environments;
- runtime provisioning;
- preview environments;
- deployment orchestration;
- backups and restore;
- PITR strategy;
- observability;
- audit logging;
- secrets management;
- security and policy gates;
- CI/CD integration;
- management API;
- CLI;
- admin console;
- usage and quota tracking;
- disaster recovery runbooks.

These capabilities are not merely application features. They are cloud/control-plane features.

## Decision

Build a separate **FOSS control plane** around Supabase OSS.

The control plane will manage Supabase runtime instances and provide a Supabase Cloud-like operational and developer experience on user-owned infrastructure.

## Consequences

### Positive

- Clear separation between managed runtimes and management platform.
- Enables multi-project and multi-environment workflows.
- Allows backup, restore, observability, secrets, and audit to become first-class features.
- Avoids overloading Supabase runtime databases with platform state.
- Creates a foundation for API, CLI, admin console, and automation.

### Negative

- Requires building substantial platform services.
- Requires careful boundary management between runtime and control plane.
- Introduces a second database and operational surface area.
- Requires a strong authorization and audit model for platform actions.

### Risks

- Scope creep toward full Supabase Cloud parity too early.
- Control plane could become overly complex before runtime provisioning is reliable.
- UI could hide unclear operational states if API/CLI are not built first.

## Alternatives considered

### Use shell scripts only

Rejected because scripts alone do not provide durable state, auditability, API access, RBAC, or multi-project management.

### Use Supabase Studio as the control plane

Rejected because Studio is not designed to manage a multi-project, multi-environment self-hosted platform with provisioning, backups, GitOps, secrets, and audit workflows.

### Use a generic internal developer platform only

Rejected as the primary approach because this project needs Supabase-specific runtime knowledge and workflows.

## Follow-up actions

- Define control-plane schema.
- Build project/environment registry.
- Add secret reference model.
- Add audit event model.
- Add provisioning service.
- Add management API.
- Add CLI before dashboard-heavy workflows.

## References

- Supabase self-hosting: https://supabase.com/docs/guides/self-hosting
- Supabase local development: https://supabase.com/docs/guides/local-development/overview
