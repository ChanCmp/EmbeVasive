/* Client Supabase untuk browser: anon key, hanya bisa MEMBACA (RLS) + Realtime.
   Semua penulisan lewat Route Handlers di app/api.
   Sesi login disimpan di localStorage; tokennya dikirim ke app/api di header Authorization. */
import { createClient } from '@supabase/supabase-js';

let client = null;

export function getBrowserClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di .env.local');
    client = createClient(url, key);
  }
  return client;
}
