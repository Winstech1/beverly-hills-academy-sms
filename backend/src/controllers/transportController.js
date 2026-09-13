const pool = require('../config/db');

// ---------- ROUTES (buses) ----------

// GET /api/transport/routes
exports.getRoutes = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, COUNT(a.id) AS assigned_count
      FROM transport_routes r
      LEFT JOIN transport_assignments a ON a.route_id = r.id
      GROUP BY r.id
      ORDER BY r.route_name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch routes.' });
  }
};

// POST /api/transport/routes
exports.createRoute = async (req, res) => {
  const { route_name, vehicle, driver_name, capacity } = req.body;
  if (!route_name) return res.status(400).json({ message: 'route_name is required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO transport_routes (route_name, vehicle, driver_name, capacity)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [route_name, vehicle || null, driver_name || null, capacity || 30]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not create route.' });
  }
};

// PUT /api/transport/routes/:id
exports.updateRoute = async (req, res) => {
  const { route_name, vehicle, driver_name, capacity, status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE transport_routes SET
        route_name = COALESCE($1, route_name),
        vehicle = COALESCE($2, vehicle),
        driver_name = COALESCE($3, driver_name),
        capacity = COALESCE($4, capacity),
        status = COALESCE($5, status)
       WHERE id = $6 RETURNING *`,
      [route_name, vehicle, driver_name, capacity, status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Route not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update route.' });
  }
};

// DELETE /api/transport/routes/:id
exports.deleteRoute = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM transport_routes WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Route not found.' });
    res.json({ message: 'Route deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete route. Students may still be assigned to it.' });
  }
};

// ---------- ASSIGNMENTS (student <-> route + payment) ----------

function paymentStatus(fee, paid) {
  if (Number(paid) <= 0) return 'Owing';
  if (Number(paid) >= Number(fee)) return 'Paid';
  return 'Partial';
}

// GET /api/transport/assignments?route_id=&term=
exports.getAssignments = async (req, res) => {
  const { route_id, term } = req.query;
  const params = [];
  const conditions = [];
  if (route_id) { params.push(route_id); conditions.push(`ta.route_id = $${params.length}`); }
  if (term) { params.push(term); conditions.push(`ta.term = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT ta.id, ta.direction, ta.fee_amount, ta.amount_paid, ta.term,
              s.id AS student_id, s.full_name AS student_name, s.admission_no,
              c.name AS class_name,
              r.id AS route_id, r.route_name
       FROM transport_assignments ta
       JOIN students s ON s.id = ta.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       JOIN transport_routes r ON r.id = ta.route_id
       ${where}
       ORDER BY s.full_name`,
      params
    );
    const withStatus = rows.map((r) => ({ ...r, status: paymentStatus(r.fee_amount, r.amount_paid) }));
    res.json(withStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch transport assignments.' });
  }
};

// POST /api/transport/assignments
exports.createAssignment = async (req, res) => {
  const { student_id, route_id, direction, fee_amount, amount_paid, term } = req.body;
  if (!student_id || !route_id || !direction || !term) {
    return res.status(400).json({ message: 'student_id, route_id, direction, and term are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO transport_assignments (student_id, route_id, direction, fee_amount, amount_paid, term)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (student_id, term)
       DO UPDATE SET route_id = EXCLUDED.route_id, direction = EXCLUDED.direction,
                     fee_amount = EXCLUDED.fee_amount, amount_paid = EXCLUDED.amount_paid
       RETURNING *`,
      [student_id, route_id, direction, fee_amount || 0, amount_paid || 0, term]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not assign student to route.' });
  }
};

// PUT /api/transport/assignments/:id  -> e.g. record a new payment
exports.updateAssignment = async (req, res) => {
  const { direction, fee_amount, amount_paid, route_id } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE transport_assignments SET
        direction = COALESCE($1, direction),
        fee_amount = COALESCE($2, fee_amount),
        amount_paid = COALESCE($3, amount_paid),
        route_id = COALESCE($4, route_id)
       WHERE id = $5 RETURNING *`,
      [direction, fee_amount, amount_paid, route_id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Assignment not found.' });
    res.json({ ...rows[0], status: paymentStatus(rows[0].fee_amount, rows[0].amount_paid) });
  } catch (err) {
    res.status(500).json({ message: 'Could not update assignment.' });
  }
};

// DELETE /api/transport/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM transport_assignments WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Assignment not found.' });
    res.json({ message: 'Assignment removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not remove assignment.' });
  }
};