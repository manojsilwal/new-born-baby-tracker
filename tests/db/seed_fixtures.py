# tests/db/seed_fixtures.py
from datetime import datetime, timedelta, timezone

def generate_realistic_newborn_state(baby_name="Maya Lin", days_old=21):
    now = datetime.now(timezone.utc)
    birth_date = (now - timedelta(days=days_old)).strftime("%Y-%m-%d")

    iso_now = now.isoformat()
    t_minus_1h = (now - timedelta(hours=1)).isoformat()
    t_minus_3h = (now - timedelta(hours=3)).isoformat()
    t_minus_4h = (now - timedelta(hours=4)).isoformat()
    t_minus_6h = (now - timedelta(hours=6)).isoformat()
    t_minus_8h = (now - timedelta(hours=8)).isoformat()

    return {
        "version": 1,
        "profile": {
            "name": baby_name,
            "birthDate": birth_date,
            "birthTime": "08:15",
            "birthWeightOz": 128,  # 8 lbs 0 oz
            "birthLengthIn": 20.0,
            "pediatrician": "Dr. Sarah Adams, MD (Northwestern Pediatrics)",
            "notes": "Healthy term delivery at 39 weeks."
        },
        "settings": {
            "theme": "light",
            "bottleUnit": "oz",
            "temperatureUnit": "F",
            "weightUnit": "lb_oz",
            "lengthUnit": "in",
            "headUnit": "in",
            "enableSound": True,
            "enableVibration": True,
            "familySyncCode": "maya-test-family",
            "lastSyncedAt": iso_now
        },
        "feeds": [
            {
                "id": "feed-test-1",
                "feedType": "nursing",
                "leftDurationMinutes": 15,
                "rightDurationMinutes": 12,
                "startTime": t_minus_3h,
                "endTime": (now - timedelta(hours=2, minutes=33)).isoformat(),
                "notes": "Good latch on both sides."
            },
            {
                "id": "feed-test-2",
                "feedType": "bottle",
                "bottleContent": "breastMilk",
                "amountOz": 3.5,
                "amountMl": 103.5,
                "startTime": t_minus_6h,
                "notes": "Dad gave bottle, finished all."
            }
        ],
        "diapers": [
            {
                "id": "diaper-test-1",
                "status": "wet",
                "timestamp": t_minus_1h,
                "hasRash": False,
                "notes": "Heavy wet diaper"
            },
            {
                "id": "diaper-test-2",
                "status": "both",
                "timestamp": t_minus_4h,
                "pooColor": "mustard_yellow",
                "pooConsistency": "seedy",
                "hasRash": False,
                "notes": "Normal newborn stool"
            }
        ],
        "sleepSessions": [
            {
                "id": "sleep-test-1",
                "startTime": t_minus_8h,
                "endTime": t_minus_6h,
                "durationMinutes": 120,
                "location": "bassinet",
                "notes": "Swaddled, slept soundly."
            }
        ],
        "temperatures": [
            {
                "id": "temp-test-1",
                "temperatureF": 98.6,
                "temperatureC": 37.0,
                "location": "axillary",
                "timestamp": t_minus_4h,
                "notes": "Routine morning check, normal."
            }
        ],
        "growthRecords": [
            {
                "id": "growth-test-1",
                "date": birth_date,
                "weightLbs": 8.0,
                "weightOz": 0.0,
                "weightKg": 3.63,
                "lengthInches": 20.0,
                "lengthCm": 50.8,
                "headCircInches": 13.8,
                "headCircCm": 35.0,
                "notes": "Birth vitals"
            },
            {
                "id": "growth-test-2",
                "date": (now - timedelta(days=7)).strftime("%Y-%m-%d"),
                "weightLbs": 8.0,
                "weightOz": 8.0,
                "weightKg": 3.86,
                "lengthInches": 20.5,
                "lengthCm": 52.0,
                "headCircInches": 14.0,
                "headCircCm": 35.6,
                "notes": "2-week pediatrician checkup"
            }
        ],
        "appointments": [
            {
                "id": "apt-test-1",
                "title": "1-Month Well-Baby Checkup",
                "providerName": "Dr. Sarah Adams",
                "clinicLocation": "Northwestern Pediatrics, Suite 400",
                "datetime": (now + timedelta(days=9)).strftime("%Y-%m-%d") + "T10:30:00",
                "completed": False,
                "notes": "Check weight gain and discuss sleep schedule."
            }
        ],
        "healthNotes": [
            {
                "id": "note-test-1",
                "timestamp": t_minus_8h,
                "title": "Cord Care",
                "content": "Umbilical cord stump fell off cleanly today.",
                "category": "milestone"
            }
        ],
        "activeTimer": None,
        "updatedAt": iso_now
    }
