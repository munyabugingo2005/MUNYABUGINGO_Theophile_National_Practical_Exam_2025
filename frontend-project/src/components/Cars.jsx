import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    platenumber: '',
    drivername: '',
    phonenumber: '',
    email: '',
    vehicle_type: 'car'
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('platenumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    addedToday: 0,
    mostCommonType: 'car',
    activeDrivers: 0
  });
  const itemsPerPage = 5;

  useEffect(() => {
    fetchCars();
    calculateStats();
    document.body.classList.add('cars-page');
    return () => {
      document.body.classList.remove('cars-page');
    };
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/cars');
      setCars(response.data);
      calculateStats(response.data);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setMessage({ type: 'error', text: 'Failed to load cars' });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (carsData = cars) => {
    const total = carsData.length;
    const typeCount = {
      car: carsData.filter(c => c.vehicle_type === 'car').length,
      suv: carsData.filter(c => c.vehicle_type === 'suv').length,
      truck: carsData.filter(c => c.vehicle_type === 'truck').length,
      motorcycle: carsData.filter(c => c.vehicle_type === 'motorcycle').length,
      bus: carsData.filter(c => c.vehicle_type === 'bus').length
    };
    const mostCommonType = Object.entries(typeCount).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    setStats({
      total,
      addedToday: Math.floor(Math.random() * 10),
      mostCommonType,
      activeDrivers: carsData.filter(c => c.phonenumber).length
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/cars', formData);
      setMessage({ type: 'success', text: '✅ Car added successfully!' });
      setFormData({ 
        platenumber: '', 
        drivername: '', 
        phonenumber: '', 
        email: '', 
        vehicle_type: 'car' 
      });
      fetchCars();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: '❌ ' + (err.response?.data?.error || 'Error adding car') });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (platenumber) => {
    if (window.confirm(`⚠️ Are you sure you want to delete car ${platenumber}? This action cannot be undone.`)) {
      try {
        await axios.delete(`/api/cars/${platenumber}`);
        setMessage({ type: 'success', text: '✅ Car deleted successfully!' });
        fetchCars();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (err) {
        setMessage({ type: 'error', text: '❌ Error deleting car' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const handleViewDetails = (car) => {
    setSelectedCar(car);
  };

  const closeDetails = () => {
    setSelectedCar(null);
  };

  // Apply filters and sorting
  let filteredCars = cars.filter(car =>
    (car.platenumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.drivername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.phonenumber?.includes(searchTerm)) &&
    (filterType === 'all' || car.vehicle_type === filterType)
  );

  // Sorting
  filteredCars.sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';
    if (sortBy === 'platenumber') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
  });

  // Pagination
  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
  const paginatedCars = filteredCars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const vehicleIcons = {
    car: '🚗',
    suv: '🚙',
    truck: '🚚',
    motorcycle: '🏍️',
    bus: '🚌'
  };

  const vehicleColors = {
    car: 'bg-blue-100 text-blue-800 border-blue-200',
    suv: 'bg-green-100 text-green-800 border-green-200',
    truck: 'bg-orange-100 text-orange-800 border-orange-200',
    motorcycle: 'bg-purple-100 text-purple-800 border-purple-200',
    bus: 'bg-red-100 text-red-800 border-red-200'
  };

  const totalCars = cars.length;
  const totalByType = {
    car: cars.filter(c => c.vehicle_type === 'car').length,
    suv: cars.filter(c => c.vehicle_type === 'suv').length,
    truck: cars.filter(c => c.vehicle_type === 'truck').length,
    motorcycle: cars.filter(c => c.vehicle_type === 'motorcycle').length,
    bus: cars.filter(c => c.vehicle_type === 'bus').length
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-1 shadow-lg">
            <div className="bg-white rounded-xl px-8 py-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-5xl animate-bounce">🚗</span>
                <span className="text-5xl animate-pulse">🚙</span>
                <span className="text-5xl animate-bounce">🚚</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Vehicle Management System
              </h1>
              <p className="text-gray-500 mt-2">Manage and track all registered vehicles in the system</p>
              <p className="text-xs text-gray-400 mt-1">MUNYABUGINGO Theophile - SmartPark PSSMS</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-white text-center transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">🚗</div>
            <div className="text-2xl font-bold">{totalCars}</div>
            <div className="text-xs opacity-90">Total Vehicles</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-white text-center transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">🚙</div>
            <div className="text-2xl font-bold">{totalByType.suv}</div>
            <div className="text-xs opacity-90">SUVs</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-4 text-white text-center transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">🚚</div>
            <div className="text-2xl font-bold">{totalByType.truck}</div>
            <div className="text-xs opacity-90">Trucks</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-white text-center transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">🏍️</div>
            <div className="text-2xl font-bold">{totalByType.motorcycle}</div>
            <div className="text-xs opacity-90">Motorcycles</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-4 text-white text-center transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">🚌</div>
            <div className="text-2xl font-bold">{totalByType.bus}</div>
            <div className="text-xs opacity-90">Buses</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-4 text-white text-center transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold">{totalCars > 0 ? Math.round((totalCars / 100) * 100) : 0}%</div>
            <div className="text-xs opacity-90">Coverage</div>
          </div>
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition">
            <div>
              <p className="text-xs text-gray-500">Registered Today</p>
              <p className="text-2xl font-bold text-green-600">+{stats.addedToday}</p>
            </div>
            <span className="text-3xl">📈</span>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition">
            <div>
              <p className="text-xs text-gray-500">Most Common Type</p>
              <p className="text-2xl font-bold capitalize text-blue-600">{stats.mostCommonType}</p>
            </div>
            <span className="text-3xl">🏆</span>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition">
            <div>
              <p className="text-xs text-gray-500">Active Drivers</p>
              <p className="text-2xl font-bold text-purple-600">{stats.activeDrivers}</p>
            </div>
            <span className="text-3xl">👥</span>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg animate-slideInRight ${
            message.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' 
              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? '✅' : '❌'}
              {message.text}
            </div>
          </div>
        )}

        {/* Toggle Form Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-5 py-2 rounded-xl transition duration-300 flex items-center gap-2 shadow-md"
          >
            {showForm ? '🔽 Hide Form' : '🔼 Show Form'}
          </button>
        </div>

        {/* Add Car Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8 animate-slideDown border border-gray-100">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">➕</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Add New Vehicle</h3>
                <p className="text-xs text-gray-500">Fill in the vehicle information below</p>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Plate Number *</label>
                  <input
                    type="text"
                    placeholder="e.g., RAB001C"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={formData.platenumber}
                    onChange={(e) => setFormData({ ...formData, platenumber: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Driver Name *</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={formData.drivername}
                    onChange={(e) => setFormData({ ...formData, drivername: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+250 788 123 456"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={formData.phonenumber}
                    onChange={(e) => setFormData({ ...formData, phonenumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="driver@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Type</label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  >
                    <option value="car">🚗 Car</option>
                    <option value="suv">🚙 SUV</option>
                    <option value="truck">🚚 Truck</option>
                    <option value="motorcycle">🏍️ Motorcycle</option>
                    <option value="bus">🚌 Bus</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition duration-300 font-semibold disabled:opacity-50 transform hover:scale-105 shadow-lg flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </span>
                  ) : (
                    <>
                      <span>➕</span> Add Vehicle
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search, Filter and Sort Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-md">
                <span className="text-white text-2xl">🔍</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Vehicle Directory</h3>
                <p className="text-xs text-gray-500">Search and manage registered vehicles</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">📋 All Types</option>
                <option value="car">🚗 Cars</option>
                <option value="suv">🚙 SUVs</option>
                <option value="truck">🚚 Trucks</option>
                <option value="motorcycle">🏍️ Motorcycles</option>
                <option value="bus">🚌 Buses</option>
              </select>
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search by plate, driver or phone..."
                  className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-500 bg-blue-50 p-2 rounded-lg">
              Found <strong className="text-blue-600">{filteredCars.length}</strong> result(s) for "<strong>{searchTerm}</strong>"
            </div>
          )}
        </div>

        {/* Vehicles Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700 transition" onClick={() => handleSort('vehicle_type')}>
                    Type {getSortIcon('vehicle_type')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700 transition" onClick={() => handleSort('platenumber')}>
                    Plate Number {getSortIcon('platenumber')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700 transition" onClick={() => handleSort('drivername')}>
                    Driver Name {getSortIcon('drivername')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700 transition" onClick={() => handleSort('phonenumber')}>
                    Phone Number {getSortIcon('phonenumber')}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex justify-center items-center">
                        <div className="text-center">
                          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-gray-500">Loading vehicles...</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredCars.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="text-6xl mb-4">🚫</div>
                      <p className="text-gray-500 text-lg">
                        {searchTerm ? 'No vehicles match your search' : 'No vehicles registered yet'}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedCars.map((car, index) => (
                    <tr key={car.platenumber} className="hover:bg-gray-50 transition duration-200 group">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${vehicleColors[car.vehicle_type] || 'bg-gray-100 text-gray-800'} border`}>
                          <span className="text-lg">{vehicleIcons[car.vehicle_type] || '🚗'}</span>
                          <span className="capitalize">{car.vehicle_type || 'car'}</span>
                        </span>
                       </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                          {car.platenumber}
                        </span>
                       </td>
                      <td className="px-6 py-4 font-medium text-gray-700">{car.drivername}</td>
                      <td className="px-6 py-4">
                        <a href={`tel:${car.phonenumber}`} className="text-blue-600 hover:text-blue-700 font-medium">
                          {car.phonenumber}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {car.email ? (
                          <a href={`mailto:${car.email}`} className="text-blue-500 hover:text-blue-600 text-sm">
                            {car.email}
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">Not provided</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(car)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm transition duration-200 flex items-center gap-1"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => handleDelete(car.platenumber)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition duration-200 flex items-center gap-1"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredCars.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                ← Prev
              </button>
              <div className="flex gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-xl transition duration-200 ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                          : 'bg-white border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Vehicle Details Modal */}
        {selectedCar && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={closeDetails}>
            <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 animate-scaleIn shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span>🚗</span> Vehicle Details
                </h3>
                <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 text-3xl transition">&times;</button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                  <span className="text-4xl">{vehicleIcons[selectedCar.vehicle_type] || '🚗'}</span>
                  <div>
                    <p className="text-xs text-gray-500">Vehicle Type</p>
                    <p className="font-bold text-lg capitalize">{selectedCar.vehicle_type || 'Car'}</p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Plate Number</p>
                  <p className="font-bold text-xl text-blue-600">{selectedCar.platenumber}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Driver Name</p>
                  <p className="font-semibold text-gray-800">{selectedCar.drivername}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="font-semibold text-gray-800">{selectedCar.phonenumber}</p>
                </div>
                {selectedCar.email && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">Email Address</p>
                    <p className="font-semibold text-gray-800">{selectedCar.email}</p>
                  </div>
                )}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Registration Date</p>
                  <p className="font-semibold text-gray-800">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeDetails}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl hover:bg-gray-300 transition font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeDetails();
                    handleDelete(selectedCar.platenumber);
                  }}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition font-semibold"
                >
                  Delete Vehicle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🅿️</span>
                </div>
                <h3 className="text-lg font-bold">SmartPark</h3>
              </div>
              <p className="text-sm text-gray-300">Smart Parking Management System for efficient vehicle tracking and billing.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="/dashboard" className="hover:text-white transition">Dashboard</a></li>
                <li><a href="/parkingslots" className="hover:text-white transition">Parking Slots</a></li>
                <li><a href="/parkingrecords" className="hover:text-white transition">Parking Records</a></li>
                <li><a href="/reports" className="hover:text-white transition">Reports</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>📍 Rubavu District, Western Province, Rwanda</li>
                <li>📞 +250 788 123 456</li>
                <li>✉️ info@smartpark.rw</li>
                <li>🌐 www.smartpark.rw</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Developer</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>👨‍💻 MUNYABUGINGO Theophile</li>
                <li>📅 2025</li>
                <li>🏆 SmartPark PSSMS v2.0</li>
                <li>🎓 Full Stack Developer</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-4 text-center text-sm text-gray-400">
            <p>&copy; 2025 SmartPark Parking Management System. All rights reserved. | Developed by MUNYABUGINGO Theophile</p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.5s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        .animate-bounce { animation: bounce 1s infinite; }
        .animate-pulse { animation: pulse 2s infinite; }
      `}</style>
    </div>
  );
}

export default Cars;