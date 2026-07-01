# Documentation Index

This is the source-of-truth index for Open Backend Cloud.

## Product

- [Product Charter](product/product-charter.md)
- [v1 Scope](product/v1-scope.md)

## Architecture

- [Architecture Overview](architecture/overview.md)
- [Control Plane / Runtime Plane](architecture/control-plane-runtime-plane.md)

## Architecture Decision Records

- [ADR-0001: Use Supabase OSS as Runtime Plane](architecture/adr/0001-use-supabase-oss-as-runtime-plane.md)
- [ADR-0002: Build FOSS Control Plane Around Supabase](architecture/adr/0002-build-foss-control-plane-around-supabase.md)
- [ADR-0003: Use Postgres for Control Plane State](architecture/adr/0003-use-postgres-for-control-plane-state.md)
- [ADR-0004: Use GitOps for Runtime Deployment](architecture/adr/0004-use-gitops-for-runtime-deployment.md)

## Development

- [Local Supabase Runtime](development/local-supabase-runtime.md)

## Work packets

- [WP-0002: Monorepo Tooling and Local Supabase Runtime](work-packets/WP-0002-monorepo-tooling-and-local-supabase-runtime.md)

## Current implementation state

Current work packet:

```text
WP-0002: Monorepo Tooling and Local Supabase Runtime
```

Next work packet:

```text
WP-0003: Control-Plane Data Model and Database Package
```

## Source-of-truth hierarchy

When documents disagree, use this order of authority:

1. Accepted ADRs
2. Product Charter
3. v1 Scope
4. Architecture Overview
5. Work packet documents and implementation notes
6. README summaries

If a lower-level document conflicts with an accepted ADR, update the lower-level document or create a new ADR that supersedes the prior decision.

## Project vocabulary

| Term | Meaning |
|---|---|
| Runtime plane | The Supabase OSS backend runtime being managed. |
| Control plane | The platform services that manage projects, environments, deployments, secrets, backups, observability, audit, governance, and operations. |
| Infrastructure plane | The FOSS infrastructure used to run and operate the control plane and runtime plane. |
| Project | A platform-managed backend project. |
| Environment | A concrete runtime instance for a project: local, dev, staging, production, or preview. |
| Preview environment | An ephemeral environment, typically created for a pull request or branch. |
| Managed runtime | A Supabase OSS stack controlled by the platform. |
| Platform API | The management API exposed by Open Backend Cloud. |
| Platform CLI | Command-line interface for managing projects, environments, deployments, backups, and status. |
| Admin console | Web UI for platform operations. |
