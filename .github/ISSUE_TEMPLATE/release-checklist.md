---
name: Release Checklist
title: "Release: <version>"
labels: [release]
---

## Pre-release
- [ ] CI green on main
- [ ] DB backup completed
- [ ] Migrations reviewed

## Staging
- [ ] Images deployed to staging
- [ ] Smoke tests passed

## Production
- [ ] Backup taken immediately before deploy
- [ ] Deploy executed
- [ ] Alembic upgrade head
- [ ] Health checks 200 / key flows ok

## Rollback Plan
- [ ] Previous image tag recorded
- [ ] Latest dump path recorded
