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

// PUT /api/subjects/:id
exports.updateSubject = async (req, res) => {
  const { name, department } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE subjects SET name = COALESCE($1, name), department = COALESCE($2, department)
       WHERE id = $3 RETURNING *`,
      [name, department, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Subject not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update subject.' });
  }
};

// DELETE /api/subjects/:id
exports.deleteSubject = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM subjects WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Subject not found.' });
    res.json({ message: 'Subject deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete subject. It may still be linked to a teacher or exam.' });
  }
};