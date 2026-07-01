# Open Backend Cloud

Open Backend Cloud is a free/open-source Supabase Cloud-like backend platform
built from Supabase OSS plus best-of-breed FOSS infrastructure, operations,
security, CI/CD, observability, and governance tools.

Supabase OSS is the runtime plane. Open Backend Cloud is the control plane
around that runtime.

## Current status

Implemented work packets:

- WP-0001: Repository Foundation and Product Charter
- WP-0002: Monorepo Tooling and Local Supabase Runtime
- WP-0003: Control-Plane Data Model and Database Package

Next work packet:

- WP-0004: Control API Skeleton and Platform Service Boundaries

## Architecture posture

```txt
Control plane:
  Open Backend Cloud services, database, API, CLI, admin UI, workers, audit,
  governance, deployment automation, backup management, observability, and
  project/environment lifecycle.

Runtime plane:
  Supabase OSS running Postgres, Auth, PostgREST, Realtime, Storage, Edge
  Functions, Studio, and related runtime services.

Infrastructure plane:
  FOSS infrastructure such as Docker Compose, k3s/Kubernetes, OpenTofu,
  Argo CD, Caddy/Kong, OpenBao/SOPS, pgBackRest/WAL-G, OpenTelemetry,
  Prometheus, Grafana, Loki, Valkey, NATS, and related tools.
```

## Repository layout

```txt
apps/
  admin/                 Future platform admin console.
  docs/                  Future documentation site.

services/
  control-api/           Future management API.
  provisioner/           Future runtime provisioning service.
  worker/                Future background worker service.

packages/
  config/                Shared configuration helpers.
  database/              Database types, generated Supabase types, platform schema constants.
  domain/                Control-plane domain types.
  events/                Platform event names and envelopes.
  sdk/                   Future typed control API SDK.

supabase/
  config.toml            Local Supabase development configuration.
  migrations/            Local development migrations.
  tests/                 pgTAP database tests.
  functions/             Local Edge Function examples.

docs/
  architecture/          Architecture docs and ADRs.
  database/              Database docs.
  development/           Local development docs.
  product/               Product source-of-truth docs.
  work-packets/          Work packet records.
```

## Common commands

```bash
bun install
bun run check
bun run docs:check
bun run foundation:check
bun run control-plane:check
```

Local Supabase runtime commands:

```bash
bun run supabase:start
bun run supabase:status
bun run supabase:reset
bun run supabase:test
bun run supabase:types
bun run supabase:stop
```

## Source-of-truth docs

Start here:

- [Documentation index](docs/00-index.md)
- [Product charter](docs/product/product-charter.md)
- [v1 scope](docs/product/v1-scope.md)
- [Architecture overview](docs/architecture/overview.md)
- [Control-plane/runtime-plane architecture](docs/architecture/control-plane-runtime-plane.md)
- [Control-plane data model](docs/architecture/control-plane-data-model.md)
- [Control-plane schema](docs/database/control-plane-schema.md)

## Foundational decisions

- [ADR-0001: Use Supabase OSS as Runtime Plane](docs/architecture/adr/0001-use-supabase-oss-as-runtime-plane.md)
- [ADR-0002: Build FOSS Control Plane Around Supabase](docs/architecture/adr/0002-build-foss-control-plane-around-supabase.md)
- [ADR-0003: Use Postgres for Control Plane State](docs/architecture/adr/0003-use-postgres-for-control-plane-state.md)
- [ADR-0004: Use GitOps for Runtime Deployment](docs/architecture/adr/0004-use-gitops-for-runtime-deployment.md)

## Production boundary

During early local development, the local Supabase Postgres instance may host
the `platform` schema for control-plane development. In production, the
control-plane database should be isolated from customer runtime databases.

## License

License is not finalized. WP-0001 intentionally left final licensing as an
explicit project decision.
