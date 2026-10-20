/* =========================================================
   Data mock — struktur kolom mengikuti tabel di supabase/schema.sql:
   users, devices, pets, feeding_schedule, feedings.
   Dibuat sekali saat pertama dipakai (hanya di browser), lalu dipakai
   bersama oleh semua halaman selama tab terbuka.
   Dipakai lib/data/api-mock.js saat NEXT_PUBLIC_USE_MOCK=true (coba tampilan tanpa database).
   ========================================================= */
const DAY = 86400000;
const MONITORING_MS = 30 * 60 * 1000; // jeda baca sisa makanan setelah dispense

let db = null;

export function getDB() {
  if (!db) db = createDB();
  return db;
}

function createDB() {
  // RNG dengan seed supaya data selalu sama tiap refresh
  let seed = 631;
  const rand = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const now = new Date();
  const atTime = (daysAgo, hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date(now.getTime() - daysAgo * DAY);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const users = [{ id: 'b7c1e0a2-0000-4000-8000-000000000001', email: 'pemilik@contoh.com' }];

  const devices = [{
    id: 1,
    user_id: users[0].id,
    name: 'Feeder Ruang Tamu',
    api_key_hash: '(hash sha-256)',
    paired_at: atTime(30, '19:42').toISOString(),
    last_seen_at: new Date(now.getTime() - 20 * 1000).toISOString(),
    bowl_weight_g: null, // diisi di bawah
    bowl_read_at: null,
    hopper_capacity_g: 2000,
    hopper_refilled_at: atTime(16, '20:10').toISOString(),
    hopper_level_pct: 22, // dari sensor ultrasonik
    hopper_read_at: new Date(now.getTime() - 60 * 1000).toISOString(),
  }];

  const pets = [{
    id: 1,
    device_id: 1,
    name: 'Mochi',
    watch_pct: 15,
    moderate_pct: 30,
    urgent_pct: 50,
    moderate_session: 2,
    photo_url: null, // diisi lewat upload foto (Profil Pet / klik foto di Ringkasan)
  }];

  // Jadwal hanya jam + aktif. Lama servo membuka dropper diatur di firmware.
  const feeding_schedule = [
    { id: 1, device_id: 1, feed_time: '07:00', is_active: true },
    { id: 2, device_id: 1, feed_time: '12:00', is_active: true },
    { id: 3, device_id: 1, feed_time: '17:00', is_active: true },
    { id: 4, device_id: 1, feed_time: '21:00', is_active: true },
  ];

  // ---- feedings: 21 hari terakhir
  const raw = [];
  for (let d = 21; d >= 0; d--) {
    for (const s of feeding_schedule) {
      const t = atTime(d, s.feed_time);
      if (t > now) continue;
      raw.push({ schedule: s, t });
    }
  }
  raw.sort((a, b) => a.t - b.t);

  // skenario nafsu makan: normal, 1 kejadian parah 9 hari lalu, lalu turun di sesi-sesi terakhir
  const tailPattern = [0.80, 0.74, 0.62, 0.60, 0.58, 0.66];
  const completed = raw.filter((r) => now - r.t >= MONITORING_MS);
  const tailStart = completed.length - tailPattern.length;

  let id = 1000;
  const feedings = raw.map((r, i) => {
    // jumlah yang jatuh acak (servo berbasis waktu), ditimbang load cell: 15–35 g
    const dispensed = Math.round((15 + rand() * 20) * 10) / 10;
    const done = now - r.t >= MONITORING_MS;
    let ratio = 0.86 + rand() * 0.12;
    const daysAgo = Math.floor((now - r.t) / DAY);
    if (daysAgo === 9 && r.schedule.feed_time === '17:00') ratio = 0.38;
    if (i >= tailStart && done) ratio = tailPattern[i - tailStart];
    const leftover = done ? Math.round(dispensed * (1 - ratio) * 10) / 10 : null;
    return {
      id: id++,
      device_id: 1,
      pet_id: 1,
      schedule_id: r.schedule.id,
      scheduled_at: r.t.toISOString(),
      dispensed_g: dispensed,
      leftover_g: leftover,
      status: 'normal', // dihitung ulang via classifyAll
      synced_at: new Date(r.t.getTime() + (done ? MONITORING_MS + 5000 : 5000)).toISOString(),
    };
  });

  const last = feedings[feedings.length - 1];
  devices[0].bowl_weight_g = last.leftover_g != null ? last.leftover_g : last.dispensed_g;
  devices[0].bowl_read_at = new Date(now.getTime() - 15 * 1000).toISOString();

  return { users, devices, pets, feeding_schedule, feedings };
}
