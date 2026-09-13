const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seed() {
  try {
    const passwordHash = await bcrypt.hash('Admin@12345', 10);

    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      ['School Admin', 'admin@greenvalley.edu.gh', passwordHash]
    );

    if (rows.length) {
      console.log(`Admin user created: ${rows[0].email} / Admin@12345`);
    } else {
      console.log('Admin user already exists — skipped.');
    }

    const classNames = ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2'];
    for (const name of classNames) {
      await pool.query(
        `INSERT INTO classes (name) VALUES ($1)
         ON CONFLICT DO NOTHING`,
        [name]
      );
    }
    console.log('Sample classes seeded.');
    console.log('IMPORTANT: change the admin password after first login.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
