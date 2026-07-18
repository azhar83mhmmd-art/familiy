// ============================================
// KOMUNITAS LORD — AVATAR SET
// Semua avatar digambar dengan shape/canvas biasa
// (bukan gambar pihak ketiga), tema pemain bola.
// ============================================

const AVATAR_LIST = [
  { key: 'default', label: 'Default', skin: '#e8b88a', jersey: '#7B61FF', jersey2: '#00D4FF' },
  { key: 'merah',   label: 'Merah',   skin: '#e8b88a', jersey: '#e11d2f', jersey2: '#ffffff' },
  { key: 'biru',    label: 'Biru',    skin: '#c98a55', jersey: '#1d5fe1', jersey2: '#ffffff' },
  { key: 'kuning',  label: 'Kuning',  skin: '#e8b88a', jersey: '#ffc93c', jersey2: '#111827' },
  { key: 'hijau',   label: 'Hijau',   skin: '#c98a55', jersey: '#0e7a3f', jersey2: '#ffffff' },
  { key: 'hitam',   label: 'Hitam',   skin: '#8d5a34', jersey: '#111827', jersey2: '#ffc93c' },
];

function getAvatar(key) {
  return AVATAR_LIST.find(a => a.key === key) || AVATAR_LIST[0];
}

// Gambar avatar pemain bola di dalam lingkaran (canvas context)
function drawAvatar(ctx, key, cx, cy, r) {
  const av = getAvatar(key);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#0a2417';
  ctx.fill();
  ctx.clip();

  // Jersey (body)
  ctx.fillStyle = av.jersey;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.95, r * 0.85, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jersey stripe/collar accent
  ctx.fillStyle = av.jersey2;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.55, r * 0.28, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = av.skin;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.28, r * 0.22, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.12, r * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffc93c';
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.stroke();
}

// Preview kecil untuk picker (dipakai sebagai <canvas> per opsi)
function renderAvatarPreview(canvas, key) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  drawAvatar(ctx, key, size / 2, size / 2, size / 2 - 2);
}
