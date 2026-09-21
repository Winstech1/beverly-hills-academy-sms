const pool = require('../config/db');

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ---------- PUBLIC (no login required) ----------

// GET /api/news/public  -> published posts only
exports.getPublicPosts = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT n.id, n.title, n.slug, n.image_url, n.published_at,
              LEFT(n.body, 200) AS excerpt, u.full_name AS author_name
       FROM news_posts n
       LEFT JOIN users u ON u.id = n.author_id
       WHERE n.published = true
       ORDER BY n.published_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch news.' });
  }
};

// GET /api/news/public/:slug  -> one published post, full body
exports.getPublicPost = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT n.*, u.full_name AS author_name
       FROM news_posts n
       LEFT JOIN users u ON u.id = n.author_id
       WHERE n.slug = $1 AND n.published = true`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ message: 'Post not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch post.' });
  }
};

// ---------- ADMIN (login required) ----------

// GET /api/news  -> all posts, drafts included
exports.getAllPosts = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT n.*, u.full_name AS author_name
       FROM news_posts n
       LEFT JOIN users u ON u.id = n.author_id
       ORDER BY n.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch posts.' });
  }
};

// POST /api/news
exports.createPost = async (req, res) => {
  const { title, body, image_url, published } = req.body;
  if (!title || !body) return res.status(400).json({ message: 'title and body are required.' });

  let slug = slugify(title);
  try {
    const existing = await pool.query('SELECT id FROM news_posts WHERE slug = $1', [slug]);
    if (existing.rows.length) slug = `${slug}-${Date.now()}`;

    const { rows } = await pool.query(
      `INSERT INTO news_posts (title, slug, body, image_url, author_id, published, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, slug, body, image_url || null, req.user.id, !!published, published ? new Date() : null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create post.' });
  }
};

// PUT /api/news/:id  -> edit, or toggle published
exports.updatePost = async (req, res) => {
  const { title, body, image_url, published } = req.body;
  try {
    const current = await pool.query('SELECT published FROM news_posts WHERE id = $1', [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ message: 'Post not found.' });

    const justPublished = published === true && !current.rows[0].published;

    const { rows } = await pool.query(
      `UPDATE news_posts SET
        title = COALESCE($1, title), body = COALESCE($2, body), image_url = COALESCE($3, image_url),
        published = COALESCE($4, published),
        published_at = CASE WHEN $5 THEN now() ELSE published_at END
       WHERE id = $6 RETURNING *`,
      [title, body, image_url, published, justPublished, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Could not update post.' });
  }
};

// DELETE /api/news/:id
exports.deletePost = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM news_posts WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Post not found.' });
    res.json({ message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete post.' });
  }
};