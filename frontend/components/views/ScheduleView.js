'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import { useAction, useData } from '@/components/hooks';
import { Loading, LoadError, Topbar } from '@/components/ui';
import { addSchedule, deleteSchedule, getDevice, getFeedings, getSchedules, updateSchedule } from '@/lib/data/api';
import { fmtNum, nextFeeding, untilText } from '@/lib/utils/format';

const TITLE = 'Jadwal Makan';

export default function ScheduleView() {
  const [modal, setModal] = useState(null); // { type: 'edit', existing } | { type: 'delete', schedule }
  const [busy, run] = useAction();
  const state = useData(async () => {
    const [schedules, dev, feedings] = await Promise.all([getSchedules(), getDevice(), getFeedings({ days: 7 })]);
    return { schedules, dev, feedings };
  });

  if (state.error && !state.data) return <LoadError title={TITLE} message={state.error} />;
  if (!state.data) return <Loading title={TITLE} />;
  const { schedules, dev, feedings } = state.data;
  const active = schedules.filter((s) => s.is_active);
  const next = nextFeeding(schedules);
  const avgDrop = feedings.length ? feedings.reduce((s, f) => s + f.dispensed_g, 0) / feedings.length : null;

  const toggle = (s, checked) =>
    run(() => updateSchedule(s.id, { is_active: checked }), checked ? 'Jadwal diaktifkan' : 'Jadwal dinonaktifkan');

  return (
    <>
      <Topbar title={TITLE} sub="Feeder membuka dropper otomatis pada jam-jam berikut setiap hari">
        <button className="btn btn-primary" type="button" onClick={() => setModal({ type: 'edit', existing: null })}>
          <Icon name="plus" />Tambah jadwal
        </button>
      </Topbar>

      <section className="grid grid-dash">
        <div className="card">
          <div className="card-head">
            <h2>Daftar jadwal</h2><div className="spacer" />
            <span className="tiny">{active.length} dari {schedules.length} aktif</span>
          </div>
          <div className="sched-list">
            {schedules.length ? schedules.map((s) => (
              <div key={s.id} className={`sched ${s.is_active ? '' : 'off'}`}>
                <div className="sched-time num">{s.feed_time}</div>
                <div className="sched-info">
                  <div style={{ fontWeight: 700 }}>{s.is_active ? 'Aktif' : 'Nonaktif'}</div>
                  <div className="tiny">{s.is_active ? 'Setiap hari' : 'Tidak dijalankan'}</div>
                </div>
                <div className="sched-actions">
                  <label className="switch" title="Aktif/nonaktif">
                    <input type="checkbox" checked={s.is_active} disabled={busy} onChange={(e) => toggle(s, e.target.checked)}
                      aria-label={`Aktifkan jadwal ${s.feed_time}`} />
                    <span />
                  </label>
                  <button className="btn btn-ghost btn-icon" type="button" aria-label={`Ubah jadwal ${s.feed_time}`}
                    onClick={() => setModal({ type: 'edit', existing: s })}><Icon name="edit" /></button>
                  <button className="btn btn-ghost btn-icon" type="button" aria-label={`Hapus jadwal ${s.feed_time}`}
                    onClick={() => setModal({ type: 'delete', schedule: s })}><Icon name="trash" /></button>
                </div>
              </div>
            )) : <div className="empty">Belum ada jadwal. Tambahkan jadwal pertama.</div>}
          </div>
        </div>

        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <div className="card-head"><h2>Ringkasan harian</h2></div>
            <dl className="kv">
              <dt>Sesi aktif</dt><dd>{active.length} sesi/hari</dd>
              <dt>Berikutnya</dt><dd>{next ? `${next.feed_time} (${untilText(next.at)})` : '—'}</dd>
              <dt>Rata-rata jatuh</dt><dd>{fmtNum(avgDrop, 1)} g/sesi (7 hari)</dd>
              <dt>Stok cukup</dt><dd>±{fmtNum(dev.days_left, 1)} hari</dd>
            </dl>
          </div>
          <div className="callout"><Icon name="clock" />
            <div>Jadwal disimpan juga di ESP32 (RTC DS3231), jadi feeder tetap jalan sesuai jadwal terakhir walau WiFi terputus.</div>
          </div>
          <div className="callout"><Icon name="bowl" />
            <div>Jumlah makanan yang jatuh tiap sesi bervariasi karena dropper dibuka berdasarkan waktu. Load cell menimbang berat yang jatuh, lalu nafsu makan dihitung dari persentase yang dimakan.</div>
          </div>
        </div>
      </section>

      {modal && modal.type === 'edit' && (
        <ScheduleModal existing={modal.existing} schedules={schedules} busy={busy} onClose={() => setModal(null)}
          onSave={async (feed_time) => {
            const ok = await run(
              () => (modal.existing ? updateSchedule(modal.existing.id, { feed_time }) : addSchedule({ feed_time })),
              modal.existing ? 'Jadwal diperbarui' : 'Jadwal ditambahkan',
            );
            if (ok) setModal(null);
          }} />
      )}
      {modal && modal.type === 'delete' && (
        <Modal onClose={() => setModal(null)}>
          <h3>Hapus jadwal {modal.schedule.feed_time}?</h3>
          <p className="muted small">Riwayat makan dari jadwal ini tetap tersimpan (schedule_id menjadi kosong).</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setModal(null)}>Batal</button>
            <button className="btn btn-danger" type="button" disabled={busy} onClick={async () => {
              if (await run(() => deleteSchedule(modal.schedule.id), 'Jadwal dihapus')) setModal(null);
            }}><Icon name="trash" />{busy ? 'Menghapus…' : 'Hapus'}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ScheduleModal({ existing, schedules, busy, onClose, onSave }) {
  const [time, setTime] = useState(existing ? existing.feed_time : '08:00');
  const [err, setErr] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    if (!time) return setErr('Jam wajib diisi.');
    if (schedules.some((s) => s.feed_time === time && (!existing || s.id !== existing.id))) return setErr('Sudah ada jadwal di jam ini.');
    onSave(time);
  };

  return (
    <Modal onClose={onClose}>
      <h3>{existing ? 'Ubah jadwal' : 'Tambah jadwal'}</h3>
      <p className="muted small">Feeder akan membuka dropper setiap hari pada jam yang dipilih.</p>
      <form className="form" style={{ marginTop: 18 }} onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="fTime">Jam</label>
          <input className="input" type="time" id="fTime" required value={time} onChange={(e) => { setTime(e.target.value); setErr(''); }} />
        </div>
        <div className="tiny" style={{ color: 'var(--st-urgent-ink)' }}>{err}</div>
        <div className="modal-actions" style={{ marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={busy}><Icon name="check" />{busy ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </form>
    </Modal>
  );
}
