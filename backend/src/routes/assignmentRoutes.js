const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', assignmentController.getAssignments);
router.post('/', authorize('admin', 'principal', 'teacher'), assignmentController.createAssignment);
router.put('/:id', authorize('admin', 'principal', 'teacher'), assignmentController.updateAssignment);
router.delete('/:id', authorize('admin', 'principal', 'teacher'), assignmentController.deleteAssignment);

module.exports = router;