#!/usr/bin/env python3
"""
scripts/setup_test_db.py
Provisions an isolated test database (baby_tracker_test) in the local PostgreSQL container
(fincrawler-postgres-1 on localhost:5432), verifies roles, and initializes the baby_tracker_families schema.
"""

import sys
import argparse
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_HOST = "127.0.0.1"
DB_PORT = 5432
TARGET_DB = "baby_tracker_test"

# Fallback credentials to probe
CREDENTIAL_CANDIDATES = [
    ("postgres", "postgres", "postgres"),
    ("manojsilwal", "tradetalk", "postgres"),
    ("postgres", "", "postgres"),
]

def get_admin_connection():
    for user, pwd, db in CREDENTIAL_CANDIDATES:
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=user,
                password=pwd,
                dbname=db,
                connect_timeout=3
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            return conn, user, pwd
        except Exception:
            continue
    raise ConnectionError(f"Could not connect to PostgreSQL on {DB_HOST}:{DB_PORT} using default credentials.")

def setup_database(reset=False):
    print(f"Connecting to PostgreSQL on {DB_HOST}:{DB_PORT}...")
    admin_conn, user, pwd = get_admin_connection()
    cur = admin_conn.cursor()

    # Ensure postgres role exists
    cur.execute("SELECT 1 FROM pg_roles WHERE rolname='postgres';")
    if not cur.fetchone():
        cur.execute("CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'postgres';")
        print("Created role 'postgres' with password 'postgres'.")
    else:
        cur.execute("ALTER ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'postgres';")

    if reset:
        print(f"Resetting database '{TARGET_DB}'...")
        # Terminate existing connections to target db
        cur.execute(f"""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '{TARGET_DB}' AND pid <> pg_backend_pid();
        """)
        cur.execute(f"DROP DATABASE IF EXISTS {TARGET_DB};")

    # Check if database exists
    cur.execute(f"SELECT 1 FROM pg_database WHERE datname='{TARGET_DB}';")
    if not cur.fetchone():
        cur.execute(f"CREATE DATABASE {TARGET_DB} OWNER postgres;")
        print(f"Created dedicated test database '{TARGET_DB}'.")
    else:
        print(f"Test database '{TARGET_DB}' exists.")

    admin_conn.close()

    # Connect to target db and create schema
    target_conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user="postgres",
        password="postgres",
        dbname=TARGET_DB
    )
    tcur = target_conn.cursor()
    tcur.execute("""
        CREATE TABLE IF NOT EXISTS baby_tracker_families (
            family_code TEXT PRIMARY KEY,
            state_data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_baby_tracker_families_updated_at ON baby_tracker_families(updated_at);
    """)
    target_conn.commit()
    tcur.close()
    target_conn.close()

    print(f"Schema initialized successfully in database '{TARGET_DB}'.")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Setup mock test database for Newborn Tracker")
    parser.add_argument("--reset", action="store_true", help="Drop and recreate test database")
    args = parser.parse_args()

    try:
        setup_database(reset=args.reset)
        sys.exit(0)
    except Exception as err:
        print(f"Error during setup: {err}", file=sys.stderr)
        sys.exit(1)
