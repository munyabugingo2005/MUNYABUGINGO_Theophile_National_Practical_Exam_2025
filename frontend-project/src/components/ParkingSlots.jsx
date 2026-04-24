import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ParkingSlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    slotnumber: '',
    slotstatus: 'available',
    slottype: 'standard',
    hourlyrate: 500
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/parkingslots');
      setSlots(response.data);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setMessage({ type: 'error', text: 'Failed to load parking slots' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/parkingslots', formData);
      setMessage({ type: 'success', text: '✅ Parking slot added successfully!' });
      setFormData({ slotnumber: '', slotstatus: 'available', slottype: 'standard', hourlyrate: 500 });
      fetchSlots();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: '❌ ' + (err.response?.data?.error || 'Error adding slot') });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const toggleSlotStatus = async (slotnumber, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'occupied' : 'available';
    try {
      await axios.put(`/api/parkingslots/${slotnumber}`, { slotstatus: newStatus });
      fetchSlots();
      setMessage({ type: 'success', text: `✅ Slot ${slotnumber} marked as ${newStatus}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: '❌ Error updating slot status' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }
  };

  const handleDelete = async (slotnumber) => {
    if (window.confirm(`⚠️ Are you sure you want to delete slot ${slotnumber}?`)) {
      try {
        await axios.delete(`/api/parkingslots/${slotnumber}`);
        setMessage({ type: 'success', text: `✅ Slot ${slotnumber} deleted successfully!` });
        fetchSlots();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (err) {
        setMessage({ type: 'error', text: '❌ Error deleting slot' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const viewSlotDetails = (slot) => {
    setSelectedSlot(slot);
  };

  const closeDetails = () => {
    setSelectedSlot(null);
  };

  const getSlotColor = (status, type) => {
    if (status === 'available') {
      if (type === 'vip') return 'from-green-400 to-emerald-500 border-green-600';
      if (type === 'disabled') return 'from-green-300 to-teal-400 border-green-500';
      return 'from-green-400 to-green-600 border-green-600';
    }
    if (status === 'occupied') {
      if (type === 'vip') return 'from-red-400 to-rose-500 border-red-600';
      if (type === 'disabled') return 'from-red-300 to-pink-400 border-red-500';
      return 'from-red-400 to-red-600 border-red-600';
    }
    return 'from-gray-400 to-gray-600 border-gray-600';
  };

  const getSlotIcon = (type) => {
    if (type === 'vip') return '👑';
    if (type === 'disabled') return '♿';
    return '🅿️';
  };

  const getSlotTypeBadge = (type) => {
    if (type === 'vip') return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
    if (type === 'disabled') return 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white';
    return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  // Filter slots
  const filteredSlots = slots.filter(slot => {
    const matchesType = filterType === 'all' || slot.slottype === filterType;
    const matchesStatus = filterStatus === 'all' || slot.slotstatus === filterStatus;
    const matchesSearch = slot.slotnumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSlots.length / itemsPerPage);
  const paginatedSlots = filteredSlots.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const totalSlots = slots.length;
  const availableSlots = slots.filter(s => s.slotstatus === 'available').length;
  const occupiedSlots = slots.filter(s => s.slotstatus === 'occupied').length;
  const vipSlots = slots.filter(s => s.slottype === 'vip').length;
  const disabledSlots = slots.filter(s => s.slottype === 'disabled').length;
  const standardSlots = slots.filter(s => s.slottype === 'standard').length;
  const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-1 shadow-lg">
            <div className="bg-white rounded-xl px-8 py-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🅿️ Parking Slots Management
              </h1>
              <p className="text-gray-500 mt-2">Manage and monitor all parking spaces</p>
              <p className="text-xs text-gray-400 mt-1">MUNYABUGINGO Theophile - SmartPark PSSMS</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 text-center text-white transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold">{totalSlots}</div>
            <div className="text-xs opacity-90">Total Slots</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-4 text-center text-white transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold">{availableSlots}</div>
            <div className="text-xs opacity-90">Available</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-4 text-center text-white transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">⛔</div>
            <div className="text-2xl font-bold">{occupiedSlots}</div>
            <div className="text-xs opacity-90">Occupied</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg p-4 text-center text-white transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">👑</div>
            <div className="text-2xl font-bold">{vipSlots}</div>
            <div className="text-xs opacity-90">VIP Slots</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl shadow-lg p-4 text-center text-white transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">♿</div>
            <div className="text-2xl font-bold">{disabledSlots}</div>
            <div className="text-xs opacity-90">Disabled</div>
          </div>
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg p-4 text-center text-white transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">🚗</div>
            <div className="text-2xl font-bold">{standardSlots}</div>
            <div className="text-xs opacity-90">Standard</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 text-center text-white transform hover:scale-105 transition duration-300">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <div className="text-xs opacity-90">Occupancy</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Occupancy Rate</span>
            <span className="text-sm font-semibold text-gray-700">{occupancyRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-500 ${
                occupancyRate < 50 ? 'bg-green-500' : occupancyRate < 80 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${occupancyRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Floating Message */}
        {message.text && (
          <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg animate-slideInRight ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
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
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
          >
            {showForm ? '🔽 Hide Add Form' : '🔼 Show Add Form'}
          </button>
        </div>

        {/* Add Slot Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 animate-slideDown">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">➕</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Add New Parking Slot</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Slot Number *</label>
                  <input
                    type="text"
                    placeholder="e.g., A1, B2, C3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={formData.slotnumber}
                    onChange={(e) => setFormData({ ...formData, slotnumber: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Slot Type</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={formData.slottype}
                    onChange={(e) => {
                      const rate = e.target.value === 'vip' ? 1000 : (e.target.value === 'disabled' ? 300 : 500);
                      setFormData({ ...formData, slottype: e.target.value, hourlyrate: rate });
                    }}
                  >
                    <option value="standard">🚗 Standard (500 FRW/hr)</option>
                    <option value="vip">👑 VIP (1000 FRW/hr)</option>
                    <option value="disabled">♿ Disabled (300 FRW/hr)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Initial Status</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    value={formData.slotstatus}
                    onChange={(e) => setFormData({ ...formData, slotstatus: e.target.value })}
                  >
                    <option value="available">✅ Available</option>
                    <option value="occupied">⛔ Occupied</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold">
                    ➕ Add Slot
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Filter by Type</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">📋 All Types</option>
                <option value="standard">🚗 Standard</option>
                <option value="vip">👑 VIP</option>
                <option value="disabled">♿ Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Filter by Status</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">📋 All Status</option>
                <option value="available">✅ Available</option>
                <option value="occupied">⛔ Occupied</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Search Slot</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by slot number..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Showing {filteredSlots.length} of {slots.length} slots
          </div>
        </div>

        {/* Slots Grid */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🗺️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Parking Slots Map</h3>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading parking slots...</p>
              </div>
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🅿️</div>
              <p className="text-gray-500 text-lg">No parking slots found</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {paginatedSlots.map((slot, index) => (
                  <div
                    key={slot.slotnumber}
                    className={`relative bg-gradient-to-br ${getSlotColor(slot.slotstatus, slot.slottype)} rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeIn`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => toggleSlotStatus(slot.slotnumber, slot.slotstatus)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      viewSlotDetails(slot);
                    }}
                  >
                    <div className="p-4 text-white text-center">
                      <div className="text-3xl mb-2">{getSlotIcon(slot.slottype)}</div>
                      <div className="text-xl font-bold mb-1">{slot.slotnumber}</div>
                      <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${getSlotTypeBadge(slot.slottype)}`}>
                        {slot.slottype?.toUpperCase() || 'STANDARD'}
                      </div>
                      <div className="text-lg font-bold">
                        {slot.hourlyrate || 500} FRW
                      </div>
                      <div className="text-xs opacity-90">per hour</div>
                      <div className={`mt-2 text-xs font-bold ${slot.slotstatus === 'available' ? 'text-green-200' : 'text-red-200'}`}>
                        {slot.slotstatus === 'available' ? '✓ AVAILABLE' : '✗ OCCUPIED'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(slot.slotnumber);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
                      style={{ opacity: 0.7 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Slot Details Modal */}
        {selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn" onClick={closeDetails}>
            <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Slot Details</h3>
                <button onClick={closeDetails} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <div className="space-y-3">
                <div className={`p-4 rounded-xl bg-gradient-to-r ${getSlotColor(selectedSlot.slotstatus, selectedSlot.slottype)} text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Slot Number</p>
                      <p className="text-2xl font-bold">{selectedSlot.slotnumber}</p>
                    </div>
                    <div className="text-4xl">{getSlotIcon(selectedSlot.slottype)}</div>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Slot Type</p>
                  <p className="font-semibold capitalize">{selectedSlot.slottype || 'Standard'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`font-semibold ${selectedSlot.slotstatus === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedSlot.slotstatus === 'available' ? '✅ Available' : '⛔ Occupied'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Hourly Rate</p>
                  <p className="font-semibold text-lg text-blue-600">{selectedSlot.hourlyrate || 500} FRW</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    toggleSlotStatus(selectedSlot.slotnumber, selectedSlot.slotstatus);
                    closeDetails();
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Toggle Status
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedSlot.slotnumber);
                    closeDetails();
                  }}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Delete Slot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">📖 Legend & Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg"></div>
              <div>
                <p className="font-semibold text-sm">Available Slot</p>
                <p className="text-xs text-gray-500">Click to occupy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-lg"></div>
              <div>
                <p className="font-semibold text-sm">Occupied Slot</p>
                <p className="text-xs text-gray-500">Click to free</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center text-white">👑</div>
              <div>
                <p className="font-semibold text-sm">VIP Slot</p>
                <p className="text-xs text-gray-500">1,000 FRW/hour</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center text-white">♿</div>
              <div>
                <p className="font-semibold text-sm">Disabled Slot</p>
                <p className="text-xs text-gray-500">300 FRW/hour</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              💡 <span className="font-semibold">Tips:</span> Click on any slot to toggle between Available and Occupied. 
              Right-click (or long press) on a slot to view details and manage.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🅿️</span>
                <h3 className="text-lg font-bold">SmartPark</h3>
              </div>
              <p className="text-sm text-gray-300">Smart Parking Management System</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="/dashboard" className="hover:text-white transition">Dashboard</a></li>
                <li><a href="/cars" className="hover:text-white transition">Cars</a></li>
                <li><a href="/parkingrecords" className="hover:text-white transition">Parking Records</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>📍 Rubavu District, Rwanda</li>
                <li>📞 +250 788 123 456</li>
                <li>✉️ info@smartpark.rw</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Developer</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>👨‍💻 MUNYABUGINGO Theophile</li>
                <li>📅 2025</li>
                <li>🏆 SmartPark PSSMS v2.0</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-4 text-center text-sm text-gray-400">
            <p>&copy; 2025 SmartPark Parking Management System. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* CSS Animations */}
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
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}

export default ParkingSlots;