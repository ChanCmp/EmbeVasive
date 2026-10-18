'use client';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from './AppShell';

/**
 * Muat data halaman; otomatis dimuat ulang saat `version` (AppShell) atau deps berubah.
 * Mengembalikan { data, error } — error berisi pesan yang siap ditampilkan.
 */
export function useData(loader, deps = []) {
  const { version } = useApp();
  const [state, setState] = useState({ data: null, error: null });

  useEffect(() => {
    let alive = true;
    loader()
      .then((data) => { if (alive) setState({ data, error: null }); })
      .catch((err) => { if (alive) setState((s) => ({ data: s.data, error: err.message || String(err) })); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  return state;
}

/**
 * Jalankan aksi tulis: tombol nonaktif selama berjalan, toast sukses/gagal,
 * lalu semua halaman memuat ulang data. run() mengembalikan true bila berhasil.
 */
export function useAction() {
  const { toast, refresh } = useApp();
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      if (successMsg) toast(successMsg);
      refresh();
      return true;
    } catch (err) {
      toast(err.message || 'Gagal menyimpan.', 'alert');
      return false;
    } finally {
      setBusy(false);
    }
  }, [toast, refresh]);

  return [busy, run];
}
