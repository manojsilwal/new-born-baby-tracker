# tests/conftest.py
import sys
import os
import pytest
from httpx import Client
from fastapi.testclient import TestClient

repo_root = os.path.dirname(os.path.abspath(__file__))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

parent_dir = os.path.dirname(repo_root)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from tests.db.db_client import truncate_tables, insert_family_record, get_family_record, get_db_connection
from tests.db.seed_fixtures import generate_realistic_newborn_state
from tests.mock_server.server import app

@pytest.fixture(scope="session", autouse=True)
def ensure_db_ready():
    # Make sure we can connect to baby_tracker_test
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS baby_tracker_families (
                family_code TEXT PRIMARY KEY,
                state_data JSONB NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """)
        conn.commit()
        conn.close()
    except Exception as e:
        pytest.fail(f"Could not connect to PostgreSQL test database 'baby_tracker_test': {e}")

@pytest.fixture
def clean_db():
    truncate_tables()
    yield
    truncate_tables()

@pytest.fixture
def api_client():
    return TestClient(app)

@pytest.fixture
def seeded_family(clean_db):
    state = generate_realistic_newborn_state("Maya Lin", days_old=21)
    record = insert_family_record("maya-test-family", state)
    return record
