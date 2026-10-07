# Project Summary: Smart Cat Feeder with Health Monitoring

**Author:** Handri Suhandi
**Courses:** CE631 (Embedded System Design) & CE739L (Mobile Pervasive Computing)
**Last updated:** September 2026

---

## 1. Project Goals

Design and build an automated cat feeder that goes beyond simple scheduled dispensing by **monitoring eating behavior over time** to catch early signs of illness — specifically for a household where no one is home for most of the day.

This project serves two course requirements simultaneously:
- **CE631**: embedded system design (hardware, workflow, block diagrams)
- **CE739L**: full IoT stack (smart device + backend server + frontend, "half-REST" API, cloud deployment)

### Core problem being solved
A real stakeholder (a friend and his sister) both work full-time (07:00–18:00) and live with 3 cats, one of which gets sick relatively often. Their vet specifically recommended **small, scheduled portions instead of bulk feeding**, combined with appetite monitoring — but since the house is empty all day and they have no neighbors to rely on, feeding is currently manual and ad hoc, and no one notices appetite changes until symptoms are already visible.

### Why this isn't "too simple" (addressed after early feedback)
- Existing commercial feeders (BARDI, Focat, Robolife, Petlibro, PetKit, etc.) solve scheduling and portioning, but **none build a personalized baseline of a specific cat's eating pattern or detect deviation trends** — they log meals, they don't interpret them.
- Validated via: stakeholder interview (including the vet's specific recommendation), and real cat-owner forum/blog research (Mumsnet, a Substack kibble-jar post, Reddit r/CatAdvice via MyNubs) showing manual portion-tracking is a common, unresolved struggle even for attentive owners.

---

## 2. Key Decisions Made

### Problem scope
- Narrowed from "3 cats" to **one dedicated device for the specific cat prone to illness** (not multi-cat, no RFID needed — reduces complexity while keeping the core value proposition).
- Portion is **fixed and consistent** every session — leftover food is used purely as a monitoring signal, never used to auto-adjust future portions (to avoid masking/reinforcing reduced appetite from illness).

### System architecture (3-part IoT structure)
1. **Smart device** — ESP32-based, dispenses food, weighs leftovers, and checks hopper level
2. **Backend server** — stores data, computes baseline, runs severity classification
3. **Frontend** — web dashboard + notification service

### Severity-tiered detection logic (not a binary threshold)
- **Mild/Watch** — small deviation, logged only, no alert
- **Moderate/Notify** — deviation persists or is significant → notify owners
- **Severe/Urgent** — near-zero consumption or repeated severe deviation → urgent alert

### Final hardware components
All components below have been **acquired** except the housing/auger, which are still to be designed and printed. Physical testing has not started yet.

| Component | Role | Status |
|---|---|---|
| ESP32 | Microcontroller, Wi-Fi, scheduling logic | Acquired |
| 1kg load cell | Weighs leftover food (closed-loop dispensing + monitoring) | Acquired |
| HX711 | Amplifier/ADC for the load cell | Acquired |
| **MG996R servo** | Drives the auger dispenser | Acquired |
| DS3231 (RTC) | Keeps accurate schedule independent of Wi-Fi/NTP | Acquired |
| **HLK-10M05** (AC-DC, 5V 2A) | Powers everything from household electricity with real current headroom | Acquired |
| **Ultrasonic sensor** (added; exact model to be confirmed, e.g. HC-SR04) | Hopper level: coarse full / low / empty | Acquired |
| PCB / perfboard (9cm x 15cm) | Permanent soldered connections | Acquired |
| 3D printed housing + auger | Custom enclosure, separates electronics from food/water area; auger dispenses kibble | Not yet built |

**Servo decision history (now closed):** MG996R (high torque, ~500-900mA) → considered 28BYJ-48+ULN2003 (low current, geared, but risk of insufficient torque with a 3D-printed auger's friction) → considered FS90R mini servo → **settled on MG996R** due to torque reliability concerns with the printed auger; the unit is now in hand.

**Power supply decision (now closed):** HLK-PM01's 600mA was insufficient for the MG996R, so it was replaced by the **HLK-10M05 (5V, 2A)**. Remaining engineering concern, to be handled in the power design: MG996R stall current (e.g. auger jamming on kibble) can approach or exceed the supply's rating, which risks brownouts/resets on the ESP32. Planned mitigations (to be verified in testing): bulk capacitor (~470–1000µF) across the servo supply, common ground, and powering the servo directly from the 5V rail rather than through the ESP32.

**Ultrasonic sensor (hopper level) — added scope, with justification:**
- *Why it was added:* the house is empty 07:00–18:00, so an empty hopper or a dispensing failure would otherwise look identical to "the cat didn't eat." The sensor lets the system tell "no food dispensed" apart from "cat didn't eat," which protects the integrity of the eating-pattern baseline, and enables a "refill needed" alert through the same Telegram pipeline.
- *Known limitations (state honestly in reports):* kibble surface is uneven and slopes as the auger draws from the bottom, so readings are noisy → average several readings and use only coarse thresholds (full / low / empty), not precise quantity.
- *Hardware notes:* if the model is an HC-SR04, the ECHO pin outputs 5V while ESP32 GPIO is 3.3V-only, so a voltage divider (e.g. 1k/2k) is needed on ECHO. HC-SR04 has a ~2cm minimum range, so it must be mounted high enough above the maximum fill level, and positioned so kibble/dust cannot block it. Hopper capacity (pending) affects the mounting position.
- *Scope check:* this is one more component than originally planned, kept because it directly addresses the unattended-window failure mode and data quality, not as a general extra feature.

### Backend/tech stack
- **Hosting:** Vercel (serverless functions, free tier, satisfies cloud deployment requirement)
- **Database:** Supabase (PostgreSQL — chosen because data is relational: users → devices → pets → feedings)
- **Update mechanism:** Polling (not WebSockets — Vercel's serverless model doesn't support persistent connections well)
- **Notifications:** Telegram bot (free, real-time, lowest setup friction vs. WhatsApp API/web push)
- **Device provisioning:** Wi-Fi AP-mode pairing (ESP32 hosts a temporary access point for initial setup)
- **Offline handling:** ESP32 buffers feeding/weight data locally and syncs once Wi-Fi reconnects; feeding itself still runs on schedule via the RTC regardless of connectivity; live alerts are **not possible during an outage** (acknowledged as an honest limitation)
- **Security:** HTTPS + device API key/token (not just device ID) for backend auth

### Frontend structure (4 pages, mocked up)
1. **Home** — status overview, last/next feeding, consumption metric, 7-day trend
2. **History** — full feeding log with date filter
3. **Alerts** — past notifications (deviation alerts + device-offline events)
4. **Settings** — feeding schedule, portion size, device re-pairing

### Rejected/descoped ideas (with reasoning, worth remembering)
- **RFID/multi-cat identification** — not needed since scope narrowed to one cat
- **Manual "feed now" button** — removed to keep feeding fully consistent/schedule-driven
- **Buzzer/LED indicators** — decided against; doesn't help during the core 8–6 unattended window
- **Adaptive/auto-learned feeding schedule** (friend's suggestion) — rejected; the schedule is vet-prescribed, not something that should drift based on sampled behavior (risk of reinforcing bad patterns, similar to a real case found in research where a cat learned begging behavior from another)
- **HLK-PM01 as sole power source** — insufficient current for MG996R; replaced by HLK-10M05
- **28BYJ-48+ULN2003 and FS90R servos** — rejected in favor of MG996R due to torque risk with the printed auger
- **OTA firmware updates** — descoped as future work given timeline

---

## 3. Current Status

- ✅ Problem validated (stakeholder interview + vet recommendation + forum/blog research)
- ✅ System architecture, workflow flowchart, and hardware/software block diagrams complete (hardware block diagram updated to include the ultrasonic sensor; pin assignments are tentative and must be checked against actual wiring)
- ✅ Hardware components finalized and acquired (ESP32, DS3231, load cell + HX711, MG996R, HLK-10M05, ultrasonic sensor, PCB/perfboard)
- ✅ Backend tech stack decided (Vercel + Supabase)
- ✅ Notification method decided (Telegram)
- ✅ Frontend mockups complete (4 pages)
- ⏳ Database schema — conceptually defined (users/devices/pets/feedings) but not formally written out
- ⏳ API endpoint list ("half-REST" design) — not yet formally defined
- ⏳ Software flow diagram — needs a step added for the hopper-level check
- ❌ No backend code written yet
- ❌ No frontend code built yet
- ❌ Nothing deployed yet
- ❌ Physical hardware testing not yet started (hardware is now in hand, so testing can begin)
- ❌ Housing and auger not yet designed/printed

---

## 4. Pending Tasks

1. ~~Finalize servo + power supply~~ — **done** (MG996R + HLK-10M05 acquired). Remaining: verify the power design in testing (servo stall current, brownout behavior, capacitor across the servo supply)
2. **Decide hopper capacity** (affects auger torque requirements and the ultrasonic sensor's mounting position)
3. **Confirm the ultrasonic sensor model** (logic level on ECHO, minimum range) and add level shifting if needed
4. Formally define **database schema** (tables + relationships)
5. Formally define **API resource list** (endpoints/operations) — explicitly graded in CE739L
6. Begin **incremental hardware testing**: ESP32 basics → load cell/HX711 calibration → RTC → ultrasonic hopper-level readings (test full/low/empty) → combined test → Wi-Fi/backend test → servo (with the power design in place)
7. Build actual **backend** (Vercel functions + Supabase)
8. Build actual **frontend** (from existing mockups)
9. Design the **auger** (3D print, test empty first, then with kibble, then with full hopper)
10. Update the **software flow/module diagram** to include the hopper-level check
11. Prepare and deliver **progress report** to CE739L lecturer (talking points drafted)

---

## 5. Style Guidelines (for future AI assistance on this project)

- **Documentation language:** Indonesian (Bahasa Indonesia), matching how the student communicates with lecturers
- **Emails to lecturers:** semi-formal/casual register (e.g., "izin update," "udah coba cari," contractions like "gak," "nggak") — not stiff/bureaucratic Indonesian
- **Technical honesty is prioritized over sounding impressive** — the student has repeatedly asked to correct overclaiming (e.g., "is this diagram too simple," "are you just glazing my system") and prefers direct, hedge-appropriate language ("setahu saya," "belum menemukan" rather than absolute claims)
- **Engineering trade-offs should be stated explicitly**, not glossed over (e.g., servo torque vs. current draw, offline notification limitations)
- **Avoid feature creep** — the student has repeatedly scoped things down (single cat, no manual override, no buzzer/LED, no OTA) in favor of a smaller, well-justified system over an impressive-sounding but shallow one
- **Diagrams:** follow the specific format taught in the CE631 lab module (hierarchical or layered software architecture; block-diagram style hardware architecture with components connected directly to the microcontroller) rather than generic diagram conventions
