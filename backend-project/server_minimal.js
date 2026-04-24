const express = require('express');
const cors = require('cors');
const session = require('express-session');

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
  secret: 'smartpark_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 3600000 }
}));

// Store users in memory (for testing without database)
const users = [
  { id: 1, username: 'admin', password: '$2b$10$dummy', email: 'admin@smartpark.com', fullname: 'Admin User', role: 'admin' }
];

// Simple password check (for demo)
const checkPassword = (input, stored) => {
  // For demo, accept 'Admin@123' as password
  return input === 'Admin@123';
};

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
app.post('/api/login', (req, res) => {
  const { username, password, rememberMe } = req.body;
  
  if (username === 'admin' && password === 'Admin@123') {
    const maxAge = rememberMe ? 7 * 24 * 3600000 : 3600000;
    req.session.cookie.maxAge = maxAge;
    req.session.user = { id: 1, username: 'admin', fullname: 'Admin User', email: 'admin@smartpark.com', role: 'admin' };
    res.json({ success: true, user: req.session.user });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// Register
app.post('/api/register', (req, res) => {
  const { username, password, email, fullname, phone } = req.body;
  
  console.log('Registration attempt:', { username, email, fullname });
  
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password and email are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  
  // Check if user exists (simple check)
  if (username === 'admin') {
    return res.status(400).json({ error: 'Username already exists' });
  }
  
  // For demo, always succeed
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
  req.session.user = { id: Date.now(), username: `${provider}_user`, fullname: `${provider} User`, role: 'staff' };
  res.json({ success: true, user: req.session.user });
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
    req.session.user = { id: Date.now(), username: `whatsapp_${phone}`, role: 'staff' };
    res.json({ success: true, user: req.session.user });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// Forgot password
app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  console.log(`🔐 Password reset requested for: ${email}`);
  res.json({ success: true, message: 'Reset code sent' });
});

// Reset password
app.post('/api/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;
  res.json({ success: true, message: 'Password reset successfully!' });
});

// Parking slots
app.get('/api/parkingslots', (req, res) => {
  const slots = [];
  for (let i = 1; i <= 20; i++) {
    slots.push({ slotnumber: `SLOT${i}`, slotstatus: i <= 3 ? 'occupied' : 'available' });
  }
  res.json(slots);
});

// Cars
app.get('/api/cars', (req, res) => {
  res.json([
    { platenumber: 'RAB001C', drivername: 'John Doe', phonenumber: '0788123456' },
    { platenumber: 'RAB002C', drivername: 'Jane Smith', phonenumber: '0788234567' }
  ]);
});

app.post('/api/cars', (req, res) => {
  res.json({ success: true });
});

app.delete('/api/cars/:platenumber', (req, res) => {
  res.json({ success: true });
});

// Parking records
app.get('/api/parkingrecords', (req, res) => {
  res.json([
    { recordid: 1, platenumber: 'RAB001C', drivername: 'John Doe', slotnumber: 'SLOT1', entrytime: new Date().toISOString(), exittime: null },
    { recordid: 2, platenumber: 'RAB002C', drivername: 'Jane Smith', slotnumber: 'SLOT2', entrytime: new Date(Date.now() - 3600000).toISOString(), exittime: new Date().toISOString(), duration: 1, amountpaid: 500 }
  ]);
});

app.post('/api/parkingrecords/entry', (req, res) => {
  res.json({ success: true, recordid: Math.floor(Math.random() * 1000) });
});

app.put('/api/parkingrecords/exit/:recordid', (req, res) => {
  res.json({ success: true, amountpaid: 500, duration: 1 });
});

app.delete('/api/parkingrecords/:recordid', (req, res) => {
  res.json({ success: true });
});

// Payments
app.get('/api/payments', (req, res) => {
  res.json({ payments: [], totalAmount: 0 });
});

// Reports
app.get('/api/reports/daily', (req, res) => {
  res.json({ reports: [], totalAmount: 0, date: new Date().toISOString().split('T')[0] });
});

app.get('/api/reports/bill/:recordid', (req, res) => {
  res.json({
    platenumber: 'RAB001C',
    drivername: 'John Doe',
    entrytime: new Date().toISOString(),
    exittime: new Date().toISOString(),
    duration: 1,
    amountpaid: 500,
    paymentdate: new Date().toISOString()
  });
});

// Dashboard stats
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SmartPark Server Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`👤 Demo Login: admin / Admin@123`);
  console.log(`\n✨ SmartPark PSSMS - MUNYABUGINGO Theophile\n`);
});