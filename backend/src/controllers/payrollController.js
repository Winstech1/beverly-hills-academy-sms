const pool = require('../config/db');

// ================== RATES (update here if the law changes) ==================
const SSNIT_EMPLOYEE_RATE = 0.055; // 5.5% of basic salary
const SSNIT_EMPLOYER_RATE = 0.13;  // 13% of basic salary

// Monthly PAYE bands (resident individuals), GRA. Verify with the current GRA schedule.
const PAYE_BANDS = [
  { width: 490,      rate: 0 },
  { width: 110,      rate: 0.05 },
  { width: 130,      rate: 0.10 },
  { width: 3166.67,  rate: 0.175 },
  { width: 16000,    rate: 0.25 },
  { width: 30520,    rate: 0.30 },
  { width: Infinity, rate: 0.35 },
];
// ============================================================================

const MONTHS = ['January','February','March','April','May','June','July',
  'August','September','October','November','December'];

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function computePaye(taxable) {
  let remaining = Math.max(0, taxable);
  let tax = 0;
  for (const band of PAYE_BANDS) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, band.width);
    tax += slice * band.rate;
    remaining -= slice;
  }
  return round2(tax);
}

function computePay(basic, allowances, otherDeductions = 0) {
  const b = Number(basic) || 0;
  const a = Number(allowances) || 0;
  const gross = b + a;
  const ssnitEmployee = round2(b * SSNIT_EMPLOYEE_RATE);
  const ssnitEmployer = round2(b * SSNIT_EMPLOYER_RATE);
  const paye = computePaye(gross - ssnitEmployee);
  const net = round2(gross - ssnitEmployee - paye - (Number(otherDeductions) || 0));
  return {
    gross_pay: round2(gross),
    ssnit_employee: ssnitEmployee,
    ssnit_employer: ssnitEmployer,
    paye_tax: paye,
    net_pay: net,
  };
}

// ---------------- Employees ----------------
exports.getEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM employees ORDER BY active DESC, full_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getEmployees error:', err);
    res.status(500).json({ message: 'Could not fetch employees' });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const { full_name, position, basic_salary, allowances, ssnit_number,
            tin_number, bank_name, account_number } = req.body;
    if (!full_name || !full_name.trim()) return res.status(400).json({ message: 'Full name is required' });
    if (!(Number(basic_salary) >= 0)) return res.status(400).json({ message: 'Basic salary must be a number' });

    const result = await pool.query(
      `INSERT INTO employees
        (full_name, position, basic_salary, allowances, ssnit_number, tin_number, bank_name, account_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [full_name.trim(), position || null, basic_salary || 0, allowances || 0,
       ssnit_number || null, tin_number || null, bank_name || null, account_number || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createEmployee error:', err);
    res.status(500).json({ message: 'Could not add employee' });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { full_name, position, basic_salary, allowances, ssnit_number,
            tin_number, bank_name, account_number, active } = req.body;
    const result = await pool.query(
      `UPDATE employees SET full_name=$1, position=$2, basic_salary=$3, allowances=$4,
        ssnit_number=$5, tin_number=$6, bank_name=$7, account_number=$8, active=COALESCE($9, active)
       WHERE id=$10 RETURNING *`,
      [full_name, position || null, basic_salary || 0, allowances || 0,
       ssnit_number || null, tin_number || null, bank_name || null, account_number || null,
       typeof active === 'boolean' ? active : null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateEmployee error:', err);
    res.status(500).json({ message: 'Could not update employee' });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM employees WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee removed' });
  } catch (err) {
    console.error('deleteEmployee error:', err);
    res.status(500).json({ message: 'Could not remove employee' });
  }
};

// ---------------- Payroll runs ----------------
exports.getRuns = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              COUNT(i.id)::int AS staff_count,
              COALESCE(SUM(i.gross_pay),0)::float AS total_gross,
              COALESCE(SUM(i.paye_tax),0)::float AS total_paye,
              COALESCE(SUM(i.ssnit_employee + i.ssnit_employer),0)::float AS total_ssnit,
              COALESCE(SUM(i.net_pay),0)::float AS total_net
       FROM payroll_runs r
       LEFT JOIN payroll_items i ON i.run_id = r.id
       GROUP BY r.id
       ORDER BY r.year DESC, r.month DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getRuns error:', err);
    res.status(500).json({ message: 'Could not fetch payroll runs' });
  }
};

exports.getRun = async (req, res) => {
  try {
    const run = await pool.query('SELECT * FROM payroll_runs WHERE id=$1', [req.params.id]);
    if (!run.rows.length) return res.status(404).json({ message: 'Payroll run not found' });
    const items = await pool.query(
      `SELECT i.*, e.bank_name, e.account_number, e.ssnit_number, e.tin_number
       FROM payroll_items i
       LEFT JOIN employees e ON e.id = i.employee_id
       WHERE i.run_id=$1 ORDER BY i.employee_name`,
      [req.params.id]
    );
    res.json({ ...run.rows[0], items: items.rows });
  } catch (err) {
    console.error('getRun error:', err);
    res.status(500).json({ message: 'Could not fetch payroll run' });
  }
};

// Create (or re-calculate a draft) payroll run for a month
exports.generateRun = async (req, res) => {
  const client = await pool.connect();
  try {
    const month = parseInt(req.body.month, 10);
    const year = parseInt(req.body.year, 10);
    if (!(month >= 1 && month <= 12) || !year) {
      return res.status(400).json({ message: 'Choose a valid month and year' });
    }

    await client.query('BEGIN');

    let run = (await client.query(
      'SELECT * FROM payroll_runs WHERE month=$1 AND year=$2 FOR UPDATE', [month, year]
    )).rows[0];

    if (run && run.status !== 'draft') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Payroll for ${MONTHS[month - 1]} ${year} is already ${run.status} and cannot be recalculated` });
    }

    if (!run) {
      run = (await client.query(
        `INSERT INTO payroll_runs (month, year, created_by) VALUES ($1,$2,$3) RETURNING *`,
        [month, year, req.user.id]
      )).rows[0];
    } else {
      // Keep one-off deductions entered earlier, then rebuild
      await client.query('DELETE FROM payroll_items WHERE run_id=$1', [run.id]);
    }

    const emps = (await client.query('SELECT * FROM employees WHERE active = TRUE ORDER BY full_name')).rows;
    if (!emps.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Add at least one active employee before running payroll' });
    }

    for (const e of emps) {
      const p = computePay(e.basic_salary, e.allowances, 0);
      await client.query(
        `INSERT INTO payroll_items
          (run_id, employee_id, employee_name, position, basic_salary, allowances,
           gross_pay, ssnit_employee, ssnit_employer, paye_tax, other_deductions, net_pay)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$11)`,
        [run.id, e.id, e.full_name, e.position, e.basic_salary, e.allowances,
         p.gross_pay, p.ssnit_employee, p.ssnit_employer, p.paye_tax, p.net_pay]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(run);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('generateRun error:', err);
    res.status(500).json({ message: 'Could not generate payroll' });
  } finally {
    client.release();
  }
};

// Edit one payslip (e.g. loan / advance deduction), draft runs only
exports.updateItem = async (req, res) => {
  try {
    const { other_deductions } = req.body;
    const cur = await pool.query(
      `SELECT i.*, r.status FROM payroll_items i
       JOIN payroll_runs r ON r.id = i.run_id WHERE i.id=$1`, [req.params.id]
    );
    if (!cur.rows.length) return res.status(404).json({ message: 'Payslip not found' });
    const item = cur.rows[0];
    if (item.status !== 'draft') return res.status(400).json({ message: 'Only draft payroll can be edited' });
    if (!(Number(other_deductions) >= 0)) return res.status(400).json({ message: 'Deduction must be zero or more' });

    const p = computePay(item.basic_salary, item.allowances, other_deductions);
    const result = await pool.query(
      `UPDATE payroll_items SET other_deductions=$1, net_pay=$2 WHERE id=$3 RETURNING *`,
      [other_deductions, p.net_pay, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateItem error:', err);
    res.status(500).json({ message: 'Could not update payslip' });
  }
};

// draft -> approved -> paid. Paying posts expenses and tax records automatically.
exports.setStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { status } = req.body;
    if (!['approved', 'paid'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or paid' });
    }
    await client.query('BEGIN');
    const run = (await client.query('SELECT * FROM payroll_runs WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
    if (!run) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Payroll run not found' }); }

    const allowed = (run.status === 'draft' && status === 'approved') ||
                    (run.status === 'approved' && status === 'paid');
    if (!allowed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Cannot move payroll from ${run.status} to ${status}` });
    }

    await client.query('UPDATE payroll_runs SET status=$1 WHERE id=$2', [status, run.id]);

    if (status === 'paid') {
      const t = (await client.query(
        `SELECT COALESCE(SUM(gross_pay),0) AS gross,
                COALESCE(SUM(ssnit_employer),0) AS ssnit_er,
                COALESCE(SUM(ssnit_employee),0) AS ssnit_ee,
                COALESCE(SUM(paye_tax),0) AS paye
         FROM payroll_items WHERE run_id=$1`, [run.id]
      )).rows[0];

      const label = `${MONTHS[run.month - 1]} ${run.year}`;
      const today = new Date().toISOString().slice(0, 10);
      const ref = `PAYROLL-${run.year}-${String(run.month).padStart(2, '0')}`;

      if (Number(t.gross) > 0) {
        await client.query(
          `INSERT INTO finance_transactions (type, category, amount, txn_date, description, payment_method, reference, recorded_by)
           VALUES ('expense','Salaries & Wages',$1,$2,$3,'Bank Transfer',$4,$5)`,
          [t.gross, today, `Gross salaries for ${label}`, ref, req.user.id]
        );
      }
      if (Number(t.ssnit_er) > 0) {
        await client.query(
          `INSERT INTO finance_transactions (type, category, amount, txn_date, description, payment_method, reference, recorded_by)
           VALUES ('expense','SSNIT Employer Contribution',$1,$2,$3,'Bank Transfer',$4,$5)`,
          [t.ssnit_er, today, `Employer SSNIT (13%) for ${label}`, ref, req.user.id]
        );
      }

      // Tax records due on the 15th of the following month
      const due = new Date(Date.UTC(run.year, run.month, 15)).toISOString().slice(0, 10);
      const ssnitTotal = round2(Number(t.ssnit_ee) + Number(t.ssnit_er));
      if (Number(t.paye) > 0) {
        await client.query(
          `INSERT INTO tax_records (tax_type, period_label, amount_due, due_date, reference, notes)
           VALUES ('PAYE',$1,$2,$3,$4,'Auto-created from payroll')`,
          [label, t.paye, due, ref]
        );
      }
      if (ssnitTotal > 0) {
        await client.query(
          `INSERT INTO tax_records (tax_type, period_label, amount_due, due_date, reference, notes)
           VALUES ('SSNIT',$1,$2,$3,$4,'Auto-created from payroll (employee 5.5% + employer 13%)')`,
          [label, ssnitTotal, due, ref]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: `Payroll marked ${status}` });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('setStatus error:', err);
    res.status(500).json({ message: 'Could not update payroll status' });
  } finally {
    client.release();
  }
};

exports.deleteRun = async (req, res) => {
  try {
    const run = await pool.query('SELECT status FROM payroll_runs WHERE id=$1', [req.params.id]);
    if (!run.rows.length) return res.status(404).json({ message: 'Payroll run not found' });
    if (run.rows[0].status !== 'draft') {
      return res.status(400).json({ message: 'Only draft payroll can be deleted' });
    }
    await pool.query('DELETE FROM payroll_runs WHERE id=$1', [req.params.id]);
    res.json({ message: 'Payroll run deleted' });
  } catch (err) {
    console.error('deleteRun error:', err);
    res.status(500).json({ message: 'Could not delete payroll run' });
  }
};