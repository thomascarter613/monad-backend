
WP-0006: Control API Authentication Boundary and API Key Model
Epic

Control Plane Foundation

Objective

Introduce the first safe management API access boundary before adding more administrative functionality.

Scope

This work packet adds:

API key extraction
API key hashing
static local API key auth
disabled test auth
database API key auth
protected management routes
public health/version routes
API key schema hardening migration
API key repository
auth package boundary
auth documentation
Explicit Non-Scope

This work packet does not add:

user login
SSO
RBAC
OpenFGA/Cerbos policies
API key create/revoke endpoints
organization-scoped authorization
provisioning authorization
audit actor propagation into every audit event
dashboard authentication
Public Endpoints
GET /health
GET /version
Protected Endpoints
GET /ready
POST /organizations
GET /organizations
GET /organizations/:organizationId
POST /projects
GET /projects
GET /projects/:projectId
POST /projects/:projectId/environments
GET /projects/:projectId/environments
GET /environments/:environmentId
GET /audit-events
Auth Modes
CONTROL_API_AUTH_MODE=static
CONTROL_API_AUTH_MODE=database
CONTROL_API_AUTH_MODE=disabled
Acceptance Criteria
Health and version endpoints remain public.
Ready and management endpoints require an API key.
Static local API key auth works.
Disabled auth works for tests only.
Database API key repository exists.
API keys are hashed before database lookup.
Raw API keys are not stored by the model.
API key schema migration exists.
Auth package boundary exists.
bun run control-api:check passes.
bun run check includes WP-0006 validation.
Validation Commands
bun install
bun run control-api:check
bun run check

With Supabase running:

bun run supabase:start
bun run supabase:reset

CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
bun run control-api:db:check
Smoke Test

Terminal 1:

CONTROL_API_DEV_API_KEY=dev-local-control-api-key bun run control-api:dev

Terminal 2:

curl http://127.0.0.1:4310/health
curl http://127.0.0.1:4310/version

curl -i http://127.0.0.1:4310/ready

curl -H "X-Control-Api-Key: dev-local-control-api-key" \
  http://127.0.0.1:4310/ready
Commit Message
feat: add control api auth boundary

