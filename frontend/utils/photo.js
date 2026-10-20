// Proses foto pet di browser sebelum diunggah
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

/** Potong tengah jadi persegi, resize ke size×size, hasilkan JPEG (±50–100 KB). */
export async function resizeImage(file, size = 512) {
  if (!PHOTO_TYPES.includes(file.type)) throw new Error('Format foto harus JPG, PNG, atau WebP.');
  if (file.size > PHOTO_MAX_BYTES) throw new Error('Ukuran foto maksimal 10 MB.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('File gambar tidak bisa dibaca.'));
      i.src = url;
    });
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // PNG transparan jangan jadi hitam
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
    return await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses foto.'))), 'image/jpeg', 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}
