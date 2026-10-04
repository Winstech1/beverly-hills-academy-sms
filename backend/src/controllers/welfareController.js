const pool = require('../config/db');

// ---------- CONTRIBUTIONS ----------

// GET /api/welfare/contributions?teacher_id=&year=  (admin/principal)
exports.getContributions = async (req, res) => {
  const { teacher_id, year } = req.query;
  const params = [];
  const conditions = [];
  if (teacher_id) { params.push(teacher_id); conditions.push(`w.teacher_id = $${params.length}`); }
  if (year) { params.push(year); conditions.push(`w.year = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT w.*, t.full_name AS teacher_name, t.staff_no
       FROM welfare_contributions w
       JOIN teachers t ON t.id = w.teacher_id
       ${where}
       ORDER BY w.year DESC, w.month DESC, t.full_name`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch contributions.' });
  }
};

// GET /api/welfare/contributions/mine  -> the logged-in teacher's own contributions
exports.getMyContributions = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT w.month, w.year, w.amount
       FROM welfare_contributions w
       JOIN teachers t ON t.id = w.teacher_id
       WHERE t.user_id = $1
       ORDER BY w.year DESC, w.month DESC`,
      [req.user.id]
    );
    const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);
    res.json({ contributions: rows, total });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch your contributions.' });
  }
};

// POST /api/welfare/contributions  -> record or update a teacher's contribution for a month
exports.createContribution = async (req, res) => {
  const { teacher_id, month, year, amount } = req.body;
  if (!teacher_id || !month || !year || !amount) {
    return res.status(400).json({ message: 'teacher_id, month, year, and amount are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO welfare_contributions (teacher_id, month, year, amount, recorded_by)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (teacher_id, month, year)
       DO UPDATE SET amount = EXCLUDED.amount, recorded_by = EXCLUDED.recorded_by, recorded_at = now()
       RETURNING *`,
      [teacher_id, month, year, amount, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not record contribution.' });
  }
};

// DELETE /api/welfare/contributions/:id
exports.deleteContribution = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM welfare_contributions WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Contribution not found.' });
    res.json({ message: 'Contribution deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete contribution.' });
  }
};

// ---------- POLICIES ----------

// GET /api/welfare/policies  -> readable by admin and teachers alike
exports.getPolicies = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.full_name AS uploaded_by_name
       FROM welfare_policies p
       LEFT JOIN users u ON u.id = p.uploaded_by
       ORDER BY p.uploaded_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch policies.' });
  }
};

// POST /api/welfare/policies
exports.createPolicy = async (req, res) => {
  const { title, content, document_url } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'title and content are required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO welfare_policies (title, content, document_url, uploaded_by)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [title, content, document_url || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not add policy.' });
  }
};

// DELETE /api/welfare/policies/:id
exports.deletePolicy = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM welfare_policies WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Policy not found.' });
    res.json({ message: 'Policy deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete policy.' });
  }
};