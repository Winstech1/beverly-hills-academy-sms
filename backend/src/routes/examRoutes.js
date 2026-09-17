const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', examController.getExams);
router.get('/my-results', examController.getMyResults);
router.post('/', authorize('admin', 'principal', 'teacher'), examController.createExam);
router.delete('/:id', authorize('admin', 'principal'), examController.deleteExam);
router.get('/:id/results', examController.getResults);
router.post('/:id/results', authorize('admin', 'principal', 'teacher'), examController.saveResults);

module.exports = router;