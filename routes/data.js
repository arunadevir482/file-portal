const express = require("express");
const router = express.Router();
const fs = require("fs");
const ExcelJS = require("exceljs");

const { verifyToken } = require("../middleware/authMiddleware");
const { readSourceData } = require("../services/excelService");
const { deleteFromDrive } = require("../services/drive");

// ================= HELPER =================
function getFilesData() {
  const filePath = "data/files.json";
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath));
}

// ================= FILE LIST =================
router.get("/files", verifyToken, (req, res) => {
  try {
    let files = getFilesData();
    const { type, state } = req.query;

    // Role filter
    if (req.user.role !== "admin") {
      files = files.filter(f => f.uploadedBy === req.user.id);
    }

    // Type filter
    if (type) {
      files = files.filter(f => f.type === type);
    }

    // State filter
    if (state) {
      files = files.filter(f => f.state === state);
    }

    res.json({
      success: true,
      total: files.length,
      data: files
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= DASHBOARD =================
router.get("/dashboard", verifyToken, (req, res) => {
  try {
    let files = getFilesData();
    const source = readSourceData();

    // Role filter
    if (req.user.role !== "admin") {
      files = files.filter(f => f.uploadedBy === req.user.id);
    }

    const total = source.length;

    const sssReceived = files.filter(f => f.type === "SSS").length;
    const awsReceived = files.filter(f => f.type === "AWS").length;

    res.json({
      success: true,
      dashboard: {
        totalRecords: total,

        SSS: {
          received: sssReceived,
          pending: total - sssReceived,
          percentage: total
            ? ((sssReceived / total) * 100).toFixed(2) + "%"
            : "0%"
        },

        AWS: {
          received: awsReceived,
          pending: total - awsReceived,
          percentage: total
            ? ((awsReceived / total) * 100).toFixed(2) + "%"
            : "0%"
        }
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= EXCEL REPORT DOWNLOAD =================
router.get("/report", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const files = getFilesData();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report");

    // Header
    sheet.columns = [
      { header: "File Name", key: "name", width: 25 },
      { header: "Type", key: "type", width: 10 },
      { header: "State", key: "state", width: 15 },
      { header: "Uploaded By", key: "uploadedBy", width: 20 },
      { header: "Uploaded At", key: "uploadedAt", width: 25 }
    ];

    // Data rows
    files.forEach(f => {
      sheet.addRow({
        name: f.name,
        type: f.type,
        state: f.state,
        uploadedBy: f.uploadedBy,
        uploadedAt: f.uploadedAt
      });
    });

    // Response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= DELETE FILE =================
router.delete("/file/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete"
      });
    }

    const fileId = req.params.id;
    let files = getFilesData();

    const index = files.findIndex(f => f.id === fileId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    // Delete from Google Drive
    await deleteFromDrive(fileId);

    // Remove from JSON
    files.splice(index, 1);
    fs.writeFileSync("data/files.json", JSON.stringify(files, null, 2));

    res.json({
      success: true,
      message: "File deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;