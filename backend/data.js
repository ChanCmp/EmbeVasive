import 'server-only';
/* Query baca yang dipakai beberapa Route Handler GET.
   Angka turunan (stok, consumed/baseline/drop) dihitung di sini, bukan di browser. */
import { getCurrentDevice, getCurrentPet, getServiceClient } from '@/backend/supabase';
import { fail } from '@/backend/http';
import { classifyAll } from '@/shared/domain/severity';
import { deviceView } from '@/shared/domain/derive';

const DAY = 86400000;
const BASELINE_EXTRA_DAYS = 14; // riwayat tambahan supaya baseline (10 sesi normal) bisa dihitung
const FEEDING_COLS = 'id, schedule_id, scheduled_at, dispensed_g, leftover_g, status, synced_at';

const num = (v) => (v == null ? null : Number(v));
const toFeeding = (f) => ({ ...f, dispensed_g: num(f.dispensed_g), leftover_g: num(f.leftover_g) });

/** Supabase tidak bisa dihubungi → 503 dengan pesan yang jelas (bukan 500 umum). */
export async function q(builder) {
  const { data, error } = await builder;
  if (error) {
    if (/failed to fetch|fetch failed|network/i.test(error.message)) {
      fail('Server tidak bisa terhubung ke Supabase. Cek .env.local, atau project Supabase sedang di-pause (buka supabase.com → Restore project).', 503);
    }
    throw error;
  }
  return data;
}

export async function deviceOrFail() {
  const dev = await getCurrentDevice();
  if (!dev) fail('Perangkat belum terdaftar. Jalankan database/seed.sql.', 404);
  return dev;
}

export async function petOrFail(deviceId) {
  const pet = await getCurrentPet(deviceId);
  if (!pet) fail('Pet belum terdaftar. Jalankan database/seed.sql.', 404);
  return pet;
}

export async function feedingsSince(petId, fromMs) {
  const rows = await q(getServiceClient().from('feedings').select(FEEDING_COLS)
    .eq('pet_id', petId).gte('scheduled_at', new Date(fromMs).toISOString()).order('scheduled_at'));
  return rows.map(toFeeding);
}

/** Feedings dengan angka turunan; status tetap dari DB (threshold baru hanya untuk sesi baru). */
export async function classifiedFeedings(pet, days) {
  const rows = await feedingsSince(pet.id, Date.now() - (days + BASELINE_EXTRA_DAYS) * DAY);
  return classifyAll(rows, pet, { keepStatus: true });
}

/** Baris devices + status stok/online. api_key_hash tidak pernah dikirim ke browser. */
export async function deviceWithStock(dev, pet) {
  const weekAgo = Date.now() - 7 * DAY;
  const refilled = dev.hopper_refilled_at ? new Date(dev.hopper_refilled_at).getTime() : weekAgo;
  const { api_key_hash, ...safe } = dev;
  const row = {
    ...safe,
    bowl_weight_g: num(dev.bowl_weight_g),
    hopper_level_pct: num(dev.hopper_level_pct),
    hopper_capacity_g: num(dev.hopper_capacity_g),
  };
  return deviceView(row, await feedingsSince(pet.id, Math.min(weekAgo, refilled)));
}
