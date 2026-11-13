SELECT json_build_object(
  'captured_at', now(),
  'connections', (SELECT json_build_object(
    'active', count(*) FILTER (WHERE state = 'active'),
    'idle', count(*) FILTER (WHERE state = 'idle'),
    'waiting', count(*) FILTER (WHERE wait_event IS NOT NULL),
    'total', count(*)
  ) FROM pg_stat_activity WHERE backend_type = 'client backend'),
  'locks', (SELECT json_build_object('waiting', count(*) FILTER (WHERE NOT granted), 'total', count(*)) FROM pg_locks),
  'deadlocks', (SELECT coalesce(sum(deadlocks), 0) FROM pg_stat_database),
  'transactions', (SELECT json_build_object('commits', coalesce(sum(xact_commit),0), 'rollbacks', coalesce(sum(xact_rollback),0)) FROM pg_stat_database),
  'pg_stat_statements_available', to_regclass('public.pg_stat_statements') IS NOT NULL
)::text;
