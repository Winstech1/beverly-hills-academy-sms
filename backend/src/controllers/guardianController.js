const pool = require('../config/db');

// GET /api/guardians?search=
exports.getGuardians = async (req, res) => {
  const { search = '' } = req.query;
  const params = [];
  let where = '';
  if (search) {
    params.push(`%${search}%`);
    where = `WHERE g.full_name ILIKE $1 OR g.phone ILIKE $1`;
  }
  try {
    const { rows } = await pool.query(
      `SELECT g.*, COUNT(sg.student_id) AS children_count
       FROM guardians g
       LEFT JOIN student_guardians sg ON sg.guardian_id = g.id
       ${where}
       GROUP BY g.id
       ORDER BY g.full_name`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch guardians.' });
  }
};

// GET /api/guardians/:id  -> guardian detail plus their linked children
exports.getGuardian = async (req, res) => {
  try {
    const guardian = await pool.query('SELECT * FROM guardians WHERE id = $1', [req.params.id]);
    if (!guardian.rows.length) return res.status(404).json({ message: 'Guardian not found.' });

    const children = await pool.query(
      `SELECT s.id, s.full_name, s.admission_no, c.name AS class_name, sg.is_primary
       FROM student_guardians sg
       JOIN students s ON s.id = sg.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE sg.guardian_id = $1
       ORDER BY s.full_name`,
      [req.params.id]
    );

    res.json({ ...guardian.rows[0], children: children.rows });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch guardian.' });
  }
};

// POST /api/guardians
exports.createGuardian = async (req, res) => {
  const { full_name, relationship, phone, alt_phone, email, occupation, address } = req.body;
  if (!full_name || !phone) {
    return res.status(400).json({ message: 'full_name and phone are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO guardians (full_name, relationship, phone, alt_phone, email, occupation, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [full_name, relationship || null, phone, alt_phone || null, email || null, occupation || null, address || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create guardian.' });
  }
};

// PUT /api/guardians/:id
exports.updateGuardian = async (req, res) => {
  const { full_name, relationship, phone, alt_phone, email, occupation, address } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE guardians SET
        full_name = COALESCE($1, full_name), relationship = COALESCE($2, relationship),
        phone = COALESCE($3, phone), alt_phone = COALESCE($4, alt_phone),
        email = COALESCE($5, email), occupation = COALESCE($6, occupation),
        address = COALESCE($7, address)
       WHERE id = $8 RETURNING *`,
      [full_name, relationship, phone, alt_phone, email, occupation, address, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Guardian not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update guardian.' });
  }
};

// DELETE /api/guardians/:id
exports.deleteGuardian = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM guardians WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Guardian not found.' });
    res.json({ message: 'Guardian deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete guardian.' });
  }
};

// POST /api/guardians/:id/link  -> link this guardian to a student
exports.linkStudent = async (req, res) => {
  const { student_id, is_primary } = req.body;
  if (!student_id) return res.status(400).json({ message: 'student_id is required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO student_guardians (student_id, guardian_id, is_primary)
       VALUES ($1,$2,$3)
       ON CONFLICT (student_id, guardian_id) DO UPDATE SET is_primary = EXCLUDED.is_primary
       RETURNING *`,
      [student_id, req.params.id, !!is_primary]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not link guardian to student.' });
  }
};

// DELETE /api/guardians/:id/link/:studentId
exports.unlinkStudent = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM student_guardians WHERE guardian_id = $1 AND student_id = $2',
      [req.params.id, req.params.studentId]
    );
    if (!rowCount) return res.status(404).json({ message: 'Link not found.' });
    res.json({ message: 'Guardian unlinked from student.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not unlink guardian.' });
  }
};

// GET /api/guardians/for-student/:studentId  -> guardians linked to a given student
exports.getGuardiansForStudent = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.*, sg.is_primary
       FROM student_guardians sg
       JOIN guardians g ON g.id = sg.guardian_id
       WHERE sg.student_id = $1
       ORDER BY sg.is_primary DESC, g.full_name`,
      [req.params.studentId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch guardians for this student.' });
  }
};