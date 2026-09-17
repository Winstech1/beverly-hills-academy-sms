const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', attendanceController.getAttendance);
router.get('/mine', attendanceController.getMyAttendance);
router.get('/summary', attendanceController.getSummary);
router.post('/', authorize('admin', 'principal', 'teacher'), attendanceController.saveAttendance);

module.exports = router;