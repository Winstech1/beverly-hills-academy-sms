const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/me', studentController.getMe);
router.get('/', studentController.getStudents);
router.post('/', authorize('admin', 'principal'), studentController.createStudent);
router.put('/:id', authorize('admin', 'principal'), studentController.updateStudent);
router.delete('/:id', authorize('admin'), studentController.deleteStudent);

module.exports = router;
