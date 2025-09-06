const customerAds    = require('../models/customerAdsModel');
const facebookService= require('../services/facebookService');

exports.handle = async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.messaging?.[0];
    if (!msg?.sender?.id) return res.sendStatus(400);

    const psid = msg.sender.id;
    const exists = await customerAds.exists(psid);

    if (!exists) {
      await customerAds.insert(psid);
      const fullName = await facebookService.fetchSenderName(msg.message.mid);
      await customerAds.updateInitial(psid, fullName);
    }
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};