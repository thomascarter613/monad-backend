begin;

select plan(64);

select has_schema('platform', 'platform schema exists');

select ok(exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'platform' and t.typname = 'organization_role' and t.typtype = 'e'), 'organization_role enum exists');
select ok(exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'platform' and t.typname = 'environment_kind' and t.typtype = 'e'), 'environment_kind enum exists');
select ok(exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'platform' and t.typname = 'environment_status' and t.typtype = 'e'), 'environment_status enum exists');
select ok(exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'platform' and t.typname = 'runtime_status' and t.typtype = 'e'), 'runtime_status enum exists');
select ok(exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'platform' and t.typname = 'deployment_status' and t.typtype = 'e'), 'deployment_status enum exists');
select ok(exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'platform' and t.typname = 'backup_status' and t.typtype = 'e'), 'backup_status enum exists');
select ok(exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'platform' and t.typname = 'restore_status' and t.typtype = 'e'), 'restore_status enum exists');
select ok(exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'platform' and t.typname = 'secret_provider' and t.typtype = 'e'), 'secret_provider enum exists');
select ok(exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'platform' and t.typname = 'audit_actor_type' and t.typtype = 'e'), 'audit_actor_type enum exists');
select ok(exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'platform' and t.typname = 'webhook_status' and t.typtype = 'e'), 'webhook_status enum exists');
select ok(exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'platform' and t.typname = 'quota_period' and t.typtype = 'e'), 'quota_period enum exists');

select has_table('platform', 'organizations', 'organizations table exists');
select has_table('platform', 'organization_memberships', 'organization_memberships table exists');
select has_table('platform', 'projects', 'projects table exists');
select has_table('platform', 'project_environments', 'project_environments table exists');
select has_table('platform', 'runtime_instances', 'runtime_instances table exists');
select has_table('platform', 'runtime_services', 'runtime_services table exists');
select has_table('platform', 'deployments', 'deployments table exists');
select has_table('platform', 'deployment_events', 'deployment_events table exists');
select has_table('platform', 'secrets', 'secrets table exists');
select has_table('platform', 'secret_versions', 'secret_versions table exists');
select has_table('platform', 'backup_plans', 'backup_plans table exists');
select has_table('platform', 'backups', 'backups table exists');
select has_table('platform', 'restore_jobs', 'restore_jobs table exists');
select has_table('platform', 'audit_events', 'audit_events table exists');
select has_table('platform', 'usage_events', 'usage_events table exists');
select has_table('platform', 'quota_limits', 'quota_limits table exists');
select has_table('platform', 'api_keys', 'api_keys table exists');
select has_table('platform', 'webhooks', 'webhooks table exists');

select has_pk('platform', 'organizations', 'organizations has primary key');
select has_pk('platform', 'organization_memberships', 'organization_memberships has primary key');
select has_pk('platform', 'projects', 'projects has primary key');
select has_pk('platform', 'project_environments', 'project_environments has primary key');
select has_pk('platform', 'runtime_instances', 'runtime_instances has primary key');
select has_pk('platform', 'runtime_services', 'runtime_services has primary key');
select has_pk('platform', 'deployments', 'deployments has primary key');
select has_pk('platform', 'secrets', 'secrets has primary key');
select has_pk('platform', 'backups', 'backups has primary key');
select has_pk('platform', 'restore_jobs', 'restore_jobs has primary key');
select has_pk('platform', 'audit_events', 'audit_events has primary key');
select has_pk('platform', 'usage_events', 'usage_events has primary key');
select has_pk('platform', 'quota_limits', 'quota_limits has primary key');
select has_pk('platform', 'api_keys', 'api_keys has primary key');
select has_pk('platform', 'webhooks', 'webhooks has primary key');

select has_column('platform', 'projects', 'organization_id', 'projects belongs to organization');
select has_column('platform', 'project_environments', 'project_id', 'environments belong to projects');
select has_column('platform', 'runtime_instances', 'environment_id', 'runtime_instances belong to environments');
select has_column('platform', 'deployments', 'environment_id', 'deployments belong to environments');
select has_column('platform', 'backups', 'environment_id', 'backups belong to environments');
select has_column('platform', 'restore_jobs', 'target_environment_id', 'restore jobs target an environment');
select has_column('platform', 'secrets', 'external_ref', 'secrets store external references');
select has_column('platform', 'audit_events', 'action', 'audit events include action');
select has_column('platform', 'usage_events', 'metric_name', 'usage events include metric_name');
select has_column('platform', 'quota_limits', 'limit_quantity', 'quota limits include limit quantity');
select has_column('platform', 'api_keys', 'key_hash', 'api keys store key hash');
select has_column('platform', 'webhooks', 'event_filters', 'webhooks include event filters');

select ok(
  exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = any(c.conkey)
    where n.nspname = 'platform'
      and t.relname = 'projects'
      and a.attname = 'organization_id'
      and c.contype = 'f'
  ),
  'projects.organization_id has foreign key'
);
select ok(
  exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = any(c.conkey)
    where n.nspname = 'platform'
      and t.relname = 'project_environments'
      and a.attname = 'project_id'
      and c.contype = 'f'
  ),
  'project_environments.project_id has foreign key'
);
select ok(
  exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = any(c.conkey)
    where n.nspname = 'platform'
      and t.relname = 'runtime_instances'
      and a.attname = 'environment_id'
      and c.contype = 'f'
  ),
  'runtime_instances.environment_id has foreign key'
);
select ok(
  exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = any(c.conkey)
    where n.nspname = 'platform'
      and t.relname = 'runtime_services'
      and a.attname = 'runtime_instance_id'
      and c.contype = 'f'
  ),
  'runtime_services.runtime_instance_id has foreign key'
);
select ok(
  exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = any(c.conkey)
    where n.nspname = 'platform'
      and t.relname = 'deployments'
      and a.attname = 'environment_id'
      and c.contype = 'f'
  ),
  'deployments.environment_id has foreign key'
);
select ok(
  exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = any(c.conkey)
    where n.nspname = 'platform'
      and t.relname = 'secrets'
      and a.attname = 'organization_id'
      and c.contype = 'f'
  ),
  'secrets.organization_id has foreign key'
);

select ok(
  exists (
    select 1
    from pg_tables
    where schemaname = 'platform'
      and rowsecurity = true
  ),
  'at least one platform table has RLS enabled'
);

select finish();

rollback;
