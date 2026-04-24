import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Navbar({ onLogout, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState({ temp: '24°C', condition: 'Sunny', icon: '☀️' });
  const [searchHistory, setSearchHistory] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New parking record added', time: '2 min ago', read: false, icon: '🚗', color: 'blue' },
    { id: 2, text: 'Payment received of 500 FRW', time: '1 hour ago', read: false, icon: '💰', color: 'green' },
    { id: 3, text: 'System update completed', time: '1 day ago', read: true, icon: '🔄', color: 'purple' },
    { id: 4, text: 'New user registered', time: '2 days ago', read: true, icon: '👤', color: 'orange' },
    { id: 5, text: 'Parking slot A1 occupied', time: '3 days ago', read: true, icon: '🅿️', color: 'yellow' },
    { id: 6, text: 'Daily report generated', time: '5 days ago', read: true, icon: '📊', color: 'indigo' },
  ]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(false);
    setSearchTerm('');
  }, [location.pathname]);

  // Search functionality
  useEffect(() => {
    if (searchTerm.length > 1) {
      const pages = [
        { name: 'Dashboard', path: '/dashboard', icon: '📊', type: 'Page' },
        { name: 'Cars', path: '/cars', icon: '🚗', type: 'Page' },
        { name: 'Parking Slots', path: '/parkingslots', icon: '🅿️', type: 'Page' },
        { name: 'Parking Records', path: '/parkingrecords', icon: '📝', type: 'Page' },
        { name: 'Payments', path: '/payments', icon: '💰', type: 'Page' },
        { name: 'Reports', path: '/reports', icon: '📈', type: 'Page' },
        { name: 'My Profile', path: '/profile', icon: '👤', type: 'Action' },
        { name: 'Settings', path: '/settings', icon: '⚙️', type: 'Action' },
      ];
      const filtered = pages.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm) {
      setSearchHistory(prev => [searchTerm, ...prev].slice(0, 5));
      navigate(`/search?q=${searchTerm}`);
      setSearchOpen(false);
      setSearchTerm('');
    }
  };

  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: '📊', description: 'Overview & Stats', badge: null },
    { path: '/cars', name: 'Cars', icon: '🚗', description: 'Manage Vehicles', badge: null },
    { path: '/parkingslots', name: 'Parking Slots', icon: '🅿️', description: 'Slot Management', badge: null },
    { path: '/parkingrecords', name: 'Records', icon: '📝', description: 'Parking History', badge: '3' },
    { path: '/payments', name: 'Payments', icon: '💰', description: 'Transactions', badge: null },
    { path: '/reports', name: 'Reports', icon: '📈', description: 'Analytics', badge: null },
  ];

  const quickActions = [
    { name: 'Record Entry', path: '/parkingrecords', icon: '🚗', color: 'blue' },
    { name: 'View Slots', path: '/parkingslots', icon: '🅿️', color: 'purple' },
    { name: 'Reports', path: '/reports', icon: '📊', color: 'green' },
    { name: 'Manage Cars', path: '/cars', icon: '🚙', color: 'orange' },
  ];

  const isActive = (path) => location.pathname === path;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getInitials = () => {
    const name = user?.fullname || user?.username || 'User';
    return name.charAt(0).toUpperCase();
  };

  const getRandomColor = () => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-gradient-to-r from-gray-900 to-gray-800 shadow-2xl backdrop-blur-sm py-2'
          : 'bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg py-3'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo Section */}
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2.5 rounded-xl shadow-lg transform group-hover:rotate-3 transition">
                  <span className="text-2xl">🅿️</span>
                </div>
              </div>
              <div className="hidden lg:block">
                <span className="font-bold text-xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  SmartPark PSSMS
                </span>
                <p className="text-xs text-gray-400">Parking Management System</p>
              </div>
              <span className="font-bold text-xl lg:hidden text-white">SmartPark</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-xl transition-all duration-300 flex items-center space-x-2 overflow-hidden group ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.badge && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 rounded-full text-white animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {!isActive(item.path) && (
                      <span className="text-xs opacity-0 group-hover:opacity-100 transition duration-300">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full animate-pulse"></div>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Date & Time - Desktop */}
              <div className="hidden lg:block text-right">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>📅</span>
                  <span>{formatDate()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span>🕐</span>
                  <span>{formatTime()}</span>
                </div>
              </div>

              {/* Weather - Desktop */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-xl">
                <span className="text-lg">{weather.icon}</span>
                <div className="text-left">
                  <p className="text-xs text-gray-400">{weather.condition}</p>
                  <p className="text-sm font-semibold text-white">{weather.temp}</p>
                </div>
              </div>

              {/* Search Button */}
              <div className="relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 rounded-xl hover:bg-gray-700 transition relative"
                >
                  <span className="text-xl">🔍</span>
                </button>

                {/* Search Dropdown */}
                {searchOpen && (
                  <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-xl">🔍</span> Search
                      </h3>
                    </div>
                    <div className="p-4">
                      <input
                        type="text"
                        placeholder="Search for pages, features..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleSearch}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <span className="absolute left-7 top-9 text-gray-400">🔍</span>
                    </div>
                    {searchResults.length > 0 && (
                      <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
                        {searchResults.map((result, idx) => (
                          <Link
                            key={idx}
                            to={result.path}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                          >
                            <span className="text-xl">{result.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{result.name}</p>
                              <p className="text-xs text-gray-500">{result.type}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {searchHistory.length > 0 && !searchTerm && (
                      <div className="border-t border-gray-100">
                        <div className="p-3 bg-gray-50">
                          <p className="text-xs text-gray-500">Recent Searches</p>
                        </div>
                        {searchHistory.map((term, idx) => (
                          <div key={idx} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                            🔍 {term}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setUserMenuOpen(false);
                  }}
                  className="p-2 rounded-xl hover:bg-gray-700 transition relative"
                >
                  <span className="text-xl">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Menu */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                    <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-xl">🔔</span> Notifications
                        <span className="text-xs text-gray-500">({unreadCount} unread)</span>
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`flex items-start gap-3 p-4 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${
                            !notif.read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            notif.color === 'blue' ? 'bg-blue-100' :
                            notif.color === 'green' ? 'bg-green-100' :
                            notif.color === 'purple' ? 'bg-purple-100' :
                            notif.color === 'orange' ? 'bg-orange-100' :
                            notif.color === 'yellow' ? 'bg-yellow-100' : 'bg-indigo-100'
                          }`}>
                            <span className="text-xl">{notif.icon}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{notif.text}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-gray-50 text-center">
                      <button className="text-xs text-gray-500 hover:text-gray-700">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions Dropdown */}
              <div className="relative hidden lg:block">
                <button className="p-2 rounded-xl hover:bg-gray-700 transition">
                  <span className="text-xl">⚡</span>
                </button>
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                  <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                    <h3 className="font-bold text-gray-800">Quick Actions</h3>
                  </div>
                  <div className="p-2">
                    {quickActions.map((action) => (
                      <Link
                        key={action.name}
                        to={action.path}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                      >
                        <span className="text-lg">{action.icon}</span>
                        <span className="text-sm">{action.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-700 transition group"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition transform">
                    <span className="text-white font-bold text-lg">
                      {getInitials()}
                    </span>
                  </div>
                  <span className="hidden md:inline text-white font-medium">
                    {user?.fullname?.split(' ')[0] || user?.username}
                  </span>
                  <span className="hidden md:inline text-white text-xs">▼</span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-2xl">
                            {getInitials()}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{user?.fullname || user?.username}</p>
                          <p className="text-xs text-gray-500">{user?.email || 'user@smartpark.com'}</p>
                          <p className="text-xs text-gray-500 mt-1 capitalize">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              Role: {user?.role || 'Staff'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <div className="px-5 py-2">
                        <p className="text-xs text-gray-400 mb-2">Account</p>
                      </div>
                      <Link to="/profile" className="flex items-center space-x-3 px-5 py-3 hover:bg-gray-50 transition">
                        <span className="text-xl">👤</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">My Profile</p>
                          <p className="text-xs text-gray-500">View your personal info</p>
                        </div>
                      </Link>
                      <Link to="/settings" className="flex items-center space-x-3 px-5 py-3 hover:bg-gray-50 transition">
                        <span className="text-xl">⚙️</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Settings</p>
                          <p className="text-xs text-gray-500">Manage preferences</p>
                        </div>
                      </Link>
                      <div className="px-5 py-2">
                        <p className="text-xs text-gray-400 mb-2">Support</p>
                      </div>
                      <Link to="/help" className="flex items-center space-x-3 px-5 py-3 hover:bg-gray-50 transition">
                        <span className="text-xl">❓</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Help Center</p>
                          <p className="text-xs text-gray-500">Get support</p>
                        </div>
                      </Link>
                      <Link to="/feedback" className="flex items-center space-x-3 px-5 py-3 hover:bg-gray-50 transition">
                        <span className="text-xl">💬</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Feedback</p>
                          <p className="text-xs text-gray-500">Send us feedback</p>
                        </div>
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 px-5 py-3 hover:bg-red-50 transition text-left"
                      >
                        <span className="text-xl">🚪</span>
                        <div>
                          <p className="text-sm font-medium text-red-600">Logout</p>
                          <p className="text-xs text-gray-500">Sign out of your account</p>
                        </div>
                      </button>
                    </div>
                    <div className="p-3 bg-gray-50 text-center">
                      <p className="text-xs text-gray-400">SmartPark PSSMS v2.0</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-700 transition"
              >
                <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
              </button>
            </div>
          </div>

          {/* Search Bar (Expandable) */}
          {searchOpen && (
            <div className="pt-4 pb-2 animate-slideDown">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for parking slots, cars, records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearch}
                  className="w-full px-5 py-3 pl-12 bg-gray-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
                />
                <span className="absolute left-4 top-3.5 text-gray-400 text-lg">🔍</span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <span>Press Enter to search</span>
                <span>Esc to close</span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Sidebar Menu */}
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-all duration-300 md:hidden ${
          mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`} onClick={() => setMobileMenuOpen(false)}>
          <div className={`fixed top-0 left-0 w-85 h-full bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`} onClick={(e) => e.stopPropagation()}>
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🅿️</span>
                </div>
                <div>
                  <h3 className="text-white font-bold">SmartPark</h3>
                  <p className="text-xs text-gray-400">Parking Management</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{getInitials()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user?.fullname || user?.username}</p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role || 'staff'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs opacity-75">{item.description}</p>
                    </div>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs bg-red-500 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Quick Actions in Mobile */}
            <div className="px-4 py-2">
              <p className="text-xs text-gray-400 mb-2">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    to={action.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${action.color}-600/20 text-${action.color}-400`}
                  >
                    <span>{action.icon}</span>
                    <span className="text-sm">{action.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl transition"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  SmartPark PSSMS v2.0<br />
                  MUNYABUGINGO Theophile
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className={`${scrolled ? 'h-16' : 'h-20'}`}></div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-bounce { animation: bounce 0.5s infinite; }
      `}</style>
    </>
  );
}

export default Navbar;