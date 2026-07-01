
Control API Persistence Boundary
Purpose

WP-0005 adds the first database-backed persistence boundary for the Control API.

The goal is not to overbuild the data-access layer.

The goal is to keep HTTP routes stable while allowing the backing store to switch from in-memory to PostgreSQL.

Store Modes

The Control API supports two store modes.

Memory Store

The memory store is used for:

route tests
local API shape work
development without a running database
fast feedback

It is not durable.

Database Store

The database store is used for:

integration with the platform schema
durable organizations
durable projects
durable environments
durable audit events
future management API behavior
Configuration
CONTROL_API_STORE_MODE=database
CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
CONTROL_PLANE_DATABASE_SCHEMA=platform
CONTROL_PLANE_DATABASE_MAX=5
Boundary Rule

Routes should depend on the ControlPlaneStore interface.

Routes should not contain SQL.

SQL belongs in packages/database.

Current Database Tables Used

WP-0005 currently uses:

platform.organizations
platform.projects
platform.project_environments
platform.audit_events

Later work packets will add database access for:

runtime instances
runtime services
deployments
deployment events
secrets metadata
backup plans
backups
restore jobs
usage events
quota limits
API keys
webhooks
Validation

The schema check validates the required tables and columns for the current API skeleton.

CONTROL_PLANE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
bun run control-api:db:check
Design Doctrine
Keep HTTP route code thin.
Keep SQL outside the service route layer.
Keep the in-memory store for fast tests.
Make database mode explicit.
Do not add provisioning behavior yet.
Do not expose admin actions without audit events.
