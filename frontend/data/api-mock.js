/* Implementasi data MOCK (tanpa database). Aktif bila NEXT_PUBLIC_USE_MOCK=true.
   Nama & bentuk fungsi sama persis dengan lib/data/api-supabase.js. */
import { getDB as getMockDB } from './mock-data';
import { classifyAll, currentBaseline } from '@/shared/domain/severity';
import { buildNotifications, deviceView } from '@/shared/domain/derive';
import { addReadIds, readIds } from '@/frontend/utils/read-state';

const PHOTO_KEY = 'petfeeder.petPhoto';
const DAY = 86400000;

let photoLoaded = false;
function getDB() {
  const db = getMockDB();
  if (!photoLoaded) {
    photoLoaded = true;
    // mock: foto yang pernah diunggah disimpan di browser
    try { const saved = localStorage.getItem(PHOTO_KEY); if (saved) db.pets[0].photo_url = saved; } catch { /* storage diblokir */ }
  }
  return db;
}

const delay = (v, ms = 180) => new Promise((r) => setTimeout(() => r(structuredClone(v)), ms));
const view = () => { const db = getDB(); return deviceView(db.devices[0], db.feedings); };
const classified = () => { const db = getDB(); return classifyAll(db.feedings, db.pets[0]); };

export const getSession = async () => delay(getDB().users[0], 50);
export const getDevice = async () => delay(view());
export const getPet = async () => delay(getDB().pets[0]);

export async function updatePet(patch) {
  const db = getDB();
  Object.assign(db.pets[0], patch);
  return delay(db.pets[0]);
}

export async function uploadPetPhoto(blob) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Gagal membaca foto.'));
    r.readAsDataURL(blob);
  });
  try { localStorage.setItem(PHOTO_KEY, dataUrl); } catch { /* penuh/diblokir: foto hilang saat refresh */ }
  getDB().pets[0].photo_url = dataUrl;
  return delay(dataUrl, 300);
}

export async function removePetPhoto() {
  try { localStorage.removeItem(PHOTO_KEY); } catch { /* storage diblokir */ }
  getDB().pets[0].photo_url = null;
  return delay(true, 100);
}

export const getSchedules = async () =>
  delay([...getDB().feeding_schedule].sort((a, b) => a.feed_time.localeCompare(b.feed_time)));

export async function addSchedule({ feed_time }) {
  const db = getDB();
  if (db.feeding_schedule.some((s) => s.feed_time === feed_time)) throw new Error('Sudah ada jadwal di jam ini.');
  const row = { id: Date.now(), device_id: 1, feed_time, is_active: true };
  db.feeding_schedule.push(row);
  return delay(row);
}

export async function updateSchedule(id, patch) {
  const row = getDB().feeding_schedule.find((s) => s.id === id);
  Object.assign(row, patch);
  return delay(row);
}

export async function deleteSchedule(id) {
  const db = getDB();
  db.feeding_schedule = db.feeding_schedule.filter((s) => s.id !== id);
  return delay(true);
}

export async function getFeedings({ days = 7 } = {}) {
  const from = Date.now() - days * DAY;
  return delay(classified().filter((f) => new Date(f.scheduled_at).getTime() >= from).reverse());
}

export const getBaseline = async () => delay(currentBaseline(classified()), 20);

export async function markRefilled() {
  const dev = getDB().devices[0];
  dev.hopper_refilled_at = new Date().toISOString();
  dev.hopper_level_pct = 100;
  dev.hopper_read_at = dev.hopper_refilled_at;
  return delay(view());
}

export async function updateDevice(patch) {
  Object.assign(getDB().devices[0], patch);
  return delay(view());
}

export async function regenerateApiKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return delay('pf_live_' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(''), 400);
}

export async function getNotifications() {
  const db = getDB();
  return delay(buildNotifications({ pet: db.pets[0], dev: view(), classified: classified(), readIds: readIds() }), 120);
}

export const markNotificationRead = async (id) => { addReadIds([id]); return delay(true, 20); };
export const markAllRead = async (ids) => { addReadIds(ids); return delay(true, 20); };

/** Realtime mock: berat bowl bergetar sedikit tiap 5 detik (noise load cell). */
export function subscribe(cb) {
  const t = setInterval(() => {
    const dev = getDB().devices[0];
    dev.last_seen_at = new Date().toISOString();
    const noise = (Math.random() - 0.5) * 0.6;
    const w = Math.max(0, Math.round((dev.bowl_weight_g + noise) * 10) / 10);
    dev.bowl_read_at = new Date().toISOString();
    cb({ type: 'bowl_weight', value: w, at: dev.bowl_read_at });
  }, 5000);
  return () => clearInterval(t);
}
