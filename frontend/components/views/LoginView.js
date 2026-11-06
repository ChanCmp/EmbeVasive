'use client';
import { useState } from 'react';
import { signIn, signUp } from '@/frontend/data/api';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null); // { ok, text }
  const [busy, setBusy] = useState(false);

  const submit = async (mode) => {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setMsg({ ok: false, text: 'Format email belum benar.' });
      return;
    }
    if (password.length < 6) {
      setMsg({ ok: false, text: 'Password minimal 6 karakter.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'up' && !(await signUp(value, password))) {
        setMsg({ ok: true, text: `Akun dibuat. Cek email ${value} untuk konfirmasi, lalu masuk.` });
        return;
      }
      if (mode === 'in') await signIn(value, password);
      window.location.replace('/');
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <div className="auth-card">
        <div className="card">
          <form className="form" onSubmit={(e) => { e.preventDefault(); submit('in'); }} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input className="input" type="email" id="email" placeholder="nama@email.com" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input className="input" type="password" id="password" autoComplete="current-password" required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="tiny" role="status" style={msg ? { color: msg.ok ? 'var(--st-normal-ink)' : 'var(--st-urgent-ink)' } : undefined}>
              {msg && msg.text}
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%', padding: 13 }}>Masuk</button>
            <button className="btn btn-ghost" type="button" disabled={busy} style={{ width: '100%', padding: 13 }}
              onClick={() => submit('up')}>Daftar akun baru</button>
          </form>
        </div>
      </div>
    </main>
  );
}
