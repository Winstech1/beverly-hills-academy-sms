const pool = require('../config/db');

// GET /api/applicants?status=&search=
exports.getApplicants = async (req, res) => {
  const { status, search = '' } = req.query;
  const params = [];
  const conditions = [];
  if (status) { params.push(status); conditions.push(`a.status = $${params.length}`); }
  if (search) { params.push(`%${search}%`); conditions.push(`a.full_name ILIKE $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT a.*, c.name AS applying_for_class_name
       FROM applicants a
       LEFT JOIN classes c ON c.id = a.applying_for_class_id
       ${where}
       ORDER BY a.applied_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch applicants.' });
  }
};

// POST /api/applicants
exports.createApplicant = async (req, res) => {
  const { full_name, date_of_birth, gender, applying_for_class_id, guardian_name, guardian_phone, source, notes } = req.body;
  if (!full_name) return res.status(400).json({ message: 'full_name is required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO applicants (full_name, date_of_birth, gender, applying_for_class_id, guardian_name, guardian_phone, source, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [full_name, date_of_birth || null, gender || null, applying_for_class_id || null,
       guardian_name || null, guardian_phone || null, source || 'Walk-in', notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add applicant.' });
  }
};

// PUT /api/applicants/:id  -> update status/notes (Pending -> Under Review -> Accepted/Rejected)
exports.updateApplicant = async (req, res) => {
  const { status, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE applicants SET status = COALESCE($1, status), notes = COALESCE($2, notes)
       WHERE id = $3 RETURNING *`,
      [status, notes, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Applicant not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update applicant.' });
  }
};

// DELETE /api/applicants/:id
exports.deleteApplicant = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM applicants WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Applicant not found.' });
    res.json({ message: 'Applicant deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete applicant.' });
  }
};

// POST /api/applicants/:id/convert  -> turn an Accepted applicant into a real student record
exports.convertToStudent = async (req, res) => {
  const { admission_no } = req.body;
  if (!admission_no) return res.status(400).json({ message: 'admission_no is required to enroll this applicant.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const applicantResult = await client.query('SELECT * FROM applicants WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!applicantResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Applicant not found.' });
    }
    const applicant = applicantResult.rows[0];
    if (applicant.status !== 'Accepted') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Only Accepted applicants can be enrolled.' });
    }

    const studentResult = await client.query(
      `INSERT INTO students (admission_no, full_name, class_id, date_of_birth, gender, guardian_name, guardian_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [admission_no, applicant.full_name, applicant.applying_for_class_id, applicant.date_of_birth,
       applicant.gender, applicant.guardian_name, applicant.guardian_phone]
    );
    const student = studentResult.rows[0];

    await client.query(
      `UPDATE applicants SET status = 'Enrolled', converted_student_id = $1 WHERE id = $2`,
      [student.id, req.params.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Applicant enrolled as a student.', student });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ message: 'A student with this admission number already exists.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Could not enroll applicant.' });
  } finally {
    client.release();
  }
};