'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null); // { ok, text }

  const onSubmit = (e) => {
    e.preventDefault();
    // Supabase (nanti): supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin } })
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setMsg({ ok: false, text: 'Format email belum benar.' });
      return;
    }
    setMsg({ ok: true, text: `Link masuk dikirim ke ${value}. Cek inbox kamu.` });
  };

  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-hero">
          <div className="logo" aria-hidden="true">🐾</div>
          <h1>PawFeeder</h1>
          <p>Lihat jadwal makan dan nafsu makan kucingmu dari mana saja.</p>
        </div>
        <div className="card">
          <form className="form" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input className="input" type="email" id="email" placeholder="nama@email.com" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
              <span className="hint">Kami kirim link masuk ke email ini — tanpa password.</span>
            </div>
            <div className="tiny" role="status" style={msg ? { color: msg.ok ? 'var(--st-normal-ink)' : 'var(--st-urgent-ink)' } : undefined}>
              {msg && msg.text}
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: 13 }}>Kirim link masuk</button>
          </form>
        </div>
        <p className="tiny" style={{ textAlign: 'center', marginTop: 16 }}>
          Mode demo: <Link href="/">lanjut ke dashboard</Link>
        </p>
      </div>
    </main>
  );
}
