// ============================================
// KOMUNITAS LORD — REAL-TIME SERVER
// Node.js + Express + Socket.IO
// TIDAK ada members.json — semua data disimpan
// di memory (RAM) server saja, sesuai permintaan.
// ============================================

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── In-memory store (reset setiap kali server restart) ──
let members = [];
let counter = 0;

function genId() {
  counter += 1;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FP-${rand}${counter}`;
}

// ── SSE clients (fallback kalau Socket.IO diblok jaringan) ──
const sseClients = new Set();
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive'
  });
  res.write(`event: snapshot\ndata: ${JSON.stringify(members)}\n\n`);
  sseClients.add(res);
  const ping = setInterval(() => res.write(`: ping\n\n`), 15000);
  req.on('close', () => { clearInterval(ping); sseClients.delete(res); });
});

// ── REST fallback (dipakai juga oleh mode polling untuk Vercel) ──
app.get('/api/members', (req, res) => {
  res.json({ ok: true, total: members.length, members });
});

app.post('/api/join', (req, res) => {
  const { nama, usia, gameId, username, alasan, avatar, posisi } = req.body || {};
  const VALID_POSITIONS = ['ST', 'WF', 'CM', 'CB', 'GK'];

  if (!nama || !String(nama).trim()) return res.status(400).json({ ok: false, error: 'Nama wajib diisi' });
  if (!usia || isNaN(usia)) return res.status(400).json({ ok: false, error: 'Usia tidak valid' });
  if (!username || !String(username).trim()) return res.status(400).json({ ok: false, error: 'Username wajib diisi' });
  if (!posisi || !VALID_POSITIONS.includes(String(posisi).toUpperCase())) {
    return res.status(400).json({ ok: false, error: 'Posisi tidak valid' });
  }

  const member = {
    serverId: genId(),
    nama: String(nama).trim(),
    usia: Number(usia),
    gameId: gameId ? String(gameId).trim() : '',
    username: String(username).trim().replace(/^@/, ''),
    alasan: alasan ? String(alasan).trim() : '',
    avatar: avatar || 'default',
    posisi: String(posisi).toUpperCase(),
    status: 'succeed',
    joinedAt: Date.now()
  };

  members.push(member);
  if (members.length > 500) members = members.slice(-500); // batasi memory

  // Broadcast real-time ke semua client yang terhubung (instan, tanpa delay)
  io.emit('newMember', member);
  io.emit('membersList', members);
  sseClients.forEach((c) => c.write(`event: newMember\ndata: ${JSON.stringify(member)}\n\n`));

  res.json({ ok: true, member });
});

// ── Socket.IO ──
io.on('connection', (socket) => {
  // Kirim data awal ke client yang baru connect
  socket.emit('membersList', members);

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 4624;
server.listen(PORT, () => {
  console.log(`⚽ Komunitas Lord server jalan di http://localhost:${PORT}`);
});
