// POST /api/device/feedings  (alat, header X-Device-Key)
//      body: { schedule_id?, scheduled_at: ISO 8601, dispensed_g } → 201 { id, status }
//      Dipanggil tepat setelah dropper menjatuhkan makanan. leftover_g menyusul lewat PATCH.
import { getServiceClient } from '@/backend/supabase';
import { fail, handle, json, readJson, requireId, requireNumber } from '@/backend/http';
import { petOrFail, q } from '@/backend/data';
import { deviceFromKey } from '@/backend/device-auth';

export const POST = handle(async (req) => {
  const dev = await deviceFromKey(req);
  const body = await readJson(req);
  const dispensed_g = requireNumber(body.dispensed_g, 'dispensed_g', 0, 1000);
  const at = typeof body.scheduled_at === 'string' ? new Date(body.scheduled_at) : null;
  if (!at || Number.isNaN(at.getTime())) fail('scheduled_at harus tanggal ISO 8601, mis. "2026-10-20T07:00:00+07:00".');

  const pet = await petOrFail(dev.id);
  const db = getServiceClient();

  let schedule_id = null;
  if (body.schedule_id != null) {
    schedule_id = requireId(body.schedule_id);
    const s = await q(db.from('feeding_schedule').select('id').eq('id', schedule_id).eq('device_id', dev.id).maybeSingle());
    if (!s) fail('Jadwal tidak ditemukan untuk alat ini.', 404);
  }

  const data = await q(db.from('feedings')
    .insert({ device_id: dev.id, pet_id: pet.id, schedule_id, scheduled_at: at.toISOString(), dispensed_g })
    .select('id, status').single());
  return json(data, 201);
});
