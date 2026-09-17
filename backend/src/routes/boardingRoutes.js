const express = require('express');
const router = express.Router();
const boardingController = require('../controllers/boardingController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/houses', boardingController.getHouses);
router.post('/houses', authorize('admin', 'principal'), boardingController.createHouse);
router.delete('/houses/:id', authorize('admin'), boardingController.deleteHouse);

router.get('/assignments', boardingController.getAssignments);
router.post('/assignments', authorize('admin', 'principal'), boardingController.createAssignment);
router.put('/assignments/:id/checkout', authorize('admin', 'principal'), boardingController.checkOut);
router.delete('/assignments/:id', authorize('admin', 'principal'), boardingController.deleteAssignment);

router.get('/meals', boardingController.getMeals);
router.post('/meals', authorize('admin', 'principal'), boardingController.createMeal);
router.delete('/meals/:id', authorize('admin', 'principal'), boardingController.deleteMeal);

module.exports = router;