// Helper format angka & waktu (locale Indonesia)

export const fmtNum = (n, d = 0) =>
  n == null ? '—' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: d, minimumFractionDigits: d });

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

export const fmtDateLong = (iso) =>
  new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

export function timeAgo(iso) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.max(s, 1)} detik lalu`;
  const m = Math.round(s / 60); if (m < 60) return `${m} menit lalu`;
  const h = Math.round(m / 60); if (h < 24) return `${h} jam lalu`;
  return `${Math.round(h / 24)} hari lalu`;
}

export function untilText(date) {
  const mins = Math.max(1, Math.round((date - Date.now()) / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? `dalam ${h} jam ${m} menit` : `dalam ${m} menit`;
}

/** Jadwal aktif terdekat setelah sekarang (hari ini atau besok). */
export function nextFeeding(schedules) {
  const active = schedules.filter((s) => s.is_active);
  if (!active.length) return null;
  const now = new Date();
  return active.map((s) => {
    const [h, m] = s.feed_time.split(':').map(Number);
    const t = new Date(now); t.setHours(h, m, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    return { ...s, at: t };
  }).sort((a, b) => a.at - b.at)[0];
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam';
}
