const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "smartpark_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// ================= DATABASE (FIXED + SSL SUPPORT) =================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  ssl: {
    rejectUnauthorized: false
  }
});

// SAFE CONNECTION (NO CRASH)
db.connect((err) => {
  if (err) {
    console.error("❌ DB connection failed:", err.message);
    console.log("⚠️ Server running without DB. Fix Render env variables.");
    return;
  }
  console.log("✅ Connected to MySQL database");
  createTables();
});

// ================= TABLES =================
function createTables() {
  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      userid INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE,
      password VARCHAR(255),
      email VARCHAR(100),
      fullname VARCHAR(100),
      phone VARCHAR(20),
      role VARCHAR(50) DEFAULT 'staff',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// ================= HEALTH CHECK =================
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    time: new Date(),
    dbState: db.state
  });
});

// ================= REGISTER =================
app.post("/api/register", async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
    [username, hashed, email],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ================= LOGIN =================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results.length) return res.status(401).json({ error: "User not found" });

      const user = results[0];

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Wrong password" });

      req.session.user = {
        id: user.userid,
        username: user.username,
        email: user.email
      };

      res.json({
        success: true,
        user: req.session.user
      });
    }
  );
});

// ================= LOGOUT =================
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ================= DASHBOARD STATS =================
app.get("/api/dashboard/stats", (req, res) => {
  const data = {
    totalSlots: 20,
    availableSlots: 12,
    occupiedSlots: 8,
    todayRevenue: 50000
  };

  res.json(data);
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});