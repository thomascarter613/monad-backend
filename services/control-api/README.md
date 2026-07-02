# Control API

The Control API is the first platform service for Open Backend Cloud.

It owns the initial HTTP boundary for the platform control plane.

## Current Scope

This service is intentionally small but runnable.

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

## Public Endpoints

These endpoints are public:

- `GET /health`
- `GET /version`

## Protected Endpoints

All other endpoints require a Control API key.

Provide the key with one of:

```text
Authorization: Bearer <api-key>
X-Control-Api-Key: <api-key>
X-API-Key: <api-key>
```

Local Development Auth

The local default is static API key mode.

CONTROL_API_AUTH_MODE=static \
CONTROL_API_DEV_API_KEY=dev-local-control-api-key \
bun run control-api:dev

Example request:

curl -H "X-Control-Api-Key: dev-local-control-api-key" \
  http://127.0.0.1:4310/ready
Database API Key Auth

Database mode validates SHA-256 API key hashes from platform.api_keys.

CONTROL_API_STORE_MODE=database \
CONTROL_API_AUTH_MODE=database \
CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
bun run control-api:dev
Store Modes
memory

Default.

Useful for route tests, smoke tests, local API shape work, and development when Supabase/Postgres is not running.

CONTROL_API_STORE_MODE=memory bun run control-api:dev
database

Uses the platform schema in PostgreSQL.

CONTROL_API_STORE_MODE=database \
CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
bun run control-api:dev
What It Does Not Do Yet

It does not yet provision real Supabase runtimes.

It does not yet implement full user authentication.

It does not yet implement organization-scoped authorization.

It does not yet manage secrets, backups, deployments, or quotas.

Those will come in later work packets.

Development

From the repo root:

bun run control-api:dev

Then open:

http://127.0.0.1:4310/health
Validation

From the repo root:

bun run control-api:check
Database Validation

With local Supabase running and reset:

CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
bun run control-api:db:check
Hash an API Key
bun run control-api:auth:hash "your-long-api-key"

