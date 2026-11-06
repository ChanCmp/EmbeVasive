// GET   /api/device  → perangkat + status stok/online (tanpa api_key_hash)
// PATCH /api/device  body: { name }
import { getCurrentDevice, getServiceClient } from '@/backend/supabase';
import { fail, handle, json, readJson, requireText } from '@/backend/http';
import { deviceOrFail, deviceWithStock, petOrFail } from '@/backend/data';

export const GET = handle(async (req) => {
  const dev = await deviceOrFail(req);
  return json(await deviceWithStock(dev, await petOrFail(dev.id)));
});

export const PATCH = handle(async (req) => {
  const body = await readJson(req);
  const name = requireText(body.name, 'Nama perangkat');

  const dev = await getCurrentDevice(req);
  if (!dev) fail('Perangkat belum terdaftar.', 404);

  const { data, error } = await getServiceClient()
    .from('devices').update({ name }).eq('id', dev.id).select('id, name').single();
  if (error) throw error;
  return json(data);
});
