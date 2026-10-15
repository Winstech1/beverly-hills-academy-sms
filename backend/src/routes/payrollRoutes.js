const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/payrollController');

router.use(authenticate);
router.use(authorize('admin', 'principal', 'accountant'));

router.get('/employees', ctrl.getEmployees);
router.post('/employees', ctrl.createEmployee);
router.put('/employees/:id', ctrl.updateEmployee);
router.delete('/employees/:id', ctrl.deleteEmployee);

router.get('/runs', ctrl.getRuns);
router.post('/runs', ctrl.generateRun);
router.get('/runs/:id', ctrl.getRun);
router.delete('/runs/:id', ctrl.deleteRun);
router.patch('/runs/:id/status', ctrl.setStatus);

router.put('/items/:id', ctrl.updateItem);

module.exports = router;