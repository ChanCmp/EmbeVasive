import 'server-only';
/* Autentikasi alat (ESP32): header X-Device-Key → SHA-256 → cocokkan devices.api_key_hash.
   Setiap request yang lolos juga memperbarui last_seen_at (= alat online). */
import { createHash } from 'node:crypto';
import { getServiceClient } from '@/backend/supabase';
import { fail } from '@/backend/http';
import { q } from '@/backend/data';

export async function deviceFromKey(req) {
  const key = req.headers.get('x-device-key');
  if (!key) fail('Header X-Device-Key wajib diisi.', 401);

  const hash = createHash('sha256').update(key).digest('hex');
  const db = getServiceClient();
  const dev = await q(db.from('devices').select('*').eq('api_key_hash', hash).maybeSingle());
  if (!dev) fail('API key alat tidak valid.', 401);

  const now = new Date().toISOString();
  await q(db.from('devices').update({ last_seen_at: now }).eq('id', dev.id));
  return { ...dev, last_seen_at: now };
}
