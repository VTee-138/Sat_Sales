const { google } = require('googleapis');

const jwtClient = new google.auth.JWT(
  process.env.GA_SERVICE_ACCOUNT_EMAIL,
  null,
  process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth: jwtClient });

module.exports = {
  async appendRows(values) {
    return sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${process.env.SHEET_NAME}!A:J`,
      valueInputOption: 'RAW',
      resource: { values }
    });
  }
};