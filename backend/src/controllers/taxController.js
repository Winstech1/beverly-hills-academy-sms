const pool = require('../config/db');

const STATUS_SQL = `
  CASE
    WHEN amount_paid >= amount_due AND amount_due > 0 THEN 'Paid'
    WHEN amount_paid > 0 THEN 'Part paid'
    WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 'Overdue'
    ELSE 'Pending'
  END`;

exports.getTaxRecords = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *, amount_due::float AS amount_due, amount_paid::float AS amount_paid,
              (amount_due - amount_paid)::float AS balance,
              ${STATUS_SQL} AS status
       FROM tax_records
       ORDER BY (amount_paid >= amount_due AND amount_due > 0), due_date NULLS LAST, id DESC`
    );
    const rows = result.rows;
    const outstanding = rows.reduce((s, r) => s + (r.status === 'Paid' ? 0 : r.balance), 0);
    const overdue = rows.filter((r) => r.status === 'Overdue').length;
    res.json({ records: rows, outstanding, overdue });
  } catch (err) {
    console.error('getTaxRecords error:', err);
    res.status(500).json({ message: 'Could not fetch tax records' });
  }
};

exports.createTaxRecord = async (req, res) => {
  try {
    const { tax_type, period_label, amount_due, due_date, reference, notes } = req.body;
    if (!tax_type || !tax_type.trim()) return res.status(400).json({ message: 'Tax type is required' });
    if (!period_label || !period_label.trim()) return res.status(400).json({ message: 'Period is required' });
    if (!(Number(amount_due) >= 0)) return res.status(400).json({ message: 'Amount due must be a number' });
    const result = await pool.query(
      `INSERT INTO tax_records (tax_type, period_label, amount_due, due_date, reference, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [tax_type.trim(), period_label.trim(), amount_due, due_date || null, reference || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createTaxRecord error:', err);
    res.status(500).json({ message: 'Could not add tax record' });
  }
};

exports.updateTaxRecord = async (req, res) => {
  try {
    const { tax_type, period_label, amount_due, amount_paid, due_date, paid_date, reference, notes } = req.body;
    if (!(Number(amount_due) >= 0) || !(Number(amount_paid || 0) >= 0)) {
      return res.status(400).json({ message: 'Amounts must be numbers' });
    }
    const result = await pool.query(
      `UPDATE tax_records SET tax_type=$1, period_label=$2, amount_due=$3, amount_paid=$4,
         due_date=$5, paid_date=$6, reference=$7, notes=$8
       WHERE id=$9 RETURNING *`,
      [tax_type, period_label, amount_due, amount_paid || 0, due_date || null,
       paid_date || null, reference || null, notes || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Tax record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateTaxRecord error:', err);
    res.status(500).json({ message: 'Could not update tax record' });
  }
};

exports.deleteTaxRecord = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tax_records WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ message: 'Tax record not found' });
    res.json({ message: 'Tax record deleted' });
  } catch (err) {
    console.error('deleteTaxRecord error:', err);
    res.status(500).json({ message: 'Could not delete tax record' });
  }
};