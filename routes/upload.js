const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdf = require("pdf-parse");
const { verifyToken } = require("../middleware/authMiddleware");
const { uploadFile } = require("../services/drive");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

const allowedTypes = ["pdf", "xlsx", "docx", "txt", "html"];

router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const { type } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!type || !["SSS", "AWS"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const ext = file.originalname.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(ext)) {
      return res.status(400).json({ message: "Invalid file type" });
    }

    // PDF check
    if (ext === "pdf") {
      const data = await pdf(fs.readFileSync(file.path));
      if (!data.text || data.text.length < 50) {
        return res.status(400).json({
          message: "Scanned PDF not allowed"
        });
      }
    }

    // 🚀 Upload to Drive
    const state = req.body.state || "General";

    const { uploadToDrive } = require("../services/drive");

    const fileId = await uploadToDrive(
    file.path,
    file.filename,
    type,
    state
    );

    // Delete local file
    fs.unlinkSync(file.path);

    res.json({
      message: "Uploaded to Google Drive",
      driveFileId: fileId,
      type
    });

  } catch (err) {
    res.status(500).json({
      message: "Upload error",
      error: err.message
    });
  }
});

module.exports = router;