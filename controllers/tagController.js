const customerAds = require('../models/customerAdsModel');
const consultants = ["hoài","nga","kiều","thanh","đào nhung"];
const specialTags = ["đã ck", "không phản hồi"];
exports.handle = async (req, res) => {
  try {
    const change = req.body.entry?.[0]?.changes?.[0]?.value;
    const tag    = change?.label?.page_label_name;
    const psid   = change?.user?.id;
    if (!psid) return res.sendStatus(400);
    const tagNormalized = tag?.trim().toLowerCase();
    if (consultants.includes(tagNormalized)) {
      await customerAds.updateTag(psid, tag.trim());
    } else if (specialTags.includes(tagNormalized)) {
      await customerAds.updateStatus(psid, tag.trim());
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};