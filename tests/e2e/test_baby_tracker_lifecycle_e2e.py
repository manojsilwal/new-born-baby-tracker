# tests/e2e/test_baby_tracker_lifecycle_e2e.py
from datetime import datetime, timezone, timedelta
from tests.db.seed_fixtures import generate_realistic_newborn_state

def test_24h_newborn_care_aggregation(seeded_family, api_client):
    family_code = seeded_family["family_code"]
    res = api_client.get(f"/rest/v1/baby_tracker_families?select=*&family_code=eq.{family_code}")
    assert res.status_code == 200
    state = res.json()[0]["state_data"]

    # Feeds breakdown
    feeds = state["feeds"]
    total_bottle_oz = sum(f.get("amountOz", 0) for f in feeds if f.get("feedType") == "bottle")
    nursing_sessions = [f for f in feeds if f.get("feedType") == "nursing"]
    total_nursing_mins = sum(f.get("leftDurationMinutes", 0) + f.get("rightDurationMinutes", 0) for f in nursing_sessions)

    assert total_bottle_oz == 3.5, "Bottle amount matches fixture"
    assert total_nursing_mins == 27, "15 min left + 12 min right = 27 min"

    # Diapers breakdown
    diapers = state["diapers"]
    wet_count = sum(1 for d in diapers if d.get("status") in ["wet", "both"])
    dirty_count = sum(1 for d in diapers if d.get("status") in ["dirty", "both"])

    assert wet_count == 2, "Both wet and 'both' count towards wet diapers"
    assert dirty_count == 1, "Only diaper-test-2 is dirty"

    # Sleep sessions
    sleep_sessions = state["sleepSessions"]
    total_sleep_minutes = sum(s.get("durationMinutes", 0) for s in sleep_sessions)
    assert total_sleep_minutes == 120, "120 minutes of sleep in fixture"

    # Growth milestones
    growth = state["growthRecords"]
    assert len(growth) == 2
    birth_record = growth[0]
    two_week_record = growth[1]

    # Weight gain check: 8 lbs 0 oz (128 oz) to 8 lbs 8 oz (136 oz)
    birth_oz = birth_record["weightLbs"] * 16 + birth_record["weightOz"]
    two_week_oz = two_week_record["weightLbs"] * 16 + two_week_record["weightOz"]
    weight_gain_oz = two_week_oz - birth_oz
    assert weight_gain_oz == 8.0, "Baby gained 8 oz between birth and 2-week checkup"
