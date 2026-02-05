# Infrastructure & Container Hardening

## Containers
- Run as non-root (backend/front already configured). Bots should also run as non-root; set `USER app` in Dockerfiles when rebuilding.
- Add resource limits in compose/k8s: `cpu: 0.5-1`, `mem: 512-1024Mi` per service; enable `read_only: true` where possible.
- Image signing: sign built images with cosign (`cosign sign --key cosign.key <image>`); verify on deploy.
- Vulnerability scan: `trivy image` on each build; fail on HIGH/CRITICAL.

## Networking
- Expose only nginx to public; keep db/redis internal.
- Enable service-level network policies (if k8s) or compose `networks` isolation.

## Secrets
- Use Docker/compose env files from secret store; never bake into image.

## Deploy
- Prefer pull by digest, not `latest`.
- Use rolling deploy or blue/green; ensure healthchecks gate traffic.

## Logging
- Use JSON logs; set docker logging driver to syslog/loki if available.

