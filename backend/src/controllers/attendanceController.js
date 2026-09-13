const pool = require('../config/db');

// GET /api/attendance?class_id=1&date=2026-09-13
// Returns every student in that class, with their attendance status for that date (or null if not marked yet)
exports.getAttendance = async (req, res) => {
  let { class_id, date } = req.query;
  if (!date) {
    return res.status(400).json({ message: 'date is required.' });
  }

  if (req.user.role === 'teacher') {
    const myClass = await pool.query('SELECT id FROM classes WHERE class_teacher_id = $1', [req.user.id]);
    class_id = myClass.rows[0]?.id;
    if (!class_id) return res.json([]); // teacher has no assigned class yet
  } else if (!class_id) {
    return res.status(400).json({ message: 'class_id is required.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT s.id AS student_id, s.full_name, s.admission_no, a.status
       FROM students s
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $2
       WHERE s.class_id = $1
       ORDER BY s.full_name`,
      [class_id, date]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch attendance.' });
  }
};

// POST /api/attendance
// Body: { class_id, date, records: [{ student_id, status }, ...] }
// Upserts every record in one go (one date + student combo = one row, overwritten if resubmitted)
exports.saveAttendance = async (req, res) => {
  let { class_id, date, records } = req.body;
  if (!date || !Array.isArray(records) || !records.length) {
    return res.status(400).json({ message: 'date and a non-empty records array are required.' });
  }

  if (req.user.role === 'teacher') {
    const myClass = await pool.query('SELECT id FROM classes WHERE class_teacher_id = $1', [req.user.id]);
    class_id = myClass.rows[0]?.id;
    if (!class_id) return res.status(403).json({ message: 'You are not assigned as a class teacher.' });
  } else if (!class_id) {
    return res.status(400).json({ message: 'class_id is required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const r of records) {
      await client.query(
        `INSERT INTO attendance (student_id, class_id, date, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id, date)
         DO UPDATE SET status = EXCLUDED.status, class_id = EXCLUDED.class_id`,
        [r.student_id, class_id, date, r.status]
      );
    }
    await client.query('COMMIT');
    res.json({ message: 'Attendance saved.', count: records.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Could not save attendance.' });
  } finally {
    client.release();
  }
};

// GET /api/attendance/summary?class_id=1&date=2026-09-13  -> quick counts for a class/date
exports.getSummary = async (req, res) => {
  const { class_id, date } = req.query;
  if (!class_id || !date) {
    return res.status(400).json({ message: 'class_id and date are required.' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*) FROM attendance WHERE class_id = $1 AND date = $2 GROUP BY status`,
      [class_id, date]
    );
    const summary = { Present: 0, Absent: 0, Late: 0 };
    rows.forEach((r) => { summary[r.status] = Number(r.count); });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch attendance summary.' });
  }
};