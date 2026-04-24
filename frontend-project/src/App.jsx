import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Cars from './components/Cars';
import ParkingSlots from './components/ParkingSlots';
import ParkingRecords from './components/ParkingRecords';
import Payments from './components/Payments';
import Reports from './components/Reports';

// Configure axios
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true;

// Navigation items
const navItems = [
  { path: '/dashboard', name: 'Dashboard', icon: '📊', color: 'from-blue-500 to-blue-600' },
  { path: '/cars', name: 'Cars', icon: '🚗', color: 'from-green-500 to-green-600' },
  { path: '/parkingslots', name: 'Parking Slots', icon: '🅿️', color: 'from-purple-500 to-purple-600' },
  { path: '/parkingrecords', name: 'Records', icon: '📝', color: 'from-yellow-500 to-yellow-600' },
  { path: '/payments', name: 'Payments', icon: '💰', color: 'from-pink-500 to-pink-600' },
  { path: '/reports', name: 'Reports', icon: '📈', color: 'from-red-500 to-red-600' },
];

// Navbar Component (inside Router)
function Navbar({ user, onLogout, location }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New parking record added', time: '2 min ago', read: false },
    { id: 2, text: 'Payment received of 500 FRW', time: '1 hour ago', read: false },
    { id: 3, text: 'System update completed', time: '1 day ago', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition"></div>
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <span className="text-2xl">🅿️</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <span className="font-bold text-xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                SmartPark PSSMS
              </span>
              <p className="text-xs text-gray-400">Parking Management System</p>
            </div>
            <span className="font-bold text-xl lg:hidden">SmartPark</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                  location.pathname === item.path
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                    : 'hover:bg-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-700 transition relative"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <h3 className="font-bold text-gray-800">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`p-3 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${
                          !notif.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <p className="text-sm text-gray-800">{notif.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-700 transition"
              >
                <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {user?.fullname?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {user?.fullname?.split(' ')[0] || user?.username}
                </span>
                <span className="hidden md:inline text-xs">▼</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <p className="font-semibold text-gray-800">{user?.fullname || user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email || 'user@smartpark.com'}</p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">Role: {user?.role || 'Staff'}</p>
                  </div>
                  <div className="py-2">
                    <button className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition text-left">
                      <span>👤</span><span className="text-sm">My Profile</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition text-left">
                      <span>⚙️</span><span className="text-sm">Settings</span>
                    </button>
                    <hr className="my-1" />
                    <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-50 transition text-left">
                      <span>🚪</span><span className="text-sm text-red-600">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  location.pathname === item.path
                    ? `bg-gradient-to-r ${item.color} text-white`
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

// Dashboard Component
function Dashboard({ user, stats }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
        <div className="flex justify-between items-center flex-wrap gap-4 relative z-10">
          <div>
            <p className="text-sm text-blue-100">{getGreeting()}</p>
            <h2 className="text-3xl font-bold">
              Welcome back, {user?.fullname || user?.username}! 👋
            </h2>
            <p className="text-blue-100 mt-1">SmartPark Parking Management System</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 text-center">
            <p className="text-xs opacity-80">Today's Date</p>
            <p className="font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105 duration-300 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Slots</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalSlots?.count || 0}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🅿️</span>
            </div>
          </div>
          <div className="mt-3 flex justify-between text-xs">
            <span className="text-green-600 bg-green-50 px-2 py-1 rounded">Available: {stats.availableSlots?.count || 0}</span>
            <span className="text-red-600 bg-red-50 px-2 py-1 rounded">Occupied: {stats.occupiedSlots?.count || 0}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105 duration-300 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Today's Revenue</p>
              <p className="text-3xl font-bold text-green-600">{stats.todayRevenue?.total?.toLocaleString() || 0} FRW</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105 duration-300 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Parkings</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.activeParkings?.count || 0}</p>
            </div>
            <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🚗</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105 duration-300 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalRevenue?.total?.toLocaleString() || 0} FRW</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">
          ℹ️ System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Developer</p>
            <p className="font-semibold text-gray-800">MUNYABUGINGO Theophile</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Location</p>
            <p className="font-semibold text-gray-800">Rubavu District, Western Province, Rwanda</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">System Name</p>
            <p className="font-semibold text-gray-800">SmartPark PSSMS</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">Version</p>
            <p className="font-semibold text-gray-800">2.0.0</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">
          ⚡ Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/parkingrecords" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition font-semibold">
            🚗 Record Entry
          </Link>
          <Link to="/parkingslots" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center px-4 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition font-semibold">
            🅿️ View Slots
          </Link>
          <Link to="/reports" className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center px-4 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition font-semibold">
            📊 Daily Report
          </Link>
          <Link to="/cars" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center px-4 py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition font-semibold">
            🚙 Manage Cars
          </Link>
        </div>
      </div>
    </div>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🅿️</span>
              <h3 className="text-lg font-bold">SmartPark</h3>
            </div>
            <p className="text-sm text-gray-400">Smart Parking Management System for efficient vehicle tracking and billing.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
              <li><Link to="/cars" className="hover:text-white transition">Cars</Link></li>
              <li><Link to="/parkingslots" className="hover:text-white transition">Parking Slots</Link></li>
              <li><Link to="/parkingrecords" className="hover:text-white transition">Parking Records</Link></li>
              <li><Link to="/payments" className="hover:text-white transition">Payments</Link></li>
              <li><Link to="/reports" className="hover:text-white transition">Reports</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📍 Rubavu District, Rwanda</li>
              <li>📞 +250 788 123 456</li>
              <li>✉️ info@smartpark.rw</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Developer</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>👨‍💻 MUNYABUGINGO Theophile</li>
              <li>📅 2025</li>
              <li>🏆 SmartPark PSSMS v2.0</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-6 pt-4 text-center text-sm text-gray-400">
          <p>&copy; 2025 SmartPark Parking Management System. All rights reserved. | Developed by MUNYABUGINGO Theophile</p>
        </div>
      </div>
    </footer>
  );
}

// Main App Component
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalSlots: { count: 0 },
    availableSlots: { count: 0 },
    occupiedSlots: { count: 0 },
    todayRevenue: { total: 0 },
    activeParkings: { count: 0 },
    totalRevenue: { total: 0 },
    totalCars: { count: 0 }
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/check-auth');
      setIsAuthenticated(response.data.authenticated);
      setUser(response.data.user);
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setDashboardStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading SmartPark System...</p>
          <p className="text-sm text-gray-400 mt-2">MUNYABUGINGO Theophile</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Routes>
          <Route path="*" element={
            <>
              <Navbar user={user} onLogout={handleLogout} location={window.location} />
              <main className="flex-1 container mx-auto px-4 py-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<Dashboard user={user} stats={dashboardStats} />} />
                  <Route path="/cars" element={<Cars />} />
                  <Route path="/parkingslots" element={<ParkingSlots />} />
                  <Route path="/parkingrecords" element={<ParkingRecords />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/reports" element={<Reports />} />
                </Routes>
              </main>
              <Footer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;