import 'server-only';
/* Client Supabase dengan service role — HANYA untuk Route Handlers.
   Melewati RLS, jadi semua validasi input wajib dilakukan sebelum menulis. */
import { createClient } from '@supabase/supabase-js';
import { fail } from '@/backend/http';

let client = null;

export function getServiceClient() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local');
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

/** User yang login, dari header "Authorization: Bearer <access token>" (dikirim frontend/data/api-supabase.js). */
export async function getCurrentUser(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) fail('Silakan masuk dulu.', 401);
  const { data, error } = await getServiceClient().auth.getUser(token);
  if (error || !data.user) fail('Sesi habis. Silakan masuk lagi.', 401);
  return data.user;
}

/** Perangkat milik user yang login (null bila belum menghubungkan perangkat). */
export async function getCurrentDevice(req) {
  const user = await getCurrentUser(req);
  const { data, error } = await getServiceClient()
    .from('devices').select('*').eq('user_id', user.id).order('id').limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCurrentPet(deviceId) {
  const { data, error } = await getServiceClient()
    .from('pets').select('*').eq('device_id', deviceId).maybeSingle();
  if (error) throw error;
  return data;
}
