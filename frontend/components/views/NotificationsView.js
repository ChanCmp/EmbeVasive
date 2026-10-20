'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import { useApp } from '@/components/AppShell';
import { useData } from '@/components/hooks';
import { Loading, LoadError, NotifItem, SevBadge, Topbar } from '@/components/ui';
import { getNotifications, markAllRead, markNotificationRead } from '@/lib/data/api';

const TITLE = 'Notifikasi';

export default function NotificationsView() {
  const { refresh, toast } = useApp();
  const [filter, setFilter] = useState('all');
  const state = useData(getNotifications);

  if (state.error && !state.data) return <LoadError title={TITLE} message={state.error} />;
  if (!state.data) return <Loading title={TITLE} />;
  const all = state.data;
  const unread = all.filter((n) => !n.read);
  const list = filter === 'unread' ? unread : all;

  return (
    <>
      <Topbar title={TITLE} sub="Nafsu makan rendah, stok hampir habis, dan perangkat offline">
        <button className="btn" type="button" disabled={!unread.length} onClick={async () => {
          await markAllRead(unread.map((n) => n.id)); toast('Semua notifikasi ditandai dibaca'); refresh();
        }}><Icon name="check" />Tandai semua dibaca</button>
      </Topbar>

      <div className="filters" style={{ marginBottom: 'var(--gap)' }}>
        <div className="seg" role="group" aria-label="Filter">
          <button type="button" className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>Semua ({all.length})</button>
          <button type="button" className={filter === 'unread' ? 'on' : ''} onClick={() => setFilter('unread')}>Belum dibaca ({unread.length})</button>
        </div>
      </div>

      <section className="card">
        <div className="list">
          {list.length ? list.map((n, i) => (
            <div key={n.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderTop: i ? '1px solid var(--border)' : undefined }}>
              <div style={{ flex: 1, minWidth: 0 }}><NotifItem n={n} style={{ borderTop: 0 }} /></div>
              <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                <SevBadge status={n.severity} />
                {!n.read && (
                  <button className="btn btn-ghost btn-sm" type="button" onClick={async () => { await markNotificationRead(n.id); refresh(); }}>
                    Tandai dibaca
                  </button>
                )}
              </div>
            </div>
          )) : <div className="empty">Tidak ada notifikasi.</div>}
        </div>
      </section>
    </>
  );
}
