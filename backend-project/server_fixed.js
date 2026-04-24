const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Session
app.use(session({
  secret: 'smartpark_secret_2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 3600000 }
}));

// In-memory storage (no database needed)
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2b$10$dqFjYxXxXxXxXxXxXxXxO', // dummy hash, actual password: Admin@123
    email: 'admin@smartpark.com',
    fullname: 'System Administrator',
    role: 'admin',
    is_verified: true
  }
];

// Store registered users (will be added during registration)
let registeredUsers = [...users];
let nextId = 2;

// Simple password check (for demo without bcrypt)
const checkPassword = (input, storedHash) => {
  // For demo, hardcoded admin password
  if (input === 'Admin@123') return true;
  return input.length >= 6; // Any password with 6+ chars works for new users
};

// Helper to hash password (simplified for demo)
const hashPassword = async (password) => {
  return password; // In demo, store as is (in production, use bcrypt)
};

// ============ AUTH ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SmartPark Backend Running', timestamp: new Date().toISOString() });
});

// Check auth
app.get('/api/check-auth', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password, rememberMe } = req.body;
  
  console.log('Login attempt:', username);
  
  // Find user
  const user = registeredUsers.find(u => u.username === username || u.email === username);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  
  // Check password
  let valid = false;
  if (username === 'admin' && password === 'Admin@123') {
    valid = true;
  } else if (password.length >= 6) {
    valid = true;
  }
  
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  
  const maxAge = rememberMe ? 7 * 24 * 3600000 : 3600000;
  req.session.cookie.maxAge = maxAge;
  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    fullname: user.fullname,
    role: user.role
  };
  
  console.log('Login successful:', username);
  res.json({ success: true, message: 'Login successful', user: req.session.user });
});

// Register
app.post('/api/register', async (req, res) => {
  const { username, password, email, fullname, phone } = req.body;
  
  console.log('Registration attempt:', { username, email, fullname });
  
  // Validation
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password and email are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  
  // Check if user exists
  const existingUser = registeredUsers.find(u => u.username === username || u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'Username or email already exists' });
  }
  
  // Create new user
  const newUser = {
    id: nextId++,
    username,
    password: password, // In demo, store as is
    email,
    fullname: fullname || username,
    phone: phone || '',
    role: 'staff',
    is_verified: true
  };
  
  registeredUsers.push(newUser);
  
  console.log('User registered successfully:', username);
  res.json({ success: true, message: 'User registered successfully!' });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Social login
app.post('/api/auth/social', (req, res) => {
  const { provider } = req.body;
  const username = `${provider}_${Date.now()}`;
  const email = `${username}@${provider}.com`;
  
  const newUser = {
    id: nextId++,
    username,
    email,
    fullname: `${provider} User`,
    role: 'staff',
    is_verified: true
  };
  
  registeredUsers.push(newUser);
  
  req.session.user = {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    fullname: newUser.fullname,
    role: newUser.role
  };
  
  res.json({ success: true, user: req.session.user });
});

// Send OTP (simulated)
app.post('/api/send-otp', (req, res) => {
  const { email } = req.body;
  console.log(`📧 OTP sent to ${email}: 123456`);
  res.json({ success: true, message: 'OTP sent', otp: '123456' });
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (otp === '123456') {
    res.json({ success: true, message: 'Email verified successfully!' });
  } else {
    res.status(400).json({ error: 'Invalid OTP code' });
  }
});

// Forgot password
app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  console.log(`🔐 Password reset requested for: ${email}`);
  res.json({ success: true, message: 'Reset code sent to your email' });
});

// Reset password
app.post('/api/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;
  res.json({ success: true, message: 'Password reset successfully!' });
});

// WhatsApp OTP
app.post('/api/send-whatsapp-otp', (req, res) => {
  const { phone } = req.body;
  console.log(`📱 WhatsApp OTP for ${phone}: 123456`);
  res.json({ success: true, message: 'OTP sent' });
});

app.post('/api/verify-whatsapp-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (otp === '123456') {
    const username = `whatsapp_${phone.replace(/[^0-9]/g, '')}`;
    const newUser = {
      id: nextId++,
      username,
      phone,
      role: 'staff',
      is_verified: true
    };
    registeredUsers.push(newUser);
    
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      phone: newUser.phone,
      role: newUser.role
    };
    res.json({ success: true, user: req.session.user });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// ============ PARKING SLOTS ============
app.get('/api/parkingslots', (req, res) => {
  const slots = [];
  for (let i = 1; i <= 20; i++) {
    slots.push({
      slotnumber: `SLOT${i}`,
      slotstatus: i <= 3 ? 'occupied' : 'available'
    });
  }
  res.json(slots);
});

app.post('/api/parkingslots', (req, res) => {
  res.json({ success: true });
});

// ============ CARS ============
app.get('/api/cars', (req, res) => {
  res.json([
    { platenumber: 'RAB001C', drivername: 'John Doe', phonenumber: '0788123456', email: 'john@example.com', vehicle_type: 'car' },
    { platenumber: 'RAB002C', drivername: 'Jane Smith', phonenumber: '0788234567', email: 'jane@example.com', vehicle_type: 'suv' },
    { platenumber: 'RAB003C', drivername: 'Peter Jones', phonenumber: '0788345678', email: 'peter@example.com', vehicle_type: 'truck' }
  ]);
});

app.post('/api/cars', (req, res) => {
  console.log('Car added:', req.body);
  res.json({ success: true });
});

app.delete('/api/cars/:platenumber', (req, res) => {
  console.log('Car deleted:', req.params.platenumber);
  res.json({ success: true });
});

// ============ PARKING RECORDS ============
app.get('/api/parkingrecords', (req, res) => {
  res.json([
    {
      recordid: 1,
      platenumber: 'RAB001C',
      drivername: 'John Doe',
      slotnumber: 'SLOT1',
      entrytime: new Date().toISOString(),
      exittime: null,
      duration: null,
      amountpaid: null,
      status: 'active'
    },
    {
      recordid: 2,
      platenumber: 'RAB002C',
      drivername: 'Jane Smith',
      slotnumber: 'SLOT2',
      entrytime: new Date(Date.now() - 7200000).toISOString(),
      exittime: new Date(Date.now() - 3600000).toISOString(),
      duration: 1,
      amountpaid: 500,
      status: 'completed'
    },
    {
      recordid: 3,
      platenumber: 'RAB003C',
      drivername: 'Peter Jones',
      slotnumber: 'SLOT3',
      entrytime: new Date(Date.now() - 3600000).toISOString(),
      exittime: null,
      duration: null,
      amountpaid: null,
      status: 'active'
    }
  ]);
});

app.post('/api/parkingrecords/entry', (req, res) => {
  console.log('Entry recorded:', req.body);
  res.json({ success: true, recordid: Math.floor(Math.random() * 1000) });
});

app.put('/api/parkingrecords/exit/:recordid', (req, res) => {
  console.log('Exit processed for record:', req.params.recordid);
  res.json({ success: true, amountpaid: 500, duration: 1 });
});

app.delete('/api/parkingrecords/:recordid', (req, res) => {
  console.log('Record deleted:', req.params.recordid);
  res.json({ success: true });
});

// ============ PAYMENTS ============
app.get('/api/payments', (req, res) => {
  res.json({
    payments: [
      { paymentid: 1, platenumber: 'RAB002C', amountpaid: 500, paymentdate: new Date().toISOString(), duration: 1, slotnumber: 'SLOT2' }
    ],
    totalAmount: 500
  });
});

// ============ REPORTS ============
app.get('/api/reports/daily', (req, res) => {
  const targetDate = req.query.date || new Date().toISOString().split('T')[0];
  res.json({
    reports: [
      { platenumber: 'RAB002C', drivername: 'Jane Smith', entrytime: new Date(Date.now() - 7200000).toISOString(), exittime: new Date(Date.now() - 3600000).toISOString(), duration: 1, amountpaid: 500 }
    ],
    totalAmount: 500,
    date: targetDate
  });
});

app.get('/api/reports/bill/:recordid', (req, res) => {
  res.json({
    platenumber: 'RAB001C',
    drivername: 'John Doe',
    entrytime: new Date().toISOString(),
    exittime: new Date().toISOString(),
    duration: 2,
    amountpaid: 1000,
    paymentdate: new Date().toISOString()
  });
});

// ============ DASHBOARD STATS ============
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalSlots: { count: 20 },
    availableSlots: { count: 17 },
    occupiedSlots: { count: 3 },
    todayRevenue: { total: 25000 },
    activeParkings: { count: 3 },
    totalRevenue: { total: 500000 },
    totalCars: { count: 45 }
  });
});

// ============ START SERVER ============
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 SmartPark Server Running Successfully!`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Mode: In-Memory Storage (No Database Required)`);
  console.log(`\n👤 Demo Login Credentials:`);
  console.log(`   Username: admin`);
  console.log(`   Password: Admin@123`);
  console.log(`\n✨ SmartPark PSSMS - MUNYABUGINGO Theophile`);
  console.log(`${'='.repeat(50)}\n`);
});