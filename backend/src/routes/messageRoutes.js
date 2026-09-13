const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', messageController.getInbox);
router.get('/sent', messageController.getSent);
router.post('/', messageController.sendMessage);

module.exports = router;