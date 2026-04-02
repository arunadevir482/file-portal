const express = require("express");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const path = require("path");

const router = express.Router();

/* =========================================
   📊 LOAD EXCEL DATA
========================================= */
function loadUsersFromExcel() {
  try {
    const filePath = path.join(__dirname, "../data/source.xlsx");

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    return data;
  } catch (err) {
    console.error("Excel load error:", err.message);
    return [];
  }
}

/* =========================================
   🔑 LOGIN API
========================================= */
router.post("/user-login", (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "ID or Email required" });
    }

    /* ===============================
       🔴 ADMIN LOGIN
    =============================== */
    if (id.includes("@")) {
      const token = jwt.sign(
        { id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        token,
        role: "admin",
        id
      });
    }

    /* ===============================
       🔵 USER LOGIN FROM EXCEL
    =============================== */
    const excelData = loadUsersFromExcel();

    let foundUser = null;
    let userLevel = null;

    for (let row of excelData) {
      if (row.BH_ID == id) {
        foundUser = row;
        userLevel = "BH";
        break;
      }
      if (row.SM_ID == id) {
        foundUser = row;
        userLevel = "SM";
        break;
      }
      if (row.ZBM_ID == id) {
        foundUser = row;
        userLevel = "ZBM";
        break;
      }
      if (row.RBM_ID == id) {
        foundUser = row;
        userLevel = "RBM";
        break;
      }
      if (row.ABM_ID == id) {
        foundUser = row;
        userLevel = "ABM";
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({
        message: "User ID not found in source file"
      });
    }

    /* ===============================
       🎟 TOKEN WITH ROLE + LEVEL
    =============================== */
    const userData = {
      id,
      role: "user",
      level: userLevel,
      state: foundUser.State || "",
      code: foundUser.Code || ""
    };

    const token = jwt.sign(userData, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.json({
      token,
      role: "user",
      id,
      level: userLevel,
      state: userData.state,
      code: userData.code
    });

  } catch (err) {
    res.status(500).json({
      message: "Login error",
      error: err.message
    });
  }
});

module.exports = router;