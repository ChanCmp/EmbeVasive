import 'server-only';
// Helper kecil untuk Route Handlers: respon JSON, error, validasi input

export const json = (data, status = 200) => Response.json(data, { status });

class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const fail = (message, status = 400) => { throw new HttpError(message, status); };

/** Bungkus handler: HttpError → status + pesan; error lain → 500 (detail hanya di log server). */
export function handle(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status);
      console.error('[api]', err);
      return json({ error: 'Terjadi kesalahan di server. Coba lagi.' }, 500);
    }
  };
}

export async function readJson(req) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Body harus berupa objek JSON.');
    return body;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    return fail('Body bukan JSON yang valid.');
  }
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export function requireTime(v, field = 'feed_time') {
  if (typeof v !== 'string' || !TIME_RE.test(v)) fail(`${field} harus berformat HH:MM (00:00–23:59).`);
  return v;
}

export function requireInt(v, field, min, max) {
  if (!Number.isInteger(v) || v < min || v > max) fail(`${field} harus bilangan bulat ${min}–${max}.`);
  return v;
}

export function requireNumber(v, field, min, max) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) fail(`${field} harus angka ${min}–${max}.`);
  return Math.round(v * 10) / 10; // kolom numeric(…,1)
}

export function requireText(v, field, maxLen = 40) {
  if (typeof v !== 'string' || !v.trim()) fail(`${field} wajib diisi.`);
  const t = v.trim();
  if (t.length > maxLen) fail(`${field} maksimal ${maxLen} karakter.`);
  return t;
}

export function requireId(v) {
  const id = Number(v);
  if (!Number.isInteger(id) || id <= 0) fail('ID tidak valid.');
  return id;
}

/** Kode error Postgres yang sering muncul */
export const PG = { UNIQUE: '23505', CHECK: '23514' };
