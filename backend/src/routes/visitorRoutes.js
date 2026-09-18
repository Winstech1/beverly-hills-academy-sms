const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', visitorController.getVisitors);
router.post('/', authorize('admin', 'principal'), visitorController.createVisitor);
router.put('/:id/checkout', authorize('admin', 'principal'), visitorController.checkOutVisitor);

module.exports = router;