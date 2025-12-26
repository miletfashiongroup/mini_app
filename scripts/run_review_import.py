from __future__ import annotations

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn
import psycopg

SQL_PATH = "/tmp/review_import.sql"


def split_sql(text: str) -> list[str]:
    stmts: list[str] = []
    buf: list[str] = []
    in_str = False
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == "'":
            if in_str:
                if i + 1 < len(text) and text[i + 1] == "'":
                    buf.append("''")
                    i += 2
                    continue
                in_str = False
                buf.append(ch)
                i += 1
                continue
            in_str = True
            buf.append(ch)
            i += 1
            continue
        if ch == ";" and not in_str:
            stmt = "".join(buf).strip()
            if stmt:
                stmts.append(stmt)
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        stmts.append(tail)
    return stmts


with open(SQL_PATH, "r", encoding="utf-8") as f:
    sql = f.read()

stmts = [s for s in split_sql(sql) if s.lower() not in ("begin", "commit")]
if not stmts:
    raise SystemExit("No SQL statements found")

dsn = ensure_sync_dsn(settings.database_url)
if dsn.startswith("postgresql+psycopg://"):
    dsn = dsn.replace("postgresql+psycopg://", "postgresql://", 1)
with psycopg.connect(dsn) as conn:
    with conn.cursor() as cur:
        for stmt in stmts:
            cur.execute(stmt)

print("import ok")
