// POST /api/device/api-key → buat API key alat baru.
// Hanya hash SHA-256 yang disimpan; key asli dikembalikan SEKALI ke browser.
import { createHash, randomBytes } from 'node:crypto';
import { getCurrentDevice, getServiceClient } from '@/lib/supabase/server';
import { fail, handle, json } from '@/lib/server/http';

export const POST = handle(async () => {
  const dev = await getCurrentDevice();
  if (!dev) fail('Perangkat belum terdaftar.', 404);

  const apiKey = 'pf_live_' + randomBytes(20).toString('hex');
  const hash = createHash('sha256').update(apiKey).digest('hex');

  const { error } = await getServiceClient().from('devices').update({ api_key_hash: hash }).eq('id', dev.id);
  if (error) throw error;
  return json({ api_key: apiKey }, 201);
});
