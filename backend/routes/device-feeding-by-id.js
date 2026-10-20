// PATCH /api/device/feedings/[id]  (alat, header X-Device-Key)
//       body: { leftover_g } → sisa makanan setelah pet selesai makan,
//       lalu reclassify_feedings() menghitung status severity → { id, leftover_g, status }
import { getServiceClient } from '@/backend/supabase';
import { fail, handle, json, readJson, requireId, requireNumber } from '@/backend/http';
import { q } from '@/backend/data';
import { deviceFromKey } from '@/backend/device-auth';

export const PATCH = handle(async (req, ctx) => {
  const dev = await deviceFromKey(req);
  const id = requireId((await ctx.params).id);
  const body = await readJson(req);
  const leftover_g = requireNumber(body.leftover_g, 'leftover_g', 0, 1000);

  const db = getServiceClient();

  const f = await q(db.from('feedings').select('id, pet_id, dispensed_g').eq('id', id).eq('device_id', dev.id).maybeSingle());
  if (!f) fail('Sesi makan tidak ditemukan untuk alat ini.', 404);
  if (leftover_g > Number(f.dispensed_g)) fail(`leftover_g tidak boleh lebih dari dispensed_g (${Number(f.dispensed_g)} g).`);

  await q(db.from('feedings').update({ leftover_g }).eq('id', id));
  await q(db.rpc('reclassify_feedings', { p_pet_id: f.pet_id }));

  const data = await q(db.from('feedings').select('id, leftover_g, status').eq('id', id).single());
  return json({ ...data, leftover_g: Number(data.leftover_g) });
});
