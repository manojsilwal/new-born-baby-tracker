#!/usr/bin/env python3
"""
scripts/run_mock_server.py
Launches the Mock Supabase PostgREST sync server on 127.0.0.1:54321 backed by PostgreSQL (baby_tracker_test).
"""

import sys
import os

# Add repo root to python path
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("MOCK_SERVER_PORT", "54321"))
    print(f"Starting Mock Supabase PostgREST server on http://127.0.0.1:{port}...")
    uvicorn.run("tests.mock_server.server:app", host="127.0.0.1", port=port, log_level="info")
