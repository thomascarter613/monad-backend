
# Control API

## Purpose

The Control API is the first runnable service boundary for the Open Backend Cloud control plane.

It will eventually become the foundation for:

* management API
* CLI
* admin console
* automation
* Backstage integration
* provisioning workflows
* audit and governance views

## Current Status

The service is skeletal but runnable.

It supports:

* memory-backed store mode
* database-backed store mode
* static local API key auth
* database API key auth
* disabled auth for tests
* API key lifecycle endpoints
* actor-aware audit events

## Base URL

Local default:

```text
http://127.0.0.1:4310
```

## Authentication

Public endpoints:

* `GET /health`
* `GET /version`

Protected endpoints require an API key.

Accepted headers:

```text
Authorization: Bearer <api-key>
X-Control-Api-Key: <api-key>
X-API-Key: <api-key>
```

Local default API key:

```text
dev-local-control-api-key
```

Example:

```bash
curl -H "X-Control-Api-Key: dev-local-control-api-key" \
  http://127.0.0.1:4310/ready
```

## Health Endpoints

### `GET /health`

Returns basic liveness.

Public.

### `GET /ready`

Returns readiness and store counts.

Protected.

### `GET /version`

Returns service version and environment.

Public.

## API Key Endpoints

### `POST /api-keys`

Protected.

Creates a new API key.

Request:

```json
{
  "organizationId": "org_...",
  "name": "Automation Key",
  "scopes": ["projects:read", "audit:read"],
  "expiresAt": null
}
```

Response includes the raw API key once:

```json
{
  "data": {
    "apiKey": "obc_...",
    "record": {
      "id": "key_...",
      "organizationId": "org_...",
      "name": "Automation Key",
      "keyPrefix": "obc_...",
      "scopes": ["projects:read", "audit:read"],
      "status": "active",
      "expiresAt": null,
      "lastUsedAt": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### `GET /api-keys`

Protected.

Lists API key metadata.

Does not return raw keys or key hashes.

Optional query:

```text
organizationId=org_...
status=active
```

### `POST /api-keys/:apiKeyId/revoke`

Protected.

Revokes an API key.

### `POST /api-keys/:apiKeyId/rotate`

Protected.

Rotates an API key and returns the new raw API key once.

Request:

```json
{
  "expiresAt": null
}
```

## Organization Endpoints

### `POST /organizations`

Protected.

Creates an organization.

Request:

```json
{
  "name": "Example Organization",
  "slug": "example"
}
```

### `GET /organizations`

Protected.

Lists organizations.

### `GET /organizations/:organizationId`

Protected.

Gets one organization.

## Project Endpoints

### `POST /projects`

Protected.

Creates a project.

Request:

```json
{
  "organizationId": "org_...",
  "name": "Example Project",
  "slug": "example-project"
}
```

### `GET /projects`

Protected.

Lists projects.

Optional query:

```text
organizationId=org_...
```

### `GET /projects/:projectId`

Protected.

Gets one project.

## Environment Endpoints

### `POST /projects/:projectId/environments`

Protected.

Creates a project environment.

Request:

```json
{
  "name": "Development",
  "key": "development"
}
```

Supported environment keys:

* `local`
* `preview`
* `development`
* `staging`
* `production`

### `GET /projects/:projectId/environments`

Protected.

Lists environments for one project.

### `GET /environments/:environmentId`

Protected.

Gets one environment.

## Audit Endpoints

### `GET /audit-events`

Protected.

Lists audit events.

Optional query parameters:

* `entityType`
* `entityId`
* `limit`

## Error Shape

Errors use this shape:

```json
{
  "error": {
    "code": "project_not_found",
    "message": "Project not found: proj_..."
  }
}
```

## Response Shape

Single-resource responses use:

```json
{
  "data": {}
}
```

List responses use:

```json
{
  "data": [],
  "count": 0
}
```

## Future Work

Later work packets should add:

* database-backed auth integration tests
* organization-scoped authorization
* request IDs
* structured logging
* OpenTelemetry instrumentation
* pagination
* idempotency keys
* rate limiting
* management API versioning
* generated SDK client
