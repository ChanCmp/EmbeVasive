// POST /api/device/refill → hopper dianggap penuh lagi (sensor ultrasonik belum terpasang)
import { getCurrentDevice, getServiceClient } from '@/backend/supabase';
import { fail, handle, json } from '@/backend/http';

export const POST = handle(async (req) => {
  const dev = await getCurrentDevice(req);
  if (!dev) fail('Perangkat belum terdaftar.', 404);

  const now = new Date().toISOString();
  const { data, error } = await getServiceClient()
    .from('devices')
    .update({ hopper_refilled_at: now, hopper_level_pct: 100, hopper_read_at: now })
    .eq('id', dev.id)
    .select('id, hopper_refilled_at, hopper_level_pct, hopper_read_at')
    .single();
  if (error) throw error;
  return json(data);
});
