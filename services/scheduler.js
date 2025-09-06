const cron = require('node-cron');
const idTempModel = require('../models/idTempModel');
const customerAds  = require('../models/customerAdsModel');

async function runOnce() {
  try {
    const maxPage = await idTempModel.getMaxPageId();
    const maxId   = await idTempModel.getMaxId();
    if (maxId <= maxPage) return;

    await idTempModel.insert(maxId);

    const res = await require('../config/db').query(
      `SELECT id, TO_CHAR(ngay,'YYYY-MM-DD') AS ngay_formatted,
              page, nguoi_tiep_nhan, ho_va_ten,
              tu_nhien_ads, noi_dung_ads, link_anh, psid
       FROM sales_data
       WHERE id >= $1 AND id <= $2
         AND (NOW()+INTERVAL '7 hours')::date = ngay::date
         AND nguoi_tiep_nhan IS NOT NULL
       ORDER BY id ASC`,
      [maxPage, maxId]
    );

    const values = res.rows.map(r => [
      r.nguoi_tiep_nhan,
      r.ngay_formatted,
      r.page,
      r.ho_va_ten,
      r.tu_nhien_ads,
      'Đang tư vấn',
      r.nguoi_tiep_nhan,
      r.noi_dung_ads,
      r.link_anh,
      r.psid
    ]);

    console.log('Data processing completed!');
  } catch (err) {
    console.error('Scheduler error:', err);
  }
}

module.exports = {
  start() {
    cron.schedule('1 13 * * *', async () => {
      await runOnce();
    }, { timezone: 'Asia/Bangkok' });
  },
  runOnce
};
