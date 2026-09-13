const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin', 'principal'));

router.get('/fee-collection', reportController.getFeeCollection);
router.get('/attendance-rate', reportController.getAttendanceRate);
router.get('/academic-performance', reportController.getAcademicPerformance);

module.exports = router;