'use client';
import { useRef, useState } from 'react';
import { SEVERITY_META } from '@/lib/domain/severity';
import { fmtDate, fmtNum, fmtTime } from '@/lib/utils/format';

const W = 680, H = 250, PL = 38, PR = 10, PT = 14, PB = 30;
const STATUS_VAR = { normal: '--st-normal', watch: '--st-watch', moderate: '--st-moderate', urgent: '--st-urgent' };

/** Batang % makanan yang dimakan per sesi + garis baseline. rows: kronologis, tanpa sesi pending. */
export default function BarChart({ rows, baseline }) {
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null); // { i, left, top }

  if (!rows.length) return <div className="empty">Belum ada sesi makan dengan data sisa.</div>;

  const iW = W - PL - PR, iH = H - PT - PB;
  const step = iW / rows.length;
  const bw = Math.max(3, Math.min(26, step * 0.64));
  const y = (v) => PT + (1 - v / 100) * iH;
  const y0 = y(0);

  const days = new Set(rows.map((r) => new Date(r.scheduled_at).toDateString())).size;
  const every = Math.max(1, Math.ceil(days / 8));
  let dayIdx = -1, lastDay = '';

  const bars = rows.map((r, i) => {
    const x = PL + i * step + (step - bw) / 2;
    const top = Math.min(y(r.consumed_pct), y0 - 2);
    const rad = Math.min(4, bw / 2, y0 - top);
    const d = `M${x},${y0} V${top + rad} Q${x},${top} ${x + rad},${top} H${x + bw - rad} Q${x + bw},${top} ${x + bw},${top + rad} V${y0} Z`;

    let label = null;
    const day = new Date(r.scheduled_at).toDateString();
    if (day !== lastDay) {
      lastDay = day; dayIdx++;
      if (dayIdx % every === 0) {
        label = (
          <text className="axis-label" x={PL + i * step + step / 2} y={H - 8} textAnchor="start">
            {new Date(r.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </text>
        );
      }
    }

    const onEnter = () => {
      const box = wrapRef.current.getBoundingClientRect();
      const scale = box.width / W;
      const left = Math.min(Math.max((x + bw / 2) * scale, 110), box.width - 110);
      setHover({ i, left, top: top * scale });
    };

    return (
      <g key={r.id}>
        <path className={`bar ${hover && hover.i === i ? 'hover' : ''}`} d={d} style={{ fill: `var(${STATUS_VAR[r.status]})` }} />
        <rect className="hit" x={PL + i * step} y={PT} width={step} height={iH} fill="transparent" onMouseEnter={onEnter} />
        {label}
      </g>
    );
  });

  const h = hover && rows[hover.i];

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Persentase makanan yang dimakan per sesi" onMouseLeave={() => setHover(null)}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line className="grid-line" x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} />
            <text className="axis-label" x={PL - 8} y={y(v) + 4} textAnchor="end">{v}%</text>
          </g>
        ))}
        {bars}
        {baseline ? (
          <>
            <line className="baseline-line" x1={PL} x2={W - PR} y1={y(baseline)} y2={y(baseline)} />
            <text className="baseline-label" x={W - PR} y={y(baseline) - 6} textAnchor="end">Baseline {fmtNum(baseline)}%</text>
          </>
        ) : null}
      </svg>
      <div className={`tooltip ${h ? 'show' : ''}`} style={h ? { left: hover.left, top: hover.top } : undefined}>
        {h && (
          <>
            <b>{fmtDate(h.scheduled_at)}, {fmtTime(h.scheduled_at)}</b><br />
            Dimakan {fmtNum(h.consumed_pct)}% ({fmtNum(h.dispensed_g - h.leftover_g, 1)} / {fmtNum(h.dispensed_g, 1)} g)<br />
            Status: {SEVERITY_META[h.status].label}{h.drop_pct ? ` · turun ${fmtNum(h.drop_pct)}%` : ''}
          </>
        )}
      </div>
    </div>
  );
}
