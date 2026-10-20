/* Implementasi data ASLI.
   Baca  → Supabase langsung (anon key, RLS hanya mengizinkan SELECT) + Realtime
   Tulis → Route Handlers di app/api (service role, ada validasi)
   Login belum ada: data yang dipakai = device pertama dan pet-nya. */
import { getBrowserClient } from '@/frontend/supabase';
import { classifyAll, currentBaseline } from '@/shared/domain/severity';
import { buildNotifications, deviceView, normalizeSchedule } from '@/shared/domain/derive';
import { addReadIds, readIds } from '@/frontend/utils/read-state';

const DAY = 86400000;
const BASELINE_EXTRA_DAYS = 14; // riwayat tambahan supaya baseline (10 sesi normal) bisa dihitung
const FEEDING_COLS = 'id, schedule_id, scheduled_at, dispensed_g, leftover_g, status, synced_at';

const sb = () => getBrowserClient();
const num = (v) => (v == null ? null : Number(v));
const toFeeding = (f) => ({ ...f, dispensed_g: num(f.dispensed_g), leftover_g: num(f.leftover_g) });
const toDevice = (d) => ({
  ...d,
  bowl_weight_g: num(d.bowl_weight_g),
  hopper_level_pct: num(d.hopper_level_pct),
  hopper_capacity_g: num(d.hopper_capacity_g),
});

async function q(builder) {
  const { data, error } = await builder;
  if (error) {
    if (/failed to fetch|network|load failed/i.test(error.message)) {
      throw new Error('Tidak bisa terhubung ke Supabase. Periksa koneksi internet, atau project Supabase sedang di-pause (buka supabase.com → Restore project).');
    }
    throw new Error(`Gagal memuat data dari database: ${error.message}`);
  }
  return data;
}

async function currentDevice() {
  const dev = await q(sb().from('devices').select('*').order('id').limit(1).maybeSingle());
  if (!dev) throw new Error('Belum ada perangkat di database. Jalankan database/seed.sql.');
  return toDevice(dev);
}

async function currentPet(deviceId) {
  const pet = await q(sb().from('pets').select('*').eq('device_id', deviceId).maybeSingle());
  if (!pet) throw new Error('Belum ada data pet di database. Jalankan database/seed.sql.');
  return pet;
}

async function feedingsSince(petId, fromMs) {
  const rows = await q(sb().from('feedings').select(FEEDING_COLS)
    .eq('pet_id', petId).gte('scheduled_at', new Date(fromMs).toISOString()).order('scheduled_at'));
  return rows.map(toFeeding);
}

/** Feedings dengan angka turunan; status tetap dari DB (threshold baru hanya untuk sesi baru). */
async function classifiedFeedings(pet, days) {
  const rows = await feedingsSince(pet.id, Date.now() - (days + BASELINE_EXTRA_DAYS) * DAY);
  return classifyAll(rows, pet, { keepStatus: true });
}

async function deviceWithStock(dev) {
  const weekAgo = Date.now() - 7 * DAY;
  const refilled = dev.hopper_refilled_at ? new Date(dev.hopper_refilled_at).getTime() : weekAgo;
  const pet = await currentPet(dev.id);
  return deviceView(dev, await feedingsSince(pet.id, Math.min(weekAgo, refilled)));
}

// ------------------------------------------------------------------ baca
export async function getSession() {
  const dev = await currentDevice();
  return q(sb().from('users').select('id, email').eq('id', dev.user_id).maybeSingle());
}

export async function getDevice() {
  return deviceWithStock(await currentDevice());
}

export async function getPet() {
  return currentPet((await currentDevice()).id);
}

export async function getSchedules() {
  const dev = await currentDevice();
  const rows = await q(sb().from('feeding_schedule').select('*').eq('device_id', dev.id).order('feed_time'));
  return rows.map(normalizeSchedule);
}

export async function getFeedings({ days = 7 } = {}) {
  const pet = await getPet();
  const from = Date.now() - days * DAY;
  return (await classifiedFeedings(pet, days))
    .filter((f) => new Date(f.scheduled_at).getTime() >= from)
    .reverse();
}

export async function getBaseline() {
  return currentBaseline(await classifiedFeedings(await getPet(), 7));
}

export async function getNotifications() {
  const dev = await currentDevice();
  const pet = await currentPet(dev.id);
  const [view, classified] = await Promise.all([deviceWithStock(dev), classifiedFeedings(pet, 7)]);
  return buildNotifications({ pet, dev: view, classified, readIds: readIds() });
}

// ------------------------------------------------------------------ tulis (Route Handlers)
async function call(method, url, body) {
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': isBlob ? 'image/jpeg' : 'application/json' },
      body: body === undefined ? undefined : isBlob ? body : JSON.stringify(body),
    });
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* respon tanpa body */ }
  if (!res.ok) throw new Error((data && data.error) || `Gagal menyimpan (HTTP ${res.status}).`);
  return data;
}

export const addSchedule = ({ feed_time }) => call('POST', '/api/schedules', { feed_time });
export const updateSchedule = (id, patch) => call('PATCH', `/api/schedules/${id}`, patch);
export const deleteSchedule = (id) => call('DELETE', `/api/schedules/${id}`);
export const updatePet = (patch) => call('PATCH', '/api/pet', patch);
export const uploadPetPhoto = async (blob) => (await call('POST', '/api/pet/photo', blob)).photo_url;
export const removePetPhoto = () => call('DELETE', '/api/pet/photo');
export const markRefilled = () => call('POST', '/api/device/refill');
export const updateDevice = (patch) => call('PATCH', '/api/device', patch);
export const regenerateApiKey = async () => (await call('POST', '/api/device/api-key')).api_key;

// status dibaca tetap di browser (belum ada kolom/tabel di DB)
export const markNotificationRead = async (id) => { addReadIds([id]); return true; };
export const markAllRead = async (ids) => { addReadIds(ids); return true; };

// ------------------------------------------------------------------ realtime
/** Ada perubahan di feedings/devices (dari alat atau tab lain) → minta halaman memuat ulang. */
export function subscribe(cb) {
  const channel = sb()
    .channel('petfeeder-dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feedings' }, () => cb({ type: 'refresh', table: 'feedings' }))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => cb({ type: 'refresh', table: 'devices' }))
    .subscribe();
  return () => { sb().removeChannel(channel); };
}
