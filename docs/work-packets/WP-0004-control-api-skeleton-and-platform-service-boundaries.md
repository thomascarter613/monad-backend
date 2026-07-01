# WP-0004: Control API Skeleton and Platform Service Boundaries

## Epic

Control Plane Foundation

## Objective

Create the first runnable Control API service and document the platform service boundaries.

## Scope

This work packet adds:

- `services/control-api`
- health/readiness/version endpoints
- organization endpoint skeletons
- project endpoint skeletons
- environment endpoint skeletons
- audit event endpoint skeleton
- in-memory control-plane store
- shared config package
- future SDK package
- API documentation
- service boundary documentation
- root scripts for local development and validation

## Explicit Non-Scope

This work packet does not add:

- real database persistence
- authentication
- authorization
- provisioning
- backups
- secrets integration
- observability integration
- admin dashboard
- CLI
- Backstage integration

## New Endpoints

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

## Acceptance Criteria

```text
The Control API service exists.
The Control API starts locally.
The health, ready, and version endpoints respond.
Organizations can be created and listed.
Projects can be created and listed.
Project environments can be created and listed.
Audit events are recorded for create actions.
A shared config package exists.
A placeholder SDK package exists.
Service boundaries are documented.
API conventions are documented.
bun run control-api:check passes.
bun run check includes the Control API check.
```

## Validation Commands

```bash
bun install
bun run control-api:check
bun run check
```

## Optional Smoke Test

Terminal 1:

```bash
bun run control-api:dev
```

Terminal 2:

```bash
curl http://127.0.0.1:4310/health
curl http://127.0.0.1:4310/ready
curl http://127.0.0.1:4310/version
```

## Commit Message

```text
feat: add control api skeleton
```
