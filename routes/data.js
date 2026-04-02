const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/* LOAD EXCEL DATA */
function loadExcel() {
  const filePath = path.join(__dirname, "../data/source.xlsx");

  if (!fs.existsSync(filePath)) return [];

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

/* IN-MEMORY STORAGE */
let uploadedFiles = [];

/* GET DATA */
router.get("/data", (req, res) => {
  const excelData = loadExcel();

  const finalData = excelData.map(row => {
    const match = uploadedFiles.find(f => f.Code == row.Code);

    return {
      Division: row.Division || "",
      State: row.State || "",
      "BM HQ": row["BM HQ"] || row.BM_HQ || "",
      Code: row.Code || "",
      Name: row.Name || row["Stockist Name"] || "",

      awsFile: match?.awsFile || null,
      sssFile: match?.sssFile || null
    };
  });

  res.json(finalData);
});


/* UPLOAD */
router.post("/upload", upload.single("file"), (req, res) => {
  const { code, type } = req.body;

  let record = uploadedFiles.find(r => r.Code == code);

  if (!record) {
    record = { Code: code };
    uploadedFiles.push(record);
  }

  record[type + "File"] = req.file.filename;

  res.json({ message: "Uploaded" });
});

/* VIEW FILE */
router.get("/file/:name", (req, res) => {
  res.sendFile(path.join(__dirname, "../uploads", req.params.name));
});

/* DELETE (ADMIN ONLY FRONTEND CONTROL) */
router.delete("/delete/:code/:type", (req, res) => {
  const { code, type } = req.params;

  let record = uploadedFiles.find(r => r.Code == code);

  if (record) delete record[type + "File"];

  res.json({ message: "Deleted" });
});

/* DOWNLOAD EXCEL */
router.get("/download/excel", (req, res) => {
  const data = loadExcel();

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Data");

  const filePath = path.join(__dirname, "../uploads/export.xlsx");
  XLSX.writeFile(wb, filePath);

  res.download(filePath);
});

module.exports = router;