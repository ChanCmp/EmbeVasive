// POST /api/schedules  body: { feed_time: "HH:MM" } → jadwal baru (aktif)
import { getCurrentDevice, getServiceClient } from '@/lib/supabase/server';
import { fail, handle, json, PG, readJson, requireTime } from '@/lib/server/http';
import { normalizeSchedule } from '@/lib/domain/derive';

export const POST = handle(async (req) => {
  const body = await readJson(req);
  const feed_time = requireTime(body.feed_time);

  const dev = await getCurrentDevice();
  if (!dev) fail('Perangkat belum terdaftar.', 404);

  const { data, error } = await getServiceClient()
    .from('feeding_schedule')
    .insert({ device_id: dev.id, feed_time, is_active: true })
    .select()
    .single();
  if (error) {
    if (error.code === PG.UNIQUE) fail('Sudah ada jadwal di jam ini.', 409);
    throw error;
  }
  return json(normalizeSchedule(data), 201);
});
