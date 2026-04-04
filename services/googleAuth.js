const { google } = require("googleapis");

/* =========================
   GOOGLE OAUTH CONFIG
========================= */
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost" // redirect URI (not used after token)
);

/* =========================
   SET TOKEN
========================= */
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

/* =========================
   EXPORT
========================= */
module.exports = {
  oAuth2Client
};