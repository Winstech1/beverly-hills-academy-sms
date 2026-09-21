const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes — no login required. Must come before any router.use(authenticate).
router.get('/public', newsController.getPublicPosts);
router.get('/public/:slug', newsController.getPublicPost);

// Admin routes — require login.
router.get('/', authenticate, authorize('admin', 'principal'), newsController.getAllPosts);
router.post('/', authenticate, authorize('admin', 'principal'), newsController.createPost);
router.put('/:id', authenticate, authorize('admin', 'principal'), newsController.updatePost);
router.delete('/:id', authenticate, authorize('admin'), newsController.deletePost);

module.exports = router;