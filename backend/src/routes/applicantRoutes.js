const express = require('express');
const router = express.Router();
const applicantController = require('../controllers/applicantController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', applicantController.getApplicants);
router.post('/', authorize('admin', 'principal'), applicantController.createApplicant);
router.put('/:id', authorize('admin', 'principal'), applicantController.updateApplicant);
router.delete('/:id', authorize('admin'), applicantController.deleteApplicant);
router.post('/:id/convert', authorize('admin', 'principal'), applicantController.convertToStudent);

module.exports = router;