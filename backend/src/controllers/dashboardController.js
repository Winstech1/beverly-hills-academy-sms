const pool = require('../config/db');

// GET /api/dashboard/stats  -> the 4 top cards + enrollment trend
exports.getStats = async (req, res) => {
  try {
    const [students, teachers, classes, fees] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM students WHERE status = 'Active'`),
      pool.query(`SELECT COUNT(*) FROM teachers WHERE status = 'Active'`),
      pool.query(`SELECT COUNT(*) FROM classes`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'Paid'`),
    ]);

    const enrollmentTrend = await pool.query(`
      SELECT to_char(date_trunc('month', enrolled_at), 'Mon') AS month,
             COUNT(*) AS count
      FROM students
      WHERE enrolled_at >= (CURRENT_DATE - INTERVAL '8 months')
      GROUP BY date_trunc('month', enrolled_at)
      ORDER BY date_trunc('month', enrolled_at)
    `);

    res.json({
      total_students: Number(students.rows[0].count),
      total_teachers: Number(teachers.rows[0].count),
      total_classes: Number(classes.rows[0].count),
      total_fees_collected: Number(fees.rows[0].total),
      enrollment_trend: enrollmentTrend.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load dashboard stats.' });
  }
};
