import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ParkingRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntryForm, setShowEntryForm] = useState(true);
  const [showExitForm, setShowExitForm] = useState(true);
  const [entryForm, setEntryForm] = useState({
    platenumber: '',
    drivername: '',
    phonenumber: '',
    email: '',
    vehicle_type: 'car',
    slotnumber: '',
    entrytime: new Date().toISOString().slice(0, 16)
  });
  const [exitForm, setExitForm] = useState({
    recordid: '',
    exittime: new Date().toISOString().slice(0, 16),
    paymentmethod: 'cash'
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchRecords();
  }, [filterStatus]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const url = filterStatus !== 'all' ? `/api/parkingrecords?status=${filterStatus}` : '/api/parkingrecords';
      const response = await axios.get(url);
      setRecords(response.data || []);
    } catch (err) {
      console.error('Error fetching records:', err);
      setMessage({ type: 'error', text: 'Failed to load records' });
    } finally {
      setLoading(false);
    }
  };

  const handleEntry = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/parkingrecords/entry', entryForm);
      setMessage({ type: 'success', text: '✅ Car entry recorded successfully!' });
      setEntryForm({
        platenumber: '',
        drivername: '',
        phonenumber: '',
        email: '',
        vehicle_type: 'car',
        slotnumber: '',
        entrytime: new Date().toISOString().slice(0, 16)
      });
      fetchRecords();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: '❌ ' + (err.response?.data?.error || 'Error recording entry') });
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.put(`/api/parkingrecords/exit/${exitForm.recordid}`, {
        exittime: exitForm.exittime,
        paymentmethod: exitForm.paymentmethod
      });
      setMessage({ type: 'success', text: `✅ Exit processed! Amount: ${response.data.amountpaid} FRW for ${response.data.duration} hour(s)` });
      setExitForm({ recordid: '', exittime: new Date().toISOString().slice(0, 16), paymentmethod: 'cash' });
      fetchRecords();
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: '❌ ' + (err.response?.data?.error || 'Error processing exit') });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordid) => {
    if (window.confirm('⚠️ Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`/api/parkingrecords/${recordid}`);
        setMessage({ type: 'success', text: '✅ Record deleted successfully!' });
        fetchRecords();
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (err) {
        setMessage({ type: 'error', text: '❌ Error deleting record' });
      }
    }
  };

  const getStatusBadge = (exittime) => {
    if (exittime) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">✓ Completed</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">● Active</span>;
  };

  // Filter and pagination
  const filteredRecords = records.filter(record =>
    record.platenumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.drivername?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate stats
  const totalRecords = records.length;
  const activeRecords = records.filter(r => !r.exittime).length;
  const completedRecords = records.filter(r => r.exittime).length;
  const totalRevenue = records.reduce((sum, r) => sum + (parseFloat(r.amountpaid) || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-1 shadow-lg">
            <div className="bg-white rounded-xl px-8 py-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📝 Parking Records
              </h1>
              <p className="text-gray-500 mt-2">Manage vehicle entry, exit, and payment records</p>
              <p className="text-xs text-gray-400 mt-1">MUNYABUGINGO Theophile - SmartPark PSSMS</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-xl transition transform hover:scale-105">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
            <div className="text-xs text-gray-500">Total Records</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-xl transition transform hover:scale-105">
            <div className="text-3xl mb-2">🟡</div>
            <div className="text-2xl font-bold text-yellow-600">{activeRecords}</div>
            <div className="text-xs text-gray-500">Active Parkings</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-xl transition transform hover:scale-105">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-600">{completedRecords}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4 text-center hover:shadow-xl transition transform hover:scale-105">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold text-purple-600">{totalRevenue.toLocaleString()} FRW</div>
            <div className="text-xs text-gray-500">Total Revenue</div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? '✅' : '❌'}
              {message.text}
            </div>
          </div>
        )}

        {/* Toggle Forms */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => setShowEntryForm(!showEntryForm)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center gap-2"
          >
            {showEntryForm ? '🔽' : '🔼'} Entry Form
          </button>
          <button
            onClick={() => setShowExitForm(!showExitForm)}
            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition flex items-center gap-2"
          >
            {showExitForm ? '🔽' : '🔼'} Exit Form
          </button>
        </div>

        {/* Entry Form */}
        {showEntryForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🚗</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Car Entry Registration</h3>
            </div>
            <form onSubmit={handleEntry}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Plate Number *</label>
                  <input type="text" placeholder="e.g., RAB001C" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" value={entryForm.platenumber} onChange={(e) => setEntryForm({...entryForm, platenumber: e.target.value.toUpperCase()})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Driver Name *</label>
                  <input type="text" placeholder="Full name" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" value={entryForm.drivername} onChange={(e) => setEntryForm({...entryForm, drivername: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
                  <input type="tel" placeholder="+250 788 123 456" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" value={entryForm.phonenumber} onChange={(e) => setEntryForm({...entryForm, phonenumber: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input type="email" placeholder="driver@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" value={entryForm.email} onChange={(e) => setEntryForm({...entryForm, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Type</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" value={entryForm.vehicle_type} onChange={(e) => setEntryForm({...entryForm, vehicle_type: e.target.value})}>
                    <option value="car">🚗 Car</option>
                    <option value="suv">🚙 SUV</option>
                    <option value="truck">🚚 Truck</option>
                    <option value="motorcycle">🏍️ Motorcycle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Slot Number *</label>
                  <input type="text" placeholder="e.g., A1, B2" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" value={entryForm.slotnumber} onChange={(e) => setEntryForm({...entryForm, slotnumber: e.target.value.toUpperCase()})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Entry Time *</label>
                  <input type="datetime-local" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" value={entryForm.entrytime} onChange={(e) => setEntryForm({...entryForm, entrytime: e.target.value})} required />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-teal-600 transition font-semibold disabled:opacity-50" disabled={loading}>
                    {loading ? '⏳ Recording...' : '🚗 Record Entry'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Exit Form */}
        {showExitForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🚪</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Car Exit & Payment Processing</h3>
            </div>
            <form onSubmit={handleExit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Record ID *</label>
                  <input type="number" placeholder="Enter record ID" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" value={exitForm.recordid} onChange={(e) => setExitForm({...exitForm, recordid: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Exit Time *</label>
                  <input type="datetime-local" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" value={exitForm.exittime} onChange={(e) => setExitForm({...exitForm, exittime: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" value={exitForm.paymentmethod} onChange={(e) => setExitForm({...exitForm, paymentmethod: e.target.value})}>
                    <option value="cash">💵 Cash</option>
                    <option value="mobile_money">📱 Mobile Money</option>
                    <option value="card">💳 Card</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition font-semibold disabled:opacity-50" disabled={loading}>
                    {loading ? '⏳ Processing...' : '🚪 Process Exit & Bill'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📋</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Parking Records</h3>
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by plate or driver..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            {['all', 'active', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? '📋 All' : status === 'active' ? '🟡 Active' : '✅ Completed'}
              </button>
            ))}
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading records...</p>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg">No parking records found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                      <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Plate</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Driver</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Slot</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Entry Time</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Exit Time</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Duration</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedRecords.map((record) => (
                      <tr key={record.recordid} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-bold text-gray-800">#{record.recordid}</td>
                        <td className="px-6 py-4 font-semibold text-blue-600">{record.platenumber}</td>
                        <td className="px-6 py-4">{record.drivername}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm">{record.slotnumber}</span>
                        </td>
                        <td className="px-6 py-4 text-sm">{new Date(record.entrytime).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm">{record.exittime ? new Date(record.exittime).toLocaleString() : '-'}</td>
                        <td className="px-6 py-4">{record.duration ? `${record.duration} hrs` : '-'}</td>
                        <td className="px-6 py-4 font-bold text-green-600">{record.amountpaid ? `${record.amountpaid.toLocaleString()} FRW` : '-'}</td>
                        <td className="px-6 py-4">{getStatusBadge(record.exittime)}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleDelete(record.recordid)} className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition">
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 py-6 border-t border-gray-200">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition">
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
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
                <li><a href="/parkingslots" className="hover:text-white transition">Parking Slots</a></li>
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
    </div>
  );
}

export default ParkingRecords;