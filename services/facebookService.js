const axios = require('axios');
const FB_TOKEN = process.env.FB_PAGE_TOKEN;

module.exports = {
  async fetchSenderName(mid) {
    const url  = `https://graph.facebook.com/v23.0/${mid}`;
    const res  = await axios.get(url, { params: { fields: 'from', access_token: FB_TOKEN } });
    return res.data.from.name;
  }
};
