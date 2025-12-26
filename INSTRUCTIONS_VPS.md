Инструкции для восстановления backend/admin-bot (VPS)

1) Исправить отступы в /root/brace__1/packages/backend/src/brace_backend/core/config.py
   Выполнить на VPS (важно: без ведущих пробелов перед python3):
   python3 - <<'PY'
from pathlib import Path
import re

p = Path('/root/brace__1/packages/backend/src/brace_backend/core/config.py')
lines = p.read_text().splitlines()
indents = []
for line in lines:
    if not line.strip():
        continue
    m = re.match(r'^( +)', line)
    indents.append(len(m.group(1)) if m else 0)

min_indent = min(indents) if indents else 0
if min_indent > 0:
    lines = [line[min_indent:] if len(line) >= min_indent else '' for line in lines]
    p.write_text('\n'.join(lines) + '\n')
    print('fixed indent', min_indent)
else:
    print('indent ok')
PY

2) Пересобрать и перезапустить backend и admin-bot:
   docker compose -f /root/brace__1/infra/docker-compose.prod.yml up -d --build backend admin-bot

3) Проверить состояние и здоровье:
   docker compose -f /root/brace__1/infra/docker-compose.prod.yml ps
   curl -s http://127.0.0.1:8000/api/health

4) Если все еще unhealthy, снять логи:
   docker logs --tail=200 infra-backend-1
   docker logs --tail=200 infra-admin-bot-1
