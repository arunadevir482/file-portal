const { google } = require("googleapis");
const { oAuth2Client } = require("./googleAuth");
const fs = require("fs");

const drive = google.drive({
  version: "v3",
  auth: oAuth2Client
});

/* =========================
   CREATE / GET FOLDER
========================= */
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

    console.log("Folder created:", name);

    return folder.data.id;

  } catch (err) {
    console.error("Folder error:", err.message);
    throw err;
  }
}

/* =========================
   UPLOAD FILE
========================= */
async function uploadToDrive(filePath, fileName, type, state = "General") {
  try {
    console.log("Uploading:", fileName);

    const mainFolderId = await getOrCreateFolder(type);
    const stateFolderId = await getOrCreateFolder(state, mainFolderId);

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

    // PUBLIC ACCESS
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

    console.log("Upload success:", fileId);

    return {
      fileId,
      webViewLink: file.data.webViewLink
    };

  } catch (err) {
    console.error("Upload error:", err.message);
    throw err;
  }
}

/* =========================
   DELETE FILE (SAFE)
========================= */
async function deleteFromDrive(fileId) {
  try {

    if (!fileId) {
      console.log("No fileId provided");
      return false;
    }

    console.log("Deleting file:", fileId);

    await drive.files.delete({ fileId });

    console.log("Delete success:", fileId);

    return true;

  } catch (err) {
    console.error("Delete error:", err.message);

    // ✅ DO NOT BREAK SYSTEM
    return false;
  }
}

module.exports = {
  uploadToDrive,
  deleteFromDrive
};