const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/mine', classController.getMyClass);
router.get('/', classController.getClasses);
router.post('/', authorize('admin', 'principal'), classController.createClass);
router.put('/:id', authorize('admin', 'principal'), classController.updateClass);
router.delete('/:id', authorize('admin'), classController.deleteClass);

module.exports = router;
