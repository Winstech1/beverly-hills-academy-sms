const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/books', libraryController.getBooks);
router.post('/books', authorize('admin', 'principal'), libraryController.createBook);
router.delete('/books/:id', authorize('admin'), libraryController.deleteBook);

router.get('/loans', libraryController.getLoans);
router.post('/loans', authorize('admin', 'principal', 'teacher'), libraryController.createLoan);
router.put('/loans/:id/return', authorize('admin', 'principal', 'teacher'), libraryController.returnLoan);

module.exports = router;