const pool = require('../config/db');

// GET /api/subjects
exports.getSubjects = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM subjects ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch subjects.' });
  }
};

// POST /api/subjects
exports.createSubject = async (req, res) => {
  const { name, department } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required.' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO subjects (name, department) VALUES ($1,$2) RETURNING *',
      [name, department || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not create subject.' });
  }
};