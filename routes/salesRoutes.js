const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// 1. Webhook verification (GET) - Dùng chung cho tất cả webhook
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Kiểm tra mode & token
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ SALES WEBHOOK_VERIFIED');
    // Phải gửi raw challenge (không dùng json)
    return res.status(200).send(challenge);
  }

  console.warn('❌ SALES WEBHOOK_VERIFICATION_FAILED');
  return res.sendStatus(403);
});

// 2. Event handler (POST) - Xử lý tất cả các loại webhook
router.post('/', (req, res) => {
  // Gọi controller tổng hợp để xử lý
  salesController.handle(req, res);
});

module.exports = router;
