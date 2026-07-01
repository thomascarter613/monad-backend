# Control API

## Purpose

The Control API is the first runnable service boundary for the Open Backend Cloud control plane.

It will eventually become the foundation for:

- management API
- CLI
- admin console
- automation
- Backstage integration
- provisioning workflows
- audit and governance views

## Current Status

The service is skeletal but runnable.

It currently uses an in-memory store so that routes, request/response shapes, tests, and service boundaries can be validated before connecting to the control-plane PostgreSQL database.

Persistence will be added in a later work packet.

## Base URL

Local default:

```text
http://127.0.0.1:4310
```

## Health Endpoints

### `GET /health`

Returns basic liveness.

### `GET /ready`

Returns readiness and in-memory store counts.

### `GET /version`

Returns service version and environment.

## Organization Endpoints

### `POST /organizations`

Creates an organization.

Request:

```json
{
  "name": "Example Organization",
  "slug": "example"
}
```

### `GET /organizations`

Lists organizations.

### `GET /organizations/:organizationId`

Gets one organization.

## Project Endpoints

### `POST /projects`

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

Lists projects.

Optional query:

```text
organizationId=org_...
```

### `GET /projects/:projectId`

Gets one project.

## Environment Endpoints

### `POST /projects/:projectId/environments`

Creates a project environment.

Request:

```json
{
  "name": "Development",
  "key": "development"
}
```

Supported environment keys:

- `local`
- `preview`
- `development`
- `staging`
- `production`

### `GET /projects/:projectId/environments`

Lists environments for one project.

### `GET /environments/:environmentId`

Gets one environment.

## Audit Endpoints

### `GET /audit-events`

Lists audit events.

Optional query parameters:

- `entityType`
- `entityId`
- `limit`

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

- database-backed repositories
- authentication
- authorization
- request IDs
- structured logging
- OpenTelemetry instrumentation
- API key support
- pagination
- idempotency keys
- rate limiting
- management API versioning
- generated SDK client
