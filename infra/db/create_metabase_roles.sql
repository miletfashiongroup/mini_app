-- Запускать от имени пользователя с CREATEROLE + CREATEDB
-- Создание роли для Metabase (внутренняя БД)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'metabase_app') THEN
    CREATE ROLE metabase_app LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
  END IF;
END $$;

-- Создание read-only роли для аналитики
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'metabase_ro') THEN
    CREATE ROLE metabase_ro LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
  END IF;
END $$;

-- Внутренняя БД Metabase
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'metabase_prod') THEN
    CREATE DATABASE metabase_prod OWNER metabase_app;
  END IF;
END $$;

-- Read-only доступ к аналитике
GRANT CONNECT ON DATABASE brace_prod TO metabase_ro;
\connect brace_prod
GRANT USAGE ON SCHEMA public TO metabase_ro;
GRANT SELECT ON TABLE analytics_events TO metabase_ro;
GRANT SELECT ON TABLE analytics_daily_metrics TO metabase_ro;
GRANT SELECT ON TABLE analytics_reports TO metabase_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metabase_ro;
