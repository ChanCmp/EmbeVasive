'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import { useApp } from '@/components/AppShell';
import { useAction, useData } from '@/components/hooks';
import { DeviceChip, Loading, LoadError, Topbar } from '@/components/ui';
import { getDevice, LOW_STOCK_PCT, markRefilled, regenerateApiKey, updateDevice } from '@/lib/data/api';
import { fmtDate, fmtNum, fmtTime, timeAgo } from '@/lib/utils/format';

const TITLE = 'Perangkat';

export default function DeviceView() {
  const { toast, live } = useApp();
  const [busy, run] = useAction();
  const [modal, setModal] = useState(null); // 'rename' | 'regen'
  const [newKey, setNewKey] = useState(null);
  const state = useData(getDevice);

  if (state.error && !state.data) return <LoadError title={TITLE} message={state.error} />;
  if (!state.data) return <Loading title={TITLE} />;
  const dev = state.data;
  const bowl = live ? live.bowl : dev.bowl_weight_g;
  const bowlAt = live ? live.at : dev.bowl_read_at;
  const seen = live ? live.at : dev.last_seen_at;

  return (
    <>
      <Topbar title={TITLE} sub="ESP32 + load cell + servo + RTC + sensor ultrasonik">
        <DeviceChip dev={dev} />
      </Topbar>

      <section className="grid grid-dash">
        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <div className="card-head">
              <h2>Stok hopper</h2><div className="spacer" />
              <button className="btn btn-primary btn-sm" type="button" disabled={busy}
                onClick={() => run(markRefilled, 'Stok ditandai penuh')}>
                <Icon name="refresh" />Sudah diisi ulang
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="stat-value num">{fmtNum(dev.hopper_pct)}<small>%</small></span>
              <span className="muted small">±{fmtNum(dev.days_left, 1)} hari lagi (rata-rata {fmtNum(dev.daily_use_g)} g/hari)</span>
            </div>
            <div className={`meter ${dev.hopper_low ? 'low' : ''}`} style={{ margin: '10px 0 18px' }}>
              <span style={{ width: `${Math.min(100, dev.hopper_pct)}%` }} />
            </div>
            <dl className="kv">
              <dt>Sensor ultrasonik</dt>
              <dd>{dev.hopper_level_pct != null ? `${fmtNum(dev.hopper_level_pct)}% · ${timeAgo(dev.hopper_read_at)}` : '—'}</dd>
              <dt>Estimasi hitungan</dt>
              <dd>{fmtNum(dev.hopper_remaining_g)} g ({fmtNum(dev.hopper_est_pct)}%) dari kapasitas − total dispense</dd>
              <dt>Kapasitas</dt><dd>{fmtNum(dev.hopper_capacity_g)} g</dd>
              <dt>Terakhir diisi</dt><dd>{fmtDate(dev.hopper_refilled_at)}, {fmtTime(dev.hopper_refilled_at)}</dd>
            </dl>
            {dev.hopper_low && (
              <div className="callout warn" style={{ marginTop: 16 }}>
                <Icon name="alert" />
                <div>Stok di bawah {LOW_STOCK_PCT}%. Isi ulang lalu tekan “Sudah diisi ulang”.</div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h2>Bowl (load cell)</h2></div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="stat-value num">{fmtNum(bowl, 1)}<small>g</small></span>
              <span className="muted small">dibaca {timeAgo(bowlAt)}</span>
            </div>
            <p className="tiny" style={{ marginTop: 8 }}>Presisi HX711 ±1–5 g. Hanya pembacaan terakhir yang disimpan (devices.bowl_weight_g).</p>
          </div>
        </div>

        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <div className="card-head">
              <h2>Info perangkat</h2><div className="spacer" />
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setModal('rename')}><Icon name="edit" />Ubah nama</button>
            </div>
            <dl className="kv">
              <dt>Nama</dt><dd>{dev.name}</dd>
              <dt>Device ID</dt><dd className="num">{dev.id}</dd>
              <dt>Dipasangkan</dt><dd>{fmtDate(dev.paired_at)}</dd>
              <dt>Terakhir aktif</dt><dd>{timeAgo(seen)}</dd>
            </dl>
          </div>

          <div className="card">
            <div className="card-head"><h2>API key perangkat</h2></div>
            <p className="small muted">Dipakai ESP32 untuk sinkron data. Server hanya menyimpan hash-nya, jadi key hanya ditampilkan sekali saat dibuat.</p>
            <div style={{ marginTop: 14 }}>
              {newKey ? (
                <>
                  <div className="keybox">{newKey}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                    <button className="btn btn-sm" type="button" onClick={async () => {
                      try { await navigator.clipboard.writeText(newKey); toast('API key disalin'); } catch { toast('Gagal menyalin, salin manual', 'alert'); }
                    }}><Icon name="copy" />Salin</button>
                    <span className="tiny">Simpan sekarang — key tidak akan ditampilkan lagi.</span>
                  </div>
                </>
              ) : (
                <div className="keybox">••••••••••••••••••••••••</div>
              )}
            </div>
            <button className="btn btn-sm" type="button" style={{ marginTop: 12 }} onClick={() => setModal('regen')}>
              <Icon name="key" />Buat key baru
            </button>
          </div>
        </div>
      </section>

      {modal === 'rename' && (
        <RenameModal current={dev.name} busy={busy} onClose={() => setModal(null)} onSave={async (name) => {
          if (await run(() => updateDevice({ name }), 'Nama perangkat diperbarui')) setModal(null);
        }} />
      )}
      {modal === 'regen' && (
        <Modal onClose={() => setModal(null)}>
          <h3>Buat API key baru?</h3>
          <p className="muted small">Key lama langsung tidak berlaku. ESP32 harus di-flash / di-provisioning ulang dengan key baru.</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setModal(null)}>Batal</button>
            <button className="btn btn-danger" type="button" disabled={busy} onClick={async () => {
              let key = null;
              const ok = await run(async () => { key = await regenerateApiKey(); });
              if (ok) { setModal(null); setNewKey(key); }
            }}><Icon name="key" />{busy ? 'Membuat…' : 'Buat baru'}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function RenameModal({ current, busy, onClose, onSave }) {
  const [name, setName] = useState(current);
  const onSubmit = (e) => {
    e.preventDefault();
    const v = name.trim();
    if (v) onSave(v);
  };
  return (
    <Modal onClose={onClose}>
      <h3>Ubah nama perangkat</h3>
      <form className="form" style={{ marginTop: 14 }} onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="dName">Nama</label>
          <input className="input" id="dName" maxLength={40} required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </form>
    </Modal>
  );
}
