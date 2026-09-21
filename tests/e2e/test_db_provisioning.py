# tests/e2e/test_db_provisioning.py
import json
from tests.db.db_client import (
    get_db_connection,
    truncate_tables,
    insert_family_record,
    get_family_record,
    list_family_codes,
)
from tests.db.seed_fixtures import generate_realistic_newborn_state

def test_postgres_connection_and_table_schema():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'baby_tracker_families'
        ORDER BY ordinal_position;
    """)
    columns = {r[0]: (r[1], r[2]) for r in cur.fetchall()}
    conn.close()

    assert "family_code" in columns, "family_code column should exist"
    assert "state_data" in columns, "state_data column should exist"
    assert "updated_at" in columns, "updated_at column should exist"
    assert columns["state_data"][0] == "jsonb", "state_data must be JSONB"

def test_insert_and_retrieve_family_record(clean_db):
    state = generate_realistic_newborn_state("Maya Lin", days_old=14)
    code = "maya-family-4821"

    # Insert into mock db
    inserted = insert_family_record(code, state)
    assert inserted is not None
    assert inserted["family_code"] == code

    # Retrieve from mock db
    fetched = get_family_record(code)
    assert fetched is not None
    assert fetched["family_code"] == code
    assert fetched["state_data"]["profile"]["name"] == "Maya Lin"
    assert len(fetched["state_data"]["feeds"]) == 2
    assert len(fetched["state_data"]["diapers"]) == 2

def test_upsert_merge_on_conflict(clean_db):
    state1 = generate_realistic_newborn_state("Baby Alex", days_old=5)
    code = "alex-family"

    insert_family_record(code, state1)
    record1 = get_family_record(code)

    # Modify state (e.g. add a 3rd feed)
    state2 = dict(state1)
    state2["feeds"].append({
        "id": "feed-new-3",
        "feedType": "bottle",
        "amountOz": 4.0,
        "startTime": "2026-09-20T12:00:00Z"
    })

    # Upsert with updated state
    insert_family_record(code, state2)
    record2 = get_family_record(code)

    assert len(record2["state_data"]["feeds"]) == 3
    # Check that family codes list has only 1 entry
    codes = list_family_codes()
    assert codes == ["alex-family"]
