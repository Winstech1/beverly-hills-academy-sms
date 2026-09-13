const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', teacherController.getTeachers);
router.get('/:id', teacherController.getTeacher);
router.post('/', authorize('admin', 'principal'), teacherController.createTeacher);
router.put('/:id', authorize('admin', 'principal'), teacherController.updateTeacher);
router.delete('/:id', authorize('admin'), teacherController.deleteTeacher);

module.exports = router;
