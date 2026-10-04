const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin', 'principal'));

router.get('/items', storeController.getItems);
router.post('/items', storeController.createItem);
router.put('/items/:id', storeController.updateItem);
router.delete('/items/:id', storeController.deleteItem);

router.get('/transactions', storeController.getTransactions);
router.post('/transactions', storeController.createTransaction);

module.exports = router;