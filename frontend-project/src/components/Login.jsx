import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  // State Management
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullname: '',
    phone: '',
    otpCode: '',
    newPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendTimer]);

  // Auto-rotate steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // LOGIN HANDLER
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post('/api/login', { 
        username: formData.username, 
        password: formData.password,
        rememberMe 
      });
      if (response.data.success) {
        setSuccess('✅ Login successful! Redirecting...');
        setTimeout(() => {
          onLogin(response.data.user);
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error || '❌ Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  // REGISTER HANDLER
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (!agreedToTerms) {
      setError('❌ Please agree to the Terms and Conditions');
      setLoading(false);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('❌ Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('❌ Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    if (!formData.email.includes('@')) {
      setError('❌ Please enter a valid email address');
      setLoading(false);
      return;
    }
    
    if (!formData.username) {
      setError('❌ Username is required');
      setLoading(false);
      return;
    }
    
    if (!formData.fullname) {
      setError('❌ Full name is required');
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('/api/register', {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        fullname: formData.fullname,
        phone: formData.phone
      });
      
      if (response.data.success) {
        setSuccess('✅ Account created successfully! Please login.');
        setTimeout(() => {
          setMode('login');
          setFormData({ 
            ...formData, 
            username: '',
            password: '',
            confirmPassword: '',
            email: '',
            fullname: '',
            phone: ''
          });
          setAgreedToTerms(false);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || '❌ Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // FORGOT PASSWORD
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (!formData.email) {
      setError('❌ Please enter your email address');
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('/api/forgot-password', { email: formData.email });
      if (response.data.success) {
        setSuccess('✅ Reset code sent to your email!');
        setResendTimer(60);
        setMode('reset');
      }
    } catch (err) {
      setError(err.response?.data?.error || '❌ Email not found');
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('❌ Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setError('❌ Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    if (!formData.otpCode || formData.otpCode.length !== 6) {
      setError('❌ Please enter a valid 6-digit OTP code');
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('/api/reset-password', {
        email: formData.email,
        otp: formData.otpCode,
        newPassword: formData.newPassword
      });
      
      if (response.data.success) {
        setSuccess('✅ Password reset successfully! Please login.');
        setTimeout(() => {
          setMode('login');
          setFormData({ ...formData, email: '', otpCode: '', newPassword: '', confirmPassword: '' });
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || '❌ Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // SOCIAL LOGIN
  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post('/api/auth/social', { provider });
      if (response.data.success) {
        setSuccess(`✅ Logged in with ${provider}!`);
        setTimeout(() => {
          onLogin(response.data.user);
        }, 1000);
      }
    } catch (err) {
      setError(`❌ Failed to login with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  // WHATSAPP LOGIN
  const handleSendWhatsAppOTP = async () => {
    const phoneNumber = prompt('📱 Enter your WhatsApp phone number (with country code):', '+2507XXXXXXXX');
    if (phoneNumber && phoneNumber.length > 8) {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const response = await axios.post('/api/send-whatsapp-otp', { phone: phoneNumber });
        if (response.data.success) {
          setWhatsappPhone(phoneNumber);
          setSuccess('✅ OTP sent to your WhatsApp!');
          setMode('whatsapp-otp');
        }
      } catch (err) {
        setError('❌ Failed to send WhatsApp OTP');
      } finally {
        setLoading(false);
      }
    } else {
      setError('❌ Please enter a valid phone number');
    }
  };

  const handleVerifyWhatsAppOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (!formData.otpCode || formData.otpCode.length !== 6) {
      setError('❌ Please enter a valid 6-digit OTP code');
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('/api/verify-whatsapp-otp', {
        phone: whatsappPhone,
        otp: formData.otpCode
      });
      
      if (response.data.success) {
        setSuccess('✅ WhatsApp login successful!');
        setTimeout(() => {
          onLogin(response.data.user);
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error || '❌ Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      fullname: '',
      phone: '',
      otpCode: '',
      newPassword: ''
    });
  };

  const parkingSteps = [
    { icon: '🚗', title: 'Vehicle Entry', desc: 'Driver enters parking area with vehicle' },
    { icon: '🅿️', title: 'Slot Assignment', desc: 'System assigns available parking slot' },
    { icon: '⏱️', title: 'Parking Duration', desc: 'Time tracking starts automatically' },
    { icon: '💰', title: 'Payment & Exit', desc: 'Calculate fee and process payment' }
  ];

  const systemFeatures = [
    { icon: '🅿️', title: 'Smart Parking', desc: 'Efficient parking space management' },
    { icon: '🚗', title: 'Auto Billing', desc: 'Automatic fee calculation' },
    { icon: '📊', title: 'Real-time Reports', desc: 'Analytics and insights' },
    { icon: '🔒', title: 'Secure System', desc: 'Your data is protected' },
    { icon: '📱', title: 'Mobile Ready', desc: 'Access from any device' },
    { icon: '⚡', title: 'Fast Processing', desc: 'Quick entry and exit' }
  ];

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL - System Description */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex-col justify-between p-8 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">🅿️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">SmartPark</h1>
              <p className="text-xs text-blue-200">Parking Management System</p>
            </div>
          </div>
          
          {/* Main Description */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-4">Smart Parking<br/>Management System</h2>
            <p className="text-blue-200 text-lg leading-relaxed">
              SmartPark is a comprehensive parking space sales management system designed 
              to streamline vehicle entry, automated billing, real-time slot tracking, 
              and generate detailed reports for efficient parking management.
            </p>
          </div>
          
          {/* Parking Process Steps */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📋</span> Parking Process
            </h3>
            <div className="space-y-4">
              {parkingSteps.map((step, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500 ${
                    activeStep === idx ? 'bg-white/20 backdrop-blur-sm scale-105' : 'opacity-70'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    activeStep === idx ? 'bg-white/30' : 'bg-white/10'
                  }`}>
                    {step.icon}
                  </div>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-blue-200">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* System Features Grid */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>⭐</span> Key Features
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {systemFeatures.slice(0, 4).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-white/10 rounded-lg">
                  <span className="text-xl">{feature.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="text-xs text-blue-200">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/20">
          <p className="text-sm text-blue-200">
            <strong>📍 Location:</strong> Rubavu District, Western Province, Rwanda
          </p>
          <p className="text-sm text-blue-200 mt-1">
            <strong>👨‍💻 Developer:</strong> MUNYABUGINGO Theophile
          </p>
          <p className="text-xs text-blue-300 mt-2">
            © 2025 SmartPark PSSMS - All Rights Reserved
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - Login/Register Form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-500 animate-fadeIn">
          
          {/* Decorative Top Bar */}
          <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          {/* Logo and Header */}
          <div className="text-center pt-8 px-8 pb-4">
            <div className="relative inline-block lg:hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl transform hover:scale-110 transition duration-300">
                <span className="text-3xl">🅿️</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {mode === 'login' && 'Welcome Back!'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'reset' && 'Create New Password'}
              {mode === 'whatsapp-otp' && 'WhatsApp Verification'}
            </h2>
            <p className="text-gray-500 text-sm">
              {mode === 'login' && 'Login to access your SmartPark dashboard'}
              {mode === 'register' && 'Join SmartPark for efficient parking management'}
              {mode === 'forgot' && "Enter your email to reset your password"}
              {mode === 'reset' && 'Create a new secure password'}
              {mode === 'whatsapp-otp' && 'Enter the 6-digit code sent to your WhatsApp'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-8 mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg animate-shake">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {success && (
            <div className="mx-8 mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded-lg animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="px-8 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Username or Email</label>
                <div className="relative group">
                  <span className="absolute left-3 top-3 text-gray-400 group-hover:text-blue-500 transition">👤</span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300"
                    required
                    placeholder="Enter your username or email"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Password</label>
                <div className="relative group">
                  <span className="absolute left-3 top-3 text-gray-400 group-hover:text-blue-500 transition">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300"
                    required
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                >
                  Forgot Password?
                </button>
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold disabled:opacity-50 transform hover:scale-[1.02] shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : 'Login'}
              </button>
            </form>
          )}

          {/* REGISTRATION FORM - Enhanced */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="px-8 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-sm">Full Name *</label>
                  <input
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-sm">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                    placeholder="Choose a username"
                  />
                  <p className="text-xs text-gray-400 mt-1">Unique username for login</p>
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                  placeholder="your@email.com"
                />
                <p className="text-xs text-gray-400 mt-1">We'll send verification and notifications to this email</p>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="+250 788 123 456"
                />
                <p className="text-xs text-gray-400 mt-1">Optional - For WhatsApp notifications</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-sm">Password *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                    placeholder="Minimum 6 characters"
                  />
                  <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-sm">Confirm Password *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
              
              {/* Terms and Conditions */}
              <div className="flex items-start gap-2 mt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  required
                />
                <label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the <button type="button" className="text-blue-600 hover:underline">Terms of Service</button> and 
                  <button type="button" className="text-blue-600 hover:underline ml-1">Privacy Policy</button>
                </label>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-2">
                By registering, you agree to receive important account notifications
              </p>
              
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-xl hover:from-green-600 hover:to-teal-600 transition font-semibold disabled:opacity-50 shadow-lg">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="px-8 space-y-4">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-4xl">🔐</span>
                </div>
                <p className="text-gray-600 text-sm">Enter your email address and we'll send you a password reset code</p>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                  placeholder="your@email.com"
                />
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition font-semibold shadow-lg">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="px-8 space-y-4">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-4xl">🔑</span>
                </div>
                <p className="text-gray-600 text-sm">Enter the OTP code sent to your email</p>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">OTP Code</label>
                <input
                  type="text"
                  name="otpCode"
                  value={formData.otpCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                  placeholder="000000"
                  maxLength="6"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                  placeholder="Minimum 6 characters"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                  placeholder="Confirm your new password"
                />
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transition font-semibold shadow-lg">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* WHATSAPP OTP FORM */}
          {mode === 'whatsapp-otp' && (
            <form onSubmit={handleVerifyWhatsAppOTP} className="px-8 space-y-4">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-4xl">💬</span>
                </div>
                <p className="text-gray-600 text-sm">We sent a verification code to your WhatsApp number:</p>
                <p className="font-semibold text-gray-800 text-lg mt-1">{whatsappPhone}</p>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Enter OTP Code</label>
                <input
                  type="text"
                  name="otpCode"
                  value={formData.otpCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  required
                  placeholder="000000"
                  maxLength="6"
                />
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-xl hover:from-green-600 hover:to-teal-600 transition font-semibold shadow-lg">
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>
          )}

          {/* SOCIAL LOGIN BUTTONS */}
          {mode === 'login' && (
            <div className="px-8">
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-3 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all duration-300 group"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-xs text-gray-600 group-hover:text-red-600">Google</span>
                </button>
                
                <button
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group"
                >
                  <svg className="w-6 h-6" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
                  </svg>
                  <span className="text-xs text-gray-600 group-hover:text-blue-600">Facebook</span>
                </button>
                
                <button
                  onClick={handleSendWhatsAppOTP}
                  disabled={loading}
                  className="flex flex-col items-center justify-center gap-1 px-3 py-3 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-300 group"
                >
                  <svg className="w-6 h-6" fill="#25D366" viewBox="0 0 24 24">
                    <path d="M12.031 2C6.493 2 2 6.493 2 12.031c0 2.031.63 3.916 1.714 5.488L2.028 22l4.646-1.444c1.48.876 3.182 1.357 4.938 1.357 5.538 0 10.031-4.493 10.031-10.031S17.569 2 12.031 2z" />
                    <path d="M16.464 14.5c-.249-.124-1.468-.723-1.696-.805-.228-.083-.394-.124-.56.124-.166.249-.644.805-.79.97-.146.166-.291.187-.54.062s-1.06-.39-2.019-1.245c-.746-.667-1.25-1.49-1.397-1.742-.146-.249-.016-.383.11-.508.112-.112.249-.291.374-.436.125-.146.166-.249.249-.415.083-.166.042-.312-.021-.436-.062-.124-.56-1.347-.768-1.845-.2-.48-.404-.415-.56-.423-.146-.008-.312-.008-.478-.008s-.436.062-.664.312c-.228.249-.874.854-.874 2.083s.894 2.414 1.018 2.581c.125.166 1.756 2.678 4.25 3.756.594.256 1.058.41 1.42.525.597.19 1.14.163 1.57.099.48-.072 1.468-.6 1.676-1.18.208-.58.208-1.077.146-1.18-.062-.104-.228-.166-.478-.29z" />
                  </svg>
                  <span className="text-xs text-gray-600 group-hover:text-green-600">WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* Mobile Features (visible only on mobile) */}
          <div className="lg:hidden px-8 pb-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-2">
                {systemFeatures.slice(0, 4).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2">
                    <span className="text-lg">{feature.icon}</span>
                    <div>
                      <p className="text-xs font-semibold">{feature.title}</p>
                      <p className="text-xs text-gray-500">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle Links */}
          <div className="text-center pb-6">
            {mode === 'login' && (
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button onClick={() => switchMode('register')} className="text-blue-600 hover:text-blue-700 font-semibold transition">
                  Register here
                </button>
              </p>
            )}
            
            {mode === 'register' && (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-blue-600 hover:text-blue-700 font-semibold transition">
                  Login here
                </button>
              </p>
            )}
            
            {(mode === 'forgot' || mode === 'reset' || mode === 'whatsapp-otp') && (
              <button onClick={() => switchMode('login')} className="text-blue-600 hover:text-blue-700 font-semibold transition">
                ← Back to Login
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center">
            <p className="text-xs text-gray-500">
              SmartPark PSSMS v2.0 | Developed by MUNYABUGINGO Theophile
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Rubavu District, Western Province, Rwanda
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}

export default Login;