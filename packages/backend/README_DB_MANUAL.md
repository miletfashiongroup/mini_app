# DB Manual Fixes (Production-safe)

Run these SQL snippets manually in pgAdmin/psql against the `brace_prod` database. They are idempotent and safe for production. No data loss.

```sql
-- Revoke temp table creation from PUBLIC (tighten security).
REVOKE TEMPORARY ON DATABASE brace_prod FROM PUBLIC;

-- Create dedicated app role (non-superuser).
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'brace_app') THEN
      CREATE ROLE brace_app LOGIN PASSWORD '***set-strong-password***';
   END IF;
END$$;

-- Grant minimal rights to the app role.
GRANT CONNECT ON DATABASE brace_prod TO brace_app;
GRANT TEMPORARY ON DATABASE brace_prod TO brace_app;
-- Schema/table grants are applied by Alembic after migrations; ensure default schema ownership:
ALTER SCHEMA public OWNER TO user1;
GRANT USAGE ON SCHEMA public TO brace_app;
GRANT CREATE ON SCHEMA public TO user1;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO brace_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO brace_app;
ALTER DEFAULT PRIVILEGES FOR ROLE user1 IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO brace_app;
ALTER DEFAULT PRIVILEGES FOR ROLE user1 IN SCHEMA public GRANT ALL ON SEQUENCES TO brace_app;
```

Notes:
- Keep `user1` as owner; `brace_app` is the application login role used by SQLAlchemy.
- No need to recreate the DB unless you want to change locale.
