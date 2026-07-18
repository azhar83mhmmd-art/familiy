// ============================================
// FLASH PEAK COMMUNITY — POSISI PLAYER
// Dipakai bareng di: form pendaftaran, landing
// showcase, live table, dan ID card.
// ============================================

const POSITION_LIST = [
  {
    key: 'ST',
    label: 'Striker',
    short: 'ST',
    desc: 'Ujung tombak serangan, spesialis cetak gol.',
    color: '#ff5c5c',
    colorSoft: 'rgba(255,92,92,0.14)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 6l3.2 2.3-1.2 3.8h-4l-1.2-3.8L12 6z" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>`
  },
  {
    key: 'WF',
    label: 'Wing Forward',
    short: 'WF',
    desc: 'Mengancam dari sisi sayap, cepat dan lincah.',
    color: '#00d4ff',
    colorSoft: 'rgba(0,212,255,0.14)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12c3-5 7-8 9-8s6 3 9 8c-3 5-7 8-9 8s-6-3-9-8z"/><path d="M12 8v8M8 12h8" stroke-width="1.6"/></svg>`
  },
  {
    key: 'CM',
    label: 'Central Midfielder',
    short: 'CM',
    desc: 'Otak permainan, atur alur serangan tim.',
    color: '#ffc93c',
    colorSoft: 'rgba(255,201,60,0.14)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18" stroke-width="1.4" opacity=".5"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/></svg>`
  },
  {
    key: 'CB',
    label: 'Center Back',
    short: 'CB',
    desc: 'Benteng pertahanan, kokoh menjaga gawang.',
    color: '#16e07a',
    colorSoft: 'rgba(22,224,122,0.14)',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8 3.5v5.4c0 5-3.4 8.7-8 10.1-4.6-1.4-8-5.1-8-10.1V5.5L12 2z"/></svg>`
  },
  {
    key: 'GK',
    label: 'Goalkeeper',
    short: 'GK',
    desc: 'Penjaga gawang, garda terakhir. Punya room khusus.',
    color: '#a78bfa',
    colorSoft: 'rgba(167,139,250,0.14)',
    room: true,
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16" stroke-width="1.4" opacity=".55"/><circle cx="15" cy="14" r="1.6" fill="currentColor" stroke="none"/></svg>`
  },
];

function getPosition(key) {
  return POSITION_LIST.find(p => p.key === key) || POSITION_LIST[0];
}
