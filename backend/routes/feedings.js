// GET /api/feedings?days=7 → sesi makan N hari terakhir (terbaru dulu),
//     tiap item + consumed_pct, baseline_pct, drop_pct. days: 1–90, default 7.
import { fail, handle, json } from '@/backend/http';
import { classifiedFeedings, deviceOrFail, petOrFail } from '@/backend/data';

const DAY = 86400000;

export const GET = handle(async (req) => {
  const raw = new URL(req.url).searchParams.get('days');
  const days = raw == null ? 7 : Number(raw);
  if (!Number.isInteger(days) || days < 1 || days > 90) fail('days harus bilangan bulat 1–90.');

  const pet = await petOrFail((await deviceOrFail(req)).id);
  const from = Date.now() - days * DAY;
  const rows = (await classifiedFeedings(pet, days))
    .filter((f) => new Date(f.scheduled_at).getTime() >= from)
    .reverse();
  return json(rows);
});
