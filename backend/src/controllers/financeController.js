const pool = require('../config/db');

// Fee payments already recorded in the system count as income ("School Fees")
const FEES_CTE = `
  fees AS (
    SELECT amount, COALESCE(paid_at, created_at::date) AS d
    FROM payments WHERE status = 'Paid'
  )`;

// ---------- Transactions ----------
exports.getTransactions = async (req, res) => {
  try {
    const { type, category, from, to, search } = req.query;
    const where = [];
    const params = [];
    if (type) { params.push(type); where.push(`t.type = $${params.length}`); }
    if (category) { params.push(category); where.push(`t.category = $${params.length}`); }
    if (from) { params.push(from); where.push(`t.txn_date >= $${params.length}`); }
    if (to) { params.push(to); where.push(`t.txn_date <= $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      where.push(`(t.description ILIKE $${params.length} OR t.reference ILIKE $${params.length})`);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT t.*, u.username AS recorded_by_name
       FROM finance_transactions t
       LEFT JOIN users u ON u.id = t.recorded_by
       ${clause}
       ORDER BY t.txn_date DESC, t.id DESC
       LIMIT 500`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getTransactions error:', err);
    res.status(500).json({ message: 'Could not fetch transactions' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const { type, category, amount, txn_date, description, payment_method, reference } = req.body;
    if (!['income', 'expense'].includes(type)) return res.status(400).json({ message: 'Type must be income or expense' });
    if (!category || !category.trim()) return res.status(400).json({ message: 'Category is required' });
    if (!(Number(amount) > 0)) return res.status(400).json({ message: 'Amount must be greater than zero' });

    const result = await pool.query(
      `INSERT INTO finance_transactions
        (type, category, amount, txn_date, description, payment_method, reference, recorded_by)
       VALUES ($1,$2,$3,COALESCE($4, CURRENT_DATE),$5,$6,$7,$8) RETURNING *`,
      [type, category.trim(), amount, txn_date || null, description || null,
       payment_method || 'Cash', reference || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createTransaction error:', err);
    res.status(500).json({ message: 'Could not add transaction' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { type, category, amount, txn_date, description, payment_method, reference } = req.body;
    if (!['income', 'expense'].includes(type)) return res.status(400).json({ message: 'Type must be income or expense' });
    if (!(Number(amount) > 0)) return res.status(400).json({ message: 'Amount must be greater than zero' });

    const result = await pool.query(
      `UPDATE finance_transactions
       SET type=$1, category=$2, amount=$3, txn_date=COALESCE($4, txn_date),
           description=$5, payment_method=$6, reference=$7
       WHERE id=$8 RETURNING *`,
      [type, (category || '').trim(), amount, txn_date || null, description || null,
       payment_method || 'Cash', reference || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Transaction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateTransaction error:', err);
    res.status(500).json({ message: 'Could not update transaction' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM finance_transactions WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error('deleteTransaction error:', err);
    res.status(500).json({ message: 'Could not delete transaction' });
  }
};

// ---------- Summary / analysis ----------
exports.getSummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const monthly = await pool.query(
      `WITH ${FEES_CTE},
       all_txn AS (
         SELECT type, amount, txn_date AS d, category FROM finance_transactions
         UNION ALL
         SELECT 'income', amount, d, 'School Fees' FROM fees
       )
       SELECT EXTRACT(MONTH FROM d)::int AS month,
              COALESCE(SUM(amount) FILTER (WHERE type='income'),0)::float AS income,
              COALESCE(SUM(amount) FILTER (WHERE type='expense'),0)::float AS expense
       FROM all_txn
       WHERE EXTRACT(YEAR FROM d) = $1
       GROUP BY 1 ORDER BY 1`,
      [year]
    );

    const byCategory = await pool.query(
      `WITH ${FEES_CTE},
       all_txn AS (
         SELECT type, amount, txn_date AS d, category FROM finance_transactions
         UNION ALL
         SELECT 'income', amount, d, 'School Fees' FROM fees
       )
       SELECT type, category, SUM(amount)::float AS total
       FROM all_txn
       WHERE EXTRACT(YEAR FROM d) = $1
       GROUP BY type, category
       ORDER BY type, total DESC`,
      [year]
    );

    const months = Array.from({ length: 12 }, (_, i) => {
      const row = monthly.rows.find((r) => r.month === i + 1);
      return { month: i + 1, income: row ? row.income : 0, expense: row ? row.expense : 0 };
    });
    const totalIncome = months.reduce((s, m) => s + m.income, 0);
    const totalExpense = months.reduce((s, m) => s + m.expense, 0);

    res.json({
      year,
      totalIncome,
      totalExpense,
      netSurplus: totalIncome - totalExpense,
      months,
      incomeByCategory: byCategory.rows.filter((r) => r.type === 'income'),
      expenseByCategory: byCategory.rows.filter((r) => r.type === 'expense'),
    });
  } catch (err) {
    console.error('getSummary error:', err);
    res.status(500).json({ message: 'Could not build finance summary' });
  }
};

// ---------- Budgets ----------
exports.getBudgets = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;

    const result = await pool.query(
      `WITH ${FEES_CTE},
       all_txn AS (
         SELECT type, amount, txn_date AS d, category FROM finance_transactions
         UNION ALL
         SELECT 'income', amount, d, 'School Fees' FROM fees
       )
       SELECT b.id, b.category, b.type, b.year, b.month, b.amount::float AS budget, b.notes,
              COALESCE((
                SELECT SUM(a.amount) FROM all_txn a
                WHERE a.type = b.type AND a.category = b.category
                  AND EXTRACT(YEAR FROM a.d) = b.year AND EXTRACT(MONTH FROM a.d) = b.month
              ),0)::float AS actual
       FROM budgets b
       WHERE b.year = $1 AND b.month = $2
       ORDER BY b.type, b.category`,
      [year, month]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getBudgets error:', err);
    res.status(500).json({ message: 'Could not fetch budgets' });
  }
};

exports.saveBudget = async (req, res) => {
  try {
    const { category, type, year, month, amount, notes } = req.body;
    if (!category || !category.trim()) return res.status(400).json({ message: 'Category is required' });
    if (!(Number(amount) >= 0)) return res.status(400).json({ message: 'Amount must be zero or more' });
    const result = await pool.query(
      `INSERT INTO budgets (category, type, year, month, amount, notes)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (category, type, year, month)
       DO UPDATE SET amount = EXCLUDED.amount, notes = EXCLUDED.notes
       RETURNING *`,
      [category.trim(), type === 'income' ? 'income' : 'expense', year, month, amount, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('saveBudget error:', err);
    res.status(500).json({ message: 'Could not save budget' });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM budgets WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    console.error('deleteBudget error:', err);
    res.status(500).json({ message: 'Could not delete budget' });
  }
};