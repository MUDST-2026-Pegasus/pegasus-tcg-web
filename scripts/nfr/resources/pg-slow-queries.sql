SELECT queryid,
       calls,
       round(total_exec_time::numeric, 2) AS total_exec_ms,
       round(mean_exec_time::numeric, 2) AS mean_exec_ms,
       rows,
       round(rows::numeric / greatest(calls, 1), 2) AS rows_per_call,
       shared_blks_read,
       shared_blks_hit,
       left(query, 1000) AS normalized_query
FROM pg_stat_statements
WHERE calls > 0
ORDER BY total_exec_time DESC
LIMIT 50;
