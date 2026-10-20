/* =========================================================
   Lapisan data yang dipakai semua komponen.
   Memilih implementasi:
     - lib/data/api-supabase.js  (default) — baca dari Supabase, tulis lewat app/api
     - lib/data/api-mock.js      — data contoh di browser, aktif bila NEXT_PUBLIC_USE_MOCK=true
   Semua fungsi hanya boleh dipanggil di browser (useEffect / event handler).
   ========================================================= */
import * as mock from './api-mock';
import * as real from './api-supabase';

export { LOW_STOCK_PCT } from '@/lib/domain/derive';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const impl = USE_MOCK ? mock : real;

export const getSession = (...a) => impl.getSession(...a);
export const getDevice = (...a) => impl.getDevice(...a);
export const getPet = (...a) => impl.getPet(...a);
export const getSchedules = (...a) => impl.getSchedules(...a);
export const getFeedings = (...a) => impl.getFeedings(...a);
export const getBaseline = (...a) => impl.getBaseline(...a);
export const getNotifications = (...a) => impl.getNotifications(...a);

export const addSchedule = (...a) => impl.addSchedule(...a);
export const updateSchedule = (...a) => impl.updateSchedule(...a);
export const deleteSchedule = (...a) => impl.deleteSchedule(...a);
export const updatePet = (...a) => impl.updatePet(...a);
export const uploadPetPhoto = (...a) => impl.uploadPetPhoto(...a);
export const removePetPhoto = (...a) => impl.removePetPhoto(...a);
export const markRefilled = (...a) => impl.markRefilled(...a);
export const updateDevice = (...a) => impl.updateDevice(...a);
export const regenerateApiKey = (...a) => impl.regenerateApiKey(...a);
export const markNotificationRead = (...a) => impl.markNotificationRead(...a);
export const markAllRead = (...a) => impl.markAllRead(...a);

export const subscribe = (...a) => impl.subscribe(...a);
