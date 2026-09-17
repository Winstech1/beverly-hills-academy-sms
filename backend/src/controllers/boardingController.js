const pool = require('../config/db');

// ---------- HOUSES ----------

// GET /api/boarding/houses
exports.getHouses = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT h.*, COUNT(a.id) FILTER (WHERE a.status = 'Checked In') AS occupied_count
      FROM boarding_houses h
      LEFT JOIN boarding_assignments a ON a.house_id = h.id
      GROUP BY h.id
      ORDER BY h.gender, h.name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch boarding houses.' });
  }
};

// POST /api/boarding/houses
exports.createHouse = async (req, res) => {
  const { name, gender, warden_name, contact_phone, capacity } = req.body;
  if (!name || !gender) return res.status(400).json({ message: 'name and gender are required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO boarding_houses (name, gender, warden_name, contact_phone, capacity)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, gender, warden_name || null, contact_phone || null, capacity || 40]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not create house.' });
  }
};

// DELETE /api/boarding/houses/:id
exports.deleteHouse = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM boarding_houses WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'House not found.' });
    res.json({ message: 'House deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete house. Students may still be assigned to it.' });
  }
};

// ---------- ASSIGNMENTS (students in boarding) ----------

// GET /api/boarding/assignments?house_id=&status=
exports.getAssignments = async (req, res) => {
  const { house_id, status } = req.query;
  const params = [];
  const conditions = [];
  if (house_id) { params.push(house_id); conditions.push(`a.house_id = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`a.status = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.room_no, a.status, a.checked_in_at, a.checked_out_at, a.health_notes,
              s.id AS student_id, s.full_name AS student_name, s.admission_no, s.gender,
              c.name AS class_name,
              h.id AS house_id, h.name AS house_name
       FROM boarding_assignments a
       JOIN students s ON s.id = a.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       JOIN boarding_houses h ON h.id = a.house_id
       ${where}
       ORDER BY s.full_name`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch boarding assignments.' });
  }
};

// POST /api/boarding/assignments  -> check a student into a house
exports.createAssignment = async (req, res) => {
  const { student_id, house_id, room_no, health_notes } = req.body;
  if (!student_id || !house_id) {
    return res.status(400).json({ message: 'student_id and house_id are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO boarding_assignments (student_id, house_id, room_no, health_notes)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (student_id)
       DO UPDATE SET house_id = EXCLUDED.house_id, room_no = EXCLUDED.room_no,
                     health_notes = EXCLUDED.health_notes, status = 'Checked In',
                     checked_in_at = CURRENT_DATE, checked_out_at = NULL
       RETURNING *`,
      [student_id, house_id, room_no || null, health_notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not check in student.' });
  }
};

// PUT /api/boarding/assignments/:id/checkout
exports.checkOut = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE boarding_assignments SET status = 'Checked Out', checked_out_at = CURRENT_DATE
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Assignment not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not check out student.' });
  }
};

// DELETE /api/boarding/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM boarding_assignments WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Assignment not found.' });
    res.json({ message: 'Assignment removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not remove assignment.' });
  }
};

// ---------- WEEKLY MEAL PLAN ----------

// GET /api/boarding/meals?house_id=
exports.getMeals = async (req, res) => {
  const { house_id } = req.query;
  if (!house_id) return res.status(400).json({ message: 'house_id is required.' });
  try {
    const { rows } = await pool.query(
      `SELECT * FROM boarding_meal_plan WHERE house_id = $1
       ORDER BY CASE day_of_week
         WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
         WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7 END,
       CASE meal_type WHEN 'Breakfast' THEN 1 WHEN 'Lunch' THEN 2 ELSE 3 END`,
      [house_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch meal plan.' });
  }
};

// POST /api/boarding/meals
exports.createMeal = async (req, res) => {
  const { house_id, day_of_week, meal_type, menu } = req.body;
  if (!house_id || !day_of_week || !meal_type || !menu) {
    return res.status(400).json({ message: 'house_id, day_of_week, meal_type, and menu are required.' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO boarding_meal_plan (house_id, day_of_week, meal_type, menu)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [house_id, day_of_week, meal_type, menu]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not add meal.' });
  }
};

// DELETE /api/boarding/meals/:id
exports.deleteMeal = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM boarding_meal_plan WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Meal entry not found.' });
    res.json({ message: 'Meal entry deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete meal entry.' });
  }
};