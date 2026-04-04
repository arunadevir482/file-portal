const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/* =========================
   LOAD EXCEL
========================= */
function loadExcel() {
  const filePath = path.join(__dirname, "../data/source.xlsx");

  if (!fs.existsSync(filePath)) {
    console.log("Excel file missing");
    return [];
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

/* =========================
   MEMORY STORAGE
========================= */
let uploadedFiles = [];

/* =========================
   LIST DATA (UPDATED)
========================= */
router.get("/list", (req, res) => {
  const excelData = loadExcel();

  const finalData = excelData.map((row, index) => {
    const code = row.Code || row.CODE;

    const match = uploadedFiles.find(f => f.Code == code);

    return {
      id: index,

      division: row.Division || "",
      state: row.STATE || "",
      bmhq: row["BM HQ"] || row.BM_HQ || "",
      code: code || "",
      name: row["Stockist Name"] || row.Name || "",

      // ✅ SALES ADDED
      sales: match?.sales || "",

      awsFile: match?.awsFile
        ? `/data/file/${match.awsFile}`
        : null,

      sssFile: match?.sssFile
        ? `/data/file/${match.sssFile}`
        : null
    };
  });

  res.json(finalData);
});

/* =========================
   UPLOAD (UPDATED)
========================= */
router.post("/upload", upload.single("file"), (req, res) => {
  const { code, type, sales } = req.body;

  if (!code || !type) {
    return res.status(400).json({ error: "Missing data" });
  }

  let record = uploadedFiles.find(r => r.Code == code);

  if (!record) {
    record = { Code: code };
    uploadedFiles.push(record);
  }

  // ✅ SAVE SALES
  record.sales = sales;

  // SAVE FILE
  record[type + "File"] = req.file.filename;

  res.json({
    success: true,
    file: req.file.filename
  });
});

/* =========================
   VIEW FILE
========================= */
router.get("/file/:name", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  res.sendFile(filePath);
});

/* =========================
   DELETE (UPDATED)
========================= */
router.delete("/delete/:code/:type", (req, res) => {
  const { code, type } = req.params;

  let record = uploadedFiles.find(r => r.Code == code);

  if (record) {
    delete record[type + "File"];

    // ✅ UNLOCK SALES IF BOTH FILES REMOVED
    if (!record.awsFile && !record.sssFile) {
      record.sales = "";
    }
  }

  res.json({ success: true });
});

/* =========================
   DOWNLOAD EXCEL
========================= */
router.get("/download/excel", (req, res) => {
  const excelData = loadExcel();

  const finalData = excelData.map(row => {
    const code = row.Code || row.CODE;
    const match = uploadedFiles.find(f => f.Code == code);

    return {
      ...row,
      Sales: match?.sales || "",
      AWS_Status: match?.awsFile ? "Received" : "Pending",
      SSS_Status: match?.sssFile ? "Received" : "Pending"
    };
  });

  const ws = XLSX.utils.json_to_sheet(finalData);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Report");

  const filePath = path.join(__dirname, "../uploads/export.xlsx");
  XLSX.writeFile(wb, filePath);

  res.download(filePath);
});

module.exports = router;