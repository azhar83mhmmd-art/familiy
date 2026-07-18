const { getMembers } = require('./_store');

module.exports = (req, res) => {
  const members = getMembers();
  res.status(200).json({ ok: true, total: members.length, members });
};
