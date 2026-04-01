require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= STATIC FILES =================
// Serve frontend (UI)
app.use(express.static(path.join(__dirname, "public")));

// ================= ROUTES =================
app.use("/auth", require("./routes/auth"));
app.use("/upload", require("./routes/upload"));
app.use("/data", require("./routes/data"));

// ================= DEFAULT ROUTE =================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= HEALTH CHECK =================
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});