const { google } = require("googleapis");
const { oAuth2Client } = require("./googleAuth");
const fs = require("fs");

const drive = google.drive({
  version: "v3",
  auth: oAuth2Client
});

// ================= FOLDER =================
async function getOrCreateFolder(name, parent = null) {

  const query =
    `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false` +
    (parent ? ` and '${parent}' in parents` : "");

  const res = await drive.files.list({
    q: query,
    fields: "files(id, name)"
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parent ? [parent] : []
    },
    fields: "id"
  });

  return folder.data.id;
}

// ================= UPLOAD =================
async function uploadToDrive(filePath, fileName, type, state = "General") {

  // Folder structure: TYPE → STATE
  const mainFolderId = await getOrCreateFolder(type);
  const stateFolderId = await getOrCreateFolder(state, mainFolderId);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [stateFolderId]
    },
    media: {
      body: fs.createReadStream(filePath)
    },
    fields: "id, name"
  });

  const fileId = response.data.id;

  // ✅ MAKE FILE PUBLIC
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone"
    }
  });

  // ✅ GET VIEW LINK
  const file = await drive.files.get({
    fileId,
    fields: "webViewLink"
  });

  return {
    fileId,
    webViewLink: file.data.webViewLink
  };
}

// ================= LIST =================
async function listFiles() {
  const res = await drive.files.list({
    q: "trashed=false",
    fields: "files(id, name, createdTime)"
  });

  return res.data.files;
}

// ================= DELETE =================
async function deleteFromDrive(fileId) {
  await drive.files.delete({ fileId });
  return true;
}

module.exports = {
  uploadToDrive,
  listFiles,
  deleteFromDrive
};