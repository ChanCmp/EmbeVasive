// PATCH /api/pet  body: { name, watch_pct, moderate_pct, urgent_pct, moderate_session }
// Threshold baru hanya berlaku untuk sesi makan berikutnya — status lama tidak dihitung ulang.
import { getCurrentDevice, getCurrentPet, getServiceClient } from '@/lib/supabase/server';
import { fail, handle, json, readJson, requireInt, requireText } from '@/lib/server/http';

export const PATCH = handle(async (req) => {
  const body = await readJson(req);
  const patch = {
    name: requireText(body.name, 'Nama pet'),
    watch_pct: requireInt(body.watch_pct, 'Threshold Ringan', 1, 100),
    moderate_pct: requireInt(body.moderate_pct, 'Threshold Sedang', 1, 100),
    urgent_pct: requireInt(body.urgent_pct, 'Threshold Parah', 1, 100),
    moderate_session: requireInt(body.moderate_session, 'Sesi beruntun', 1, 10),
  };
  if (!(patch.watch_pct < patch.moderate_pct && patch.moderate_pct < patch.urgent_pct)) {
    fail('Urutan harus: Ringan < Sedang < Parah.');
  }

  const dev = await getCurrentDevice();
  if (!dev) fail('Perangkat belum terdaftar.', 404);
  const pet = await getCurrentPet(dev.id);
  if (!pet) fail('Pet belum terdaftar.', 404);

  const { data, error } = await getServiceClient()
    .from('pets').update(patch).eq('id', pet.id).select().single();
  if (error) throw error;
  return json(data);
});
