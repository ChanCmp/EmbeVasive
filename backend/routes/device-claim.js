// POST /api/device/claim  body: { device_id } → hubungkan perangkat yang belum punya pemilik ke user yang login.
// Perangkat milik orang lain dibalas 404 yang sama dengan ID yang tidak ada, jadi keberadaannya tidak bocor.
// shortcut: kode = ID perangkat (mudah ditebak), ganti dengan kode pairing acak sebelum dipakai publik.
import { getCurrentUser, getServiceClient } from '@/backend/supabase';
import { fail, handle, json, readJson, requireId } from '@/backend/http';
import { q } from '@/backend/data';

export const POST = handle(async (req) => {
  const user = await getCurrentUser(req);
  const id = requireId((await readJson(req)).device_id);
  const db = getServiceClient();

  const dev = await q(db.from('devices').select('id, user_id').eq('id', id).maybeSingle());
  if (!dev || (dev.user_id && dev.user_id !== user.id)) fail('Perangkat tidak ditemukan.', 404);
  if (dev.user_id === user.id) return json({ device_id: id });

  const mine = await q(db.from('devices').select('id').eq('user_id', user.id).limit(1).maybeSingle());
  if (mine) fail('Akun ini sudah terhubung ke perangkat lain.', 409);

  // bersyarat user_id IS NULL: kalau ada yang mengklaim duluan, tidak ada baris yang berubah
  const claimed = await q(db.from('devices')
    .update({ user_id: user.id, paired_at: new Date().toISOString() })
    .eq('id', id).is('user_id', null).select('id'));
  if (!claimed.length) fail('Perangkat tidak ditemukan.', 404);
  return json({ device_id: id }, 201);
});
