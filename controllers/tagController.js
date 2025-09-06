const customerAds = require('../models/customerAdsModel');

// Các tag để thay đổi trạng thái
const statusTags = {
  "đã chuyển đổi": "Đã chuyển khoản",
  "không phản hồi": "Không phản hồi"
};

exports.handle = async (req, res) => {
  try {
    const change = req.body.entry?.[0]?.changes?.[0]?.value;
    const tag    = change?.label?.page_label_name;
    const psid   = change?.user?.id;
    
    if (!psid) return res.sendStatus(400);
    
    const tagNormalized = tag?.trim().toLowerCase();
    
    // Kiểm tra các tag trạng thái
    if (statusTags[tagNormalized]) {
      await customerAds.updateStatus(psid, statusTags[tagNormalized]);
      console.log(`✅ Updated status for PSID ${psid}: ${tag.trim()} -> ${statusTags[tagNormalized]}`);
    }
    
    return res.sendStatus(200);
  } catch (err) {
    console.error('Tag controller error:', err);
    return res.sendStatus(500);
  }
};