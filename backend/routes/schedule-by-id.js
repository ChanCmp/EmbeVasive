// PATCH  /api/schedules/[id]  body: { feed_time?: "HH:MM", is_active?: boolean }
// DELETE /api/schedules/[id]  (riwayat makan tetap ada, feedings.schedule_id → NULL)
import { getCurrentDevice, getServiceClient } from '@/backend/supabase';
import { fail, handle, json, PG, readJson, requireId, requireTime } from '@/backend/http';
import { normalizeSchedule } from '@/shared/domain/derive';

async function deviceOrFail() {
  const dev = await getCurrentDevice();
  if (!dev) fail('Perangkat belum terdaftar.', 404);
  return dev;
}

export const PATCH = handle(async (req, ctx) => {
  const id = requireId((await ctx.params).id);
  const body = await readJson(req);

  const patch = {};
  if (body.feed_time !== undefined) patch.feed_time = requireTime(body.feed_time);
  if (body.is_active !== undefined) {
    if (typeof body.is_active !== 'boolean') fail('is_active harus true atau false.');
    patch.is_active = body.is_active;
  }
  if (!Object.keys(patch).length) fail('Tidak ada perubahan yang dikirim.');

  const dev = await deviceOrFail();
  const { data, error } = await getServiceClient()
    .from('feeding_schedule')
    .update(patch)
    .eq('id', id)
    .eq('device_id', dev.id)
    .select()
    .maybeSingle();
  if (error) {
    if (error.code === PG.UNIQUE) fail('Sudah ada jadwal di jam ini.', 409);
    throw error;
  }
  if (!data) fail('Jadwal tidak ditemukan.', 404);
  return json(normalizeSchedule(data));
});

export const DELETE = handle(async (_req, ctx) => {
  const id = requireId((await ctx.params).id);
  const dev = await deviceOrFail();
  const { data, error } = await getServiceClient()
    .from('feeding_schedule')
    .delete()
    .eq('id', id)
    .eq('device_id', dev.id)
    .select('id');
  if (error) throw error;
  if (!data.length) fail('Jadwal tidak ditemukan.', 404);
  return json({ ok: true });
});
