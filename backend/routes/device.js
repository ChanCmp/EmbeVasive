// PATCH /api/device  body: { name }
import { getCurrentDevice, getServiceClient } from '@/lib/supabase/server';
import { fail, handle, json, readJson, requireText } from '@/lib/server/http';

export const PATCH = handle(async (req) => {
  const body = await readJson(req);
  const name = requireText(body.name, 'Nama perangkat');

  const dev = await getCurrentDevice();
  if (!dev) fail('Perangkat belum terdaftar.', 404);

  const { data, error } = await getServiceClient()
    .from('devices').update({ name }).eq('id', dev.id).select('id, name').single();
  if (error) throw error;
  return json(data);
});
