insert into public.runtime_metadata (key, value)
values
  (
    'runtime.template.name',
    jsonb_build_object(
      'name', 'Open Backend Cloud Runtime Template',
      'work_packet', 'WP-0002',
      'managed_by', 'open-backend-cloud'
    )
  ),
  (
    'runtime.template.purpose',
    jsonb_build_object(
      'purpose', 'Validate local Supabase runtime bootstrapping, migrations, seed data, tests, and type generation.',
      'runtime_plane', 'Supabase OSS',
      'control_plane', 'Open Backend Cloud'
    )
  )
on conflict (key) do update
set value = excluded.value,
    updated_at = now();
