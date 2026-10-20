// GET /api/notifications → notifikasi turunan (nafsu makan, stok, offline), terbaru dulu.
// Status "sudah dibaca" belum ada di DB → ditandai di browser (frontend/utils/read-state.js).
import { handle, json } from '@/backend/http';
import { classifiedFeedings, deviceOrFail, deviceWithStock, petOrFail } from '@/backend/data';
import { buildNotifications } from '@/shared/domain/derive';

export const GET = handle(async () => {
  const dev = await deviceOrFail();
  const pet = await petOrFail(dev.id);
  const [view, classified] = await Promise.all([deviceWithStock(dev, pet), classifiedFeedings(pet, 7)]);
  const items = buildNotifications({ pet, dev: view, classified, readIds: new Set() });
  return json(items.map(({ read, ...n }) => n));
});
