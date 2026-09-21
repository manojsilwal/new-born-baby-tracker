# tests/db/db_client.py
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict, Any, List

TEST_DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 5432,
    "user": "postgres",
    "password": "postgres",
    "dbname": "baby_tracker_test"
}

def get_db_connection():
    return psycopg2.connect(**TEST_DB_CONFIG)

def truncate_tables():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("TRUNCATE TABLE baby_tracker_families;")
        conn.commit()

def insert_family_record(family_code: str, state_data: Dict[str, Any], updated_at: Optional[str] = None):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if updated_at:
                cur.execute("""
                    INSERT INTO baby_tracker_families (family_code, state_data, updated_at)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (family_code) DO UPDATE
                    SET state_data = EXCLUDED.state_data, updated_at = EXCLUDED.updated_at
                    RETURNING family_code, state_data, updated_at;
                """, (family_code.lower().strip(), json.dumps(state_data), updated_at))
            else:
                cur.execute("""
                    INSERT INTO baby_tracker_families (family_code, state_data, updated_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (family_code) DO UPDATE
                    SET state_data = EXCLUDED.state_data, updated_at = NOW()
                    RETURNING family_code, state_data, updated_at;
                """, (family_code.lower().strip(), json.dumps(state_data)))
            row = cur.fetchone()
        conn.commit()
        return dict(row) if row else None

def get_family_record(family_code: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT family_code, state_data, updated_at
                FROM baby_tracker_families
                WHERE family_code = %s;
            """, (family_code.lower().strip(),))
            row = cur.fetchone()
            if row:
                res = dict(row)
                if isinstance(res["updated_at"], object):
                    res["updated_at"] = res["updated_at"].isoformat()
                return res
            return None

def list_family_codes() -> List[str]:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT family_code FROM baby_tracker_families ORDER BY updated_at DESC;")
            return [r[0] for r in cur.fetchall()]
