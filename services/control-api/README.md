# Control API

The Control API is the first platform service for Open Backend Cloud.

It owns the initial HTTP boundary for the platform control plane.

## Current Scope

This service is intentionally skeletal but runnable.

It currently exposes:

- `GET /health`
- `GET /ready`
- `GET /version`
- `POST /organizations`
- `GET /organizations`
- `GET /organizations/:organizationId`
- `POST /projects`
- `GET /projects`
- `GET /projects/:projectId`
- `POST /projects/:projectId/environments`
- `GET /projects/:projectId/environments`
- `GET /environments/:environmentId`
- `GET /audit-events`

## What It Does Not Do Yet

It does not yet provision real Supabase runtimes.

It does not yet persist to the control-plane PostgreSQL database.

It does not yet authenticate requests.

It does not yet enforce authorization.

It does not yet manage secrets, backups, deployments, or quotas.

Those will come in later work packets.

## Development

From the repo root:

```bash
bun run control-api:dev
```

Then open:

```text
http://127.0.0.1:4310/health
```

## Validation

From the repo root:

```bash
bun run control-api:check
```
