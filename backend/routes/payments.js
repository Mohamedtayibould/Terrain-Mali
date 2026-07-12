const express = require('express');
const router = express.Router();
const { pay, handleWebhook, getReceipt } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { verifyWebhook } = require('../middleware/webhookVerify');

router.post('/pay', authenticate, pay);
router.post('/webhook', verifyWebhook, handleWebhook);
router.get('/receipt/:reservation_id', authenticate, getReceipt);

module.exports = router;
