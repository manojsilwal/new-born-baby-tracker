# Newborn Tracker 👶🍼

A fast, calm, trustworthy, and local-first newborn care companion designed for parents and caregivers to track feeding, diapers, sleep, temperature, pediatrician visits, growth, and clinical notes.

Optimized for exhausted parents managing nighttime feeds one-handed on mobile devices, tablets, or desktop browsers.

---

## Key Features

- **Local-First & 100% Private**:
  - All data is stored directly in browser `localStorage` (`newborn-tracker:v1`).
  - No accounts, no cloud sync, no tracking, and no external medical APIs.
- **One-Tap Logging & Quick Actions**:
  - Instant logging for feeds, diapers, and sleep with minimal typing.
  - Automatic timestamping to current time with inline adjustment before saving.
  - Undo banner toast after any log, edit, or deletion.
- **Nursing & Bottle Tracker**:
  - **Nursing**: Independent Left/Right breast timers, live side switching, accumulated durations, and persistent timer banner if closed during a feed. Calculates elapsed time using timestamps for backgrounding/refresh accuracy.
  - **Bottle**: Expressed Milk or Formula, fast steppers (-0.5/+0.5 oz, -10/+10 ml), direct numeric entry, quick amounts, and secondary unit conversion display.
- **Diaper Tracker**:
  - Log Pee, Poop, or Combined (Pee + Poop together).
  - Accessible color swatches for urine (Clear, Pale Yellow, Dark Yellow, Concentrated Orange).
  - Stool consistency and color pickers.
  - **High-Priority Safety Alerts**: Immediate red alert banner with required acknowledgment when selecting *Clay / Pale* or *Blood-tinged* stool, advising prompt consultation with a pediatrician.
- **Sleep Tracker**:
  - Live sleep timer with start/stop and persistent active session tracking.
  - Manual entry with automatic duration calculation and cross-midnight sleep handling.
- **Vitals & Temperature**:
  - Canonical storage in Celsius, switchable between °F and °C.
  - **Newborn Fever Alert**: High-priority alert banner with required acknowledgment when reading is $\ge 100.4^\circ\text{F}$ ($38.0^\circ\text{C}$).
- **Today Dashboard**:
  - *Time Since Last* cards (Last Fed, Last Diaper, Last Slept - defined as start time of most recent sleep).
  - Live active nursing or sleep timer banners with quick controls.
  - Rolling past 24-hour summary (wet diapers, dirty diapers, bottle volume, nursing time, sleep time, latest temperature).
  - Reverse-chronological activity timeline with inline editing and deletion.
- **7-Day History View**:
  - Daily summary metrics with previous/next 7-day pagination (capped at today).
  - Expandable day cards to view full timelines.
- **48-Hour Doctor Summary**:
  - Comprehensive clinical summary covering the previous 48 rolling hours.
  - Formatted breakdown of feeds, diaper counts, stool observations, sleep totals, temperature readings, latest growth stats, and upcoming appointment questions.
  - One-click **Copy Summary** (clipboard), **Print Summary** (clean print-optimized stylesheet), and **Export JSON**.
- **Pediatric Health & Growth**:
  - **Visits**: Scheduled pediatrician appointments, checklist of questions to ask, doctor instructions.
  - **Growth**: Weight, length, and head circumference tracking with calculated deltas from prior measurements.
  - **Care Notes**: Categorized notes for medications (e.g. Vitamin D drops), vaccines, symptoms, and pediatrician advice.
- **Accessibility & Design System**:
  - Calm, low-contrast palette (soft slate neutrals, muted sage controls, warm amber highlights, and low-glare charcoal dark mode).
  - Light, Dark, and System theme support with zero-flash pre-render script.
  - Generous touch targets ($\ge 44 \times 44\text{ px}$), WCAG AA contrast, keyboard accessibility, and focus trapping.
  - Tabular numbers (`font-mono`) to eliminate layout shifts during timer updates.
- **Data Portability**:
  - Complete JSON backup export and import restoration.
  - Reset to realistic 24-hour sample demo data.
  - Clear all data with safety confirmation dialog.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build
```bash
npm run build
```

---

## Medical Disclaimer

Newborn Tracker is an observational caregiving utility created for parents and caregivers to log routine daily events. It is **not a medical device** and does not diagnose, treat, prevent, or evaluate any health conditions. Always seek direct medical guidance from a qualified pediatrician or medical professional regarding infant symptoms or health concerns. In an emergency, contact emergency medical services immediately.
