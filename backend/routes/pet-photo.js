// POST   /api/pet/photo  body: JPEG mentah (Content-Type: image/jpeg, maks 1 MB)
//        → simpan di bucket pet-photos, isi pets.photo_url, hapus foto lama
// DELETE /api/pet/photo  → hapus file + pets.photo_url = null
import { getCurrentDevice, getCurrentPet, getServiceClient } from '@/backend/supabase';
import { fail, handle, json } from '@/backend/http';

const BUCKET = 'pet-photos';
const MAX_BYTES = 1024 * 1024;

async function petOrFail() {
  const dev = await getCurrentDevice();
  if (!dev) fail('Perangkat belum terdaftar.', 404);
  const pet = await getCurrentPet(dev.id);
  if (!pet) fail('Pet belum terdaftar.', 404);
  return pet;
}

/** URL publik → path file di bucket (null jika bukan file dari bucket ini). */
function storagePath(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url ? url.indexOf(marker) : -1;
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
}

async function removeOld(url) {
  const path = storagePath(url);
  if (!path) return;
  const { error } = await getServiceClient().storage.from(BUCKET).remove([path]);
  if (error) console.warn('[api] gagal hapus foto lama', path, error.message);
}

export const POST = handle(async (req) => {
  if (!(req.headers.get('content-type') || '').startsWith('image/jpeg')) {
    fail('Foto harus dikirim sebagai JPEG (Content-Type: image/jpeg).', 415);
  }
  const buf = new Uint8Array(await req.arrayBuffer());
  if (!buf.length) fail('File foto kosong.');
  if (buf.length > MAX_BYTES) fail('Ukuran foto maksimal 1 MB setelah dikompres.', 413);
  if (!(buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) fail('File bukan JPEG yang valid.', 415);

  const pet = await petOrFail();
  const db = getServiceClient();
  const path = `pet-${pet.id}-${Date.now()}.jpg`;

  const up = await db.storage.from(BUCKET).upload(path, buf, { contentType: 'image/jpeg', upsert: false });
  if (up.error) throw up.error;
  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await db.from('pets').update({ photo_url: pub.publicUrl }).eq('id', pet.id).select().single();
  if (error) {
    await db.storage.from(BUCKET).remove([path]); // jangan tinggalkan file yatim
    throw error;
  }
  await removeOld(pet.photo_url);
  return json({ photo_url: data.photo_url }, 201);
});

export const DELETE = handle(async () => {
  const pet = await petOrFail();
  const { error } = await getServiceClient().from('pets').update({ photo_url: null }).eq('id', pet.id);
  if (error) throw error;
  await removeOld(pet.photo_url);
  return json({ ok: true });
});
