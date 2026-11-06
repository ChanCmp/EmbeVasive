// GET  /api/schedules  → semua jadwal, urut jam
// POST /api/schedules  body: { feed_time: "HH:MM" } → jadwal baru (aktif)
import { getCurrentDevice, getServiceClient } from '@/backend/supabase';
import { fail, handle, json, PG, readJson, requireTime } from '@/backend/http';
import { normalizeSchedule } from '@/shared/domain/derive';
import { deviceOrFail, q } from '@/backend/data';

export const GET = handle(async (req) => {
  const dev = await deviceOrFail(req);
  const rows = await q(getServiceClient()
    .from('feeding_schedule').select('*').eq('device_id', dev.id).order('feed_time'));
  return json(rows.map(normalizeSchedule));
});

export const POST = handle(async (req) => {
  const body = await readJson(req);
  const feed_time = requireTime(body.feed_time);

  const dev = await getCurrentDevice(req);
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
