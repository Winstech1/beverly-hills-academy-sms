const pool = require('../config/db');

// GET /api/teachers?search=&department=&page=1&limit=10
exports.getTeachers = async (req, res) => {
  const { search = '', department, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(t.full_name ILIKE $${params.length} OR t.staff_no ILIKE $${params.length})`);
  }
  if (department) {
    params.push(department);
    conditions.push(`t.department = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM teachers t ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT t.id, t.staff_no, t.full_name, t.photo_url, t.department, t.status,
              sub.name AS subject_name
       FROM teachers t
       LEFT JOIN subjects sub ON sub.id = t.subject_id
       ${where}
       ORDER BY t.id
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch teachers.' });
  }
};

// GET /api/teachers/:id
exports.getTeacher = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, sub.name AS subject_name
       FROM teachers t LEFT JOIN subjects sub ON sub.id = t.subject_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Teacher not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch teacher.' });
  }
};

// POST /api/teachers
exports.createTeacher = async (req, res) => {
  const { staff_no, full_name, subject_id, department, phone, photo_url } = req.body;
  if (!staff_no || !full_name) {
    return res.status(400).json({ message: 'staff_no and full_name are required.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO teachers (staff_no, full_name, subject_id, department, phone, photo_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [staff_no, full_name, subject_id || null, department || null, phone || null, photo_url || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'A teacher with this staff number already exists.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Could not create teacher.' });
  }
};

// PUT /api/teachers/:id
exports.updateTeacher = async (req, res) => {
  const fields = ['full_name', 'subject_id', 'department', 'phone', 'photo_url', 'status'];
  const updates = [];
  const values = [];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      values.push(req.body[field]);
      updates.push(`${field} = $${values.length}`);
    }
  });

  if (!updates.length) return res.status(400).json({ message: 'No fields to update.' });

  values.push(req.params.id);
  try {
    const { rows } = await pool.query(
      `UPDATE teachers SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ message: 'Teacher not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update teacher.' });
  }
};

// DELETE /api/teachers/:id
exports.deleteTeacher = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM teachers WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Teacher not found.' });
    res.json({ message: 'Teacher deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete teacher.' });
  }
};
