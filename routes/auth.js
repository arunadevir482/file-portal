const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ================= USER LOGIN =================
router.post("/user-login", (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // 🔹 USER TOKEN
    const token = jwt.sign(
      {
        id: id,
        role: "user"
      },
      "SECRET_KEY",
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      message: "User login successful",
      token
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Login error",
      error: err.message
    });
  }
});


// ================= ADMIN LOGIN =================
router.post("/admin-login", (req, res) => {
  try {
    const { username, password } = req.body;

    // 🔹 SIMPLE STATIC ADMIN (can upgrade later)
    if (username !== "admin" || password !== "admin123") {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials"
      });
    }

    // 🔹 ADMIN TOKEN
    const token = jwt.sign(
      {
        id: "admin",
        role: "admin"
      },
      "SECRET_KEY",
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      message: "Admin login successful",
      token
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Admin login error",
      error: err.message
    });
  }
});


// ================= GOOGLE AUTH ROUTES =================
// (Keep if already working)

const { getAuthUrl, getToken } = require("../services/googleAuth");

// Step 1 → Redirect to Google
router.get("/google", (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// Step 2 → Callback
router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).send("No code provided");
    }

    await getToken(code);

    res.send("✅ Google Drive Connected Successfully!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;