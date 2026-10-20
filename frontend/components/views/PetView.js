'use client';
import { useMemo, useState } from 'react';
import Icon from '@/frontend/components/Icon';
import Modal from '@/frontend/components/Modal';
import { useApp } from '@/frontend/components/AppShell';
import { useAction, useData } from '@/frontend/components/hooks';
import { Loading, LoadError, PetPhoto, SevBadge, Topbar } from '@/frontend/components/ui';
import { getFeedings, getPet, removePetPhoto, updatePet } from '@/frontend/data/api';
import { BASELINE_WINDOW, classifyAll, SEVERITY_META } from '@/shared/domain/severity';
import { fmtDate, fmtTime } from '@/frontend/utils/format';

const TITLE = 'Profil Pet';
const LETTER = { normal: 'N', watch: 'R', moderate: 'S', urgent: '!' };
const FIELDS = ['name', 'watch_pct', 'moderate_pct', 'urgent_pct', 'moderate_session'];

export default function PetView() {
  const { pickPhoto, photoBusy } = useApp();
  const [busy, run] = useAction();
  const [edits, setEdits] = useState({}); // hanya field yang diubah user & belum disimpan
  const [err, setErr] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const state = useData(async () => {
    const [pet, feedings] = await Promise.all([getPet(), getFeedings({ days: 21 })]);
    return { pet, chrono: feedings.slice().reverse() };
  });

  const pet = state.data && state.data.pet;
  // nilai form = data tersimpan + perubahan yang belum disimpan
  const draft = useMemo(() => (pet ? { ...Object.fromEntries(FIELDS.map((k) => [k, pet[k]])), ...edits } : null), [pet, edits]);
  const sim = useMemo(() => {
    if (!state.data || !draft) return [];
    return classifyAll(state.data.chrono, draft).filter((f) => f.status !== 'pending').slice(-28);
  }, [state.data, draft]);

  if (state.error && !state.data) return <LoadError title={TITLE} message={state.error} />;
  if (!state.data) return <Loading title={TITLE} />;
  const orderOk = draft.watch_pct < draft.moderate_pct && draft.moderate_pct < draft.urgent_pct;
  const set = (k, v) => { setEdits((d) => ({ ...d, [k]: v })); setErr(''); };

  const onSubmit = async (e) => {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) return setErr('Nama wajib diisi.');
    const { watch_pct, moderate_pct, urgent_pct, moderate_session } = draft;
    const ok = await run(() => updatePet({ name, watch_pct, moderate_pct, urgent_pct, moderate_session }), 'Profil & threshold disimpan');
    if (ok) setEdits({});
  };

  return (
    <>
      <Topbar title={TITLE} sub="1 feeder untuk 1 kucing — threshold diatur khusus untuk pet ini" />
      <section className="grid grid-dash">
        <div className="grid" style={{ alignContent: 'start' }}>
          <div className="card">
            <div className="card-head"><h2>Foto pet</h2></div>
            <div className="pet-photo-row">
              <PetPhoto pet={pet} className="pet-photo-lg" />
              <div className="pet-photo-actions">
                <button type="button" className={`btn btn-primary btn-sm ${photoBusy ? 'busy' : ''}`} onClick={pickPhoto}>
                  <Icon name="camera" />{pet.photo_url ? 'Ganti foto' : 'Unggah foto'}
                </button>
                {pet.photo_url && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmRemove(true)}>
                    <Icon name="trash" />Hapus foto
                  </button>
                )}
                <span className="tiny">JPG, PNG, atau WebP, maks 10 MB. Foto otomatis dipotong persegi.</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h2>Threshold nafsu makan</h2></div>
            <p className="small muted" style={{ marginBottom: 18 }}>
              Persentase penurunan makanan yang dimakan (dari berat yang jatuh ke bowl) dibanding <b>baseline</b> (rata-rata {BASELINE_WINDOW} sesi normal terakhir) sebelum notifikasi dikirim.
            </p>
            <form className="form" onSubmit={onSubmit}>
              <div className="field" style={{ maxWidth: 320 }}>
                <label htmlFor="pName">Nama pet</label>
                <input className="input" id="pName" required maxLength={40} value={draft.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <ThrRow name="watch_pct" label="Ringan" sev="watch" value={draft.watch_pct} onChange={set} />
              <ThrRow name="moderate_pct" label="Sedang" sev="moderate" value={draft.moderate_pct} onChange={set} />
              <ThrRow name="urgent_pct" label="Parah" sev="urgent" value={draft.urgent_pct} onChange={set} />
              <div className="field" style={{ maxWidth: 320 }}>
                <label htmlFor="pSess">Sesi beruntun untuk status &quot;Sedang&quot;</label>
                <input className="input" type="number" id="pSess" min={1} max={6} value={draft.moderate_session}
                  onChange={(e) => set('moderate_session', Math.max(1, +e.target.value || 1))} />
                <span className="hint">Status &quot;Sedang&quot; hanya muncul jika penurunan ≥ threshold terjadi sebanyak ini berturut-turut.</span>
              </div>
              <div>
                <div className="tiny" style={{ marginBottom: 6 }}>Skala penurunan</div>
                <div className="thr-scale">
                  <span style={{ width: `${draft.watch_pct}%`, background: 'var(--st-normal)' }} />
                  <span style={{ width: `${Math.max(0, draft.moderate_pct - draft.watch_pct)}%`, background: 'var(--st-watch)' }} />
                  <span style={{ width: `${Math.max(0, draft.urgent_pct - draft.moderate_pct)}%`, background: 'var(--st-moderate)' }} />
                  <span style={{ flex: 1, background: 'var(--st-urgent)' }} />
                </div>
                <div className="tiny" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span>0%</span><span>100%</span></div>
              </div>
              <div className="tiny" style={{ color: 'var(--st-urgent-ink)' }}>
                {err || (orderOk ? '' : 'Urutan harus: Ringan < Sedang < Parah.')}
              </div>
              <div>
                <button className="btn btn-primary" type="submit" disabled={!orderOk || busy}>
                  <Icon name="check" />{busy ? 'Menyimpan…' : 'Simpan perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-head"><h2>Pratinjau threshold</h2></div>
          <p className="small muted" style={{ marginBottom: 14 }}>
            Klasifikasi 28 sesi terakhir bila threshold ini dipakai. Status yang sudah tercatat tidak berubah — threshold baru berlaku untuk sesi makan berikutnya.
          </p>
          <div className="preview-row">
            {sim.map((f) => (
              <div key={f.id} className={`preview-cell sev-${f.status}`}
                title={`${fmtDate(f.scheduled_at)} ${fmtTime(f.scheduled_at)} · ${SEVERITY_META[f.status].label}`}>
                {LETTER[f.status]}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['normal', 'watch', 'moderate', 'urgent'].map((s) => (
              <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SevBadge status={s} /><b className="num">{sim.filter((f) => f.status === s).length} sesi</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      {confirmRemove && (
        <Modal onClose={() => setConfirmRemove(false)}>
          <h3>Hapus foto {pet.name}?</h3>
          <p className="muted small">Tampilan kembali ke placeholder. Kamu bisa mengunggah foto baru kapan saja.</p>
          <div className="modal-actions">
            <button className="btn btn-ghost" type="button" onClick={() => setConfirmRemove(false)}>Batal</button>
            <button className="btn btn-danger" type="button" disabled={busy} onClick={async () => {
              if (await run(removePetPhoto, 'Foto pet dihapus')) setConfirmRemove(false);
            }}><Icon name="trash" />{busy ? 'Menghapus…' : 'Hapus'}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ThrRow({ name, label, sev, value, onChange }) {
  return (
    <div className="thr">
      <label htmlFor={`r-${name}`}><SevBadge status={sev} /></label>
      <input type="range" id={`r-${name}`} min={5} max={90} step={1} value={value}
        onChange={(e) => onChange(name, +e.target.value)} aria-label={`Threshold ${label}`} />
      <div className="thr-val num">{value}%</div>
    </div>
  );
}
