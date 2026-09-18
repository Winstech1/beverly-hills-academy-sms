const pool = require('../config/db');

// GET /api/approvals?status=&type=  -> everyone's requests (admin/principal only)
exports.getApprovals = async (req, res) => {
  const { status, type } = req.query;
  const params = [];
  const conditions = [];
  if (status) { params.push(status); conditions.push(`a.status = $${params.length}`); }
  if (type) { params.push(type); conditions.push(`a.type = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.full_name AS requested_by_name, d.full_name AS decided_by_name
       FROM approval_requests a
       LEFT JOIN users u ON u.id = a.requested_by
       LEFT JOIN users d ON d.id = a.decided_by
       ${where}
       ORDER BY a.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch approval requests.' });
  }
};

// GET /api/approvals/mine  -> requests the logged-in user has made
exports.getMyApprovals = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, d.full_name AS decided_by_name
       FROM approval_requests a
       LEFT JOIN users d ON d.id = a.decided_by
       WHERE a.requested_by = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch your requests.' });
  }
};

// POST /api/approvals  -> anyone logged in can submit a request
exports.createApproval = async (req, res) => {
  const { type, details } = req.body;
  if (!type || !details) return res.status(400).json({ message: 'type and details are required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO approval_requests (type, requested_by, details)
       VALUES ($1,$2,$3) RETURNING *`,
      [type, req.user.id, details]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not submit request.' });
  }
};

// PUT /api/approvals/:id/decide  -> admin/principal approves or rejects
exports.decideApproval = async (req, res) => {
  const { status, decision_notes } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: "status must be 'Approved' or 'Rejected'." });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE approval_requests SET
        status = $1, decision_notes = $2, decided_by = $3, decided_at = now()
       WHERE id = $4 AND status = 'Pending' RETURNING *`,
      [status, decision_notes || null, req.user.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Request not found or already decided.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not record decision.' });
  }
};