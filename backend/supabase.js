import 'server-only';
/* Client Supabase dengan service role — HANYA untuk Route Handlers.
   Melewati RLS, jadi semua validasi input wajib dilakukan sebelum menulis. */
import { createClient } from '@supabase/supabase-js';

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

// Login belum ada: "perangkat milik user" = device pertama, pet = pet milik device itu.
// Diganti filter berdasarkan auth.uid() saat login dibuat.
export async function getCurrentDevice() {
  const { data, error } = await getServiceClient()
    .from('devices').select('*').order('id').limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCurrentPet(deviceId) {
  const { data, error } = await getServiceClient()
    .from('pets').select('*').eq('device_id', deviceId).maybeSingle();
  if (error) throw error;
  return data;
}
