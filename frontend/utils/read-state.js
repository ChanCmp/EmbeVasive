// Status "notifikasi sudah dibaca" — disimpan di browser (DB belum punya kolomnya)
const READ_KEY = 'petfeeder.readNotifications';

export function readIds() {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); }
}

export function addReadIds(ids) {
  const set = readIds();
  ids.forEach((i) => set.add(i));
  try { localStorage.setItem(READ_KEY, JSON.stringify([...set])); } catch { /* storage diblokir */ }
}
