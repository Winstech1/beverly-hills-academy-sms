const bcrypt = require('bcryptjs');
const pool = require('../config/db');

exports.getAccountants = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, username, email, is_active, created_at
       FROM users WHERE role = 'accountant' ORDER BY full_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getAccountants error:', err);
    res.status(500).json({ message: 'Could not fetch accountants' });
  }
};

exports.createAccountant = async (req, res) => {
  try {
    const { full_name, username, password } = req.body;
    if (!full_name || !full_name.trim()) return res.status(400).json({ message: 'Full name is required' });
    if (!username || username.trim().length < 3) return res.status(400).json({ message: 'Username must be at least 3 characters' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const uname = username.trim().toLowerCase();
    const exists = await pool.query('SELECT 1 FROM users WHERE username = $1', [uname]);
    if (exists.rows.length) return res.status(400).json({ message: 'That username is already taken' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (full_name, username, password_hash, role)
       VALUES ($1,$2,$3,'accountant') RETURNING id, full_name, username`,
      [full_name.trim(), uname, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createAccountant error:', err);
    res.status(500).json({ message: 'Could not create accountant account' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `UPDATE users SET password_hash=$1 WHERE id=$2 AND role='accountant' RETURNING id`,
      [hash, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Accountant not found' });
    res.json({ message: 'Password reset' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Could not reset password' });
  }
};

exports.deleteAccountant = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id=$1 AND role='accountant' RETURNING id`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Accountant not found' });
    res.json({ message: 'Accountant removed' });
  } catch (err) {
    console.error('deleteAccountant error:', err);
    res.status(500).json({ message: 'Could not remove accountant' });
  }
};