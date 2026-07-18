const { addMember, genId } = require('./_store');

module.exports = (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  let body = req.body;
  if (!body || typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch (e) { body = {}; }
  }

  const { nama, usia, gameId, username, alasan, avatar, posisi } = body || {};
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

  addMember(member);
  res.status(200).json({ ok: true, member });
};
