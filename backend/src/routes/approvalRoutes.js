const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('admin', 'principal'), approvalController.getApprovals);
router.get('/mine', approvalController.getMyApprovals);
router.post('/', approvalController.createApproval);
router.put('/:id/decide', authorize('admin', 'principal'), approvalController.decideApproval);

module.exports = router;