const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// GET /api/students?search=&class_id=&status=&page=1&limit=10
exports.getStudents = async (req, res) => {
  const { search = '', status, page = 1, limit = 10 } = req.query;
  let { class_id } = req.query;

  // Teachers can only ever see their own class — override whatever was requested.
  if (req.user.role === 'teacher') {
    const myClass = await pool.query('SELECT id FROM classes WHERE class_teacher_id = $1', [req.user.id]);
    class_id = myClass.rows[0]?.id || 0; // 0 matches no real class, so an unassigned teacher sees nobody
  }

  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(s.full_name ILIKE $${params.length} OR s.admission_no ILIKE $${params.length})`);
  }
  if (class_id) {
    params.push(class_id);
    conditions.push(`s.class_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`s.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM students s ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT s.id, s.admission_no, s.full_name, s.photo_url, s.status,
              c.name AS class_name, c.id AS class_id
       FROM students s
       LEFT JOIN classes c ON c.id = s.class_id
       ${where}
       ORDER BY s.id
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch students.' });
  }
};

// GET /api/students/:id
exports.getStudent = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, c.name AS class_name
       FROM students s LEFT JOIN classes c ON c.id = s.class_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Student not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch student.' });
  }
};

// POST /api/students
// POST /api/students
// email/password are optional — if given, creates a login account (role='student') so the
// student (or parent) can sign into their own portal to view results, attendance, and fees.
exports.createStudent = async (req, res) => {
  const {
    admission_no, full_name, class_id, date_of_birth,
    gender, guardian_name, guardian_phone, address, photo_url,
    email, password,
  } = req.body;

  if (!admission_no || !full_name) {
    return res.status(400).json({ message: 'admission_no and full_name are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let userId = null;

    if (email && password) {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length) {
        await client.query('ROLLBACK');
        return res.status(409).json({ message: 'A user with this email already exists.' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const userResult = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role) VALUES ($1,$2,$3,'student') RETURNING id`,
        [full_name, email, passwordHash]
      );
      userId = userResult.rows[0].id;
    }

    const { rows } = await client.query(
      `INSERT INTO students
        (admission_no, full_name, class_id, date_of_birth, gender, guardian_name, guardian_phone, address, photo_url, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [admission_no, full_name, class_id || null, date_of_birth || null, gender || null,
       guardian_name || null, guardian_phone || null, address || null, photo_url || null, userId]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ message: 'A student with this admission number already exists.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Could not create student.' });
  } finally {
    client.release();
  }
};
// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  const fields = ['full_name', 'class_id', 'date_of_birth', 'gender',
    'guardian_name', 'guardian_phone', 'address', 'photo_url', 'status'];
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
      `UPDATE students SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ message: 'Student not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update student.' });
  }
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Student not found.' });
    res.json({ message: 'Student deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete student.' });
  }
};

// GET /api/students/me  -> the logged-in student's own record
exports.getMe = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, c.name AS class_name
       FROM students s LEFT JOIN classes c ON c.id = s.class_id
       WHERE s.user_id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'No student record linked to this account.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch your record.' });
  }
};