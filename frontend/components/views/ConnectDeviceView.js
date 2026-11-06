'use client';
/* Tampil bila user sudah login tapi belum punya perangkat: masukkan ID perangkat untuk menghubungkannya. */
import { useState } from 'react';
import { Topbar } from '@/frontend/components/ui';
import { claimDevice } from '@/frontend/data/api';

export default function ConnectDeviceView({ onConnected }) {
  const [id, setId] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await claimDevice(id.trim());
      onConnected();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Topbar title="Hubungkan perangkat" sub="Akun ini belum terhubung ke feeder" />
      <div className="card" style={{ maxWidth: 420 }}>
        <form className="form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="device-id">ID perangkat</label>
            <input className="input" id="device-id" inputMode="numeric" placeholder="contoh: 1" required
              value={id} onChange={(e) => setId(e.target.value)} />
            <span className="hint">ID tertera pada feeder kamu.</span>
          </div>
          <div className="tiny" role="status" style={msg ? { color: 'var(--st-urgent-ink)' } : undefined}>{msg}</div>
          <button className="btn btn-primary" type="submit" disabled={busy || !id.trim()}>Hubungkan</button>
        </form>
      </div>
    </>
  );
}
