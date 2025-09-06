const pool = require('../config/db');

module.exports = {
  async exists(psid) {
    const { rows } = await pool.query(
      'SELECT 1 FROM sales_data WHERE psid = $1', [psid]
    );
    return rows.length > 0;
  },
  async insert(psid) {
    return pool.query(
      'INSERT INTO sales_data (psid) VALUES ($1)', [psid]
    );
  },
  async updateInitial(psid, fullName) {
    return pool.query(
      `UPDATE sales_data
         SET ngay        = NOW() + INTERVAL '7 hours',
             page        = '10 Education SAT',
             ho_va_ten   = $1,
             tinh_trang  = 'Đang tư vấn',
             tu_nhien_ads= 'Tự nhiên'
       WHERE psid = $2`, [fullName, psid]
    );
  },
  async updateAds(psid, adImage, adTitle) {
    return pool.query(
      `UPDATE sales_data
         SET tu_nhien_ads = 'Ads',
             link_anh     = $1,
             noi_dung_ads = $2
       WHERE psid = $3`,
      [adImage, adTitle, psid]
    );
  },
  async updateStatus(psid, status) {
    return pool.query(
      `UPDATE sales_data
         SET tinh_trang = $1
       WHERE psid = $2`,
      [status, psid]
    );
  },
  async updatePhoneNumber(psid, phoneNumber) {
    return pool.query(
      `UPDATE sales_data
         SET sdt = $1
       WHERE psid = $2`,
      [phoneNumber, psid]
    );
  },
  async updateNewCustomer(psid) {
    return pool.query(
      `UPDATE sales_data
         SET new = TRUE
       WHERE psid = $1`,
      [psid]
    );
  }
};