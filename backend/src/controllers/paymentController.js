const pool = require('../config/db');

// GET /api/payments?search=&status=&page=1&limit=10
exports.getPayments = async (req, res) => {
  const { search = '', status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(s.full_name ILIKE $${params.length} OR s.admission_no ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    conditions.push(`p.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM payments p LEFT JOIN students s ON s.id = p.student_id ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT p.id, p.amount, p.status, p.paid_at, p.method, p.reference, p.created_at,
              s.full_name AS student_name, s.admission_no, c.name AS class_name
       FROM payments p
       LEFT JOIN students s ON s.id = p.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch payments.' });
  }
};

// GET /api/payments/summary  -> totals for the top cards
exports.getSummary = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE status = 'Paid'), 0) AS total_paid,
        COALESCE(SUM(amount) FILTER (WHERE status = 'Pending'), 0) AS total_pending,
        COALESCE(SUM(amount) FILTER (WHERE status = 'Overdue'), 0) AS total_overdue,
        COUNT(*) FILTER (WHERE status = 'Paid') AS paid_count,
        COUNT(*) FILTER (WHERE status = 'Pending') AS pending_count,
        COUNT(*) FILTER (WHERE status = 'Overdue') AS overdue_count
      FROM payments
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch fee summary.' });
  }
};

// POST /api/payments  -> record a new payment
exports.createPayment = async (req, res) => {
  const { student_id, amount, status, paid_at, method, reference } = req.body;
  if (!student_id || !amount) {
    return res.status(400).json({ message: 'student_id and amount are required.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO payments (student_id, amount, status, paid_at, method, reference)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [student_id, amount, status || 'Pending', paid_at || null, method || null, reference || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not record payment.' });
  }
};

// PUT /api/payments/:id  -> e.g. mark Pending -> Paid
exports.updatePayment = async (req, res) => {
  const { status, paid_at, method, reference } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE payments SET
        status = COALESCE($1, status),
        paid_at = COALESCE($2, paid_at),
        method = COALESCE($3, method),
        reference = COALESCE($4, reference)
       WHERE id = $5 RETURNING *`,
      [status, paid_at, method, reference, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Payment not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update payment.' });
  }
};

// DELETE /api/payments/:id
exports.deletePayment = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM payments WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Payment not found.' });
    res.json({ message: 'Payment deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete payment.' });
  }
};

// GET /api/payments/mine  -> the logged-in student's own fee/payment history
exports.getMyPayments = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.amount, p.status, p.paid_at, p.method
       FROM payments p
       JOIN students s ON s.id = p.student_id
       WHERE s.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch your payments.' });
  }
};