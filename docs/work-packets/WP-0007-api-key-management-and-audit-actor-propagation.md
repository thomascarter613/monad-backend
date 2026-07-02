
# WP-0007: API Key Management Endpoints and Audit Actor Propagation

## Epic

Control Plane Foundation

## Objective

Add safe API key lifecycle endpoints and ensure management actions record the calling principal in audit events.

## Scope

This work packet adds:

* `POST /api-keys`
* `GET /api-keys`
* `POST /api-keys/:apiKeyId/revoke`
* `POST /api-keys/:apiKeyId/rotate`
* one-time raw API key reveal on create/rotate
* safe API key metadata listing
* API key scopes
* actor-aware audit event recording
* memory-store API key support
* database-store API key support
* docs for API key lifecycle

## Explicit Non-Scope

This work packet does not add:

* human user login
* SSO
* RBAC
* OpenFGA/Cerbos policy integration
* organization-scoped authorization enforcement
* admin dashboard
* API key UI
* rate limiting
* idempotency keys
* database integration tests

## Acceptance Criteria

```text
API keys can be created.
API keys can be listed without exposing raw key values or hashes.
API keys can be revoked.
API keys can be rotated.
Raw API keys are revealed only on create/rotate.
Management route audit events record the calling principal.
API key lifecycle events are audited.
Memory store supports API key lifecycle tests.
Database store supports API key lifecycle methods.
bun run control-api:check passes.
bun run check includes WP-0007 validation.
```

## Validation Commands

```bash
bun install
bun run control-api:check
bun run check
```

## Smoke Test

Terminal 1:

```bash
CONTROL_API_DEV_API_KEY=dev-local-control-api-key bun run control-api:dev
```

Terminal 2:

```bash
curl -X POST http://127.0.0.1:4310/api-keys \
  -H "Content-Type: application/json" \
  -H "X-Control-Api-Key: dev-local-control-api-key" \
  -d '{"name":"Local Automation Key","scopes":["projects:read","audit:read"]}'

curl http://127.0.0.1:4310/api-keys \
  -H "X-Control-Api-Key: dev-local-control-api-key"

curl http://127.0.0.1:4310/audit-events \
  -H "X-Control-Api-Key: dev-local-control-api-key"
```

## Commit Message

```text
feat: add api key management endpoints
```

