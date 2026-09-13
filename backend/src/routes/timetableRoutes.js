const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', timetableController.getTimetable);
router.post('/', authorize('admin', 'principal'), timetableController.createSlot);
router.delete('/:id', authorize('admin', 'principal'), timetableController.deleteSlot);

module.exports = router;