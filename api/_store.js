// Shared in-memory store untuk mode Vercel (serverless) + pub/sub
// agar SSE bisa dorong data secara instan (real-time tanpa delay).
// TIDAK ada members.json / file apapun.
global.__LORD_MEMBERS__ = global.__LORD_MEMBERS__ || [];
global.__LORD_COUNTER__ = global.__LORD_COUNTER__ || 0;
global.__LORD_SUBS__ = global.__LORD_SUBS__ || new Set();

function genId() {
  global.__LORD_COUNTER__ += 1;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FP-${rand}${global.__LORD_COUNTER__}`;
}

module.exports = {
  getMembers: () => global.__LORD_MEMBERS__,
  addMember: (m) => {
    global.__LORD_MEMBERS__.push(m);
    if (global.__LORD_MEMBERS__.length > 500) {
      global.__LORD_MEMBERS__ = global.__LORD_MEMBERS__.slice(-500);
    }
    global.__LORD_SUBS__.forEach((fn) => {
      try { fn(m); } catch (e) {}
    });
    return m;
  },
  subscribe: (fn) => {
    global.__LORD_SUBS__.add(fn);
    return () => global.__LORD_SUBS__.delete(fn);
  },
  genId
};
