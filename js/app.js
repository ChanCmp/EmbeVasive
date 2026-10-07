/* =========================================================
   UI — routing, render tiap halaman, event handler.
   Semua data diambil lewat window.API (lihat api.js).
   ========================================================= */
(function () {
  // ------------------------------------------------------- icons
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    chart: '<path d="M3 3v18h18"/><path d="M8 17v-6M13 17V7M18 17v-4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
    cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
    bowl: '<path d="M3 12h18a9 8 0 0 1-18 0Z"/><path d="M7 20h10"/><path d="M9 8c0-1 1-1 1-2s-1-1-1-2M14 8c0-1 1-1 1-2s-1-1-1-2"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    octagon: '<path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86z"/><path d="M12 8v4M12 16h.01"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    wifi: '<path d="M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>',
    wifiOff: '<path d="m2 2 20 20M8.5 16.5a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M12 20h.01"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  };
  const icon = (name, extra = '') => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${ICONS[name] || ''}</svg>`;
  const SEV_ICON = { normal: 'checkCircle', watch: 'eye', moderate: 'alert', urgent: 'octagon', pending: 'clock' };
  const sevBadge = (s) => `<span class="sev sev-${s}">${icon(SEV_ICON[s])}${Severity.META[s].label}</span>`;

  // ------------------------------------------------------- helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtNum = (n, d = 0) => (n == null ? '—' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: d, minimumFractionDigits: d }));
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtDateLong = (iso) => new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  function timeAgo(iso) {
    const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return `${Math.max(s, 1)} detik lalu`;
    const m = Math.round(s / 60); if (m < 60) return `${m} menit lalu`;
    const h = Math.round(m / 60); if (h < 24) return `${h} jam lalu`;
    return `${Math.round(h / 24)} hari lalu`;
  }

  function toast(msg, ic = 'check') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${icon(ic)}<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function openModal(html, onMount) {
    const root = $('#modalRoot');
    root.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
    const back = $('.modal-backdrop', root);
    const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('click', (e) => { if (e.target === back) close(); });
    $$('[data-close]', root).forEach((b) => b.addEventListener('click', close));
    onMount && onMount($('.modal', root), close);
    const first = $('input, button.btn-primary, button', root);
    first && first.focus();
  }

  // ------------------------------------------------------- state & routes
  const state = { user: null, device: null, unread: 0, chartN: 14, histDays: 7, histStatus: 'all', notifFilter: 'all' };

  const ROUTES = [
    { id: 'ringkasan', label: 'Ringkasan', short: 'Ringkasan', icon: 'home', render: viewDashboard },
    { id: 'riwayat', label: 'Riwayat Makan', short: 'Riwayat', icon: 'chart', render: viewHistory },
    { id: 'jadwal', label: 'Jadwal', short: 'Jadwal', icon: 'calendar', render: viewSchedule },
    { id: 'notifikasi', label: 'Notifikasi', short: 'Notif', icon: 'bell', render: viewNotifications },
    { id: 'pet', label: 'Profil Pet', short: 'Pet', icon: 'paw', render: viewPet },
    { id: 'perangkat', label: 'Perangkat', short: 'Alat', icon: 'cpu', render: viewDevice },
  ];

  function renderNav(active) {
    const item = (r, mobile) => {
      const badge = r.id === 'notifikasi' && state.unread ? `<span class="badge">${state.unread}</span>` : '';
      return `<a href="#${r.id}" class="${r.id === active ? 'active' : ''}" ${r.id === active ? 'aria-current="page"' : ''}>${icon(r.icon)}<span>${mobile ? r.short : r.label}</span>${badge}</a>`;
    };
    $('#nav').innerHTML = ROUTES.map((r) => item(r, false)).join('');
    $('#mobileNav').innerHTML = ROUTES.map((r) => item(r, true)).join('');
  }

  async function refreshUnread() {
    const list = await API.getNotifications();
    state.unread = list.filter((n) => !n.read).length;
  }

  async function route() {
    const id = (location.hash || '#ringkasan').slice(1);
    const r = ROUTES.find((x) => x.id === id) || ROUTES[0];
    await refreshUnread();
    renderNav(r.id);
    const view = $('#view');
    await r.render(view);
    document.title = `${r.label} · PawFeeder`;
  }

  function topbar(title, sub, right = '') {
    return `<header class="topbar">
      <div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>
      <div class="spacer"></div>
      ${right}
    </header>`;
  }

  function deviceChip(dev) {
    return dev.online
      ? `<span class="chip chip-online"><span class="dot live-dot"></span>Online · <span data-live="seen">${timeAgo(dev.last_seen_at)}</span></span>`
      : `<span class="chip chip-offline">${icon('wifiOff', 'style="width:14px;height:14px"')}Offline · ${timeAgo(dev.last_seen_at)}</span>`;
  }

  function nextFeeding(schedules) {
    const active = schedules.filter((s) => s.is_active);
    if (!active.length) return null;
    const now = new Date();
    const cand = active.map((s) => {
      const [h, m] = s.feed_time.split(':').map(Number);
      const t = new Date(now); t.setHours(h, m, 0, 0);
      if (t <= now) t.setDate(t.getDate() + 1);
      return { ...s, at: t };
    }).sort((a, b) => a.at - b.at);
    return cand[0];
  }

  // ------------------------------------------------------- chart
  const STATUS_VAR = { normal: '--st-normal', watch: '--st-watch', moderate: '--st-moderate', urgent: '--st-urgent' };

  function barChart(rows, baseline) {
    // rows: kronologis, sudah tanpa pending
    if (!rows.length) return '<div class="empty">Belum ada sesi makan dengan data sisa.</div>';
    const W = 680, H = 250, pL = 38, pR = 10, pT = 14, pB = 30;
    const iW = W - pL - pR, iH = H - pT - pB;
    const step = iW / rows.length;
    const bw = Math.max(3, Math.min(26, step * 0.64));
    const y = (v) => pT + (1 - v / 100) * iH;
    const y0 = y(0);

    let g = '';
    for (const v of [0, 25, 50, 75, 100]) {
      g += `<line class="grid-line" x1="${pL}" x2="${W - pR}" y1="${y(v)}" y2="${y(v)}"/>`;
      g += `<text class="axis-label" x="${pL - 8}" y="${y(v) + 4}" text-anchor="end">${v}%</text>`;
    }

    let bars = '';
    const days = new Set(rows.map((r) => new Date(r.scheduled_at).toDateString())).size;
    const every = Math.max(1, Math.ceil(days / 8));
    let dayIdx = -1, lastDay = '';
    rows.forEach((r, i) => {
      const x = pL + i * step + (step - bw) / 2;
      const top = Math.min(y(r.consumed_pct), y0 - 2);
      const rad = Math.min(4, bw / 2, y0 - top);
      const d = `M${x},${y0} V${top + rad} Q${x},${top} ${x + rad},${top} H${x + bw - rad} Q${x + bw},${top} ${x + bw},${top + rad} V${y0} Z`;
      bars += `<path class="bar" data-i="${i}" d="${d}" style="fill:var(${STATUS_VAR[r.status]})"/>`;
      bars += `<rect class="hit" data-i="${i}" x="${pL + i * step}" y="${pT}" width="${step}" height="${iH}" fill="transparent"/>`;
      const day = new Date(r.scheduled_at).toDateString();
      if (day !== lastDay) {
        lastDay = day; dayIdx++;
        if (dayIdx % every === 0) {
          const lbl = new Date(r.scheduled_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          bars += `<text class="axis-label" x="${pL + i * step + step / 2}" y="${H - 8}" text-anchor="start">${lbl}</text>`;
        }
      }
    });

    let base = '';
    if (baseline) {
      const by = y(baseline);
      base = `<line class="baseline-line" x1="${pL}" x2="${W - pR}" y1="${by}" y2="${by}"/>
        <text class="baseline-label" x="${W - pR}" y="${by - 6}" text-anchor="end">Baseline ${fmtNum(baseline)}%</text>`;
    }

    return `<div class="chart-wrap">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Persentase porsi yang dimakan per sesi">${g}${bars}${base}</svg>
      <div class="tooltip"></div>
    </div>`;
  }

  function bindChart(root, rows) {
    const wrap = $('.chart-wrap', root);
    if (!wrap) return;
    const tip = $('.tooltip', wrap);
    const svg = $('svg', wrap);
    $$('.hit', wrap).forEach((h) => {
      h.addEventListener('mouseenter', () => {
        const i = +h.dataset.i, r = rows[i];
        $$('.bar', wrap).forEach((b) => b.classList.toggle('hover', +b.dataset.i === i));
        const bar = $(`.bar[data-i="${i}"]`, wrap).getBoundingClientRect();
        const box = wrap.getBoundingClientRect();
        tip.innerHTML = `<b>${fmtDate(r.scheduled_at)}, ${fmtTime(r.scheduled_at)}</b><br>
          Dimakan ${fmtNum(r.consumed_pct)}% (${fmtNum(r.dispensed_g - r.leftover_g, 1)} / ${fmtNum(r.dispensed_g, 1)} g)<br>
          Status: ${Severity.META[r.status].label}${r.drop_pct ? ` · turun ${fmtNum(r.drop_pct)}%` : ''}`;
        tip.style.left = `${Math.min(Math.max(bar.left - box.left + bar.width / 2, 110), box.width - 110)}px`;
        tip.style.top = `${bar.top - box.top}px`;
        tip.classList.add('show');
      });
    });
    svg.addEventListener('mouseleave', () => {
      tip.classList.remove('show');
      $$('.bar', wrap).forEach((b) => b.classList.remove('hover'));
    });
  }

  const chartLegend = `<div class="legend">
    <span><i style="background:var(--st-normal)"></i>Normal</span>
    <span><i style="background:var(--st-watch)"></i>Ringan</span>
    <span><i style="background:var(--st-moderate)"></i>Sedang</span>
    <span><i style="background:var(--st-urgent)"></i>Parah</span>
    <span><i class="dash"></i>Baseline</span>
  </div>`;

  function untilText(date) {
    const mins = Math.max(1, Math.round((date - Date.now()) / 60000));
    const h = Math.floor(mins / 60), m = mins % 60;
    return h ? `dalam ${h} jam ${m} menit` : `dalam ${m} menit`;
  }

  // ------------------------------------------------------- foto pet
  const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

  /** Potong tengah jadi persegi, resize ke size×size, hasilkan JPEG (±50–100 KB). */
  async function resizeImage(file, size = 512) {
    if (!PHOTO_TYPES.includes(file.type)) throw new Error('Format foto harus JPG, PNG, atau WebP.');
    if (file.size > PHOTO_MAX_BYTES) throw new Error('Ukuran foto maksimal 10 MB.');
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('File gambar tidak bisa dibaca.'));
        i.src = url;
      });
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; // PNG transparan jangan jadi hitam
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
      return await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses foto.'))), 'image/jpeg', 0.85));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function pickPetPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = PHOTO_TYPES.join(',');
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      const targets = $$('[data-photo-pick]');
      targets.forEach((b) => { b.classList.add('busy'); b.setAttribute('aria-busy', 'true'); });
      try {
        await API.uploadPetPhoto(await resizeImage(file));
        toast('Foto pet diperbarui');
        route();
      } catch (err) {
        toast(err.message, 'alert');
        targets.forEach((b) => { b.classList.remove('busy'); b.removeAttribute('aria-busy'); });
      }
    });
    input.click();
  }

  function photoInner(pet) {
    return pet.photo_url
      ? `<img src="${esc(pet.photo_url)}" alt="Foto ${esc(pet.name)}">`
      : `<span class="hero-pet-ph">${icon('paw')}<span>Foto pet</span></span>`;
  }

  function petPhoto(pet, extraClass = '') {
    const action = pet.photo_url ? 'Ganti' : 'Unggah';
    return `<button type="button" class="hero-pet ${extraClass}" data-photo-pick aria-label="${action} foto ${esc(pet.name)}" title="${action} foto">
      ${photoInner(pet)}
      <span class="photo-edit" aria-hidden="true">${icon('camera')}</span>
    </button>`;
  }

  function bindPhotoPick(root) {
    $$('[data-photo-pick]', root).forEach((b) => b.addEventListener('click', pickPetPhoto));
  }

  // ======================================================= VIEW: Ringkasan
  async function viewDashboard(view) {
    const [dev, pet, schedules, feedings, baseline, notifs] = await Promise.all([
      API.getDevice(), API.getPet(), API.getSchedules(), API.getFeedings({ days: 14 }), API.getBaseline(), API.getNotifications(),
    ]);
    state.device = dev;
    const done = feedings.filter((f) => f.status !== 'pending');
    const latest = done[0];
    const next = nextFeeding(schedules);

    const today = done.filter((f) => sameDay(f.scheduled_at, Date.now()));
    const todayPct = today.length ? today.reduce((s, f) => s + f.consumed_pct, 0) / today.length : null;
    const todayDrop = todayPct != null && baseline ? ((baseline - todayPct) / baseline) * 100 : null;

    const petStatus = latest ? latest.status : 'normal';
    const hello = new Date().getHours() < 11 ? 'Selamat pagi' : new Date().getHours() < 15 ? 'Selamat siang' : new Date().getHours() < 19 ? 'Selamat sore' : 'Selamat malam';

    // sesi hari ini
    const todayAll = feedings.filter((f) => sameDay(f.scheduled_at, Date.now()));
    const slots = schedules.filter((s) => s.is_active).map((s) => ({
      time: s.feed_time, f: todayAll.find((x) => x.schedule_id === s.id),
    }));
    // sesi dari jadwal yang sudah dihapus/nonaktif tetap ditampilkan
    todayAll.filter((f) => !slots.some((s) => s.f === f)).forEach((f) => slots.push({ time: fmtTime(f.scheduled_at), f }));
    slots.sort((a, b) => a.time.localeCompare(b.time));

    const chartRows = done.slice(0, state.chartN).reverse();

    view.innerHTML = `
      ${topbar(`${hello} 👋`, fmtDateLong(new Date()), deviceChip(dev))}

      <section class="hero" aria-label="Status ${esc(pet.name)}">
        ${petPhoto(pet)}
        <div class="hero-body">
          <div class="eyebrow">Kondisi ${esc(pet.name)} saat ini</div>
          <h2>${petStatus === 'normal' ? 'Makan dengan baik' : petStatus === 'watch' ? 'Nafsu makan sedikit turun' : petStatus === 'moderate' ? 'Nafsu makan turun beberapa sesi' : 'Nafsu makan turun drastis'}</h2>
          <div class="hero-meta">
            <span class="sev sev-${petStatus} sev-flag">${icon(SEV_ICON[petStatus])}${Severity.META[petStatus].label}</span>
            <span class="chip">${icon('calendar', 'style="width:14px;height:14px"')}${schedules.filter((s) => s.is_active).length} jadwal aktif</span>
          </div>
        </div>
        <div class="hero-next">
          <div class="hero-next-label">${icon('clock', 'style="width:16px;height:16px"')}Makan berikutnya</div>
          ${next
            ? `<div class="hero-next-time num">${next.feed_time}</div><div class="hero-next-sub">${untilText(next.at)}</div>`
            : '<div class="hero-next-time">—</div><div class="hero-next-sub">Tidak ada jadwal aktif</div>'}
        </div>
      </section>

      <section class="stats" style="margin-top:var(--gap)">
        <div class="stat stat-blue">
          <div class="stat-label">${icon('bowl')}Berat bowl sekarang</div>
          <div class="stat-value num"><span data-live="bowl">${fmtNum(dev.bowl_weight_g, 1)}</span><small>g</small></div>
          <div class="stat-foot">Load cell · <span data-live="bowlAt">${timeAgo(dev.bowl_read_at)}</span></div>
        </div>
        <div class="stat stat-mint">
          <div class="stat-label">${icon('activity')}Nafsu makan hari ini</div>
          <div class="stat-value num">${todayPct != null ? fmtNum(todayPct) : '—'}<small>%</small></div>
          <div class="stat-foot">${todayPct == null ? 'Belum ada sesi selesai hari ini'
            : `Baseline ${fmtNum(baseline)}% · ${todayDrop > 1 ? `turun ${fmtNum(todayDrop)}%` : 'sesuai baseline'}`}</div>
        </div>
        <div class="stat stat-sun">
          <div class="stat-label">${icon('box')}Stok makanan</div>
          <div class="stat-value num">${fmtNum(dev.hopper_pct)}<small>%</small></div>
          <div class="meter ${dev.hopper_low ? 'low' : ''}" role="meter" aria-valuenow="${Math.round(dev.hopper_pct)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.min(100, dev.hopper_pct)}%"></span></div>
          <div class="stat-foot">${dev.hopper_low ? `${icon('alert', 'style="width:14px;height:14px;vertical-align:-2px"')} Hampir habis · ` : ''}±${fmtNum(dev.days_left, 1)} hari lagi</div>
        </div>
      </section>

      <section class="grid grid-dash" style="margin-top:var(--gap)">
        <div class="card">
          <div class="card-head">
            <div>
              <h2>Makanan yang dimakan per sesi</h2>
              <div class="tiny">% dari berat makanan yang jatuh ke bowl, dibanding baseline</div>
            </div>
            <div class="spacer"></div>
            <div class="seg" role="group" aria-label="Jumlah sesi">
              ${[8, 14, 28].map((n) => `<button data-n="${n}" class="${state.chartN === n ? 'on' : ''}">${n} sesi</button>`).join('')}
            </div>
          </div>
          ${barChart(chartRows, baseline)}
          <div style="margin-top:12px">${chartLegend}</div>
        </div>

        <div class="card">
          <div class="card-head">
            <h2>Notifikasi terbaru</h2><div class="spacer"></div>
            <a href="#notifikasi" class="small">Lihat semua</a>
          </div>
          <div class="list">
            ${notifs.slice(0, 4).map(notifItem).join('') || '<div class="empty">Tidak ada notifikasi 🎉</div>'}
          </div>
        </div>
      </section>

      <section class="card" style="margin-top:var(--gap)">
        <div class="card-head"><h2>Sesi hari ini</h2><div class="spacer"></div><a href="#jadwal" class="small">Atur jadwal</a></div>
        <div class="sessions">
          ${slots.map(sessionCard).join('') || '<div class="empty">Tidak ada jadwal aktif.</div>'}
        </div>
      </section>`;

    $$('[data-n]', view).forEach((b) => b.addEventListener('click', () => { state.chartN = +b.dataset.n; viewDashboard(view); }));
    bindPhotoPick(view);
    bindChart(view, chartRows);
  }

  function sessionCard(s) {
    if (!s.f) {
      return `<div class="session upcoming">
        <span class="session-time">${s.time}</span>
        <div class="small muted">Akan datang</div>
      </div>`;
    }
    if (s.f.status === 'pending') {
      return `<div class="session">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><span class="session-time">${s.time}</span>${sevBadge('pending')}</div>
        <div class="small muted">${fmtNum(s.f.dispensed_g, 1)} g jatuh ke bowl · sisa dibaca 30 menit setelahnya</div>
      </div>`;
    }
    const eaten = s.f.dispensed_g - s.f.leftover_g;
    return `<div class="session">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><span class="session-time">${s.time}</span>${sevBadge(s.f.status)}</div>
      <div class="session-bar"><span style="width:${s.f.consumed_pct}%"></span></div>
      <div class="small muted num">Dimakan ${fmtNum(eaten, 1)} / ${fmtNum(s.f.dispensed_g, 1)} g (${fmtNum(s.f.consumed_pct)}%)</div>
    </div>`;
  }

  // ======================================================= VIEW: Riwayat
  async function viewHistory(view) {
    const [feedings, baseline] = await Promise.all([API.getFeedings({ days: state.histDays }), API.getBaseline()]);
    const done = feedings.filter((f) => f.status !== 'pending');
    const rows = state.histStatus === 'all' ? feedings : feedings.filter((f) => f.status === state.histStatus);
    const avg = done.length ? done.reduce((s, f) => s + f.consumed_pct, 0) / done.length : null;
    const abnormal = done.filter((f) => f.status !== 'normal').length;
    const totalEaten = done.reduce((s, f) => s + (f.dispensed_g - f.leftover_g), 0);
    const avgDrop = feedings.length ? feedings.reduce((s, f) => s + f.dispensed_g, 0) / feedings.length : null;

    view.innerHTML = `
      ${topbar('Riwayat Makan', 'Berat makanan yang jatuh dan sisanya, terbaca load cell di setiap sesi')}
      <div class="filters" style="margin-bottom:var(--gap)">
        <div class="seg" role="group" aria-label="Rentang waktu">
          ${[7, 14, 21].map((d) => `<button data-d="${d}" class="${state.histDays === d ? 'on' : ''}">${d} hari</button>`).join('')}
        </div>
        <select class="input" id="statusFilter" aria-label="Filter status">
          <option value="all">Semua status</option>
          ${['normal', 'watch', 'moderate', 'urgent', 'pending'].map((s) => `<option value="${s}" ${state.histStatus === s ? 'selected' : ''}>${Severity.META[s].label}</option>`).join('')}
        </select>
      </div>

      <section class="stats">
        <div class="stat stat-blue"><div class="stat-label">${icon('calendar')}Total sesi</div>
          <div class="stat-value num">${feedings.length}</div><div class="stat-foot">Rata-rata ${fmtNum(avgDrop, 1)} g jatuh per sesi</div></div>
        <div class="stat stat-mint"><div class="stat-label">${icon('activity')}Rata-rata dimakan</div>
          <div class="stat-value num">${fmtNum(avg)}<small>%</small></div><div class="stat-foot">Total ${fmtNum(totalEaten / 1000, 2)} kg dimakan</div></div>
        <div class="stat stat-sun"><div class="stat-label">${icon('alert')}Sesi tidak normal</div>
          <div class="stat-value num">${abnormal}</div><div class="stat-foot">Ringan, sedang, atau parah</div></div>
      </section>

      <section class="card" style="margin-top:var(--gap)">
        <div class="card-head"><h2>Tren nafsu makan</h2><div class="spacer"></div>${chartLegend}</div>
        ${barChart(done.slice().reverse(), baseline)}
      </section>

      <section class="card" style="margin-top:var(--gap)">
        <div class="card-head"><h2>Detail sesi</h2><div class="spacer"></div><span class="tiny">${rows.length} baris</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Waktu</th><th class="r">Jatuh ke bowl</th><th class="r">Sisa</th><th class="r">Dimakan</th><th class="r">vs Baseline</th><th>Status</th>
            </tr></thead>
            <tbody>
              ${rows.map((f) => `<tr>
                <td><b>${fmtTime(f.scheduled_at)}</b> <span class="muted small">${fmtDate(f.scheduled_at)}</span></td>
                <td class="r num">${fmtNum(f.dispensed_g, 1)} g</td>
                <td class="r num">${f.leftover_g == null ? '—' : fmtNum(f.leftover_g, 1) + ' g'}</td>
                <td class="r num">${f.consumed_pct == null ? '—' : fmtNum(f.consumed_pct) + '%'}</td>
                <td class="r num">${f.drop_pct == null ? '—' : f.drop_pct < 1 ? '±0%' : '−' + fmtNum(f.drop_pct) + '%'}</td>
                <td>${sevBadge(f.status)}</td>
              </tr>`).join('') || '<tr><td colspan="6"><div class="empty">Tidak ada data untuk filter ini.</div></td></tr>'}
            </tbody>
          </table>
        </div>
      </section>`;

    $$('[data-d]', view).forEach((b) => b.addEventListener('click', () => { state.histDays = +b.dataset.d; viewHistory(view); }));
    $('#statusFilter').addEventListener('change', (e) => { state.histStatus = e.target.value; viewHistory(view); });
    bindChart(view, done.slice().reverse());
  }

  // ======================================================= VIEW: Jadwal
  async function viewSchedule(view) {
    const [schedules, dev, feedings] = await Promise.all([API.getSchedules(), API.getDevice(), API.getFeedings({ days: 7 })]);
    const active = schedules.filter((s) => s.is_active);
    const next = nextFeeding(schedules);
    const avgDrop = feedings.length ? feedings.reduce((s, f) => s + f.dispensed_g, 0) / feedings.length : null;

    view.innerHTML = `
      ${topbar('Jadwal Makan', 'Feeder membuka dropper otomatis pada jam-jam berikut setiap hari',
        `<button class="btn btn-primary" id="addSched">${icon('plus')}Tambah jadwal</button>`)}
      <section class="grid grid-dash">
        <div class="card">
          <div class="card-head"><h2>Daftar jadwal</h2><div class="spacer"></div><span class="tiny">${active.length} dari ${schedules.length} aktif</span></div>
          <div class="sched-list">
            ${schedules.map((s) => `
              <div class="sched ${s.is_active ? '' : 'off'}">
                <div class="sched-time num">${s.feed_time}</div>
                <div class="sched-info">
                  <div style="font-weight:700">${s.is_active ? 'Aktif' : 'Nonaktif'}</div>
                  <div class="tiny">${s.is_active ? 'Setiap hari' : 'Tidak dijalankan'}</div>
                </div>
                <div class="sched-actions">
                  <label class="switch" title="Aktif/nonaktif">
                    <input type="checkbox" data-toggle="${s.id}" ${s.is_active ? 'checked' : ''} aria-label="Aktifkan jadwal ${s.feed_time}">
                    <span></span>
                  </label>
                  <button class="btn btn-ghost btn-icon" data-edit="${s.id}" aria-label="Ubah jadwal ${s.feed_time}">${icon('edit')}</button>
                  <button class="btn btn-ghost btn-icon" data-del="${s.id}" aria-label="Hapus jadwal ${s.feed_time}">${icon('trash')}</button>
                </div>
              </div>`).join('') || '<div class="empty">Belum ada jadwal. Tambahkan jadwal pertama.</div>'}
          </div>
        </div>

        <div class="grid" style="align-content:start">
          <div class="card">
            <div class="card-head"><h2>Ringkasan harian</h2></div>
            <dl class="kv">
              <dt>Sesi aktif</dt><dd>${active.length} sesi/hari</dd>
              <dt>Berikutnya</dt><dd>${next ? `${next.feed_time} (${untilText(next.at)})` : '—'}</dd>
              <dt>Rata-rata jatuh</dt><dd>${fmtNum(avgDrop, 1)} g/sesi (7 hari)</dd>
              <dt>Stok cukup</dt><dd>±${fmtNum(dev.days_left, 1)} hari</dd>
            </dl>
          </div>
          <div class="callout">${icon('clock')}<div>Jadwal disimpan juga di ESP32 (RTC DS3231), jadi feeder tetap jalan sesuai jadwal terakhir walau WiFi terputus.</div></div>
          <div class="callout">${icon('bowl')}<div>Jumlah makanan yang jatuh tiap sesi bervariasi karena dropper dibuka berdasarkan waktu. Load cell menimbang berat yang jatuh, lalu nafsu makan dihitung dari persentase yang dimakan.</div></div>
        </div>
      </section>`;

    $('#addSched').addEventListener('click', () => scheduleModal(null, schedules, view));
    $$('[data-edit]', view).forEach((b) => b.addEventListener('click', () => scheduleModal(schedules.find((s) => s.id === +b.dataset.edit), schedules, view)));
    $$('[data-toggle]', view).forEach((c) => c.addEventListener('change', async () => {
      await API.updateSchedule(+c.dataset.toggle, { is_active: c.checked });
      toast(c.checked ? 'Jadwal diaktifkan' : 'Jadwal dinonaktifkan');
      viewSchedule(view);
    }));
    $$('[data-del]', view).forEach((b) => b.addEventListener('click', () => {
      const s = schedules.find((x) => x.id === +b.dataset.del);
      openModal(`
        <h3>Hapus jadwal ${s.feed_time}?</h3>
        <p class="muted small">Riwayat makan dari jadwal ini tetap tersimpan (schedule_id menjadi kosong).</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-close>Batal</button>
          <button class="btn btn-danger" id="confirmDel">${icon('trash')}Hapus</button>
        </div>`, (m, close) => {
        $('#confirmDel', m).addEventListener('click', async () => {
          await API.deleteSchedule(s.id); close(); toast('Jadwal dihapus'); viewSchedule(view);
        });
      });
    }));
  }

  function scheduleModal(existing, schedules, view) {
    openModal(`
      <h3>${existing ? 'Ubah jadwal' : 'Tambah jadwal'}</h3>
      <p class="muted small">Feeder akan membuka dropper setiap hari pada jam yang dipilih.</p>
      <form class="form" id="schedForm" style="margin-top:18px" novalidate>
        <div class="field"><label for="fTime">Jam</label>
          <input class="input" type="time" id="fTime" required value="${existing ? existing.feed_time : '08:00'}"></div>
        <div class="tiny" id="fErr" style="color:var(--st-urgent-ink)"></div>
        <div class="modal-actions" style="margin-top:4px">
          <button type="button" class="btn btn-ghost" data-close>Batal</button>
          <button type="submit" class="btn btn-primary">${icon('check')}Simpan</button>
        </div>
      </form>`, (m, close) => {
      $('#schedForm', m).addEventListener('submit', async (e) => {
        e.preventDefault();
        const feed_time = $('#fTime', m).value;
        const err = $('#fErr', m);
        if (!feed_time) return (err.textContent = 'Jam wajib diisi.');
        if (schedules.some((s) => s.feed_time === feed_time && (!existing || s.id !== existing.id))) return (err.textContent = 'Sudah ada jadwal di jam ini.');
        if (existing) await API.updateSchedule(existing.id, { feed_time });
        else await API.addSchedule({ feed_time });
        close(); toast(existing ? 'Jadwal diperbarui & dikirim ke feeder' : 'Jadwal ditambahkan & dikirim ke feeder');
        viewSchedule(view);
      });
    });
  }

  // ======================================================= VIEW: Notifikasi
  const KIND_ICON = { appetite: 'activity', stock: 'box', offline: 'wifiOff' };
  function notifItem(n) {
    const bg = `var(--st-${n.severity}-bg)`, fg = `var(--st-${n.severity}-ink)`;
    return `<div class="list-item" data-nid="${esc(n.id)}" style="${n.read ? 'opacity:.6' : ''}">
      <div class="list-icon" style="background:${bg};color:${fg}">${icon(KIND_ICON[n.kind])}</div>
      <div class="list-body">
        <div class="list-title">${esc(n.title)}</div>
        <div class="list-desc">${esc(n.desc)}</div>
        <div class="tiny" style="margin-top:4px">${timeAgo(n.at)}${n.read ? ' · dibaca' : ''}</div>
      </div>
    </div>`;
  }

  async function viewNotifications(view) {
    const all = await API.getNotifications();
    const list = state.notifFilter === 'unread' ? all.filter((n) => !n.read) : all;
    const unread = all.filter((n) => !n.read);

    view.innerHTML = `
      ${topbar('Notifikasi', 'Nafsu makan rendah, stok hampir habis, dan perangkat offline',
        `<button class="btn" id="readAll" ${unread.length ? '' : 'disabled'}>${icon('check')}Tandai semua dibaca</button>`)}
      <div class="filters" style="margin-bottom:var(--gap)">
        <div class="seg" role="group" aria-label="Filter">
          <button data-f="all" class="${state.notifFilter === 'all' ? 'on' : ''}">Semua (${all.length})</button>
          <button data-f="unread" class="${state.notifFilter === 'unread' ? 'on' : ''}">Belum dibaca (${unread.length})</button>
        </div>
      </div>
      <section class="card">
        <div class="list">
          ${list.map((n) => `
            <div style="display:flex;gap:12px;align-items:flex-start" class="notif-row">
              <div style="flex:1;min-width:0">${notifItem(n)}</div>
              <div style="padding-top:12px;display:flex;flex-direction:column;gap:6px;align-items:flex-end">
                ${sevBadge(n.severity)}
                ${n.read ? '' : `<button class="btn btn-ghost btn-sm" data-read="${esc(n.id)}">Tandai dibaca</button>`}
              </div>
            </div>`).join('') || '<div class="empty">Tidak ada notifikasi.</div>'}
        </div>
      </section>`;

    $$('.notif-row', view).forEach((r, i) => { if (i) r.style.borderTop = '1px solid var(--border)'; const li = $('.list-item', r); li.style.borderTop = '0'; });
    $$('[data-f]', view).forEach((b) => b.addEventListener('click', () => { state.notifFilter = b.dataset.f; viewNotifications(view); }));
    $$('[data-read]', view).forEach((b) => b.addEventListener('click', async () => { await API.markNotificationRead(b.dataset.read); route(); }));
    $('#readAll').addEventListener('click', async () => { await API.markAllRead(unread.map((n) => n.id)); toast('Semua notifikasi ditandai dibaca'); route(); });
  }

  // ======================================================= VIEW: Profil Pet
  async function viewPet(view) {
    const [pet, feedings] = await Promise.all([API.getPet(), API.getFeedings({ days: 21 })]);
    const chrono = feedings.slice().reverse();
    const draft = { ...pet };

    view.innerHTML = `
      ${topbar('Profil Pet', '1 feeder untuk 1 kucing — threshold diatur khusus untuk pet ini')}
      <section class="grid grid-dash">
        <div class="grid" style="align-content:start">
        <div class="card">
          <div class="card-head"><h2>Foto pet</h2></div>
          <div class="pet-photo-row">
            ${petPhoto(pet, 'pet-photo-lg')}
            <div class="pet-photo-actions">
              <button type="button" class="btn btn-primary btn-sm" data-photo-pick>${icon('camera')}${pet.photo_url ? 'Ganti foto' : 'Unggah foto'}</button>
              ${pet.photo_url ? `<button type="button" class="btn btn-ghost btn-sm" id="removePhoto">${icon('trash')}Hapus foto</button>` : ''}
              <span class="tiny">JPG, PNG, atau WebP, maks 10 MB. Foto otomatis dipotong persegi.</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h2>Threshold nafsu makan</h2></div>
          <p class="small muted" style="margin-bottom:18px">Persentase penurunan makanan yang dimakan (dari berat yang jatuh ke bowl) dibanding <b>baseline</b> (rata-rata ${Severity.BASELINE_WINDOW} sesi normal terakhir) sebelum notifikasi dikirim.</p>
          <form class="form" id="petForm">
            <div class="field" style="max-width:320px">
              <label for="pName">Nama pet</label>
              <input class="input" id="pName" value="${esc(pet.name)}" required maxlength="40">
            </div>
            ${thrRow('watch_pct', 'Ringan', 'watch', pet.watch_pct)}
            ${thrRow('moderate_pct', 'Sedang', 'moderate', pet.moderate_pct)}
            ${thrRow('urgent_pct', 'Parah', 'urgent', pet.urgent_pct)}
            <div class="field" style="max-width:320px">
              <label for="pSess">Sesi beruntun untuk status "Sedang"</label>
              <input class="input" type="number" id="pSess" min="1" max="6" value="${pet.moderate_session}">
              <span class="hint">Status "Sedang" hanya muncul jika penurunan ≥ threshold terjadi sebanyak ini berturut-turut.</span>
            </div>
            <div>
              <div class="tiny" style="margin-bottom:6px">Skala penurunan</div>
              <div class="thr-scale" id="scale"></div>
              <div class="tiny" style="display:flex;justify-content:space-between;margin-top:4px"><span>0%</span><span>100%</span></div>
            </div>
            <div class="tiny" id="pErr" style="color:var(--st-urgent-ink)"></div>
            <div><button class="btn btn-primary" type="submit" id="pSave">${icon('check')}Simpan perubahan</button></div>
          </form>
        </div>
        </div>

        <div class="card" style="align-self:start">
          <div class="card-head"><h2>Simulasi</h2></div>
          <p class="small muted" style="margin-bottom:14px">Klasifikasi 28 sesi terakhir bila threshold diterapkan.</p>
          <div class="preview-row" id="preview"></div>
          <div id="previewCounts" style="margin-top:16px;display:flex;flex-direction:column;gap:8px"></div>
        </div>
      </section>`;

    bindPhotoPick(view);
    const removeBtn = $('#removePhoto', view);
    if (removeBtn) removeBtn.addEventListener('click', () => openModal(`
      <h3>Hapus foto ${esc(pet.name)}?</h3>
      <p class="muted small">Tampilan kembali ke placeholder. Kamu bisa mengunggah foto baru kapan saja.</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-close>Batal</button>
        <button class="btn btn-danger" id="confirmRemovePhoto">${icon('trash')}Hapus</button>
      </div>`, (m, close) => {
      $('#confirmRemovePhoto', m).addEventListener('click', async () => {
        await API.removePetPhoto(); close(); toast('Foto pet dihapus'); route();
      });
    }));

    const form = $('#petForm', view);
    const update = () => {
      draft.watch_pct = +$('[name="watch_pct"]', form).value;
      draft.moderate_pct = +$('[name="moderate_pct"]', form).value;
      draft.urgent_pct = +$('[name="urgent_pct"]', form).value;
      draft.moderate_session = Math.max(1, +$('#pSess', form).value || 1);
      $$('[data-val]', form).forEach((o) => { o.textContent = draft[o.dataset.val] + '%'; });

      const ok = draft.watch_pct < draft.moderate_pct && draft.moderate_pct < draft.urgent_pct;
      $('#pErr', form).textContent = ok ? '' : 'Urutan harus: Ringan < Sedang < Parah.';
      $('#pSave', form).disabled = !ok;

      $('#scale', form).innerHTML = `
        <span style="width:${draft.watch_pct}%;background:var(--st-normal)"></span>
        <span style="width:${Math.max(0, draft.moderate_pct - draft.watch_pct)}%;background:var(--st-watch)"></span>
        <span style="width:${Math.max(0, draft.urgent_pct - draft.moderate_pct)}%;background:var(--st-moderate)"></span>
        <span style="flex:1;background:var(--st-urgent)"></span>`;

      const sim = Severity.classifyAll(chrono, draft).filter((f) => f.status !== 'pending').slice(-28);
      const letter = { normal: 'N', watch: 'R', moderate: 'S', urgent: '!' };
      $('#preview', view).innerHTML = sim.map((f) => `<div class="preview-cell sev-${f.status}" title="${fmtDate(f.scheduled_at)} ${fmtTime(f.scheduled_at)} · ${Severity.META[f.status].label}">${letter[f.status]}</div>`).join('');
      const counts = ['normal', 'watch', 'moderate', 'urgent'].map((s) => [s, sim.filter((f) => f.status === s).length]);
      $('#previewCounts', view).innerHTML = counts.map(([s, c]) => `<div style="display:flex;justify-content:space-between;align-items:center">${sevBadge(s)}<b class="num">${c} sesi</b></div>`).join('');
    };
    form.addEventListener('input', update);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#pName', form).value.trim();
      if (!name) return ($('#pErr', form).textContent = 'Nama wajib diisi.');
      const { watch_pct, moderate_pct, urgent_pct, moderate_session } = draft;
      await API.updatePet({ name, watch_pct, moderate_pct, urgent_pct, moderate_session });
      toast('Profil & threshold disimpan');
    });
    update();
  }

  function thrRow(name, label, sev, val) {
    return `<div class="thr">
      <label for="r-${name}">${sevBadge(sev)}</label>
      <input type="range" id="r-${name}" name="${name}" min="5" max="90" step="1" value="${val}" aria-label="Threshold ${label}">
      <div class="thr-val num" data-val="${name}">${val}%</div>
    </div>`;
  }

  // ======================================================= VIEW: Perangkat
  async function viewDevice(view) {
    const dev = await API.getDevice();
    state.device = dev;

    view.innerHTML = `
      ${topbar('Perangkat', 'ESP32 + load cell + servo + RTC + sensor ultrasonik', deviceChip(dev))}
      <section class="grid grid-dash">
        <div class="grid" style="align-content:start">
          <div class="card">
            <div class="card-head"><h2>Stok hopper</h2><div class="spacer"></div>
              <button class="btn btn-primary btn-sm" id="refill">${icon('refresh')}Sudah diisi ulang</button></div>
            <div style="display:flex;align-items:baseline;gap:8px">
              <span class="stat-value num">${fmtNum(dev.hopper_pct)}<small>%</small></span>
              <span class="muted small">±${fmtNum(dev.days_left, 1)} hari lagi (rata-rata ${fmtNum(dev.daily_use_g)} g/hari)</span>
            </div>
            <div class="meter ${dev.hopper_low ? 'low' : ''}" style="margin:10px 0 18px"><span style="width:${Math.min(100, dev.hopper_pct)}%"></span></div>
            <dl class="kv">
              <dt>Sensor ultrasonik</dt><dd>${dev.hopper_level_pct != null ? `${fmtNum(dev.hopper_level_pct)}% · ${timeAgo(dev.hopper_read_at)}` : '—'}</dd>
              <dt>Estimasi hitungan</dt><dd>${fmtNum(dev.hopper_remaining_g)} g (${fmtNum(dev.hopper_est_pct)}%) dari kapasitas − total dispense</dd>
              <dt>Kapasitas</dt><dd>${fmtNum(dev.hopper_capacity_g)} g</dd>
              <dt>Terakhir diisi</dt><dd>${fmtDate(dev.hopper_refilled_at)}, ${fmtTime(dev.hopper_refilled_at)}</dd>
            </dl>
            ${dev.hopper_low ? `<div class="callout warn" style="margin-top:16px">${icon('alert')}<div>Stok di bawah ${API.LOW_STOCK_PCT}%. Isi ulang lalu tekan “Sudah diisi ulang”.</div></div>` : ''}
          </div>

          <div class="card">
            <div class="card-head"><h2>Bowl (load cell)</h2></div>
            <div style="display:flex;align-items:baseline;gap:8px">
              <span class="stat-value num"><span data-live="bowl">${fmtNum(dev.bowl_weight_g, 1)}</span><small>g</small></span>
              <span class="muted small">dibaca <span data-live="bowlAt">${timeAgo(dev.bowl_read_at)}</span></span>
            </div>
            <p class="tiny" style="margin-top:8px">Presisi HX711 ±1–5 g. Hanya pembacaan terakhir yang disimpan (devices.bowl_weight_g).</p>
          </div>
        </div>

        <div class="grid" style="align-content:start">
          <div class="card">
            <div class="card-head"><h2>Info perangkat</h2><div class="spacer"></div>
              <button class="btn btn-ghost btn-sm" id="rename">${icon('edit')}Ubah nama</button></div>
            <dl class="kv">
              <dt>Nama</dt><dd>${esc(dev.name)}</dd>
              <dt>Device ID</dt><dd class="num">${dev.id}</dd>
              <dt>Dipasangkan</dt><dd>${fmtDate(dev.paired_at)}</dd>
              <dt>Terakhir aktif</dt><dd data-live="seen">${timeAgo(dev.last_seen_at)}</dd>
            </dl>
          </div>

          <div class="card">
            <div class="card-head"><h2>API key perangkat</h2></div>
            <p class="small muted">Dipakai ESP32 untuk sinkron data. Server hanya menyimpan hash-nya, jadi key hanya ditampilkan sekali saat dibuat.</p>
            <div id="keyArea" style="margin-top:14px">
              <div class="keybox">••••••••••••••••••••••••</div>
            </div>
            <button class="btn btn-sm" id="regen" style="margin-top:12px">${icon('key')}Buat key baru</button>
          </div>
        </div>
      </section>`;

    $('#refill').addEventListener('click', async () => { await API.markRefilled(); toast('Stok ditandai penuh'); viewDevice(view); });
    $('#rename').addEventListener('click', () => openModal(`
      <h3>Ubah nama perangkat</h3>
      <form class="form" id="renameForm" style="margin-top:14px">
        <div class="field"><label for="dName">Nama</label><input class="input" id="dName" value="${esc(dev.name)}" maxlength="40" required></div>
        <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Batal</button><button class="btn btn-primary" type="submit">Simpan</button></div>
      </form>`, (m, close) => {
      $('#renameForm', m).addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = $('#dName', m).value.trim();
        if (!name) return;
        await API.updateDevice({ name }); close(); toast('Nama perangkat diperbarui'); viewDevice(view);
      });
    }));
    $('#regen').addEventListener('click', () => openModal(`
      <h3>Buat API key baru?</h3>
      <p class="muted small">Key lama langsung tidak berlaku. ESP32 harus di-flash / di-provisioning ulang dengan key baru.</p>
      <div class="modal-actions"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-danger" id="doRegen">${icon('key')}Buat baru</button></div>`, (m, close) => {
      $('#doRegen', m).addEventListener('click', async () => {
        const key = await API.regenerateApiKey(); close();
        $('#keyArea', view).innerHTML = `
          <div class="keybox">${key}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
            <button class="btn btn-sm" id="copyKey">${icon('copy')}Salin</button>
            <span class="tiny">Simpan sekarang — key tidak akan ditampilkan lagi.</span>
          </div>`;
        $('#copyKey', view).addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(key); toast('API key disalin'); } catch { toast('Gagal menyalin, salin manual', 'alert'); }
        });
      });
    }));
  }

  // ------------------------------------------------------- theme
  const THEMES = ['auto', 'light', 'dark'];
  const THEME_LABEL = { auto: ['monitor', 'Tema: otomatis'], light: ['sun', 'Tema: terang'], dark: ['moon', 'Tema: gelap'] };
  function applyTheme(t) {
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    const [ic, lbl] = THEME_LABEL[t];
    $('#themeBtn').innerHTML = `${icon(ic)}${lbl}`;
  }
  let theme = 'auto';
  try { theme = localStorage.getItem('petfeeder.theme') || 'auto'; } catch { /* ignore */ }

  // ------------------------------------------------------- boot
  async function boot() {
    $$('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
    applyTheme(theme);
    $('#themeBtn').addEventListener('click', () => {
      theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
      try { localStorage.setItem('petfeeder.theme', theme); } catch { /* ignore */ }
      applyTheme(theme);
    });

    state.user = await API.getSession();
    $('#userEmail').textContent = state.user.email;
    $('#userAvatar').textContent = state.user.email[0].toUpperCase();

    window.addEventListener('hashchange', route);
    await route();

    // realtime: update angka tanpa render ulang halaman
    API.subscribe((msg) => {
      if (msg.type === 'bowl_weight') {
        $$('[data-live="bowl"]').forEach((el) => { el.textContent = fmtNum(msg.value, 1); });
        $$('[data-live="bowlAt"]').forEach((el) => { el.textContent = timeAgo(msg.at); });
        $$('[data-live="seen"]').forEach((el) => { el.textContent = timeAgo(msg.at); });
      }
    });
  }

  boot();
})();
