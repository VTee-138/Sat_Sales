const pool = require('../config/db');
module.exports = {
  async getMaxPageId() {
    const { rows } = await pool.query(
      `SELECT COALESCE(MAX(page_id),0) AS max_page_id FROM id_temp`
    );
    return parseInt(rows[0].max_page_id, 10);
  },
  async getMaxId() {
    const { rows } = await pool.query(
      `SELECT COALESCE(MAX(id),0) AS max_id FROM sales_data`
    );
    return parseInt(rows[0].max_id, 10);
  },
  async insert(pageId) {
    return pool.query(
      'INSERT INTO id_temp (page_id) VALUES ($1)', [pageId]
    );
  }
};
