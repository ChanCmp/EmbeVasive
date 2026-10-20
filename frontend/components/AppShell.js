'use client';
/* Kerangka aplikasi: sidebar, navigasi bawah (HP), tema, toast,
   badge notifikasi, data realtime, dan pemilih foto pet.
   Semua halaman dashboard mengakses ini lewat useApp(). */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import { getNotifications, getSession, subscribe, uploadPetPhoto } from '@/lib/data/api';
import { PHOTO_TYPES, resizeImage } from '@/lib/utils/photo';

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const NAV = [
  { href: '/', label: 'Ringkasan', short: 'Ringkasan', icon: 'home' },
  { href: '/riwayat', label: 'Riwayat Makan', short: 'Riwayat', icon: 'chart' },
  { href: '/jadwal', label: 'Jadwal', short: 'Jadwal', icon: 'calendar' },
  { href: '/notifikasi', label: 'Notifikasi', short: 'Notif', icon: 'bell' },
  { href: '/pet', label: 'Profil Pet', short: 'Pet', icon: 'paw' },
  { href: '/perangkat', label: 'Perangkat', short: 'Alat', icon: 'cpu' },
];

const THEMES = ['auto', 'light', 'dark'];
const THEME_LABEL = { auto: ['monitor', 'Tema: otomatis'], light: ['sun', 'Tema: terang'], dark: ['moon', 'Tema: gelap'] };
const THEME_KEY = 'petfeeder.theme';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [unread, setUnread] = useState(0);
  const [version, setVersion] = useState(0); // naik setiap ada perubahan data -> halaman memuat ulang
  const [live, setLive] = useState(null);    // { bowl, at } dari realtime
  const [toasts, setToasts] = useState([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [theme, setTheme] = useState('auto');

  const toast = useCallback((msg, icon = 'check') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((t) => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => { getSession().then(setUser).catch(() => setUser(null)); }, [version]);

  useEffect(() => {
    let alive = true;
    getNotifications()
      .then((list) => { if (alive) setUnread(list.filter((n) => !n.read).length); })
      .catch(() => { if (alive) setUnread(0); });
    return () => { alive = false; };
  }, [version, pathname]);

  // realtime: mock mengirim berat bowl; Supabase mengirim "refresh" saat feedings/devices berubah
  useEffect(() => subscribe((msg) => {
    if (msg.type === 'bowl_weight') setLive({ bowl: msg.value, at: msg.at });
    else if (msg.type === 'refresh') refresh();
  }), [refresh]);

  // tema: nilai awal sudah dipasang skrip di <head> (app/layout.js) supaya tidak berkedip
  useEffect(() => {
    try { setTheme(localStorage.getItem(THEME_KEY) || 'auto'); } catch { /* storage diblokir */ }
  }, []);
  const cycleTheme = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(next);
    if (next === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* storage diblokir */ }
  };

  const pickPhoto = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = PHOTO_TYPES.join(',');
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      setPhotoBusy(true);
      try {
        await uploadPetPhoto(await resizeImage(file));
        toast('Foto pet diperbarui');
        refresh();
      } catch (err) {
        toast(err.message, 'alert');
      } finally {
        setPhotoBusy(false);
      }
    });
    input.click();
  }, [toast, refresh]);

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const navItem = (r, mobile) => (
    <Link key={r.href} href={r.href} className={isActive(r.href) ? 'active' : ''} aria-current={isActive(r.href) ? 'page' : undefined}>
      <Icon name={r.icon} />
      <span>{mobile ? r.short : r.label}</span>
      {r.href === '/notifikasi' && unread > 0 && <span className="badge">{unread}</span>}
    </Link>
  );

  const [themeIcon, themeLabel] = THEME_LABEL[theme];

  return (
    <AppCtx.Provider value={{ toast, refresh, version, live, pickPhoto, photoBusy }}>
      <div className="app">
        <aside className="sidebar" aria-label="Navigasi utama">
          <div className="brand">
            <div className="brand-logo"><Icon name="paw" /></div>
            <div>
              <div className="brand-name">PawFeeder</div>
              <div className="brand-sub">Monitoring nafsu makan</div>
            </div>
          </div>
          <nav className="nav">{NAV.map((r) => navItem(r, false))}</nav>
          <div className="sidebar-foot">
            <button className="btn btn-ghost" type="button" onClick={cycleTheme}>
              <Icon name={themeIcon} />{themeLabel}
            </button>
            <div className="user-chip">
              <div className="avatar">{user ? user.email[0].toUpperCase() : '?'}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="email">{user ? user.email : '—'}</div>
                <Link className="tiny" href="/login">Keluar</Link>
              </div>
            </div>
          </div>
        </aside>

        <main className="main" tabIndex={-1}>{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="Navigasi">{NAV.map((r) => navItem(r, true))}</nav>

      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div className="toast" key={t.id}><Icon name={t.icon} /><span>{t.msg}</span></div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}
