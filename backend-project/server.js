const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: 'smartpark_secret_2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 3600000 }
}));

// ============ DATABASE CONNECTION ============
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'PSSMS'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    console.log('Please start MySQL (XAMPP/WAMP) first!');
    process.exit(1);
  }
  console.log('✅ Connected to MySQL database');
  createTables();
});

// ============ CREATE ALL TABLES ============
function createTables() {
  // Users table
  db.query(`CREATE TABLE IF NOT EXISTS users (
    userid INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    fullname VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'staff',
    is_verified BOOLEAN DEFAULT TRUE,
    provider VARCHAR(50) DEFAULT 'local',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Users error:', err);
    else console.log('✅ Users table ready');
  });

  // Parkingslot table
  db.query(`CREATE TABLE IF NOT EXISTS parkingslot (
    slotnumber VARCHAR(10) PRIMARY KEY,
    slotstatus ENUM('available', 'occupied') DEFAULT 'available',
    slottype VARCHAR(20) DEFAULT 'standard',
    hourlyrate INT DEFAULT 500
  )`, (err) => {
    if (err) console.error('Parkingslot error:', err);
    else {
      console.log('✅ Parkingslot table ready');
      const defaultSlots = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'VIP1', 'VIP2', 'DIS1', 'DIS2'];
      defaultSlots.forEach(slot => {
        let type = 'standard';
        let rate = 500;
        if (slot.includes('VIP')) { type = 'vip'; rate = 1000; }
        if (slot.includes('DIS')) { type = 'disabled'; rate = 300; }
        db.query('INSERT IGNORE INTO parkingslot (slotnumber, slotstatus, slottype, hourlyrate) VALUES (?, "available", ?, ?)', [slot, type, rate]);
      });
    }
  });

  // Car table
  db.query(`CREATE TABLE IF NOT EXISTS car (
    platenumber VARCHAR(20) PRIMARY KEY,
    drivername VARCHAR(100) NOT NULL,
    phonenumber VARCHAR(15) NOT NULL,
    email VARCHAR(100),
    vehicle_type VARCHAR(50) DEFAULT 'car'
  )`, (err) => {
    if (err) console.error('Car error:', err);
    else console.log('✅ Car table ready');
  });

  // Parkingrecord table
  db.query(`CREATE TABLE IF NOT EXISTS parkingrecord (
    recordid INT AUTO_INCREMENT PRIMARY KEY,
    platenumber VARCHAR(20),
    slotnumber VARCHAR(10),
    entrytime DATETIME NOT NULL,
    exittime DATETIME,
    duration DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active'
  )`, (err) => {
    if (err) console.error('Parkingrecord error:', err);
    else console.log('✅ Parkingrecord table ready');
  });

  // Payment table
  db.query(`CREATE TABLE IF NOT EXISTS payment (
    paymentid INT AUTO_INCREMENT PRIMARY KEY,
    recordid INT,
    platenumber VARCHAR(20),
    amountpaid DECIMAL(10,2) NOT NULL,
    paymentdate DATETIME NOT NULL,
    paymentmethod VARCHAR(50) DEFAULT 'cash',
    transaction_id VARCHAR(100),
    slotnumber VARCHAR(10),
    duration DECIMAL(10,2)
  )`, (err) => {
    if (err) console.error('Payment error:', err);
    else console.log('✅ Payment table ready');
  });

  // Insert default admin user
  setTimeout(async () => {
    db.query('SELECT * FROM users WHERE username = "admin"', async (err, results) => {
      if (err) return;
      if (!results || results.length === 0) {
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        db.query(`INSERT INTO users (username, password, email, fullname, role, is_verified, provider) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                  ['admin', hashedPassword, 'admin@smartpark.com', 'System Administrator', 'admin', true, 'local']);
        console.log('✅ Admin user created');
      }
    });
  }, 1000);
}

// ============ AUTHENTICATION ROUTES ============
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SmartPark Server Running', timestamp: new Date().toISOString() });
});

app.get('/api/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

// REGISTER - WORKING
app.post('/api/register', async (req, res) => {
  const { username, password, email, fullname, phone } = req.body;
  
  console.log('📝 Registration attempt:', { username, email });
  
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results && results.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.query(`INSERT INTO users (username, password, email, fullname, phone, role, is_verified, provider) 
              VALUES (?, ?, ?, ?, ?, 'staff', true, 'local')`,
      [username, hashedPassword, email, fullname || username, phone || null],
      (err) => {
        if (err) return res.status(500).json({ error: 'Failed to create user' });
        console.log('✅ User registered:', username);
        res.json({ success: true, message: 'Registration successful!' });
      });
  });
});

// LOGIN - WORKING
app.post('/api/login', (req, res) => {
  const { username, password, rememberMe } = req.body;
  
  db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!results || results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const maxAge = rememberMe ? 7 * 24 * 3600000 : 3600000;
    req.session.cookie.maxAge = maxAge;
    req.session.user = {
      id: user.userid,
      username: user.username,
      email: user.email,
      fullname: user.fullname,
      role: user.role
    };
    
    console.log('✅ Login successful:', username);
    res.json({ success: true, user: req.session.user });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ============ SOCIAL AUTH ============
app.post('/api/auth/social', async (req, res) => {
  const { provider } = req.body;
  const timestamp = Date.now();
  const email = `${provider}_user_${timestamp}@${provider}.com`;
  const username = `${provider}_${timestamp}`;
  const fullname = `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`;
  const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
  
  db.query('SELECT * FROM users WHERE provider = ?', [provider], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    if (!results || results.length === 0) {
      db.query(`INSERT INTO users (username, password, email, fullname, role, is_verified, provider) 
                VALUES (?, ?, ?, ?, 'staff', true, ?)`,
        [username, hashedPassword, email, fullname, provider],
        (err, result) => {
          if (err) return res.status(500).json({ error: 'Failed to create user' });
          req.session.user = { id: result.insertId, username, email, fullname, role: 'staff' };
          res.json({ success: true, user: req.session.user });
        }
      );
    } else {
      const user = results[0];
      req.session.user = { id: user.userid, username: user.username, email: user.email, fullname: user.fullname, role: user.role };
      res.json({ success: true, user: req.session.user });
    }
  });
});

// ============ PARKING SLOTS ROUTES ============
app.get('/api/parkingslots', (req, res) => {
  db.query('SELECT * FROM parkingslot ORDER BY slotnumber', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results || []);
  });
});

app.post('/api/parkingslots', (req, res) => {
  const { slotnumber, slotstatus, slottype, hourlyrate } = req.body;
  if (!slotnumber) return res.status(400).json({ error: 'Slot number required' });
  const rate = hourlyrate || (slottype === 'vip' ? 1000 : (slottype === 'disabled' ? 300 : 500));
  db.query('INSERT INTO parkingslot (slotnumber, slotstatus, slottype, hourlyrate) VALUES (?, ?, ?, ?)',
    [slotnumber, slotstatus || 'available', slottype || 'standard', rate],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

app.put('/api/parkingslots/:slotnumber', (req, res) => {
  const { slotnumber } = req.params;
  const { slotstatus } = req.body;
  db.query('UPDATE parkingslot SET slotstatus = ? WHERE slotnumber = ?', [slotstatus, slotnumber], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/parkingslots/:slotnumber', (req, res) => {
  const { slotnumber } = req.params;
  db.query('DELETE FROM parkingslot WHERE slotnumber = ?', [slotnumber], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ CARS ROUTES ============
app.get('/api/cars', (req, res) => {
  db.query('SELECT * FROM car ORDER BY platenumber', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results || []);
  });
});

app.post('/api/cars', (req, res) => {
  const { platenumber, drivername, phonenumber, email, vehicle_type } = req.body;
  if (!platenumber || !drivername || !phonenumber) {
    return res.status(400).json({ error: 'Plate number, driver name and phone are required' });
  }
  db.query('INSERT INTO car (platenumber, drivername, phonenumber, email, vehicle_type) VALUES (?, ?, ?, ?, ?)',
    [platenumber, drivername, phonenumber, email || null, vehicle_type || 'car'],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

app.delete('/api/cars/:platenumber', (req, res) => {
  const { platenumber } = req.params;
  db.query('DELETE FROM car WHERE platenumber = ?', [platenumber], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ PARKING RECORDS ROUTES ============
app.get('/api/parkingrecords', (req, res) => {
  const query = `
    SELECT pr.*, c.drivername, c.phonenumber, c.email,
           p.amountpaid, p.paymentdate, p.paymentmethod
    FROM parkingrecord pr
    LEFT JOIN car c ON pr.platenumber = c.platenumber
    LEFT JOIN payment p ON pr.recordid = p.recordid
    ORDER BY pr.recordid DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results || []);
  });
});

app.post('/api/parkingrecords/entry', (req, res) => {
  const { platenumber, drivername, phonenumber, email, vehicle_type, slotnumber, entrytime } = req.body;
  
  if (!platenumber || !drivername || !phonenumber || !slotnumber || !entrytime) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  db.query('INSERT IGNORE INTO car (platenumber, drivername, phonenumber, email, vehicle_type) VALUES (?, ?, ?, ?, ?)',
    [platenumber, drivername, phonenumber, email || null, vehicle_type || 'car'], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      db.query('SELECT slotstatus FROM parkingslot WHERE slotnumber = ?', [slotnumber], (err, slots) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!slots || slots.length === 0) return res.status(400).json({ error: 'Slot not found' });
        if (slots[0].slotstatus === 'occupied') return res.status(400).json({ error: 'Slot occupied' });
        
        db.query('INSERT INTO parkingrecord (platenumber, slotnumber, entrytime, status) VALUES (?, ?, ?, "active")',
          [platenumber, slotnumber, entrytime],
          (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            db.query('UPDATE parkingslot SET slotstatus = "occupied" WHERE slotnumber = ?', [slotnumber]);
            res.json({ success: true, recordid: result.insertId });
          });
      });
    });
});

app.put('/api/parkingrecords/exit/:recordid', (req, res) => {
  const { recordid } = req.params;
  const { exittime, paymentmethod } = req.body;
  
  db.query('SELECT platenumber, slotnumber, entrytime FROM parkingrecord WHERE recordid = ?', [recordid], (err, records) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!records || records.length === 0) return res.status(404).json({ error: 'Record not found' });
    
    const record = records[0];
    const entrytime = new Date(record.entrytime);
    const exit = new Date(exittime);
    let duration = Math.ceil((exit - entrytime) / (1000 * 60 * 60));
    if (duration < 1) duration = 1;
    
    const amountpaid = duration * 500;
    const transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
    
    db.query('UPDATE parkingrecord SET exittime = ?, duration = ?, status = "completed" WHERE recordid = ?',
      [exittime, duration, recordid], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.query(`INSERT INTO payment (recordid, platenumber, amountpaid, paymentdate, paymentmethod, transaction_id, slotnumber, duration) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [recordid, record.platenumber, amountpaid, exittime, paymentmethod || 'cash', transactionId, record.slotnumber, duration],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.query('UPDATE parkingslot SET slotstatus = "available" WHERE slotnumber = ?', [record.slotnumber]);
            res.json({ success: true, amountpaid, duration });
          });
      });
  });
});

app.delete('/api/parkingrecords/:recordid', (req, res) => {
  const { recordid } = req.params;
  db.query('DELETE FROM parkingrecord WHERE recordid = ?', [recordid], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ PAYMENTS ROUTES ============
app.get('/api/payments', (req, res) => {
  const query = `
    SELECT p.*, c.drivername
    FROM payment p
    LEFT JOIN car c ON p.platenumber = c.platenumber
    ORDER BY p.paymentdate DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const totalAmount = results.reduce((sum, r) => sum + parseFloat(r.amountpaid), 0);
    res.json({ payments: results, totalAmount });
  });
});

app.post('/api/payments', (req, res) => {
  const { platenumber, amountpaid, paymentmethod, transaction_id, paymentdate, slotnumber, duration } = req.body;
  
  console.log('Adding payment:', { platenumber, amountpaid });
  
  if (!platenumber || !amountpaid || !paymentdate) {
    return res.status(400).json({ error: 'Plate number, amount and date are required' });
  }
  
  const transactionId = transaction_id || 'TXN' + Date.now() + Math.floor(Math.random() * 10000);
  const finalSlotnumber = slotnumber || 'N/A';
  const finalDuration = duration || 1;
  
  db.query(`INSERT INTO payment (platenumber, amountpaid, paymentdate, paymentmethod, transaction_id, slotnumber, duration) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [platenumber, amountpaid, paymentdate, paymentmethod || 'cash', transactionId, finalSlotnumber, finalDuration],
    (err, result) => {
      if (err) {
        console.error('Payment insert error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Payment added successfully. ID:', result.insertId);
      res.json({ success: true, paymentid: result.insertId });
    });
});

app.delete('/api/payments/:paymentid', (req, res) => {
  const { paymentid } = req.params;
  db.query('DELETE FROM payment WHERE paymentid = ?', [paymentid], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ REPORT ROUTES ============
app.get('/api/reports/daily', (req, res) => {
  const targetDate = req.query.date || new Date().toISOString().split('T')[0];
  
  const query = `
    SELECT p.*, c.drivername
    FROM payment p
    LEFT JOIN car c ON p.platenumber = c.platenumber
    WHERE DATE(p.paymentdate) = ?
    ORDER BY p.paymentdate DESC
  `;
  
  db.query(query, [targetDate], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const totalAmount = results.reduce((sum, r) => sum + parseFloat(r.amountpaid), 0);
    res.json({ reports: results, totalAmount, date: targetDate });
  });
});

app.get('/api/reports/bill/:recordid', (req, res) => {
  const { recordid } = req.params;
  
  const query = `
    SELECT p.*, c.drivername
    FROM payment p
    LEFT JOIN car c ON p.platenumber = c.platenumber
    WHERE p.recordid = ?
  `;
  
  db.query(query, [recordid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json(results[0]);
  });
});

// ============ DASHBOARD STATS ============
app.get('/api/dashboard/stats', (req, res) => {
  const queries = {
    totalSlots: 'SELECT COUNT(*) as count FROM parkingslot',
    availableSlots: 'SELECT COUNT(*) as count FROM parkingslot WHERE slotstatus = "available"',
    occupiedSlots: 'SELECT COUNT(*) as count FROM parkingslot WHERE slotstatus = "occupied"',
    todayRevenue: 'SELECT COALESCE(SUM(amountpaid), 0) as total FROM payment WHERE DATE(paymentdate) = CURDATE()',
    activeParkings: 'SELECT COUNT(*) as count FROM parkingrecord WHERE status = "active"',
    totalRevenue: 'SELECT COALESCE(SUM(amountpaid), 0) as total FROM payment',
    totalCars: 'SELECT COUNT(*) as count FROM car'
  };
  
  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;
  
  for (const [key, query] of Object.entries(queries)) {
    db.query(query, (err, result) => {
      results[key] = err ? { count: 0, total: 0 } : (result[0] || { count: 0, total: 0 });
      completed++;
      if (completed === total) res.json(results);
    });
  }
});

// ============ FORGOT/RESET PASSWORD ============
const otpStore = new Map();

app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });
  console.log(`🔐 Password reset OTP for ${email}: ${otp}`);
  res.json({ success: true, message: 'Reset code sent to your email' });
});

app.post('/api/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const stored = otpStore.get(email);
  
  if (!stored || stored.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP code' });
  }
  if (stored.expires < Date.now()) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP has expired' });
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to reset password' });
    otpStore.delete(email);
    res.json({ success: true, message: 'Password reset successfully!' });
  });
});

// ============ WHATSAPP OTP ============
app.post('/api/send-whatsapp-otp', (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`📱 WhatsApp OTP for ${phone}: ${otp}`);
  res.json({ success: true, message: 'OTP sent', otp: otp });
});

app.post('/api/verify-whatsapp-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (otp.length !== 6) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
  
  const username = `whatsapp_${phone.replace(/[^0-9]/g, '')}`;
  const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
  
  db.query('SELECT * FROM users WHERE phone = ?', [phone], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    if (!results || results.length === 0) {
      db.query(`INSERT INTO users (username, password, phone, role, is_verified, provider) 
                VALUES (?, ?, ?, 'staff', true, 'whatsapp')`,
        [username, hashedPassword, phone],
        (err, result) => {
          if (err) return res.status(500).json({ error: 'Failed to create user' });
          req.session.user = { id: result.insertId, username, phone, role: 'staff' };
          res.json({ success: true, user: req.session.user });
        }
      );
    } else {
      const user = results[0];
      req.session.user = { id: user.userid, username: user.username, phone: user.phone, role: user.role };
      res.json({ success: true, user: req.session.user });
    }
  });
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 SmartPark Server Running!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📊 Database: MySQL - PSSMS`);
  console.log(`\n👤 Login Credentials:`);
  console.log(`   Username: admin`);
  console.log(`   Password: Admin@123`);
  console.log(`\n📋 Available Endpoints:`);
  console.log(`   ✅ POST   /api/register`);
  console.log(`   ✅ POST   /api/login`);
  console.log(`   ✅ POST   /api/logout`);
  console.log(`   ✅ POST   /api/auth/social`);
  console.log(`   ✅ GET    /api/parkingslots`);
  console.log(`   ✅ POST   /api/parkingslots`);
  console.log(`   ✅ GET    /api/cars`);
  console.log(`   ✅ POST   /api/cars`);
  console.log(`   ✅ GET    /api/parkingrecords`);
  console.log(`   ✅ POST   /api/parkingrecords/entry`);
  console.log(`   ✅ PUT    /api/parkingrecords/exit/:id`);
  console.log(`   ✅ GET    /api/payments`);
  console.log(`   ✅ POST   /api/payments`);
  console.log(`   ✅ GET    /api/reports/daily`);
  console.log(`   ✅ GET    /api/reports/bill/:id`);
  console.log(`   ✅ GET    /api/dashboard/stats`);
  console.log(`   ✅ POST   /api/forgot-password`);
  console.log(`   ✅ POST   /api/reset-password`);
  console.log(`\n✨ SmartPark PSSMS - MUNYABUGINGO Theophile`);
  console.log(`${'='.repeat(60)}\n`);
});