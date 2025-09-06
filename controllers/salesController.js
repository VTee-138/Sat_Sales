const customerAds = require('../models/customerAdsModel');
const adIdModel = require('../models/adIdModel');
const facebookService = require('../services/facebookService');

// Các tag để thay đổi trạng thái
const statusTags = {
  "đã chuyển đổi": "Đã chuyển khoản",
  "không phản hồi": "Không phản hồi"
};

exports.handle = async (req, res) => {
  try {
    const body = req.body;
    
    // Log để debug
    console.log('📩 Received webhook:', JSON.stringify(body, null, 2));
    
    // Kiểm tra loại webhook dựa vào cấu trúc dữ liệu
    const entry = body.entry?.[0];
    
    if (!entry) {
      console.log('❌ No entry found in webhook data');
      return res.sendStatus(400);
    }
    
    // 1. TAG WEBHOOK - có changes với label
    if (entry.changes?.[0]?.value?.label) {
      console.log('🏷️ Processing TAG webhook');
      return await handleTagWebhook(entry.changes[0].value, res);
    }
    
    // 2. MESSENGER WEBHOOK - có messaging
    if (entry.messaging?.[0]) {
      const msg = entry.messaging[0];
      console.log('💬 Processing MESSENGER webhook');
      
      // 2a. ADS_COUNT - messenger có referral (từ ads)
      if (msg.referral?.ads_context_data) {
        console.log('📊 Processing ADS_COUNT (referral) webhook');
        return await handleAdsCountWebhook(msg, res);
      }
      
      // 2b. REGULAR MESSAGE - messenger thông thường
      console.log('📨 Processing regular MESSENGER webhook');
      return await handleMessengerWebhook(msg, res);
    }
    
    console.log('❓ Unknown webhook type, ignoring');
    return res.sendStatus(200);
    
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return res.sendStatus(500);
  }
};

// Xử lý tag webhook (từ tagController)
async function handleTagWebhook(changeValue, res) {
  try {
    const tag = changeValue?.label?.page_label_name;
    const psid = changeValue?.user?.id;
    
    if (!psid) {
      console.log('❌ No PSID found in tag webhook');
      return res.sendStatus(400);
    }
    
    const tagNormalized = tag?.trim().toLowerCase();
    
    // Kiểm tra các tag trạng thái
    if (statusTags[tagNormalized]) {
      await customerAds.updateStatus(psid, statusTags[tagNormalized]);
      console.log(`✅ Updated status for PSID ${psid}: ${tag.trim()} -> ${statusTags[tagNormalized]}`);
    } else {
      console.log(`ℹ️ Tag "${tag}" không được xử lý`);
    }
    
    return res.sendStatus(200);
  } catch (err) {
    console.error('❌ Tag webhook error:', err);
    return res.sendStatus(500);
  }
}

// Xử lý ads count webhook (từ adsCountController)
async function handleAdsCountWebhook(msg, res) {
  try {
    const psid = msg.sender.id;
    const adTitle = msg.referral?.ads_context_data?.ad_title || '';
    const adImage = msg.referral?.ads_context_data?.photo_url || '';

    console.log(`📊 Processing ads for PSID: ${psid}`);
    
    await adIdModel.insertIfNotExists(psid);
    const exists = await customerAds.exists(psid);
    
    if (exists) {
      await customerAds.updateAds(psid, adImage, adTitle);
      console.log(`✅ Updated ads data for PSID: ${psid}`);
    } else {
      console.log(`ℹ️ Customer ${psid} not exists, skipping ads update`);
    }
    
    return res.sendStatus(200);
  } catch (err) {
    console.error('❌ Ads count webhook error:', err);
    return res.sendStatus(500);
  }
}

// Xử lý messenger webhook (từ messengerController)
async function handleMessengerWebhook(msg, res) {
  try {
    if (!msg?.sender?.id) {
      console.log('❌ No sender ID found in messenger webhook');
      return res.sendStatus(400);
    }

    const psid = msg.sender.id;
    console.log(`💬 Processing message for PSID: ${psid}`);
    
    const exists = await customerAds.exists(psid);

    if (!exists) {
      console.log(`➕ Creating new customer: ${psid}`);
      await customerAds.insert(psid);
      
      const fullName = await facebookService.fetchSenderName(msg.message.mid);
      await customerAds.updateInitial(psid, fullName);
      console.log(`✅ Created customer: ${psid} - ${fullName}`);
    } else {
      console.log(`ℹ️ Customer ${psid} already exists`);
    }
    
    // Kiểm tra tin nhắn có chứa số điện thoại không
    const messageText = msg.message?.text;
    if (messageText) {
      const phoneNumber = extractPhoneNumber(messageText);
      if (phoneNumber) {
        await customerAds.updatePhoneNumber(psid, phoneNumber);
        console.log(`📱 Updated phone number for PSID ${psid}: ${phoneNumber}`);
      }
    }
    
    return res.sendStatus(200);
  } catch (err) {
    console.error('❌ Messenger webhook error:', err);
    return res.sendStatus(500);
  }
}

// Hàm tách số điện thoại từ text (bắt đầu bằng 0 và có 10 ký tự)
function extractPhoneNumber(text) {
  try {
    // Regex pattern: bắt đầu bằng 0, theo sau là 9 chữ số (tổng cộng 10 số)
    const phonePattern = /\b0\d{9}\b/g;
    const matches = text.match(phonePattern);
    
    if (matches && matches.length > 0) {
      // Trả về số điện thoại đầu tiên tìm thấy
      return matches[0];
    }
    
    return null;
  } catch (err) {
    console.error('❌ Error extracting phone number:', err);
    return null;
  }
}
