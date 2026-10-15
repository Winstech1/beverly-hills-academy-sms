const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/accountantController');

router.use(authenticate);
router.use(authorize('admin', 'principal'));

router.get('/', ctrl.getAccountants);
router.post('/', ctrl.createAccountant);
router.put('/:id/password', ctrl.resetPassword);
router.delete('/:id', ctrl.deleteAccountant);

module.exports = router;