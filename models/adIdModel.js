const pool = require('../config/db');
module.exports = {
  async insertIfNotExists(psid) {
    return pool.query(
      `INSERT INTO ads_id (psid)
         VALUES ($1)
       ON CONFLICT (psid) DO NOTHING`,
      [psid]
    );
  }
};
