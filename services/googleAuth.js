const { google } = require("googleapis");

// 🔐 Load from ENV (Render)
const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = "http://localhost:5000/auth/google/callback";

const refresh_token = process.env.GOOGLE_REFRESH_TOKEN;

// OAuth Client
const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uri
);

// Set credentials
oAuth2Client.setCredentials({
  refresh_token: refresh_token
});

module.exports = oAuth2Client;