# tests/mock_server/server.py
import json
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(title="Mock Supabase PostgREST Sync Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 5432,
    "user": "postgres",
    "password": "postgres",
    "dbname": "baby_tracker_test"
}

def get_conn():
    return psycopg2.connect(**DB_CONFIG)

class UpsertPayload(BaseModel):
    family_code: str
    state_data: Dict[str, Any]
    updated_at: Optional[str] = None

@app.get("/health")
def health():
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
        return {"status": "ok", "database": "baby_tracker_test", "backend": "fincrawler-postgres-1"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/rest/v1/baby_tracker_families")
def get_families(request: Request):
    # Parse query parameters: select=*&family_code=eq.maya-test
    family_code_param = request.query_params.get("family_code")
    if not family_code_param:
        with get_conn() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SELECT family_code, state_data, updated_at FROM baby_tracker_families ORDER BY updated_at DESC;")
                rows = cur.fetchall()
                results = []
                for r in rows:
                    item = dict(r)
                    if hasattr(item["updated_at"], "isoformat"):
                        item["updated_at"] = item["updated_at"].isoformat()
                    results.append(item)
                return results

    # eq.family_code format
    prefix = "eq."
    if family_code_param.startswith(prefix):
        clean_code = family_code_param[len(prefix):].lower().strip()
    else:
        clean_code = family_code_param.lower().strip()

    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT family_code, state_data, updated_at
                FROM baby_tracker_families
                WHERE LOWER(family_code) = %s;
            """, (clean_code,))
            row = cur.fetchone()
            if not row:
                return []
            item = dict(row)
            if hasattr(item["updated_at"], "isoformat"):
                item["updated_at"] = item["updated_at"].isoformat()
            return [item]

@app.post("/rest/v1/baby_tracker_families", status_code=status.HTTP_201_CREATED)
def upsert_family(payload: UpsertPayload, request: Request, response: Response):
    code = payload.family_code.lower().strip()
    state_json = json.dumps(payload.state_data)
    updated_at = payload.updated_at

    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            if updated_at:
                cur.execute("""
                    INSERT INTO baby_tracker_families (family_code, state_data, updated_at)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (family_code) DO UPDATE
                    SET state_data = EXCLUDED.state_data, updated_at = EXCLUDED.updated_at
                    RETURNING family_code, state_data, updated_at;
                """, (code, state_json, updated_at))
            else:
                cur.execute("""
                    INSERT INTO baby_tracker_families (family_code, state_data, updated_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT (family_code) DO UPDATE
                    SET state_data = EXCLUDED.state_data, updated_at = NOW()
                    RETURNING family_code, state_data, updated_at;
                """, (code, state_json))
            row = cur.fetchone()
        conn.commit()

    if not row:
        raise HTTPException(status_code=500, detail="Failed to upsert family record")

    item = dict(row)
    if hasattr(item["updated_at"], "isoformat"):
        item["updated_at"] = item["updated_at"].isoformat()
    return item

@app.delete("/rest/v1/baby_tracker_families", status_code=status.HTTP_204_NO_CONTENT)
def delete_family(request: Request):
    family_code_param = request.query_params.get("family_code")
    if not family_code_param:
        raise HTTPException(status_code=400, detail="family_code query parameter is required")

    prefix = "eq."
    if family_code_param.startswith(prefix):
        clean_code = family_code_param[len(prefix):].lower().strip()
    else:
        clean_code = family_code_param.lower().strip()

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM baby_tracker_families WHERE LOWER(family_code) = %s;", (clean_code,))
        conn.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# Test helper endpoints
@app.post("/api/test/reset")
def reset_test_data():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("TRUNCATE TABLE baby_tracker_families;")
        conn.commit()
    return {"status": "success", "message": "Truncated baby_tracker_families table."}

@app.get("/api/test/state/{family_code}")
def inspect_test_state(family_code: str):
    with get_conn() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT family_code, state_data, updated_at FROM baby_tracker_families WHERE LOWER(family_code) = %s;", (family_code.lower().strip(),))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Family not found")
            item = dict(row)
            if hasattr(item["updated_at"], "isoformat"):
                item["updated_at"] = item["updated_at"].isoformat()
            return item
