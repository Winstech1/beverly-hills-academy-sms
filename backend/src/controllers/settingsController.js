const pool = require('../config/db');

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM school_settings WHERE id = 1');
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch settings.' });
  }
};

// PUT /api/settings
exports.updateSettings = async (req, res) => {
  const { school_name, address, phone, email, logo_url } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE school_settings SET
        school_name = COALESCE($1, school_name),
        address = COALESCE($2, address),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        logo_url = COALESCE($5, logo_url)
       WHERE id = 1 RETURNING *`,
      [school_name, address, phone, email, logo_url]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update settings.' });
  }
};