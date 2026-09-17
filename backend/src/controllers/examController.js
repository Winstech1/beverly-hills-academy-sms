const pool = require('../config/db');

// GET /api/exams
// GET /api/exams
exports.getExams = async (req, res) => {
  try {
    const params = [];
    let where = '';

    if (req.user.role === 'teacher') {
      const myClass = await pool.query('SELECT id FROM classes WHERE class_teacher_id = $1', [req.user.id]);
      const classId = myClass.rows[0]?.id || 0;
      params.push(classId);
      where = 'WHERE e.class_id = $1';
    }

    const { rows } = await pool.query(`
      SELECT e.id, e.name, e.exam_date, e.max_score,
             c.id AS class_id, c.name AS class_name,
             sub.id AS subject_id, sub.name AS subject_name
      FROM exams e
      LEFT JOIN classes c ON c.id = e.class_id
      LEFT JOIN subjects sub ON sub.id = e.subject_id
      ${where}
      ORDER BY e.exam_date DESC
    `, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch exams.' });
  }
};

// POST /api/exams
// POST /api/exams
exports.createExam = async (req, res) => {
  const { name, subject_id, exam_date, max_score } = req.body;
  let { class_id } = req.body;

  if (req.user.role === 'teacher') {
    const myClass = await pool.query('SELECT id FROM classes WHERE class_teacher_id = $1', [req.user.id]);
    class_id = myClass.rows[0]?.id;
    if (!class_id) return res.status(403).json({ message: 'You are not assigned as a class teacher.' });
  }

  if (!name || !class_id || !subject_id || !exam_date) {
    return res.status(400).json({ message: 'name, class_id, subject_id, and exam_date are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO exams (name, class_id, subject_id, exam_date, max_score)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, class_id, subject_id, exam_date, max_score || 100]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create exam.' });
  }
};

// DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM exams WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Exam not found.' });
    res.json({ message: 'Exam deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete exam.' });
  }
};

// GET /api/exams/:id/results  -> roster of the exam's class, with any existing score
// GET /api/exams/:id/results  -> roster of the exam's class, with any existing score
exports.getResults = async (req, res) => {
  try {
    const examResult = await pool.query('SELECT * FROM exams WHERE id = $1', [req.params.id]);
    if (!examResult.rows.length) return res.status(404).json({ message: 'Exam not found.' });
    const exam = examResult.rows[0];

    if (req.user.role === 'teacher') {
      const myClass = await pool.query('SELECT id FROM classes WHERE class_teacher_id = $1', [req.user.id]);
      if (exam.class_id !== myClass.rows[0]?.id) {
        return res.status(403).json({ message: 'This exam belongs to a different class.' });
      }
    }
    const { rows } = await pool.query(
      `SELECT s.id AS student_id, s.full_name, s.admission_no, r.score, r.grade, r.remarks
       FROM students s
       LEFT JOIN exam_results r ON r.student_id = s.id AND r.exam_id = $2
       WHERE s.class_id = $1
       ORDER BY s.full_name`,
      [exam.class_id, req.params.id]
    );
    res.json({ exam, roster: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch results.' });
  }
};

// Simple grade bands — adjust freely to match your school's grading scale
function computeGrade(score, maxScore) {
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

// POST /api/exams/:id/results
// Body: { records: [{ student_id, score }, ...] }
exports.saveResults = async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || !records.length) {
    return res.status(400).json({ message: 'A non-empty records array is required.' });
  }

  const client = await pool.connect();
  try {
    const examResult = await client.query('SELECT max_score, class_id FROM exams WHERE id = $1', [req.params.id]);
    if (!examResult.rows.length) {
      client.release();
      return res.status(404).json({ message: 'Exam not found.' });
    }

    if (req.user.role === 'teacher') {
      const myClass = await client.query('SELECT id FROM classes WHERE class_teacher_id = $1', [req.user.id]);
      if (examResult.rows[0].class_id !== myClass.rows[0]?.id) {
        client.release();
        return res.status(403).json({ message: 'This exam belongs to a different class.' });
      }
    }

    const maxScore = examResult.rows[0].max_score;

    await client.query('BEGIN');
    for (const r of records) {
      if (r.score === null || r.score === '' || r.score === undefined) continue;
      const grade = computeGrade(Number(r.score), maxScore);
      await client.query(
        `INSERT INTO exam_results (exam_id, student_id, score, grade)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (exam_id, student_id)
         DO UPDATE SET score = EXCLUDED.score, grade = EXCLUDED.grade`,
        [req.params.id, r.student_id, r.score, grade]
      );
    }
    await client.query('COMMIT');
    res.json({ message: 'Results saved.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Could not save results.' });
  } finally {
    client.release();
  }
};

// GET /api/exams/my-results  -> every graded exam result for the logged-in student
exports.getMyResults = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.score, r.grade, e.name AS exam_name, e.exam_date, e.max_score, sub.name AS subject_name
       FROM exam_results r
       JOIN exams e ON e.id = r.exam_id
       JOIN subjects sub ON sub.id = e.subject_id
       JOIN students s ON s.id = r.student_id
       WHERE s.user_id = $1
       ORDER BY e.exam_date DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch your results.' });
  }
};