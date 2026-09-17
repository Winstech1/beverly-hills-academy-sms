const pool = require('../config/db');

// GET /api/reports/fee-collection  -> total collected/pending/overdue per class
exports.getFeeCollection = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.name AS class_name,
             COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Paid'), 0) AS collected,
             COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Pending'), 0) AS pending,
             COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Overdue'), 0) AS overdue
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      LEFT JOIN payments p ON p.student_id = s.id
      GROUP BY c.id, c.name
      ORDER BY c.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not generate fee collection report.' });
  }
};

// GET /api/reports/attendance-rate  -> % present per class over the last 30 days
exports.getAttendanceRate = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.name AS class_name,
             COUNT(a.id) AS total_marks,
             COUNT(a.id) FILTER (WHERE a.status = 'Present') AS present_count,
             CASE WHEN COUNT(a.id) = 0 THEN 0
                  ELSE ROUND(100.0 * COUNT(a.id) FILTER (WHERE a.status = 'Present') / COUNT(a.id), 1)
             END AS attendance_rate
      FROM classes c
      LEFT JOIN attendance a ON a.class_id = c.id AND a.date >= (CURRENT_DATE - INTERVAL '30 days')
      GROUP BY c.id, c.name
      ORDER BY c.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not generate attendance report.' });
  }
};

// GET /api/reports/academic-performance  -> average exam score per class
exports.getAcademicPerformance = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.name AS class_name,
             COUNT(r.id) AS results_count,
             ROUND(AVG(r.score), 1) AS average_score
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id
      LEFT JOIN exam_results r ON r.student_id = s.id
      GROUP BY c.id, c.name
      ORDER BY c.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not generate academic performance report.' });
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