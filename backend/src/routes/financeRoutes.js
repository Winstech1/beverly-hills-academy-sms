const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/financeController');
const tax = require('../controllers/taxController');

router.use(authenticate);
router.use(authorize('admin', 'principal', 'accountant'));

router.get('/transactions', ctrl.getTransactions);
router.post('/transactions', ctrl.createTransaction);
router.put('/transactions/:id', ctrl.updateTransaction);
router.delete('/transactions/:id', ctrl.deleteTransaction);

router.get('/summary', ctrl.getSummary);

router.get('/budgets', ctrl.getBudgets);
router.post('/budgets', ctrl.saveBudget);
router.delete('/budgets/:id', ctrl.deleteBudget);

router.get('/tax', tax.getTaxRecords);
router.post('/tax', tax.createTaxRecord);
router.put('/tax/:id', tax.updateTaxRecord);
router.delete('/tax/:id', tax.deleteTaxRecord);

module.exports = router;