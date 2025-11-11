.PHONY: backend-install backend-test frontend-install frontend-build docker-up docker-down lint

backend-install:
	cd packages/backend && poetry install

backend-test:
	cd packages/backend && poetry run pytest

frontend-install:
	cd packages/frontend && npm install

frontend-build:
	cd packages/frontend && npm run build

docker-up:
	docker compose -f infra/docker-compose.prod.yml up --build

docker-down:
	docker compose -f infra/docker-compose.prod.yml down -v

lint:
	cd packages/backend && poetry run ruff check
	cd packages/frontend && npm run lint
