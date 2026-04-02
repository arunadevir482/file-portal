require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* STATIC FILES */
app.use(express.static("public"));

/* ROUTES */
app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/data"));

/* START */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port " + PORT));