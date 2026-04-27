const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

/* ========================
   MIDDLEWARE
======================== */
app.use(cors({
  origin: "*", // for frontend (React)
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "smartpark_secret",
  resave: false,
  saveUninitialized: false
}));

/* ========================
   POSTGRES CONNECTION (NEON)
======================== */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("✅ Database connected (PostgreSQL)"))
  .catch(err => {
    console.error("❌ DB connection failed:", err.message);
  });

/* ========================
   TEST ROUTE
======================== */
app.get("/", (req, res) => {
  res.json({
    message: "SmartPark API Running",
    database: !!process.env.DATABASE_URL
  });
});

/* ========================
   AUTH ROUTES (BASIC)
======================== */

// REGISTER
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1,$2,$3) RETURNING *",
      [username, email, password]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1 AND password=$2",
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    req.session.user = result.rows[0];

    res.json({
      message: "Login successful",
      user: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGOUT
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

/* ========================
   USERS TABLE CHECK (optional)
======================== */
app.get("/api/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});

/* ========================
   START SERVER
======================== */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("================================");
  console.log("🚀 Server running on port", PORT);
  console.log("================================");
});