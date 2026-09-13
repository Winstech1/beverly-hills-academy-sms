const express = require('express');
const router = express.Router();
const transportController = require('../controllers/transportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/routes', transportController.getRoutes);
router.post('/routes', authorize('admin', 'principal'), transportController.createRoute);
router.put('/routes/:id', authorize('admin', 'principal'), transportController.updateRoute);
router.delete('/routes/:id', authorize('admin'), transportController.deleteRoute);

router.get('/assignments', transportController.getAssignments);
router.post('/assignments', authorize('admin', 'principal'), transportController.createAssignment);
router.put('/assignments/:id', authorize('admin', 'principal'), transportController.updateAssignment);
router.delete('/assignments/:id', authorize('admin', 'principal'), transportController.deleteAssignment);

module.exports = router;