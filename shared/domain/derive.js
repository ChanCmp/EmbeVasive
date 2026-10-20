/* Data turunan yang dihitung dari baris tabel — dipakai versi mock & Supabase.
   Aman untuk browser maupun server (tidak memakai window/localStorage). */
import { SEVERITY_META } from './severity';

export const LOW_STOCK_PCT = 25;
const OFFLINE_AFTER_MS = 3 * 60 * 1000;
const DAY = 86400000;

/** Kolom `time` Postgres dikirim "07:00:00" → UI memakai "07:00". */
export const normalizeSchedule = (s) => ({ ...s, feed_time: String(s.feed_time).slice(0, 5) });

/**
 * Status stok & online perangkat.
 * @param dev      baris devices
 * @param feedings feedings (minimal kolom scheduled_at, dispensed_g) sejak min(isi ulang, 7 hari lalu)
 */
export function deviceView(dev, feedings) {
  const refilledAt = dev.hopper_refilled_at ? new Date(dev.hopper_refilled_at).getTime() : 0;
  const sinceRefill = feedings
    .filter((f) => new Date(f.scheduled_at).getTime() >= refilledAt)
    .reduce((s, f) => s + Number(f.dispensed_g), 0);
  const remaining = Math.max(0, dev.hopper_capacity_g - sinceRefill);
  const estPct = (remaining / dev.hopper_capacity_g) * 100;
  // jumlah per sesi acak, jadi pemakaian harian = rata-rata berat yang jatuh 7 hari terakhir
  const weekAgo = Date.now() - 7 * DAY;
  const dailyUse = feedings
    .filter((f) => new Date(f.scheduled_at).getTime() >= weekAgo)
    .reduce((s, f) => s + Number(f.dispensed_g), 0) / 7;
  const pct = dev.hopper_level_pct != null ? Number(dev.hopper_level_pct) : estPct;
  return {
    ...dev,
    online: dev.last_seen_at ? Date.now() - new Date(dev.last_seen_at).getTime() < OFFLINE_AFTER_MS : false,
    hopper_remaining_g: remaining,
    hopper_est_pct: estPct,
    hopper_pct: pct,
    hopper_low: pct <= LOW_STOCK_PCT,
    days_left: dailyUse ? (dev.hopper_capacity_g * pct / 100) / dailyUse : null,
    daily_use_g: dailyUse,
  };
}

/**
 * Notifikasi diturunkan dari status sesi makan (7 hari), stok, dan status online.
 * @param classified feedings yang sudah diperkaya (consumed_pct, baseline_pct, drop_pct, status)
 * @param readIds    Set id notifikasi yang sudah dibaca
 */
export function buildNotifications({ pet, dev, classified, readIds }) {
  const items = [];
  const weekAgo = Date.now() - 7 * DAY;
  for (const f of classified) {
    if (!['watch', 'moderate', 'urgent'].includes(f.status)) continue;
    if (new Date(f.scheduled_at).getTime() < weekAgo) continue;
    const meta = SEVERITY_META[f.status];
    const pctText = f.baseline_pct != null
      ? ` (baseline ${Math.round(f.baseline_pct)}%, turun ${Math.round(f.drop_pct)}%)`
      : '';
    items.push({
      id: 'feed-' + f.id,
      kind: 'appetite',
      severity: f.status,
      title: `Nafsu makan ${pet.name}: ${meta.label}`,
      desc: `Hanya makan ${Math.round(f.consumed_pct)}% dari makanan yang jatuh${pctText}. Sisa ${Number(f.leftover_g).toLocaleString('id-ID')} g dari ${Number(f.dispensed_g).toLocaleString('id-ID')} g.`,
      at: f.synced_at,
    });
  }
  if (dev.hopper_low) {
    items.push({
      id: 'stock-' + dev.hopper_refilled_at,
      kind: 'stock',
      severity: 'watch',
      title: 'Stok makanan hampir habis',
      desc: `Hopper tersisa ±${Math.round(dev.hopper_pct)}%${dev.days_left != null ? `, cukup untuk ±${dev.days_left.toLocaleString('id-ID', { maximumFractionDigits: 1 })} hari` : ''}. Segera isi ulang.`,
      at: dev.hopper_read_at || dev.hopper_refilled_at || new Date().toISOString(),
    });
  }
  if (!dev.online) {
    items.push({
      id: 'offline-' + dev.last_seen_at,
      kind: 'offline',
      severity: 'urgent',
      title: 'Perangkat offline',
      desc: 'Feeder tetap memberi makan sesuai jadwal terakhir, data akan tersinkron saat online.',
      at: dev.last_seen_at || dev.paired_at,
    });
  }
  items.sort((a, b) => new Date(b.at) - new Date(a.at));
  items.forEach((n) => { n.read = readIds.has(n.id); });
  return items;
}
