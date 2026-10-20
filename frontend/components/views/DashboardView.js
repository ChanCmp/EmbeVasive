'use client';
import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import BarChart from '@/components/BarChart';
import { useApp } from '@/components/AppShell';
import { useData } from '@/components/hooks';
import { ChartLegend, DeviceChip, Loading, LoadError, NotifItem, PetPhoto, SevBadge, Topbar } from '@/components/ui';
import { getBaseline, getDevice, getFeedings, getNotifications, getPet, getSchedules } from '@/lib/data/api';
import { fmtDateLong, fmtNum, fmtTime, greeting, nextFeeding, sameDay, timeAgo, untilText } from '@/lib/utils/format';

const HEADLINE = {
  normal: 'Makan dengan baik',
  watch: 'Nafsu makan sedikit turun',
  moderate: 'Nafsu makan turun beberapa sesi',
  urgent: 'Nafsu makan turun drastis',
};

export default function DashboardView() {
  const { live } = useApp();
  const [chartN, setChartN] = useState(14);
  const state = useData(async () => {
    const [dev, pet, schedules, feedings, baseline, notifs] = await Promise.all([
      getDevice(), getPet(), getSchedules(), getFeedings({ days: 14 }), getBaseline(), getNotifications(),
    ]);
    return { dev, pet, schedules, feedings, baseline, notifs };
  });

  // judul statis saat memuat: jam server ≠ jam browser
  if (state.error && !state.data) return <LoadError title="Ringkasan" message={state.error} />;
  if (!state.data) return <Loading title="Ringkasan" />;
  const { dev, pet, schedules, feedings, baseline, notifs } = state.data;

  const done = feedings.filter((f) => f.status !== 'pending');
  const petStatus = done[0] ? done[0].status : 'normal';
  const next = nextFeeding(schedules);
  const activeCount = schedules.filter((s) => s.is_active).length;

  const today = done.filter((f) => sameDay(f.scheduled_at, Date.now()));
  const todayPct = today.length ? today.reduce((s, f) => s + f.consumed_pct, 0) / today.length : null;
  const todayDrop = todayPct != null && baseline ? ((baseline - todayPct) / baseline) * 100 : null;

  // sesi hari ini: jadwal aktif + sesi dari jadwal yang sudah dihapus/nonaktif
  const todayAll = feedings.filter((f) => sameDay(f.scheduled_at, Date.now()));
  const slots = schedules.filter((s) => s.is_active).map((s) => ({
    key: `s${s.id}`, time: s.feed_time, f: todayAll.find((x) => x.schedule_id === s.id),
  }));
  todayAll.filter((f) => !slots.some((s) => s.f === f))
    .forEach((f) => slots.push({ key: `f${f.id}`, time: fmtTime(f.scheduled_at), f }));
  slots.sort((a, b) => a.time.localeCompare(b.time));

  const chartRows = done.slice(0, chartN).reverse();
  const bowl = live ? live.bowl : dev.bowl_weight_g;
  const bowlAt = live ? live.at : dev.bowl_read_at;

  return (
    <>
      <Topbar title={`${greeting()} 👋`} sub={fmtDateLong(new Date())}>
        <DeviceChip dev={dev} />
      </Topbar>

      <section className="hero" aria-label={`Status ${pet.name}`}>
        <PetPhoto pet={pet} />
        <div className="hero-body">
          <div className="eyebrow">Kondisi {pet.name} saat ini</div>
          <h2>{HEADLINE[petStatus]}</h2>
          <div className="hero-meta">
            <SevBadge status={petStatus} />
            <span className="chip"><Icon name="calendar" size={14} />{activeCount} jadwal aktif</span>
          </div>
        </div>
        <div className="hero-next">
          <div className="hero-next-label"><Icon name="clock" size={16} />Makan berikutnya</div>
          {next ? (
            <>
              <div className="hero-next-time num">{next.feed_time}</div>
              <div className="hero-next-sub">{untilText(next.at)}</div>
            </>
          ) : (
            <>
              <div className="hero-next-time">—</div>
              <div className="hero-next-sub">Tidak ada jadwal aktif</div>
            </>
          )}
        </div>
      </section>

      <section className="stats" style={{ marginTop: 'var(--gap)' }}>
        <div className="stat stat-blue">
          <div className="stat-label"><Icon name="bowl" />Berat bowl sekarang</div>
          <div className="stat-value num">{fmtNum(bowl, 1)}<small>g</small></div>
          <div className="stat-foot">Load cell · {timeAgo(bowlAt)}</div>
        </div>
        <div className="stat stat-mint">
          <div className="stat-label"><Icon name="activity" />Nafsu makan hari ini</div>
          <div className="stat-value num">{todayPct != null ? fmtNum(todayPct) : '—'}<small>%</small></div>
          <div className="stat-foot">
            {todayPct == null
              ? 'Belum ada sesi selesai hari ini'
              : `Baseline ${fmtNum(baseline)}% · ${todayDrop > 1 ? `turun ${fmtNum(todayDrop)}%` : 'sesuai baseline'}`}
          </div>
        </div>
        <div className="stat stat-sun">
          <div className="stat-label"><Icon name="box" />Stok makanan</div>
          <div className="stat-value num">{fmtNum(dev.hopper_pct)}<small>%</small></div>
          <div className={`meter ${dev.hopper_low ? 'low' : ''}`} role="meter" aria-valuenow={Math.round(dev.hopper_pct)} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${Math.min(100, dev.hopper_pct)}%` }} />
          </div>
          <div className="stat-foot">
            {dev.hopper_low && <><Icon name="alert" size={14} style={{ verticalAlign: -2 }} /> Hampir habis · </>}
            ±{fmtNum(dev.days_left, 1)} hari lagi
          </div>
        </div>
      </section>

      <section className="grid grid-dash" style={{ marginTop: 'var(--gap)' }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h2>Makanan yang dimakan per sesi</h2>
              <div className="tiny">% dari berat makanan yang jatuh ke bowl, dibanding baseline</div>
            </div>
            <div className="spacer" />
            <div className="seg" role="group" aria-label="Jumlah sesi">
              {[8, 14, 28].map((n) => (
                <button key={n} type="button" className={chartN === n ? 'on' : ''} onClick={() => setChartN(n)}>{n} sesi</button>
              ))}
            </div>
          </div>
          <BarChart rows={chartRows} baseline={baseline} />
          <div style={{ marginTop: 12 }}><ChartLegend /></div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Notifikasi terbaru</h2><div className="spacer" />
            <Link href="/notifikasi" className="small">Lihat semua</Link>
          </div>
          <div className="list">
            {notifs.length
              ? notifs.slice(0, 4).map((n) => <NotifItem key={n.id} n={n} />)
              : <div className="empty">Tidak ada notifikasi 🎉</div>}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 'var(--gap)' }}>
        <div className="card-head">
          <h2>Sesi hari ini</h2><div className="spacer" />
          <Link href="/jadwal" className="small">Atur jadwal</Link>
        </div>
        <div className="sessions">
          {slots.length ? slots.map((s) => <SessionCard key={s.key} s={s} />) : <div className="empty">Tidak ada jadwal aktif.</div>}
        </div>
      </section>
    </>
  );
}

function SessionCard({ s }) {
  const head = (badge) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
      <span className="session-time">{s.time}</span>{badge}
    </div>
  );
  if (!s.f) {
    return (
      <div className="session upcoming">
        <span className="session-time">{s.time}</span>
        <div className="small muted">Akan datang</div>
      </div>
    );
  }
  if (s.f.status === 'pending') {
    return (
      <div className="session">
        {head(<SevBadge status="pending" />)}
        <div className="small muted">{fmtNum(s.f.dispensed_g, 1)} g jatuh ke bowl · sisa dibaca 30 menit setelahnya</div>
      </div>
    );
  }
  return (
    <div className="session">
      {head(<SevBadge status={s.f.status} />)}
      <div className="session-bar"><span style={{ width: `${s.f.consumed_pct}%` }} /></div>
      <div className="small muted num">
        Dimakan {fmtNum(s.f.dispensed_g - s.f.leftover_g, 1)} / {fmtNum(s.f.dispensed_g, 1)} g ({fmtNum(s.f.consumed_pct)}%)
      </div>
    </div>
  );
}
