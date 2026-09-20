// src/utils/mockData.ts
import { AppState } from '../types/tracker';
import { generateUUID } from './units';

export function createInitialMockState(): AppState {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
  const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now - d * 24 * 3600 * 1000).toISOString();
  const daysAhead = (d: number) => new Date(now + d * 24 * 3600 * 1000).toISOString();

  // Baby born 12 days ago
  const birthDate = new Date(now - 12 * 24 * 3600 * 1000).toISOString().split('T')[0];

  return {
    schemaVersion: 1,
    profile: {
      name: 'Baby Maya',
      birthDate,
    },
    settings: {
      theme: 'system',
      bottleUnit: 'oz',
      temperatureUnit: 'F',
      weightUnit: 'lb_oz',
      lengthUnit: 'in',
      headUnit: 'in',
    },
    activeTimers: {
      nursing: null,
      sleep: null,
    },
    events: [
      // 1. Feeding - 1 hour ago (Nursing)
      {
        id: generateUUID(),
        type: 'feeding',
        feedType: 'nursing',
        startTime: hoursAgo(1.2),
        endTime: hoursAgo(0.9),
        leftDurationSeconds: 600, // 10 min
        rightDurationSeconds: 480, // 8 min
        totalDurationSeconds: 1080, // 18 min
        lastActiveSide: 'right',
        note: 'Good latch on right side, seemed relaxed after feed',
        createdAt: hoursAgo(0.9),
        updatedAt: hoursAgo(0.9),
      },
      // 2. Diaper - 45 mins ago (Wet)
      {
        id: generateUUID(),
        type: 'diaper',
        timestamp: minutesAgo(45),
        hasPee: true,
        peeColor: 'pale-yellow',
        hasPoop: false,
        note: 'Quick change after morning feed',
        createdAt: minutesAgo(45),
        updatedAt: minutesAgo(45),
      },
      // 3. Sleep - 2.5 hours ago (Nap)
      {
        id: generateUUID(),
        type: 'sleep',
        startTime: hoursAgo(3.8),
        endTime: hoursAgo(2.2),
        durationSeconds: 5760, // 1h 36m
        note: 'Fell asleep in bassinet with white noise',
        createdAt: hoursAgo(2.2),
        updatedAt: hoursAgo(2.2),
      },
      // 4. Feeding - 4 hours ago (Bottle Expressed Milk)
      {
        id: generateUUID(),
        type: 'feeding',
        feedType: 'bottle',
        startTime: hoursAgo(4.1),
        endTime: hoursAgo(3.9),
        volumeMl: 75, // ~2.5 oz
        bottleType: 'expressed',
        note: 'Paced bottle feeding by partner',
        createdAt: hoursAgo(3.9),
        updatedAt: hoursAgo(3.9),
      },
      // 5. Diaper - 4.2 hours ago (Poop - Mustard yellow, seedy)
      {
        id: generateUUID(),
        type: 'diaper',
        timestamp: hoursAgo(4.2),
        hasPee: true,
        peeColor: 'pale-yellow',
        hasPoop: true,
        poopConsistency: 'seedy',
        poopColor: 'mustard-yellow',
        note: 'Typical breastfed stool consistency',
        createdAt: hoursAgo(4.2),
        updatedAt: hoursAgo(4.2),
      },
      // 6. Feeding - 7 hours ago (Nursing)
      {
        id: generateUUID(),
        type: 'feeding',
        feedType: 'nursing',
        startTime: hoursAgo(7.3),
        endTime: hoursAgo(6.9),
        leftDurationSeconds: 720, // 12 min
        rightDurationSeconds: 660, // 11 min
        totalDurationSeconds: 1380, // 23 min
        lastActiveSide: 'right',
        note: 'Burped twice easily',
        createdAt: hoursAgo(6.9),
        updatedAt: hoursAgo(6.9),
      },
      // 7. Diaper - 7.5 hours ago (Wet)
      {
        id: generateUUID(),
        type: 'diaper',
        timestamp: hoursAgo(7.5),
        hasPee: true,
        peeColor: 'pale-yellow',
        hasPoop: false,
        note: '',
        createdAt: hoursAgo(7.5),
        updatedAt: hoursAgo(7.5),
      },
      // 8. Sleep - 7.5h to 10.5h ago (Morning stretch)
      {
        id: generateUUID(),
        type: 'sleep',
        startTime: hoursAgo(10.5),
        endTime: hoursAgo(7.8),
        durationSeconds: 9720, // 2h 42m
        note: 'Peaceful stretch after early morning feed',
        createdAt: hoursAgo(7.8),
        updatedAt: hoursAgo(7.8),
      },
      // 9. Temperature - 11 hours ago (Normal check)
      {
        id: generateUUID(),
        type: 'temperature',
        timestamp: hoursAgo(11.0),
        temperatureCelsius: 36.9, // 98.4°F
        alertAcknowledged: false,
        note: 'Morning axillary check, calm and normal',
        createdAt: hoursAgo(11.0),
        updatedAt: hoursAgo(11.0),
      },
      // 10. Feeding - 11.2 hours ago (Bottle Formula)
      {
        id: generateUUID(),
        type: 'feeding',
        feedType: 'bottle',
        startTime: hoursAgo(11.3),
        endTime: hoursAgo(11.0),
        volumeMl: 90, // ~3.0 oz
        bottleType: 'formula',
        note: 'Night feed transition',
        createdAt: hoursAgo(11.0),
        updatedAt: hoursAgo(11.0),
      },
      // 11. Diaper - 11.4 hours ago (Wet)
      {
        id: generateUUID(),
        type: 'diaper',
        timestamp: hoursAgo(11.4),
        hasPee: true,
        peeColor: 'clear',
        hasPoop: false,
        note: '',
        createdAt: hoursAgo(11.4),
        updatedAt: hoursAgo(11.4),
      },
      // 12. Sleep - 12h to 15.5h ago (Overnight)
      {
        id: generateUUID(),
        type: 'sleep',
        startTime: hoursAgo(15.5),
        endTime: hoursAgo(11.8),
        durationSeconds: 13320, // 3h 42m
        note: 'Swaddled in crib',
        createdAt: hoursAgo(11.8),
        updatedAt: hoursAgo(11.8),
      },
      // 13. Feeding - 16 hours ago (Nursing)
      {
        id: generateUUID(),
        type: 'feeding',
        feedType: 'nursing',
        startTime: hoursAgo(16.2),
        endTime: hoursAgo(15.7),
        leftDurationSeconds: 840, // 14 min
        rightDurationSeconds: 420, // 7 min
        totalDurationSeconds: 1260, // 21 min
        lastActiveSide: 'right',
        note: 'Started on Left',
        createdAt: hoursAgo(15.7),
        updatedAt: hoursAgo(15.7),
      },
      // 14. Diaper - 16.5 hours ago (Poop - Soft, Mustard yellow)
      {
        id: generateUUID(),
        type: 'diaper',
        timestamp: hoursAgo(16.5),
        hasPee: true,
        peeColor: 'pale-yellow',
        hasPoop: true,
        poopConsistency: 'soft',
        poopColor: 'mustard-yellow',
        note: 'Normal texture and color',
        createdAt: hoursAgo(16.5),
        updatedAt: hoursAgo(16.5),
      },
      // 15. Feeding - 20 hours ago (Bottle Expressed Milk)
      {
        id: generateUUID(),
        type: 'feeding',
        feedType: 'bottle',
        startTime: hoursAgo(20.2),
        endTime: hoursAgo(19.9),
        volumeMl: 60, // ~2.0 oz
        bottleType: 'expressed',
        note: 'Drank quickly and burped',
        createdAt: hoursAgo(19.9),
        updatedAt: hoursAgo(19.9),
      },
      // 16. Diaper - 20.3 hours ago (Wet)
      {
        id: generateUUID(),
        type: 'diaper',
        timestamp: hoursAgo(20.3),
        hasPee: true,
        peeColor: 'pale-yellow',
        hasPoop: false,
        note: '',
        createdAt: hoursAgo(20.3),
        updatedAt: hoursAgo(20.3),
      },
      // 17. Sleep - 20.5h to 23.5h ago (Evening rest)
      {
        id: generateUUID(),
        type: 'sleep',
        startTime: hoursAgo(23.5),
        endTime: hoursAgo(20.6),
        durationSeconds: 10440, // 2h 54m
        note: 'Evening sleep after bath',
        createdAt: hoursAgo(20.6),
        updatedAt: hoursAgo(20.6),
      },
      // 18. Feeding - 23.8 hours ago (Nursing)
      {
        id: generateUUID(),
        type: 'feeding',
        feedType: 'nursing',
        startTime: hoursAgo(24.0),
        endTime: hoursAgo(23.6),
        leftDurationSeconds: 660, // 11 min
        rightDurationSeconds: 720, // 12 min
        totalDurationSeconds: 1380, // 23 min
        lastActiveSide: 'right',
        note: 'Calm feed before evening bath',
        createdAt: hoursAgo(23.6),
        updatedAt: hoursAgo(23.6),
      },
    ],
    appointments: [
      {
        id: generateUUID(),
        title: '2-Week Well-Child Checkup',
        providerName: 'Dr. Sarah Jenkins, MD',
        dateTime: daysAhead(2.5),
        location: 'Cedar Valley Pediatrics, Suite 210',
        questions: [
          'Is the current spitting up frequency normal after nursing?',
          'Verify daily Vitamin D 400 IU supplementation timing',
          'Check umbilical cord stump healing progress',
          'Review weight gain curve from birth weight',
        ],
        providerInstructions: 'Bring immunization card and record of 48-hour feeding & diaper counts.',
        isCompleted: false,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(5),
      },
      {
        id: generateUUID(),
        title: 'Lactation Consultation & Weight Check',
        providerName: 'Elena Rostova, IBCLC',
        dateTime: daysAgo(6),
        location: 'Mother & Child Wellness Center',
        questions: [
          'Check latch depth on left breast',
          'Pre and post-feed weighted feed transfer check',
        ],
        providerInstructions: 'Latching technique improved. Baby transferred ~58 ml during 15-minute nursing session. Continue alternating starting breast.',
        isCompleted: true,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(6),
      },
    ],
    growthRecords: [
      {
        id: generateUUID(),
        timestamp: daysAgo(12),
        weightGrams: 3400, // 7 lb 8 oz
        lengthCm: 50.8, // 20.0 in
        headCircumferenceCm: 35.0, // 13.8 in
        notes: 'Birth measurement recorded by hospital delivery team.',
        createdAt: daysAgo(12),
        updatedAt: daysAgo(12),
      },
      {
        id: generateUUID(),
        timestamp: daysAgo(7),
        weightGrams: 3260, // 7 lb 3 oz (normal initial newborn drop ~4%)
        lengthCm: 50.8,
        headCircumferenceCm: 35.0,
        notes: 'Day 5 discharge check. Expected physiological weight drop, regaining smoothly.',
        createdAt: daysAgo(7),
        updatedAt: daysAgo(7),
      },
      {
        id: generateUUID(),
        timestamp: daysAgo(2),
        weightGrams: 3420, // 7 lb 8.6 oz (exceeded birth weight)
        lengthCm: 51.3, // 20.2 in
        headCircumferenceCm: 35.2,
        notes: 'Back above birth weight! Excellent recovery curve.',
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
    ],
    healthNotes: [
      {
        id: generateUUID(),
        timestamp: daysAgo(6),
        category: 'medication',
        title: 'Vitamin D Supplementation',
        details: 'Started pediatrician-recommended Vitamin D3 liquid drops (400 IU daily). Administering 1 drop each morning directly on nipple before feed.',
        createdAt: daysAgo(6),
        updatedAt: daysAgo(6),
      },
      {
        id: generateUUID(),
        timestamp: daysAgo(4),
        category: 'advice',
        title: 'Paced Feeding & Burping Strategy',
        details: 'Pediatrician recommended keeping baby at a 45-degree angle during bottle feeds and pausing halfway for 1-2 minutes of gentle back burping to reduce spit-up.',
        createdAt: daysAgo(4),
        updatedAt: daysAgo(4),
      },
      {
        id: generateUUID(),
        timestamp: daysAgo(1),
        category: 'symptom',
        title: 'Mild Dry Skin on Ankles & Wrists',
        details: 'Normal newborn peeling according to nurse line. Applying a thin layer of gentle fragrance-free ointment after bath.',
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
    ],
  };
}
