// GET /api/user → user yang login { id, email, device_id } (device_id null = belum menghubungkan perangkat)
import { getCurrentDevice, getCurrentUser } from '@/backend/supabase';
import { handle, json } from '@/backend/http';

export const GET = handle(async (req) => {
  const user = await getCurrentUser(req);
  const dev = await getCurrentDevice(req);
  return json({ id: user.id, email: user.email, device_id: dev ? dev.id : null });
});
