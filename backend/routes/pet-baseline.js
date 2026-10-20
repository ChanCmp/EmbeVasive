// GET /api/pet/baseline → { baseline_pct } rata-rata % dimakan dari sesi normal terakhir (null bila belum cukup data)
import { handle, json } from '@/backend/http';
import { classifiedFeedings, deviceOrFail, petOrFail } from '@/backend/data';
import { currentBaseline } from '@/shared/domain/severity';

export const GET = handle(async () => {
  const pet = await petOrFail((await deviceOrFail()).id);
  return json({ baseline_pct: currentBaseline(await classifiedFeedings(pet, 7)) });
});
