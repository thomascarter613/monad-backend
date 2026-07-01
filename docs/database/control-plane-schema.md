# Control-Plane Schema

## Status

Initial implementation added in WP-0003.

## Schema namespace

```sql
platform
```

## Tables

```txt
organizations
organization_memberships
projects
project_environments
runtime_instances
runtime_services
deployments
deployment_events
secrets
secret_versions
backup_plans
backups
restore_jobs
audit_events
usage_events
quota_limits
api_keys
webhooks
```

## Migration

The initial migration is:

- [`../../supabase/migrations/20260701213000_init_control_plane_schema.sql`](../../supabase/migrations/20260701213000_init_control_plane_schema.sql)

## Tests

The initial pgTAP test file is:

- [`../../supabase/tests/01_control_plane_schema.pgtap.sql`](../../supabase/tests/01_control_plane_schema.pgtap.sql)

## Local commands

```bash
bun run control-plane:check
bun run supabase:reset
bun run supabase:test
```

## Production rule

The control-plane schema is allowed to run inside the local Supabase
development database for early implementation speed.

In production, this schema should run in a dedicated control-plane Postgres
database that is backed up, monitored, secured, and upgraded independently
from customer runtime databases.
