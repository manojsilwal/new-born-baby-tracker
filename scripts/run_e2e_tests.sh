#!/usr/bin/env bash
set -e

# scripts/run_e2e_tests.sh
# End-to-end test runner for Newborn Tracker with mock PostgreSQL database.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PARENT_DIR="$(cd "${REPO_DIR}/.." && pwd)"

VENV_PYTHON="${PARENT_DIR}/.venv/bin/python"
VENV_PYTEST="${PARENT_DIR}/.venv/bin/pytest"
MOCK_PORT=54321

echo "=========================================================="
echo "👶 Newborn Tracker — E2E Test Suite with Mock Database"
echo "=========================================================="
echo "Target: fincrawler-postgres-1 on localhost:5432 (baby_tracker_test)"
echo ""

# Step 1: Initialize Database
echo "==> [1/4] Provisioning isolated test database & schema..."
"${VENV_PYTHON}" "${REPO_DIR}/scripts/setup_test_db.py"

# Step 2: Run Pytest E2E Suite
echo ""
echo "==> [2/4] Running Python E2E & Caregiver Sync Test Suite..."
"${VENV_PYTEST}" "${REPO_DIR}/tests" -v

# Step 3: Start Mock PostgREST Sync Server in Background
echo ""
echo "==> [3/4] Starting Mock Supabase PostgREST Sync Server on port ${MOCK_PORT}..."
export MOCK_SERVER_PORT="${MOCK_PORT}"
"${VENV_PYTHON}" "${REPO_DIR}/scripts/run_mock_server.py" &
SERVER_PID=$!

# Ensure server is stopped when script exits
cleanup() {
  echo ""
  echo "==> Cleaning up background mock server (PID: ${SERVER_PID})..."
  kill "${SERVER_PID}" 2>/dev/null || true
}
trap cleanup EXIT

# Wait for server health
echo "Waiting for mock server to be ready on http://127.0.0.1:${MOCK_PORT}/health..."
for i in {1..30}; do
  if curl -s "http://127.0.0.1:${MOCK_PORT}/health" > /dev/null 2>&1; then
    echo "Mock server is ready and connected to PostgreSQL!"
    break
  fi
  sleep 0.5
done

# Step 4: Run Playwright E2E Suite
echo ""
echo "==> [4/4] Executing Playwright E2E Suite..."
export MOCK_SERVER_URL="http://127.0.0.1:${MOCK_PORT}"
export PATH="/usr/local/bin:/opt/homebrew/bin:${PATH}"

cd "${REPO_DIR}"
npx playwright test --config=playwright.config.ts

echo ""
echo "=========================================================="
echo "✅ All E2E tests and mock DB validations completed!"
echo "=========================================================="
