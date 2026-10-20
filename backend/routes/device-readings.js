// POST /api/device/readings  (alat, header X-Device-Key)
//      body: { bowl_weight_g?, hopper_level_pct? } — heartbeat + pembacaan sensor terbaru.
//      Body kosong {} tetap sah: hanya memperbarui last_seen_at.
import { getServiceClient } from '@/backend/supabase';
import { handle, json, readJson, requireNumber } from '@/backend/http';
import { q } from '@/backend/data';
import { deviceFromKey } from '@/backend/device-auth';

export const POST = handle(async (req) => {
  const dev = await deviceFromKey(req);
  const body = await readJson(req);

  const now = new Date().toISOString();
  const patch = {};
  if (body.bowl_weight_g !== undefined) {
    patch.bowl_weight_g = requireNumber(body.bowl_weight_g, 'bowl_weight_g', 0, 5000);
    patch.bowl_read_at = now;
  }
  if (body.hopper_level_pct !== undefined) {
    patch.hopper_level_pct = requireNumber(body.hopper_level_pct, 'hopper_level_pct', 0, 100);
    patch.hopper_read_at = now;
  }

  if (!Object.keys(patch).length) return json({ ok: true, last_seen_at: dev.last_seen_at });

  const data = await q(getServiceClient()
    .from('devices').update(patch).eq('id', dev.id)
    .select('last_seen_at, bowl_weight_g, bowl_read_at, hopper_level_pct, hopper_read_at').single());
  return json({ ok: true, ...data });
});
