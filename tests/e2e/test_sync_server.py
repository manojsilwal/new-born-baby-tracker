# tests/e2e/test_sync_server.py
from tests.db.seed_fixtures import generate_realistic_newborn_state

def test_health_check(api_client):
    response = api_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "baby_tracker_test"

def test_get_families_empty(api_client, clean_db):
    response = api_client.get("/rest/v1/baby_tracker_families?select=*&family_code=eq.nonexistent")
    assert response.status_code == 200
    assert response.json() == []

def test_post_upsert_family(api_client, clean_db):
    state = generate_realistic_newborn_state("Maya", days_old=10)
    payload = {
        "family_code": "maya-e2e-sync",
        "state_data": state
    }
    headers = {"Prefer": "resolution=merge-duplicates"}
    response = api_client.post("/rest/v1/baby_tracker_families", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["family_code"] == "maya-e2e-sync"
    assert data["state_data"]["profile"]["name"] == "Maya"

    # Now verify via GET endpoint
    get_res = api_client.get("/rest/v1/baby_tracker_families?select=*&family_code=eq.maya-e2e-sync")
    assert get_res.status_code == 200
    results = get_res.json()
    assert len(results) == 1
    assert results[0]["family_code"] == "maya-e2e-sync"
    assert len(results[0]["state_data"]["feeds"]) == 2

def test_delete_family(api_client, clean_db):
    state = generate_realistic_newborn_state("Maya", days_old=10)
    payload = {
        "family_code": "maya-to-delete",
        "state_data": state
    }
    api_client.post("/rest/v1/baby_tracker_families", json=payload)

    # Delete
    del_res = api_client.delete("/rest/v1/baby_tracker_families?family_code=eq.maya-to-delete")
    assert del_res.status_code == 204

    # Verify deleted
    get_res = api_client.get("/rest/v1/baby_tracker_families?select=*&family_code=eq.maya-to-delete")
    assert get_res.status_code == 200
    assert get_res.json() == []

def test_reset_endpoint(api_client, seeded_family):
    # Ensure seeded
    res = api_client.get("/rest/v1/baby_tracker_families")
    assert len(res.json()) >= 1

    # Reset
    reset_res = api_client.post("/api/test/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["status"] == "success"

    # Verify empty
    res_after = api_client.get("/rest/v1/baby_tracker_families")
    assert len(res_after.json()) == 0
