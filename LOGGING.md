# Logging & Rotation

- Docker daemon rotation enabled via `/etc/docker/daemon.json`:
  ```json
  { "log-driver": "json-file", "log-opts": { "max-size": "50m", "max-file": "5" } }
  ```
  Apply with `sudo systemctl reload docker && sudo systemctl restart docker` (expect containers to auto-restart).
- Service logs: `docker compose -f infra/docker-compose.prod.yml logs -f backend frontend scheduler admin-bot backup`.
- Netdata surfaces container-level CPU/mem/disk and can fire Telegram alerts (see `infra/netdata/health_alarm_notify.conf` placeholders).
 - Sentry (self-hosted) captures application errors; DSN placeholders wired in backend/frontend env vars. UI доступен на `http://<host>:9000` (без nginx proxy), health: `/_health/`. Для curl проверок используйте `--http1.0` или заголовок `Connection: close` (uwsgi не отправляет `Content-Length`).
- Log retention: Docker keeps up to 5x50MB per container; backups of logs are not stored—export via `docker logs <id> > file` before pruning if needed.
- SSH protection: fail2ban enabled with sshd jail (maxretry=6, findtime=15m, bantime=30m, ignore CI networks).
