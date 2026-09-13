const pool = require('../config/db');

// GET /api/messages  -> inbox: messages sent to my role, or to me directly
exports.getInbox = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.full_name AS sender_name
       FROM messages m
       LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.recipient_role = $1 OR m.recipient_id = $2
       ORDER BY m.sent_at DESC`,
      [req.user.role, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch inbox.' });
  }
};

// GET /api/messages/sent  -> messages I sent
exports.getSent = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM messages WHERE sender_id = $1 ORDER BY sent_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch sent messages.' });
  }
};

// POST /api/messages  -> broadcast to a role (Admin, Principal, Teacher, Parent, Student)
exports.sendMessage = async (req, res) => {
  const { recipient_role, subject, body } = req.body;
  if (!recipient_role || !body) {
    return res.status(400).json({ message: 'recipient_role and body are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, recipient_role, subject, body)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, recipient_role, subject || null, body]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not send message.' });
  }
};