/* =========================================================
   Klasifikasi severity nafsu makan.
   Dipakai di frontend untuk preview threshold; logika yang sama ada di
   database sebagai fungsi SQL reclassify_feedings() (supabase/schema.sql).

   Definisi:
     consumed_pct = (dispensed_g - leftover_g) / dispensed_g * 100
     baseline     = rata-rata consumed_pct dari N sesi terakhir yang
                    berstatus 'normal' (sesi abnormal tidak ikut, supaya
                    baseline tidak ikut turun saat kucing sedang sakit)
     drop_pct     = (baseline - consumed_pct) / baseline * 100

   Aturan (memakai kolom tabel pets):
     drop >= urgent_pct                                            -> urgent
     drop >= moderate_pct selama >= moderate_session sesi beruntun -> moderate
     drop >= watch_pct                                             -> watch
     selain itu                                                    -> normal
   ========================================================= */
export const BASELINE_WINDOW = 10;

function consumedPct(f) {
  if (f.leftover_g == null || !f.dispensed_g) return null;
  return Math.max(0, (f.dispensed_g - f.leftover_g) / f.dispensed_g) * 100;
}

/**
 * Hitung status untuk seluruh daftar feedings (urut kronologis, lama -> baru).
 * Mengembalikan array baru: tiap item ditambah consumed_pct, baseline_pct, drop_pct, status.
 *
 * keepStatus: true → status TIDAK dihitung ulang, tapi diambil dari kolom `status` di DB
 * (status yang sudah tercatat adalah sumber kebenaran; threshold baru hanya berlaku untuk
 * sesi baru). Angka consumed/baseline/drop tetap dihitung untuk ditampilkan.
 */
export function classifyAll(feedings, pet, { keepStatus = false } = {}) {
  const sorted = [...feedings].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const normalHistory = [];
  let moderateStreak = 0;

  return sorted.map((f) => {
    const consumed = consumedPct(f);
    if (consumed == null) {
      return { ...f, consumed_pct: null, baseline_pct: null, drop_pct: null, status: 'pending' };
    }

    const window = normalHistory.slice(-BASELINE_WINDOW);
    const baseline = window.length >= 3
      ? window.reduce((s, v) => s + v, 0) / window.length
      : null;

    let status = 'normal';
    let drop = null;
    if (baseline) {
      drop = Math.max(0, ((baseline - consumed) / baseline) * 100);
      moderateStreak = drop >= pet.moderate_pct ? moderateStreak + 1 : 0;

      if (drop >= pet.urgent_pct) status = 'urgent';
      else if (moderateStreak >= pet.moderate_session) status = 'moderate';
      else if (drop >= pet.watch_pct) status = 'watch';
    }
    if (keepStatus && f.status) status = f.status;

    if (status === 'normal') normalHistory.push(consumed);
    return { ...f, consumed_pct: consumed, baseline_pct: baseline, drop_pct: drop, status };
  });
}

export function currentBaseline(classified) {
  const normals = classified.filter((f) => f.status === 'normal').slice(-BASELINE_WINDOW);
  if (!normals.length) return null;
  return normals.reduce((s, f) => s + f.consumed_pct, 0) / normals.length;
}

export const SEVERITY_META = {
  normal:   { label: 'Normal',   desc: 'Nafsu makan sesuai baseline' },
  watch:    { label: 'Ringan',   desc: 'Sedikit turun dari biasanya' },
  moderate: { label: 'Sedang',   desc: 'Turun konsisten beberapa sesi' },
  urgent:   { label: 'Parah',    desc: 'Turun drastis, cek kondisi kucing' },
  pending:  { label: 'Dipantau', desc: 'Menunggu pembacaan sisa makanan' },
};
