const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', paymentController.getPayments);
router.get('/summary', paymentController.getSummary);
router.post('/', authorize('admin', 'principal'), paymentController.createPayment);
router.put('/:id', authorize('admin', 'principal'), paymentController.updatePayment);
router.delete('/:id', authorize('admin'), paymentController.deletePayment);

module.exports = router;