const express = require("express");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const router = express.Router();

/* LOAD EXCEL */
function loadUsers() {
  const filePath = path.join(__dirname, "../data/source.xlsx");

  if (!fs.existsSync(filePath)) return [];

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

/* LOGIN */
router.post("/login", (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ message: "Enter ID" });

  // ADMIN LOGIN
  if (id.includes("@")) {
    const token = jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET);
    return res.json({ token, role: "admin" });
  }

  const data = loadUsers();

  const found = data.find(r =>
    r.BH_ID == id ||
    r.SM_ID == id ||
    r.ZBM_ID == id ||
    r.RBM_ID == id ||
    r.ABM_ID == id
  );

  if (!found) return res.status(401).json({ message: "Invalid ID" });

  const token = jwt.sign({ id, role: "user" }, process.env.JWT_SECRET);

  res.json({ token, role: "user" });
});

module.exports = router;