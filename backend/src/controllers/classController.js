const pool = require('../config/db');

// GET /api/classes
exports.getClasses = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.capacity, u.full_name AS class_teacher,
              COUNT(s.id) AS student_count
       FROM classes c
       LEFT JOIN users u ON u.id = c.class_teacher_id
       LEFT JOIN students s ON s.class_id = c.id
       GROUP BY c.id, u.full_name
       ORDER BY c.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch classes.' });
  }
};

// POST /api/classes
exports.createClass = async (req, res) => {
  const { name, capacity, class_teacher_id } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required.' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO classes (name, capacity, class_teacher_id) VALUES ($1,$2,$3) RETURNING *`,
      [name, capacity || 50, class_teacher_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not create class.' });
  }
};

// PUT /api/classes/:id
exports.updateClass = async (req, res) => {
  const { name, capacity, class_teacher_id } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE classes SET name = COALESCE($1, name), capacity = COALESCE($2, capacity),
       class_teacher_id = COALESCE($3, class_teacher_id) WHERE id = $4 RETURNING *`,
      [name, capacity, class_teacher_id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Class not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update class.' });
  }
};

// DELETE /api/classes/:id
exports.deleteClass = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM classes WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Class not found.' });
    res.json({ message: 'Class deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete class.' });
  }
};
