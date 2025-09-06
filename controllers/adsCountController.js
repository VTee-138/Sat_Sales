const customerAds = require('../models/customerAdsModel');
const adIdModel   = require('../models/adIdModel');

exports.handle = async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.messaging?.[0];
    const psid    = msg.sender.id;
    const adTitle = msg.referral?.ads_context_data?.ad_title || '';
    const adImage = msg.referral?.ads_context_data?.photo_url || '';

    await adIdModel.insertIfNotExists(psid);
    const exists = await customerAds.exists(psid);
    if (exists) {
      await customerAds.updateAds(psid, adImage, adTitle);
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};
