// GET /api/device/schedules  (alat, header X-Device-Key)
//     → jadwal AKTIF saja, urut jam: [{ id, feed_time: "HH:MM" }]
import { getServiceClient } from '@/backend/supabase';
import { handle, json } from '@/backend/http';
import { q } from '@/backend/data';
import { deviceFromKey } from '@/backend/device-auth';
import { normalizeSchedule } from '@/shared/domain/derive';

export const GET = handle(async (req) => {
  const dev = await deviceFromKey(req);
  const rows = await q(getServiceClient()
    .from('feeding_schedule').select('id, feed_time')
    .eq('device_id', dev.id).eq('is_active', true).order('feed_time'));
  return json(rows.map(normalizeSchedule));
});
