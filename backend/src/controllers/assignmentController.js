const pool = require('../config/db');

// GET /api/assignments?class_id=
exports.getAssignments = async (req, res) => {
  const { class_id } = req.query;
  const params = [];
  let where = '';
  if (class_id) {
    params.push(class_id);
    where = `WHERE a.class_id = $1`;
  }

  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.title, a.description, a.due_date, a.created_at,
              c.id AS class_id, c.name AS class_name,
              sub.id AS subject_id, sub.name AS subject_name
       FROM assignments a
       LEFT JOIN classes c ON c.id = a.class_id
       LEFT JOIN subjects sub ON sub.id = a.subject_id
       ${where}
       ORDER BY a.due_date ASC NULLS LAST, a.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch assignments.' });
  }
};

// POST /api/assignments
exports.createAssignment = async (req, res) => {
  const { title, class_id, subject_id, description, due_date } = req.body;
  if (!title || !class_id || !subject_id) {
    return res.status(400).json({ message: 'title, class_id, and subject_id are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO assignments (title, class_id, subject_id, description, due_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, class_id, subject_id, description || null, due_date || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create assignment.' });
  }
};

// PUT /api/assignments/:id
exports.updateAssignment = async (req, res) => {
  const { title, class_id, subject_id, description, due_date } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE assignments SET
        title = COALESCE($1, title),
        class_id = COALESCE($2, class_id),
        subject_id = COALESCE($3, subject_id),
        description = COALESCE($4, description),
        due_date = COALESCE($5, due_date)
       WHERE id = $6 RETURNING *`,
      [title, class_id, subject_id, description, due_date, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Assignment not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update assignment.' });
  }
};

// DELETE /api/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM assignments WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Assignment not found.' });
    res.json({ message: 'Assignment deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete assignment.' });
  }
};