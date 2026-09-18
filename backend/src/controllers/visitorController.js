const pool = require('../config/db');

// GET /api/visitors?active=true
exports.getVisitors = async (req, res) => {
  const { active } = req.query;
  const where = active === 'true' ? 'WHERE time_out IS NULL' : '';
  try {
    const { rows } = await pool.query(`SELECT * FROM visitor_log ${where} ORDER BY time_in DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch visitor log.' });
  }
};

// POST /api/visitors  -> sign in a visitor
exports.createVisitor = async (req, res) => {
  const { visitor_name, phone, purpose, person_to_see } = req.body;
  if (!visitor_name) return res.status(400).json({ message: 'visitor_name is required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO visitor_log (visitor_name, phone, purpose, person_to_see)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [visitor_name, phone || null, purpose || null, person_to_see || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not log visitor.' });
  }
};

// PUT /api/visitors/:id/checkout  -> sign out a visitor
exports.checkOutVisitor = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE visitor_log SET time_out = now() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Visitor record not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not check out visitor.' });
  }
};