// GET /api/user → pemilik perangkat { id, email } (login belum ada: pemilik device pertama)
import { getServiceClient } from '@/backend/supabase';
import { fail, handle, json } from '@/backend/http';
import { deviceOrFail, q } from '@/backend/data';

export const GET = handle(async () => {
  const dev = await deviceOrFail();
  const user = await q(getServiceClient().from('users').select('id, email').eq('id', dev.user_id).maybeSingle());
  if (!user) fail('User tidak ditemukan.', 404);
  return json(user);
});
