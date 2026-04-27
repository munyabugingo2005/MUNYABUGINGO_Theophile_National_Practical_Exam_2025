require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 10000;

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "smartpark_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 3600000 }
}));

/* ---------------- DATABASE ---------------- */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("✅ Database Connected"))
  .catch(err => console.log("❌ DB ERROR:", err.message));

/* ---------------- CREATE TABLES ---------------- */

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      userid SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE,
      password VARCHAR(255),
      email VARCHAR(100),
      fullname VARCHAR(100),
      role VARCHAR(30) DEFAULT 'user'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS parkingslot (
      slotnumber VARCHAR(10) PRIMARY KEY,
      slotstatus VARCHAR(20) DEFAULT 'available',
      hourlyrate INT DEFAULT 500
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS car (
      platenumber VARCHAR(30) PRIMARY KEY,
      drivername VARCHAR(100),
      phonenumber VARCHAR(20)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS parkingrecord (
      recordid SERIAL PRIMARY KEY,
      platenumber VARCHAR(30),
      slotnumber VARCHAR(10),
      entrytime TIMESTAMP,
      exittime TIMESTAMP,
      status VARCHAR(20) DEFAULT 'active'
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment (
      paymentid SERIAL PRIMARY KEY,
      recordid INT,
      platenumber VARCHAR(30),
      amountpaid NUMERIC,
      paymentdate TIMESTAMP
    )
  `);

  console.log("✅ Tables ready");
}

initDB();

/* ---------------- ROUTES ---------------- */

app.get("/", (req, res) => {
  res.json({
    message: "SmartPark API Running",
    database: true
  });
});

/* ---------------- REGISTER ---------------- */

app.post("/api/register", async (req, res) => {
  const { username, password, email } = req.body;

  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    "INSERT INTO users(username,password,email) VALUES($1,$2,$3)",
    [username, hash, email]
  );

  res.json({ success: true });
});

/* ---------------- LOGIN ---------------- */

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await pool.query(
    "SELECT * FROM users WHERE username=$1",
    [username]
  );

  if (user.rows.length === 0)
    return res.status(401).json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.rows[0].password);

  if (!valid)
    return res.status(401).json({ error: "Wrong password" });

  req.session.user = user.rows[0];

  res.json({
    success: true,
    user: user.rows[0]
  });
});

/* ---------------- PARKING SLOTS ---------------- */

app.get("/api/slots", async (req, res) => {
  const data = await pool.query("SELECT * FROM parkingslot");
  res.json(data.rows);
});

/* ---------------- CAR ENTRY ---------------- */

app.post("/api/entry", async (req, res) => {
  const { platenumber, slotnumber } = req.body;

  await pool.query(
    "INSERT INTO car(platenumber) VALUES($1) ON CONFLICT DO NOTHING",
    [platenumber]
  );

  await pool.query(
    "INSERT INTO parkingrecord(platenumber,slotnumber,entrytime) VALUES($1,$2,NOW())",
    [platenumber, slotnumber]
  );

  await pool.query(
    "UPDATE parkingslot SET slotstatus='occupied' WHERE slotnumber=$1",
    [slotnumber]
  );

  res.json({ success: true });
});

/* ---------------- EXIT + PAYMENT ---------------- */

app.put("/api/exit/:id", async (req, res) => {
  const { id } = req.params;

  const record = await pool.query(
    "SELECT * FROM parkingrecord WHERE recordid=$1",
    [id]
  );

  const r = record.rows[0];

  const hours = 1;
  const amount = hours * 500;

  await pool.query(
    "UPDATE parkingrecord SET exittime=NOW(), status='done' WHERE recordid=$1",
    [id]
  );

  await pool.query(
    "INSERT INTO payment(recordid,platenumber,amountpaid,paymentdate) VALUES($1,$2,$3,NOW())",
    [id, r.platenumber, amount]
  );

  await pool.query(
    "UPDATE parkingslot SET slotstatus='available' WHERE slotnumber=$1",
    [r.slotnumber]
  );

  res.json({ success: true, amount });
});

/* ---------------- PAYMENTS ---------------- */

app.get("/api/payments", async (req, res) => {
  const data = await pool.query("SELECT * FROM payment");
  res.json(data.rows);
});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, () => {
  console.log("================================");
  console.log("🚀 Server running on port", PORT);
  console.log("================================");
});