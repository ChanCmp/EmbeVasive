/* =========================================================
   Lapisan data. UI (app.js) hanya memanggil fungsi di sini,
   jadi saat backend siap cukup ganti isi tiap fungsi dengan fetch()
   ke Vercel Functions / Supabase — tampilan tidak perlu diubah.

   Rencana koneksi (lihat komentar di tiap fungsi):
     Baca  -> supabase-js langsung (anon key, RLS read-only) + Supabase Realtime
     Tulis -> Vercel Functions:
       POST /api/schedules   PATCH|DELETE /api/schedules/:id   PATCH /api/pet
       POST|DELETE /api/pet/photo
       PATCH /api/device     POST /api/device/refill           POST /api/device/api-key
   ========================================================= */
(function () {
  const USE_MOCK = true;
  const LOW_STOCK_PCT = 25;
  const OFFLINE_AFTER_MS = 3 * 60 * 1000;
  const READ_KEY = 'petfeeder.readNotifications';
  const PHOTO_KEY = 'petfeeder.petPhoto';

  const db = window.MockDB;
  // mock: foto yang pernah diunggah disimpan di browser
  try { const saved = localStorage.getItem(PHOTO_KEY); if (saved) db.pets[0].photo_url = saved; } catch { /* storage diblokir */ }
  const delay = (v, ms = 180) => new Promise((r) => setTimeout(() => r(structuredClone(v)), ms));
  const DAY = 86400000;

  function deviceView(dev) {
    const sinceRefill = db.feedings
      .filter((f) => new Date(f.scheduled_at) >= new Date(dev.hopper_refilled_at))
      .reduce((s, f) => s + f.dispensed_g, 0);
    const remaining = Math.max(0, dev.hopper_capacity_g - sinceRefill);
    const estPct = (remaining / dev.hopper_capacity_g) * 100;
    // jumlah per sesi acak, jadi pemakaian harian = rata-rata berat yang jatuh 7 hari terakhir
    const weekAgo = Date.now() - 7 * DAY;
    const lastWeek = db.feedings.filter((f) => new Date(f.scheduled_at).getTime() >= weekAgo);
    const dailyUse = lastWeek.reduce((s, f) => s + f.dispensed_g, 0) / 7;
    const pct = dev.hopper_level_pct != null ? dev.hopper_level_pct : estPct;
    return {
      ...dev,
      online: Date.now() - new Date(dev.last_seen_at).getTime() < OFFLINE_AFTER_MS,
      hopper_remaining_g: remaining,
      hopper_est_pct: estPct,
      hopper_pct: pct,
      hopper_low: pct <= LOW_STOCK_PCT,
      days_left: dailyUse ? (dev.hopper_capacity_g * pct / 100) / dailyUse : null,
      daily_use_g: dailyUse,
    };
  }

  function classified() {
    return Severity.classifyAll(db.feedings, db.pets[0]);
  }

  function readSet() {
    try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
  }
  function saveReadSet(set) {
    try { localStorage.setItem(READ_KEY, JSON.stringify([...set])); } catch { /* storage diblokir */ }
  }

  const API = {
    LOW_STOCK_PCT,

    async getSession() {
      // Supabase: supabase.auth.getUser()
      return delay(db.users[0], 50);
    },

    async getDevice() {
      // supabase.from('devices').select('*').single()
      return delay(deviceView(db.devices[0]));
    },

    async getPet() {
      // supabase.from('pets').select('*').single()
      return delay(db.pets[0]);
    },

    async updatePet(patch) {
      // PATCH /api/pet  body: { name, watch_pct, moderate_pct, urgent_pct, moderate_session }
      Object.assign(db.pets[0], patch);
      return delay(db.pets[0]);
    },

    async uploadPetPhoto(blob) {
      // POST /api/pet/photo  (body: JPEG 512x512, Content-Type: image/jpeg) -> { photo_url }
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error('Gagal membaca foto.'));
        r.readAsDataURL(blob);
      });
      try { localStorage.setItem(PHOTO_KEY, dataUrl); } catch { /* penuh/diblokir: foto hilang saat refresh */ }
      db.pets[0].photo_url = dataUrl;
      return delay(dataUrl, 300);
    },

    async removePetPhoto() {
      // DELETE /api/pet/photo
      try { localStorage.removeItem(PHOTO_KEY); } catch { /* storage diblokir */ }
      db.pets[0].photo_url = null;
      return delay(true, 100);
    },

    async getSchedules() {
      // supabase.from('feeding_schedule').select('*').order('feed_time')
      return delay([...db.feeding_schedule].sort((a, b) => a.feed_time.localeCompare(b.feed_time)));
    },

    async addSchedule({ feed_time }) {
      // POST /api/schedules  body: { feed_time }
      const row = { id: Date.now(), device_id: 1, feed_time, is_active: true };
      db.feeding_schedule.push(row);
      return delay(row);
    },

    async updateSchedule(id, patch) {
      // PATCH /api/schedules/:id
      const row = db.feeding_schedule.find((s) => s.id === id);
      Object.assign(row, patch);
      return delay(row);
    },

    async deleteSchedule(id) {
      // DELETE /api/schedules/:id  (feedings.schedule_id otomatis SET NULL)
      db.feeding_schedule = db.feeding_schedule.filter((s) => s.id !== id);
      window.MockDB.feeding_schedule = db.feeding_schedule;
      return delay(true);
    },

    async getFeedings({ days = 7 } = {}) {
      // supabase.from('feedings').select('*').gte('scheduled_at', from) -> urut terbaru dulu
      const from = Date.now() - days * DAY;
      const rows = classified().filter((f) => new Date(f.scheduled_at).getTime() >= from);
      return delay(rows.reverse());
    },

    async getBaseline() {
      return delay(Severity.currentBaseline(classified()), 20);
    },

    async markRefilled() {
      // PATCH /api/device/refill -> hopper_refilled_at = now()
      db.devices[0].hopper_refilled_at = new Date().toISOString();
      db.devices[0].hopper_level_pct = 100;
      return delay(deviceView(db.devices[0]));
    },

    async updateDevice(patch) {
      Object.assign(db.devices[0], patch);
      return delay(deviceView(db.devices[0]));
    },

    async regenerateApiKey() {
      // POST /api/device/api-key -> backend simpan hash, kembalikan plaintext SEKALI
      const bytes = crypto.getRandomValues(new Uint8Array(20));
      const key = 'pf_live_' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
      db.devices[0].api_key_hash = '$2b$10$' + key.slice(-12) + '...';
      return delay(key, 400);
    },

    async getNotifications() {
      // Diturunkan di frontend dari feedings.status + status stok + last_seen_at
      const read = readSet();
      const pet = db.pets[0];
      const dev = deviceView(db.devices[0]);
      const items = [];

      const weekAgo = Date.now() - 7 * DAY;
      for (const f of classified()) {
        if (!['watch', 'moderate', 'urgent'].includes(f.status)) continue;
        if (new Date(f.scheduled_at).getTime() < weekAgo) continue;
        const meta = Severity.META[f.status];
        items.push({
          id: 'feed-' + f.id,
          kind: 'appetite',
          severity: f.status,
          title: `Nafsu makan ${pet.name}: ${meta.label}`,
          desc: `Hanya makan ${Math.round(f.consumed_pct)}% dari makanan yang jatuh (baseline ${Math.round(f.baseline_pct)}%, turun ${Math.round(f.drop_pct)}%). Sisa ${f.leftover_g.toLocaleString('id-ID')} g dari ${f.dispensed_g.toLocaleString('id-ID')} g.`,
          at: f.synced_at,
        });
      }
      if (dev.hopper_low) {
        items.push({
          id: 'stock-' + dev.hopper_refilled_at,
          kind: 'stock',
          severity: 'watch',
          title: 'Stok makanan hampir habis',
          desc: `Hopper tersisa ±${Math.round(dev.hopper_pct)}%, cukup untuk ±${dev.days_left.toLocaleString('id-ID', { maximumFractionDigits: 1 })} hari. Segera isi ulang.`,
          at: dev.hopper_read_at || new Date().toISOString(),
        });
      }
      if (!dev.online) {
        items.push({
          id: 'offline-' + dev.last_seen_at,
          kind: 'offline',
          severity: 'urgent',
          title: 'Perangkat offline',
          desc: 'Feeder tetap memberi makan sesuai jadwal terakhir, data akan tersinkron saat online.',
          at: dev.last_seen_at,
        });
      }
      items.sort((a, b) => new Date(b.at) - new Date(a.at));
      items.forEach((n) => { n.read = read.has(n.id); });
      return delay(items, 120);
    },

    async markNotificationRead(id) {
      // Catatan: DB belum punya kolom read (isu #5) — sementara disimpan di browser.
      const set = readSet(); set.add(id); saveReadSet(set);
      return delay(true, 20);
    },

    async markAllRead(ids) {
      const set = readSet(); ids.forEach((i) => set.add(i)); saveReadSet(set);
      return delay(true, 20);
    },

    /** Realtime: nanti pakai Supabase Realtime (postgres_changes di feedings & devices). */
    subscribe(cb) {
      if (!USE_MOCK) return () => {}; // diisi di Fase 3
      const t = setInterval(() => {
        const dev = db.devices[0];
        dev.last_seen_at = new Date().toISOString();
        const noise = (Math.random() - 0.5) * 0.6; // noise load cell ±0.3 g
        const w = Math.max(0, Math.round((dev.bowl_weight_g + noise) * 10) / 10);
        dev.bowl_read_at = new Date().toISOString();
        cb({ type: 'bowl_weight', value: w, at: dev.bowl_read_at });
      }, 5000);
      return () => clearInterval(t);
    },
  };

  window.API = API;
})();
