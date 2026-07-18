// Server-Sent Events endpoint — real-time TANPA delay/polling.
// Vercel serverless mendukung streaming response, jadi SSE bisa
// dorong data ke client persis saat member baru join (bukan cek berkala).
const { getMembers, subscribe } = require('./_store');

module.exports = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // Kirim snapshot awal
  res.write(`event: snapshot\ndata: ${JSON.stringify(getMembers())}\n\n`);

  const unsubscribe = subscribe((member) => {
    res.write(`event: newMember\ndata: ${JSON.stringify(member)}\n\n`);
  });

  const keepAlive = setInterval(() => {
    res.write(`: ping\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
    res.end();
  });
};
