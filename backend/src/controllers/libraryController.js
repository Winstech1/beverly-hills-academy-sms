const pool = require('../config/db');

// ---------- BOOKS ----------

// GET /api/library/books
exports.getBooks = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM library_books ORDER BY title');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch books.' });
  }
};

// POST /api/library/books
exports.createBook = async (req, res) => {
  const { title, author, category, total_copies } = req.body;
  if (!title) return res.status(400).json({ message: 'title is required.' });
  const copies = total_copies || 1;
  try {
    const { rows } = await pool.query(
      `INSERT INTO library_books (title, author, category, total_copies, available_copies)
       VALUES ($1,$2,$3,$4,$4) RETURNING *`,
      [title, author || null, category || null, copies]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not add book.' });
  }
};

// DELETE /api/library/books/:id
exports.deleteBook = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM library_books WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Book not found.' });
    res.json({ message: 'Book deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete book.' });
  }
};

// ---------- LOANS (borrow / return) ----------

// GET /api/library/loans?active=true
exports.getLoans = async (req, res) => {
  const { active } = req.query;
  const where = active === 'true' ? 'WHERE bl.returned_at IS NULL' : '';
  try {
    const { rows } = await pool.query(
      `SELECT bl.id, bl.borrowed_at, bl.due_at, bl.returned_at,
              b.id AS book_id, b.title,
              s.id AS student_id, s.full_name AS student_name, s.admission_no
       FROM book_loans bl
       JOIN library_books b ON b.id = bl.book_id
       JOIN students s ON s.id = bl.student_id
       ${where}
       ORDER BY bl.borrowed_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch loans.' });
  }
};

// POST /api/library/loans  -> borrow a book
exports.createLoan = async (req, res) => {
  const { book_id, student_id, due_at } = req.body;
  if (!book_id || !student_id) {
    return res.status(400).json({ message: 'book_id and student_id are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const book = await client.query('SELECT available_copies FROM library_books WHERE id = $1 FOR UPDATE', [book_id]);
    if (!book.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Book not found.' });
    }
    if (book.rows[0].available_copies < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No available copies of this book right now.' });
    }

    const loan = await client.query(
      `INSERT INTO book_loans (book_id, student_id, due_at) VALUES ($1,$2,$3) RETURNING *`,
      [book_id, student_id, due_at || null]
    );
    await client.query('UPDATE library_books SET available_copies = available_copies - 1 WHERE id = $1', [book_id]);
    await client.query('COMMIT');
    res.status(201).json(loan.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Could not record loan.' });
  } finally {
    client.release();
  }
};

// PUT /api/library/loans/:id/return  -> mark a book as returned
exports.returnLoan = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const loan = await client.query('SELECT * FROM book_loans WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!loan.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Loan not found.' });
    }
    if (loan.rows[0].returned_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'This book was already returned.' });
    }

    const updated = await client.query(
      `UPDATE book_loans SET returned_at = CURRENT_DATE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    await client.query(
      'UPDATE library_books SET available_copies = available_copies + 1 WHERE id = $1',
      [loan.rows[0].book_id]
    );
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Could not process return.' });
  } finally {
    client.release();
  }
};