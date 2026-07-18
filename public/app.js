// ============================================
// FLASH PEAK COMMUNITY — APP JS
// ============================================

let selectedAvatar = 'default';
let selectedPosition = null;
let lastRegistered = null;
let tickerQueue = [];
let tickerBusy = false;
let allMembers = [];

// ── Posisi Picker (form) ──────────────────────────────
function buildPositionPicker() {
  const wrap = document.getElementById('positionPicker');
  if (!wrap) return;
  wrap.innerHTML = '';
  POSITION_LIST.forEach((pos) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'position-opt';
    btn.dataset.key = pos.key;
    btn.style.setProperty('--pos-color', pos.color);
    btn.style.setProperty('--pos-color-soft', pos.colorSoft);
    btn.innerHTML = `
      <span class="position-opt-icon">${pos.icon}</span>
      <span class="position-opt-text">
        <span class="position-opt-short">${pos.short}${pos.room ? ' <em>· room</em>' : ''}</span>
        <span class="position-opt-label">${pos.label}</span>
      </span>
    `;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.position-opt').forEach(el => el.classList.remove('selected'));
      btn.classList.add('selected');
      selectedPosition = pos.key;
      document.getElementById('errPosisi').textContent = '';
    });
    wrap.appendChild(btn);
  });
}

// ── Posisi Showcase (landing section) ──────────────────────────────
function buildPositionShowcase() {
  const grid = document.getElementById('positionGrid');
  if (!grid) return;
  grid.innerHTML = POSITION_LIST.map((pos, i) => `
    <div class="position-card reveal" style="--pos-color:${pos.color};--pos-color-soft:${pos.colorSoft};transition-delay:${i * 0.06}s">
      <div class="position-card-icon">${pos.icon}</div>
      <span class="position-card-short">${pos.short}</span>
      <h3>${pos.label}</h3>
      <p>${pos.desc}</p>
      ${pos.room ? '<span class="position-card-room-tag">Room Khusus GK</span>' : ''}
    </div>
  `).join('');
}

// ── Avatar Picker ──────────────────────────────
function buildAvatarGrid() {
  const grid = document.getElementById('avatarGrid');
  grid.innerHTML = '';
  AVATAR_LIST.forEach((av, i) => {
    const wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'avatar-opt' + (i === 0 ? ' selected' : '');
    wrap.dataset.key = av.key;

    const canvas = document.createElement('canvas');
    canvas.width = 56; canvas.height = 56;
    wrap.appendChild(canvas);

    const label = document.createElement('span');
    label.textContent = av.label;
    wrap.appendChild(label);

    wrap.addEventListener('click', () => {
      document.querySelectorAll('.avatar-opt').forEach(el => el.classList.remove('selected'));
      wrap.classList.add('selected');
      selectedAvatar = av.key;
    });

    grid.appendChild(wrap);
    renderAvatarPreview(canvas, av.key);
  });
}

// ── Realtime layer ──────────────────────────────
// Prioritas: Socket.IO (Node server biasa) → SSE (Vercel & fallback).
// Keduanya PUSH langsung dari server saat ada join, tanpa polling
// berkala, jadi tidak ada delay.
let realtimeMode = null;
let socket = null;
let evtSource = null;

function initRealtime() {
  fetchMembersOnce(); // snapshot awal cepat, biar UI langsung terisi

  if (typeof io === 'function') {
    try {
      socket = io({ timeout: 2500, reconnectionAttempts: 2 });
      let socketWorked = false;

      socket.on('connect', () => {
        socketWorked = true;
        realtimeMode = 'socket';
        if (evtSource) { evtSource.close(); evtSource = null; }
      });
      socket.on('newMember', (m) => { mergeMember(m); pushTicker(m); });
      socket.on('membersList', (list) => { allMembers = list; renderLiveTable(list); });
      socket.on('connect_error', () => {
        if (!socketWorked) startSSE();
      });

      // Kalau dalam 2.5 detik socket belum connect, langsung pakai SSE
      setTimeout(() => { if (!socketWorked) startSSE(); }, 2500);
    } catch (e) {
      startSSE();
    }
  } else {
    startSSE();
  }
}

function startSSE() {
  if (evtSource || realtimeMode === 'socket') return;
  realtimeMode = 'sse';
  try {
    evtSource = new EventSource('/api/stream');
    evtSource.addEventListener('snapshot', (e) => {
      const list = JSON.parse(e.data);
      allMembers = list;
      renderLiveTable(list);
    });
    evtSource.addEventListener('newMember', (e) => {
      const m = JSON.parse(e.data);
      mergeMember(m);
      pushTicker(m);
    });
    evtSource.onerror = () => {
      // Reconnect otomatis ditangani browser (EventSource native retry)
    };
  } catch (e) {
    // Browser super lama tanpa EventSource — fallback terakhir: polling ringan
    if (!window.__pollTimer) {
      window.__pollTimer = setInterval(fetchMembersOnce, 2000);
    }
  }
}

function mergeMember(m) {
  if (!allMembers.some(x => x.serverId === m.serverId)) {
    allMembers = [...allMembers, m];
    renderLiveTable(allMembers);
  }
}

async function fetchMembersOnce() {
  try {
    const res = await fetch('/api/members');
    const data = await res.json();
    if (!data.ok) return;
    allMembers = data.members;
    renderLiveTable(allMembers);
  } catch (e) {}
}

// ── Ticker notifikasi real-time ──
function pushTicker(m) {
  tickerQueue.push(m);
  runTicker();
}

function runTicker() {
  if (tickerBusy || tickerQueue.length === 0) return;
  tickerBusy = true;
  const m = tickerQueue.shift();

  const ticker = document.getElementById('ticker');
  document.getElementById('tkNama').textContent = m.nama;
  document.getElementById('tkUsia').textContent = m.usia;
  document.getElementById('tkStatus').textContent = (m.status || 'succeed').toUpperCase();

  ticker.classList.add('show');

  setTimeout(() => {
    ticker.classList.remove('show');
    tickerBusy = false;
    setTimeout(runTicker, 250);
  }, 2000);
}

// ── Live table anggota ──
function renderLiveTable(list) {
  const body = document.getElementById('liveTableBody');
  const count = document.getElementById('onlineCount');
  const statTotal = document.getElementById('statTotal');
  count.textContent = list.length;
  animateCount(statTotal, list.length);

  if (!list.length) {
    body.innerHTML = '<div class="empty-state">Belum ada anggota yang bergabung.</div>';
    return;
  }

  const rows = list.slice().reverse().slice(0, 100).map((m, i) => {
    const pos = getPosition(m.posisi);
    return `
    <div class="live-row" style="animation-delay:${Math.min(i, 8) * 0.03}s">
      <span class="lr-nama">${escapeHtml(m.nama)}</span>
      <span class="lr-pos" style="--pos-color:${pos.color};--pos-color-soft:${pos.colorSoft}">${pos.short}</span>
      <span class="lr-status succeed">${escapeHtml((m.status || 'succeed').toUpperCase())}</span>
    </div>
  `;
  }).join('');
  body.innerHTML = rows;

  renderHeroAvatars(list);
}

// ── Hero avatar stack (member terbaru, landing hero) ──
function renderHeroAvatars(list) {
  const stack = document.getElementById('heroAvatarStack');
  if (!stack) return;
  const latest = list.slice(-5).reverse();
  if (!latest.length) { stack.innerHTML = ''; return; }
  stack.innerHTML = latest.map(m => {
    const pos = getPosition(m.posisi);
    return `<span class="hero-avatar-chip" style="--pos-color:${pos.color}" title="${escapeHtml(m.nama)} · ${pos.short}">
      <canvas width="30" height="30" data-avatar="${m.avatar || 'default'}"></canvas>
    </span>`;
  }).join('');
  stack.querySelectorAll('canvas').forEach(c => renderAvatarPreview(c, c.dataset.avatar));
}

function animateCount(el, target) {
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const step = target > current ? 1 : -1;
  let val = current;
  const t = setInterval(() => {
    val += step;
    el.textContent = val;
    if (val === target) clearInterval(t);
  }, 30);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ── Form validation & submit ──
function showErr(id, msg) {
  document.getElementById(id).textContent = msg;
}
function clearErrs() {
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}

// ── Partikel dekoratif hero (dibuat via JS biar posisi & durasi acak) ──
function buildLandingParticles() {
  const wrap = document.getElementById('landingParticles');
  if (!wrap) return;
  const count = 18;
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.random() * 100;
    const duration = 8 + Math.random() * 10;
    const delay = Math.random() * 10;
    const drift = (Math.random() * 60 - 30).toFixed(0) + 'px';
    const size = (2 + Math.random() * 3).toFixed(1) + 'px';
    html += `<span style="left:${left}%;width:${size};height:${size};animation-duration:${duration}s;animation-delay:${delay}s;--drift:${drift}"></span>`;
  }
  wrap.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  buildAvatarGrid();
  buildPositionPicker();
  buildPositionShowcase();
  buildLandingParticles();
  initRealtime();
  observeReveal();

  document.getElementById('regForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrs();

    const nama = document.getElementById('nama').value.trim();
    const usia = document.getElementById('usia').value.trim();
    const gameId = document.getElementById('gameId').value.trim();
    const username = document.getElementById('username').value.trim();
    const alasan = document.getElementById('alasan').value.trim();

    let valid = true;
    if (!nama) { showErr('errNama', 'Nama wajib diisi'); valid = false; }
    if (!usia || usia < 10 || usia > 99) { showErr('errUsia', 'Usia harus 10–99'); valid = false; }
    if (!gameId) { showErr('errGameId', 'ID wajib diisi'); valid = false; }
    if (!username) { showErr('errUsername', 'Username wajib diisi'); valid = false; }
    if (!alasan || alasan.length < 10) { showErr('errAlasan', 'Ceritakan alasanmu minimal 10 karakter'); valid = false; }
    if (!selectedPosition) { showErr('errPosisi', 'Pilih salah satu posisi'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    const originalHtml = btn.innerHTML;
    btn.innerHTML = 'Mendaftarkan...';

    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, usia, gameId, username, alasan, avatar: selectedAvatar, posisi: selectedPosition })
      });
      const data = await res.json();

      if (!data.ok) {
        alert(data.error || 'Pendaftaran gagal, coba lagi.');
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        return;
      }

      lastRegistered = data.member;
      mergeMember(data.member);
      // Kalau realtime belum aktif sama sekali (sangat jarang), tampilkan ticker manual
      if (!realtimeMode) pushTicker(data.member);

      document.getElementById('regForm').reset();
      document.querySelectorAll('.position-opt').forEach(el => el.classList.remove('selected'));
      selectedPosition = null;
      btn.disabled = false;
      btn.innerHTML = originalHtml;

      openIdCard(data.member);
    } catch (err) {
      alert('Terjadi kesalahan koneksi. Coba lagi.');
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  });

  document.getElementById('closeIdCard').addEventListener('click', () => {
    document.getElementById('idCardModal').classList.remove('show');
  });

  document.getElementById('downloadBtn').addEventListener('click', downloadIdCard);

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('show');
    });
  });
});

// ── Scroll reveal animasi ──
function observeReveal() {
  const targets = document.querySelectorAll('.about-card, .form-card, .live-card, .position-card');
  targets.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(el => io.observe(el));
}

// ── ID CARD (mengikuti referensi desain Flash Peak) ──
let idCardDrawn = false;
let idCardDrawing = false;

function openIdCard(member) {
  idCardDrawn = false;
  document.getElementById('idCardModal').classList.add('show');

  // Gambar SEKALI secara sinkron dulu supaya kartu tidak pernah kosong,
  // baru redraw setelah font custom benar-benar siap (kalau ada perbedaan visual).
  drawIdCard(member);
  idCardDrawn = true;

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      drawIdCard(member);
      idCardDrawn = true;
    }).catch(() => {});
  }
}

function drawIdCard(member) {
  idCardDrawing = true;
  const canvas = document.getElementById('idCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const FONT = "'Poppins', Arial, sans-serif";

  ctx.clearRect(0, 0, W, H);

  // Background dasar gelap (sesuai referensi)
  ctx.fillStyle = '#0a0f1c';
  roundRect(ctx, 0, 0, W, H, 22);
  ctx.fill();

  // Garis-garis halus dekoratif horizontal
  ctx.save();
  roundRect(ctx, 0, 0, W, H, 22);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let y = 20; y < H; y += 22) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  const cardPos = getPosition(member.posisi);

  // Ring dekoratif kanan atas
  ctx.beginPath();
  ctx.arc(W - 70, 68, 46, 0, Math.PI * 2);
  ctx.strokeStyle = cardPos.color + '30';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Border sesuai warna posisi
  ctx.strokeStyle = cardPos.color;
  ctx.lineWidth = 3;
  roundRect(ctx, 3, 3, W - 6, H - 6, 20);
  ctx.stroke();

  // Header kiri
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = cardPos.color;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText('FLASH PEAK COMMUNITY', 28, 42);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `12px ${FONT}`;
  ctx.fillText('OFFICIAL IDENTITY CARD', 28, 60);

  // Badge kanan atas "LORD MEMBER"
  ctx.fillStyle = '#ffc93c';
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText('LORD MEMBER', W - 28, 36);
  ctx.textAlign = 'left';

  // Avatar
  drawAvatar(ctx, member.avatar || 'default', 112, 208, 72);

  // Info kanan avatar
  const x = 218;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillText(member.nama, x, 150);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('MEMBER ID', x, 186);
  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText(member.serverId, x, 210);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('USERNAME', x, 240);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 19px ${FONT}`;
  ctx.fillText('@' + member.username, x, 264);

  // Badge posisi player (dinamis sesuai posisi yang dipilih saat daftar)
  const pos = getPosition(member.posisi);
  const pillW = pos.room ? 108 : 62;
  ctx.fillStyle = pos.color;
  roundRect(ctx, x, 284, pillW, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#0a0f1c';
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(pos.short + (pos.room ? ' · ROOM' : ''), x + pillW / 2, 301);
  ctx.textAlign = 'left';

  // Footer kiri
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `12px ${FONT}`;
  ctx.fillText('flashpeak.community  •  ID Game: ' + (member.gameId || '-'), 28, H - 26);

  // Footer kanan — pill "SUCCEED"
  ctx.fillStyle = '#16e07a';
  roundRect(ctx, W - 148, H - 46, 122, 30, 15);
  ctx.fill();
  ctx.fillStyle = '#04160c';
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('SUCCEED', W - 87, H - 26);
  ctx.textAlign = 'left';

  idCardDrawing = false;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function downloadIdCard() {
  const canvas = document.getElementById('idCanvas');

  // Jaga-jaga terakhir: gambar ulang secara sinkron tepat sebelum export,
  // supaya file yang didownload TIDAK PERNAH kosong/putih walau ada race condition.
  if (lastRegistered) {
    drawIdCard(lastRegistered);
  }

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const nameSlug = (lastRegistered?.username || 'member').toLowerCase().replace(/[^a-z0-9]/g, '');
    link.download = `id-card-flashpeak-${nameSlug}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (e) {
    alert('Gagal membuat file gambar. Coba lagi.');
    return;
  }

  document.getElementById('idCardModal').classList.remove('show');
  showJoinPopup();
}

function showJoinPopup() {
  const nama = lastRegistered?.nama || 'Sobat Lord';
  document.getElementById('joinText').textContent =
    `Halo ${nama}, selamat bergabung di Komunitas Lord! Setelah mendownload ID Card ini, harap kirim di Komunitas Lord ya, biar gampang kenalan 👋⚽`;
  document.getElementById('joinPopup').classList.add('show');
}
