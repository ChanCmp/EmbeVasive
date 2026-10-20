'use client';
import { useState } from 'react';
import Icon from '@/frontend/components/Icon';
import BarChart from '@/frontend/components/BarChart';
import { useData } from '@/frontend/components/hooks';
import { ChartLegend, Loading, LoadError, SevBadge, Topbar } from '@/frontend/components/ui';
import { getBaseline, getFeedings } from '@/frontend/data/api';
import { SEVERITY_META } from '@/shared/domain/severity';
import { fmtDate, fmtNum, fmtTime } from '@/frontend/utils/format';

const TITLE = 'Riwayat Makan';

export default function HistoryView() {
  const [days, setDays] = useState(7);
  const [statusFilter, setStatusFilter] = useState('all');
  const state = useData(async () => {
    const [feedings, baseline] = await Promise.all([getFeedings({ days }), getBaseline()]);
    return { feedings, baseline };
  }, [days]);

  if (state.error && !state.data) return <LoadError title={TITLE} message={state.error} />;
  if (!state.data) return <Loading title={TITLE} />;
  const { feedings, baseline } = state.data;

  const done = feedings.filter((f) => f.status !== 'pending');
  const rows = statusFilter === 'all' ? feedings : feedings.filter((f) => f.status === statusFilter);
  const avg = done.length ? done.reduce((s, f) => s + f.consumed_pct, 0) / done.length : null;
  const abnormal = done.filter((f) => f.status !== 'normal').length;
  const totalEaten = done.reduce((s, f) => s + (f.dispensed_g - f.leftover_g), 0);
  const avgDrop = feedings.length ? feedings.reduce((s, f) => s + f.dispensed_g, 0) / feedings.length : null;
  const chronological = done.slice().reverse();

  return (
    <>
      <Topbar title={TITLE} sub="Berat makanan yang jatuh dan sisanya, terbaca load cell di setiap sesi" />
      <div className="filters" style={{ marginBottom: 'var(--gap)' }}>
        <div className="seg" role="group" aria-label="Rentang waktu">
          {[7, 14, 21].map((d) => (
            <button key={d} type="button" className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{d} hari</button>
          ))}
        </div>
        <select className="input" aria-label="Filter status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Semua status</option>
          {['normal', 'watch', 'moderate', 'urgent', 'pending'].map((s) => (
            <option key={s} value={s}>{SEVERITY_META[s].label}</option>
          ))}
        </select>
      </div>

      <section className="stats">
        <div className="stat stat-blue">
          <div className="stat-label"><Icon name="calendar" />Total sesi</div>
          <div className="stat-value num">{feedings.length}</div>
          <div className="stat-foot">Rata-rata {fmtNum(avgDrop, 1)} g jatuh per sesi</div>
        </div>
        <div className="stat stat-mint">
          <div className="stat-label"><Icon name="activity" />Rata-rata dimakan</div>
          <div className="stat-value num">{fmtNum(avg)}<small>%</small></div>
          <div className="stat-foot">Total {fmtNum(totalEaten / 1000, 2)} kg dimakan</div>
        </div>
        <div className="stat stat-sun">
          <div className="stat-label"><Icon name="alert" />Sesi tidak normal</div>
          <div className="stat-value num">{abnormal}</div>
          <div className="stat-foot">Ringan, sedang, atau parah</div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 'var(--gap)' }}>
        <div className="card-head"><h2>Tren nafsu makan</h2><div className="spacer" /><ChartLegend /></div>
        <BarChart rows={chronological} baseline={baseline} />
      </section>

      <section className="card" style={{ marginTop: 'var(--gap)' }}>
        <div className="card-head"><h2>Detail sesi</h2><div className="spacer" /><span className="tiny">{rows.length} baris</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Waktu</th><th className="r">Jatuh ke bowl</th><th className="r">Sisa</th>
                <th className="r">Dimakan</th><th className="r">vs Baseline</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((f) => (
                <tr key={f.id}>
                  <td><b>{fmtTime(f.scheduled_at)}</b> <span className="muted small">{fmtDate(f.scheduled_at)}</span></td>
                  <td className="r num">{fmtNum(f.dispensed_g, 1)} g</td>
                  <td className="r num">{f.leftover_g == null ? '—' : `${fmtNum(f.leftover_g, 1)} g`}</td>
                  <td className="r num">{f.consumed_pct == null ? '—' : `${fmtNum(f.consumed_pct)}%`}</td>
                  <td className="r num">{f.drop_pct == null ? '—' : f.drop_pct < 1 ? '±0%' : `−${fmtNum(f.drop_pct)}%`}</td>
                  <td><SevBadge status={f.status} /></td>
                </tr>
              )) : (
                <tr><td colSpan={6}><div className="empty">Tidak ada data untuk filter ini.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
