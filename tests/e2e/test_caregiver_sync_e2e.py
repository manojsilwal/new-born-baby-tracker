# tests/e2e/test_caregiver_sync_e2e.py
from datetime import datetime, timezone, timedelta
from tests.db.seed_fixtures import generate_realistic_newborn_state

def merge_states_e2e(local_state, remote_state):
    """
    Python equivalent of the TypeScript mergeStates function in src/utils/supabaseSync.ts.
    Merges feeds, diapers, sleepSessions, temperatures, growthRecords, appointments, and healthNotes.
    """
    merged = dict(local_state)

    def merge_lists(local_list, remote_list):
        items_by_id = {}
        for item in remote_list or []:
            items_by_id[item["id"]] = item
        for item in local_list or []:
            items_by_id[item["id"]] = item
        return list(items_by_id.values())

    merged["feeds"] = merge_lists(local_state.get("feeds", []), remote_state.get("feeds", []))
    merged["diapers"] = merge_lists(local_state.get("diapers", []), remote_state.get("diapers", []))
    merged["sleepSessions"] = merge_lists(local_state.get("sleepSessions", []), remote_state.get("sleepSessions", []))
    merged["temperatures"] = merge_lists(local_state.get("temperatures", []), remote_state.get("temperatures", []))
    merged["growthRecords"] = merge_lists(local_state.get("growthRecords", []), remote_state.get("growthRecords", []))
    merged["appointments"] = merge_lists(local_state.get("appointments", []), remote_state.get("appointments", []))
    merged["healthNotes"] = merge_lists(local_state.get("healthNotes", []), remote_state.get("healthNotes", []))

    # Profile & settings prefer the most recent updatedAt
    local_time = local_state.get("updatedAt", "")
    remote_time = remote_state.get("updatedAt", "")
    if remote_time > local_time:
        merged["profile"] = remote_state.get("profile", local_state.get("profile"))
        merged["updatedAt"] = remote_time
    else:
        merged["updatedAt"] = local_time

    return merged

def test_multi_caregiver_dual_device_sync(api_client, clean_db):
    family_code = "maya-lin-caregivers"
    base_state = generate_realistic_newborn_state("Maya Lin", days_old=14)
    base_state["feeds"] = []
    base_state["diapers"] = []

    now = datetime.now(timezone.utc)

    # Step 1: Mom (Caregiver 1) initializes family and logs Feed 1
    feed_mom = {
        "id": "feed-mom-10am",
        "feedType": "nursing",
        "leftDurationMinutes": 15,
        "rightDurationMinutes": 10,
        "startTime": (now - timedelta(minutes=45)).isoformat(),
        "notes": "Mom logged nursing session."
    }
    state_mom = dict(base_state)
    state_mom["feeds"] = [feed_mom]
    state_mom["updatedAt"] = (now - timedelta(minutes=40)).isoformat()

    res_mom = api_client.post("/rest/v1/baby_tracker_families", json={
        "family_code": family_code,
        "state_data": state_mom,
        "updated_at": state_mom["updatedAt"]
    })
    assert res_mom.status_code == 201

    # Step 2: Dad (Caregiver 2) opens app with the same family code and pulls state
    fetch_dad = api_client.get(f"/rest/v1/baby_tracker_families?select=*&family_code=eq.{family_code}")
    assert fetch_dad.status_code == 200
    dad_remote = fetch_dad.json()[0]["state_data"]
    assert len(dad_remote["feeds"]) == 1
    assert dad_remote["feeds"][0]["id"] == "feed-mom-10am"

    # Step 3: Dad logs a diaper change on his device
    diaper_dad = {
        "id": "diaper-dad-1015am",
        "status": "both",
        "pooColor": "mustard_yellow",
        "hasRash": False,
        "timestamp": (now - timedelta(minutes=25)).isoformat(),
        "notes": "Dad changed diaper after feeding."
    }
    state_dad = dict(dad_remote)
    state_dad["diapers"] = [diaper_dad]
    state_dad["updatedAt"] = (now - timedelta(minutes=20)).isoformat()

    # Dad syncs his updated state
    res_dad_sync = api_client.post("/rest/v1/baby_tracker_families", json={
        "family_code": family_code,
        "state_data": state_dad,
        "updated_at": state_dad["updatedAt"]
    })
    assert res_dad_sync.status_code == 201

    # Step 4: Mom's app triggers auto-sync / background poll
    fetch_mom = api_client.get(f"/rest/v1/baby_tracker_families?select=*&family_code=eq.{family_code}")
    assert fetch_mom.status_code == 200
    server_state = fetch_mom.json()[0]["state_data"]

    # Mom merges local state with server state
    mom_final_state = merge_states_e2e(state_mom, server_state)

    # Verification: Both Mom and Dad's logs exist in the merged state
    feed_ids = [f["id"] for f in mom_final_state["feeds"]]
    diaper_ids = [d["id"] for d in mom_final_state["diapers"]]

    assert "feed-mom-10am" in feed_ids, "Mom's nursing log must be preserved"
    assert "diaper-dad-1015am" in diaper_ids, "Dad's diaper log must be synchronized"
    assert mom_final_state["profile"]["name"] == "Maya Lin"
