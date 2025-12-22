.PHONY: backend-install backend-test frontend-install frontend-build docker-up docker-down docker-logs smoke lint

backend-install:
	cd packages/backend && poetry install

backend-test:
	cd packages/backend && poetry run pytest

analytics-test:
	cd packages/backend && poetry run pytest tests/test_analytics_ingest.py tests/test_analytics_schema.py

frontend-install:
	cd packages/frontend && npm install

frontend-build:
	cd packages/frontend && npm run build

docker-up:
	docker compose -f infra/docker-compose.prod.yml up --build -d

docker-down:
	docker compose -f infra/docker-compose.prod.yml down -v --remove-orphans

docker-logs:
	docker compose -f infra/docker-compose.prod.yml logs -f backend frontend

smoke:
	./scripts/run-smoke.sh

lint:
	cd packages/backend && poetry run ruff check
	cd packages/frontend && npm run lint

seed:
	cd packages/backend && poetry run python -m brace_backend.services.seed
