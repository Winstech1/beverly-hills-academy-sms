const pool = require('../config/db');

// ---------- JOB POSTINGS ----------

// GET /api/jobs?status=
exports.getJobs = async (req, res) => {
  const { status } = req.query;
  const params = [];
  let where = '';
  if (status) { params.push(status); where = `WHERE j.status = $1`; }
  try {
    const { rows } = await pool.query(
      `SELECT j.*, COUNT(a.id) AS applicant_count
       FROM job_postings j
       LEFT JOIN job_applicants a ON a.job_id = j.id
       ${where}
       GROUP BY j.id
       ORDER BY j.posted_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch job postings.' });
  }
};

// POST /api/jobs
exports.createJob = async (req, res) => {
  const { title, department, description, requirements, closing_date } = req.body;
  if (!title) return res.status(400).json({ message: 'title is required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO job_postings (title, department, description, requirements, closing_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, department || null, description || null, requirements || null, closing_date || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create job posting.' });
  }
};

// PUT /api/jobs/:id
exports.updateJob = async (req, res) => {
  const { title, department, description, requirements, status, closing_date } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE job_postings SET
        title = COALESCE($1, title), department = COALESCE($2, department),
        description = COALESCE($3, description), requirements = COALESCE($4, requirements),
        status = COALESCE($5, status), closing_date = COALESCE($6, closing_date)
       WHERE id = $7 RETURNING *`,
      [title, department, description, requirements, status, closing_date, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Job posting not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update job posting.' });
  }
};

// DELETE /api/jobs/:id
exports.deleteJob = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM job_postings WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Job posting not found.' });
    res.json({ message: 'Job posting deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete job posting.' });
  }
};

// ---------- JOB APPLICANTS ----------

// GET /api/jobs/:jobId/applicants
exports.getJobApplicants = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM job_applicants WHERE job_id = $1 ORDER BY applied_at DESC`,
      [req.params.jobId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch applicants.' });
  }
};

// POST /api/jobs/:jobId/applicants
exports.createJobApplicant = async (req, res) => {
  const { full_name, email, phone, resume_url, cover_letter } = req.body;
  if (!full_name) return res.status(400).json({ message: 'full_name is required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO job_applicants (job_id, full_name, email, phone, resume_url, cover_letter)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.jobId, full_name, email || null, phone || null, resume_url || null, cover_letter || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not submit application.' });
  }
};

// PUT /api/job-applicants/:id  -> update status (Applied -> Shortlisted -> Interviewed -> Hired/Rejected)
exports.updateJobApplicant = async (req, res) => {
  const { status, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE job_applicants SET status = COALESCE($1, status), notes = COALESCE($2, notes)
       WHERE id = $3 RETURNING *`,
      [status, notes, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Applicant not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update applicant.' });
  }
};

// DELETE /api/job-applicants/:id
exports.deleteJobApplicant = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM job_applicants WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Applicant not found.' });
    res.json({ message: 'Applicant deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete applicant.' });
  }
};

// GET /api/recruitment/jobs/open  -> open roles only, for teacher/student view (no applicant data)
exports.getOpenJobs = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, department, description, requirements, closing_date, posted_at
       FROM job_postings WHERE status = 'Open' ORDER BY posted_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch open job postings.' });
  }
};