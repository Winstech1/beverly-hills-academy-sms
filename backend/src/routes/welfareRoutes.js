const express = require('express');
const router = express.Router();
const welfareController = require('../controllers/welfareController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Contributions
router.get('/contributions', authorize('admin', 'principal'), welfareController.getContributions);
router.get('/contributions/mine', welfareController.getMyContributions);
router.post('/contributions', authorize('admin', 'principal'), welfareController.createContribution);
router.delete('/contributions/:id', authorize('admin', 'principal'), welfareController.deleteContribution);

// Policies — everyone logged in can read, only admin/principal can manage
router.get('/policies', welfareController.getPolicies);
router.post('/policies', authorize('admin', 'principal'), welfareController.createPolicy);
router.delete('/policies/:id', authorize('admin', 'principal'), welfareController.deletePolicy);

module.exports = router;