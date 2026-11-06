/* Implementasi data ASLI — semua baca & tulis lewat Route Handlers di app/api
   (backend memakai service role + validasi). Browser hanya memakai Supabase
   langsung untuk login dan Realtime (anon key, RLS hanya mengizinkan SELECT data milik sendiri). */
import { getBrowserClient } from '@/frontend/supabase';
import { addReadIds, readIds } from '@/frontend/utils/read-state';

const sb = () => getBrowserClient();

async function call(method, url, body) {
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;
  const { data: { session } } = await sb().auth.getSession();
  const headers = {};
  if (session) headers.Authorization = `Bearer ${session.access_token}`;
  if (body !== undefined) headers['Content-Type'] = isBlob ? 'image/jpeg' : 'application/json';
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : isBlob ? body : JSON.stringify(body),
    });
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* respon tanpa body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Permintaan gagal (HTTP ${res.status}).`);
    err.status = res.status; // 401 → AppShell mengarahkan ke /login
    throw err;
  }
  return data;
}

// ------------------------------------------------------------------ login
export async function signIn(email, password) {
  const { error } = await sb().auth.signInWithPassword({ email, password });
  if (error) throw error;
}
/** true = langsung masuk; false = perlu konfirmasi email dulu (opsi "Confirm email" di Supabase aktif). */
export async function signUp(email, password) {
  const { data, error } = await sb().auth.signUp({ email, password });
  if (error) throw error;
  return !!data.session;
}
export const signOut = () => sb().auth.signOut();
export const claimDevice = (device_id) => call('POST', '/api/device/claim', { device_id });

// ------------------------------------------------------------------ baca
export const getSession = () => call('GET', '/api/user');
export const getDevice = () => call('GET', '/api/device');
export const getPet = () => call('GET', '/api/pet');
export const getSchedules = () => call('GET', '/api/schedules');
export const getFeedings = ({ days = 7 } = {}) => call('GET', `/api/feedings?days=${days}`);
export const getBaseline = async () => (await call('GET', '/api/pet/baseline')).baseline_pct;

export async function getNotifications() {
  const read = readIds();
  return (await call('GET', '/api/notifications')).map((n) => ({ ...n, read: read.has(n.id) }));
}

// ------------------------------------------------------------------ tulis
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
