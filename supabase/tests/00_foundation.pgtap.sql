begin;

select plan(7);

select has_table('public', 'runtime_metadata', 'runtime_metadata table exists');
select has_column('public', 'runtime_metadata', 'id', 'runtime_metadata.id exists');
select has_column('public', 'runtime_metadata', 'key', 'runtime_metadata.key exists');
select has_column('public', 'runtime_metadata', 'value', 'runtime_metadata.value exists');
select has_function('public', 'set_updated_at', 'set_updated_at trigger function exists');
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.runtime_metadata'::regclass
  ),
  'runtime_metadata has row level security enabled'
);
select ok(
  exists (
    select 1
    from public.runtime_metadata
    where key = 'runtime.template.name'
  ),
  'runtime metadata seed row exists'
);

select * from finish();

rollback;
