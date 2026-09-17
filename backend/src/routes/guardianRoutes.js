const express = require('express');
const router = express.Router();
const guardianController = require('../controllers/guardianController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', guardianController.getGuardians);
router.get('/for-student/:studentId', guardianController.getGuardiansForStudent);
router.get('/:id', guardianController.getGuardian);
router.post('/', authorize('admin', 'principal'), guardianController.createGuardian);
router.put('/:id', authorize('admin', 'principal'), guardianController.updateGuardian);
router.delete('/:id', authorize('admin'), guardianController.deleteGuardian);
router.post('/:id/link', authorize('admin', 'principal'), guardianController.linkStudent);
router.delete('/:id/link/:studentId', authorize('admin', 'principal'), guardianController.unlinkStudent);

module.exports = router;