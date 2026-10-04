const pool = require('../config/db');

// ---------- ITEMS ----------

// GET /api/store/items?category=
exports.getItems = async (req, res) => {
  const { category } = req.query;
  const params = [];
  let where = '';
  if (category) { params.push(category); where = 'WHERE category = $1'; }
  try {
    const { rows } = await pool.query(
      `SELECT * FROM store_items ${where} ORDER BY category, name`,
      params
    );
    const withFlag = rows.map((r) => ({
      ...r,
      low_stock: Number(r.quantity_in_stock) <= Number(r.reorder_level || 0),
    }));
    res.json(withFlag);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch store items.' });
  }
};

// POST /api/store/items
exports.createItem = async (req, res) => {
  const { name, category, unit, quantity_in_stock, reorder_level, unit_price, supplier, notes } = req.body;
  if (!name || !category) return res.status(400).json({ message: 'name and category are required.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO store_items (name, category, unit, quantity_in_stock, reorder_level, unit_price, supplier, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, category, unit || 'pcs', quantity_in_stock || 0, reorder_level || 0,
       unit_price || null, supplier || null, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create item.' });
  }
};

// PUT /api/store/items/:id
exports.updateItem = async (req, res) => {
  const { name, category, unit, reorder_level, unit_price, supplier, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE store_items SET
        name = COALESCE($1, name), category = COALESCE($2, category), unit = COALESCE($3, unit),
        reorder_level = COALESCE($4, reorder_level), unit_price = COALESCE($5, unit_price),
        supplier = COALESCE($6, supplier), notes = COALESCE($7, notes)
       WHERE id = $8 RETURNING *`,
      [name, category, unit, reorder_level, unit_price, supplier, notes, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Item not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update item.' });
  }
};

// DELETE /api/store/items/:id
exports.deleteItem = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM store_items WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Item not found.' });
    res.json({ message: 'Item deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete item.' });
  }
};

// ---------- TRANSACTIONS (stock in / stock out) ----------

// GET /api/store/transactions?item_id=
exports.getTransactions = async (req, res) => {
  const { item_id } = req.query;
  const params = [];
  let where = '';
  if (item_id) { params.push(item_id); where = 'WHERE t.item_id = $1'; }
  try {
    const { rows } = await pool.query(
      `SELECT t.*, i.name AS item_name, i.unit, u.full_name AS recorded_by_name
       FROM store_transactions t
       JOIN store_items i ON i.id = t.item_id
       LEFT JOIN users u ON u.id = t.recorded_by
       ${where}
       ORDER BY t.created_at DESC
       LIMIT 100`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch transactions.' });
  }
};

// POST /api/store/transactions  -> record Stock In or Stock Out, adjusts quantity atomically
exports.createTransaction = async (req, res) => {
  const { item_id, type, quantity, reason } = req.body;
  if (!item_id || !type || !quantity) {
    return res.status(400).json({ message: 'item_id, type, and quantity are required.' });
  }
  if (Number(quantity) <= 0) {
    return res.status(400).json({ message: 'quantity must be greater than zero.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const item = await client.query('SELECT quantity_in_stock FROM store_items WHERE id = $1 FOR UPDATE', [item_id]);
    if (!item.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Item not found.' });
    }

    const current = Number(item.rows[0].quantity_in_stock);
    const delta = type === 'Stock In' ? Number(quantity) : -Number(quantity);
    const newQty = current + delta;

    if (newQty < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Not enough stock — only ${current} available.` });
    }

    await client.query('UPDATE store_items SET quantity_in_stock = $1 WHERE id = $2', [newQty, item_id]);
    const txResult = await client.query(
      `INSERT INTO store_transactions (item_id, type, quantity, reason, recorded_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [item_id, type, quantity, reason || null, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json(txResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Could not record transaction.' });
  } finally {
    client.release();
  }
};