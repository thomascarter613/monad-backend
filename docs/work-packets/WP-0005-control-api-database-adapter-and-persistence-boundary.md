
WP-0005: Control API Database Adapter and Persistence Boundary
Epic

Control Plane Foundation

Objective

Add a PostgreSQL-backed persistence boundary for the Control API while preserving the existing route-level service boundary.

Scope

This work packet adds:

database-backed control-plane repository
configurable Control API store mode
PostgreSQL schema validation command
database health/readiness support
Control API docs for persistence
package boundary between services/control-api and packages/database
Explicit Non-Scope

This work packet does not add:

authentication
authorization
provisioning
backup orchestration
secret management
admin dashboard
CLI
pagination
idempotency keys
OpenTelemetry instrumentation
database transaction unit-of-work abstraction
Store Modes
CONTROL_API_STORE_MODE=memory
CONTROL_API_STORE_MODE=database

memory remains the default.

database requires:

CONTROL_PLANE_DATABASE_URL
Acceptance Criteria
The Control API still runs with the memory store.
The Control API can be configured to use the database store.
The database store lives behind the same ControlPlaneStore interface.
Route handlers do not contain SQL.
SQL access lives in packages/database.
A schema validation command exists.
bun run control-api:check passes without requiring Supabase.
bun run control-api:db:check validates the platform schema when Supabase is running.
Docs explain the persistence boundary.
Validation Commands

Always run:

bun install
bun run control-api:check
bun run check

When Supabase is running:

bun run supabase:start
bun run supabase:reset
CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
bun run control-api:db:check
Commit Message
feat: add control api database adapter

