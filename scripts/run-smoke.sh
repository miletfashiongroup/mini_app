#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_BIN="${COMPOSE_BIN:-docker compose}"
COMPOSE_FILE="${ROOT_DIR}/infra/docker-compose.smoke.yml"

cleanup() {
  ${COMPOSE_BIN} -f "${COMPOSE_FILE}" down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

${COMPOSE_BIN} -f "${COMPOSE_FILE}" up --build --abort-on-container-exit
