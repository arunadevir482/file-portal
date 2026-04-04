const { google } = require("googleapis");
const { oAuth2Client } = require("./googleAuth");
const fs = require("fs");

const drive = google.drive({
  version: "v3",
  auth: oAuth2Client
});

// ================= FOLDER =================
async function getOrCreateFolder(name, parent = null) {
  try {
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

  } catch (err) {
    console.error("Folder error:", err.message);
    throw err;
  }
}

// ================= UPLOAD =================
async function uploadToDrive(filePath, fileName, type, state = "General") {
  try {

    const mainFolderId = await getOrCreateFolder(type);
    const stateFolderId = await getOrCreateFolder(state, mainFolderId);

    // ✅ UNIQUE FILE NAME (IMPORTANT)
    const uniqueName = Date.now() + "-" + fileName;

    const response = await drive.files.create({
      requestBody: {
        name: uniqueName,
        parents: [stateFolderId]
      },
      media: {
        mimeType: "application/octet-stream",
        body: fs.createReadStream(filePath)
      },
      fields: "id"
    });

    const fileId = response.data.id;

    // ✅ MAKE PUBLIC
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone"
      }
    });

    const file = await drive.files.get({
      fileId,
      fields: "webViewLink"
    });

    return {
      fileId,
      webViewLink: file.data.webViewLink
    };

  } catch (err) {
    console.error("Upload error:", err.message);
    throw err;
  }
}

// ================= DELETE =================
async function deleteFromDrive(fileId) {
  try {
    await drive.files.delete({ fileId });
    return true;
  } catch (err) {
    console.error("Delete error:", err.message);
    throw err;
  }
}

module.exports = {
  uploadToDrive,
  deleteFromDrive
};