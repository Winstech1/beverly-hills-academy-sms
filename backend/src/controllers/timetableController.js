const pool = require('../config/db');

// GET /api/timetable?class_id=1
exports.getTimetable = async (req, res) => {
  const { class_id } = req.query;
  if (!class_id) return res.status(400).json({ message: 'class_id is required.' });

  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.day_of_week, t.start_time, t.end_time,
              sub.id AS subject_id, sub.name AS subject_name,
              tc.id AS teacher_id, tc.full_name AS teacher_name
       FROM timetable_slots t
       LEFT JOIN subjects sub ON sub.id = t.subject_id
       LEFT JOIN teachers tc ON tc.id = t.teacher_id
       WHERE t.class_id = $1
       ORDER BY
         CASE t.day_of_week
           WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
           WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 ELSE 6 END,
         t.start_time`,
      [class_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch timetable.' });
  }
};

// POST /api/timetable
exports.createSlot = async (req, res) => {
  const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time } = req.body;
  if (!class_id || !subject_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ message: 'class_id, subject_id, day_of_week, start_time, and end_time are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO timetable_slots (class_id, subject_id, teacher_id, day_of_week, start_time, end_time)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [class_id, subject_id, teacher_id || null, day_of_week, start_time, end_time]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create timetable slot.' });
  }
};

// DELETE /api/timetable/:id
exports.deleteSlot = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM timetable_slots WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Slot not found.' });
    res.json({ message: 'Slot deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete slot.' });
  }
};