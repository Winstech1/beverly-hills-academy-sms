const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', subjectController.getSubjects);
router.post('/', authorize('admin', 'principal'), subjectController.createSubject);

module.exports = router;