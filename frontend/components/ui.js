'use client';
// Komponen kecil yang dipakai banyak halaman
import Icon from './Icon';
import { useApp } from './AppShell';
import { SEVERITY_META } from '@/shared/domain/severity';
import { timeAgo } from '@/frontend/utils/format';

const SEV_ICON = { normal: 'checkCircle', watch: 'eye', moderate: 'alert', urgent: 'octagon', pending: 'clock' };

/** Badge severity: ikon + label + warna (tidak pernah warna saja). */
export function SevBadge({ status, className = '' }) {
  return (
    <span className={`sev sev-${status} ${className}`.trim()}>
      <Icon name={SEV_ICON[status]} />
      {SEVERITY_META[status].label}
    </span>
  );
}

export function Topbar({ title, sub, children }) {
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div className="spacer" />
      {children}
    </header>
  );
}

export function DeviceChip({ dev }) {
  const { live } = useApp();
  const seen = live ? live.at : dev.last_seen_at;
  return dev.online ? (
    <span className="chip chip-online">
      <span className="dot live-dot" />Online · {timeAgo(seen)}
    </span>
  ) : (
    <span className="chip chip-offline">
      <Icon name="wifiOff" size={14} />Offline · {timeAgo(dev.last_seen_at)}
    </span>
  );
}

export function ChartLegend() {
  return (
    <div className="legend">
      <span><i style={{ background: 'var(--st-normal)' }} />Normal</span>
      <span><i style={{ background: 'var(--st-watch)' }} />Ringan</span>
      <span><i style={{ background: 'var(--st-moderate)' }} />Sedang</span>
      <span><i style={{ background: 'var(--st-urgent)' }} />Parah</span>
      <span><i className="dash" />Baseline</span>
    </div>
  );
}

const KIND_ICON = { appetite: 'activity', stock: 'box', offline: 'wifiOff' };

export function NotifItem({ n, style }) {
  return (
    <div className="list-item" style={{ ...(n.read ? { opacity: 0.6 } : null), ...style }}>
      <div className="list-icon" style={{ background: `var(--st-${n.severity}-bg)`, color: `var(--st-${n.severity}-ink)` }}>
        <Icon name={KIND_ICON[n.kind]} />
      </div>
      <div className="list-body">
        <div className="list-title">{n.title}</div>
        <div className="list-desc">{n.desc}</div>
        <div className="tiny" style={{ marginTop: 4 }}>{timeAgo(n.at)}{n.read ? ' · dibaca' : ''}</div>
      </div>
    </div>
  );
}

/** Foto pet yang bisa diklik untuk unggah/ganti. */
export function PetPhoto({ pet, className = '' }) {
  const { pickPhoto, photoBusy } = useApp();
  const action = pet.photo_url ? 'Ganti' : 'Unggah';
  return (
    <button
      type="button"
      className={`hero-pet ${className} ${photoBusy ? 'busy' : ''}`.trim()}
      onClick={pickPhoto}
      aria-label={`${action} foto ${pet.name}`}
      aria-busy={photoBusy || undefined}
      title={`${action} foto`}
    >
      {pet.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL / URL Supabase Storage
        <img src={pet.photo_url} alt={`Foto ${pet.name}`} />
      ) : (
        <span className="hero-pet-ph"><Icon name="paw" /><span>Foto pet</span></span>
      )}
      <span className="photo-edit" aria-hidden="true"><Icon name="camera" /></span>
    </button>
  );
}

export function Loading({ title }) {
  return (
    <>
      <Topbar title={title} />
      <div className="card"><div className="empty">Memuat data…</div></div>
    </>
  );
}

/** Tampilan saat data gagal dimuat (mis. Supabase di-pause / koneksi putus). */
export function LoadError({ title, message }) {
  const { refresh } = useApp();
  return (
    <>
      <Topbar title={title} />
      <div className="card">
        <div className="callout warn">
          <Icon name="alert" />
          <div>
            <b>Data tidak bisa dimuat.</b><br />{message}
          </div>
        </div>
        <button type="button" className="btn" style={{ marginTop: 14 }} onClick={refresh}>
          <Icon name="refresh" />Coba lagi
        </button>
      </div>
    </>
  );
}
