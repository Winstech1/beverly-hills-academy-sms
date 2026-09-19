const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);


router.get('/jobs/open', recruitmentController.getOpenJobs);
router.get('/jobs', recruitmentController.getJobs);
router.post('/jobs', authorize('admin', 'principal'), recruitmentController.createJob);
router.put('/jobs/:id', authorize('admin', 'principal'), recruitmentController.updateJob);
router.delete('/jobs/:id', authorize('admin'), recruitmentController.deleteJob);

router.get('/jobs/:jobId/applicants', recruitmentController.getJobApplicants);
router.post('/jobs/:jobId/applicants', authorize('admin', 'principal'), recruitmentController.createJobApplicant);
router.put('/job-applicants/:id', authorize('admin', 'principal'), recruitmentController.updateJobApplicant);
router.delete('/job-applicants/:id', authorize('admin', 'principal'), recruitmentController.deleteJobApplicant);

module.exports = router;