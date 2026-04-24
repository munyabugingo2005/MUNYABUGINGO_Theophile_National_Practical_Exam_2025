import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [filterMethod, setFilterMethod] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    averageAmount: 0,
    cashTotal: 0,
    mobileTotal: 0,
    cardTotal: 0,
    dailyAverage: 0
  });
  const itemsPerPage = 10;

  // New payment form
  const [newPayment, setNewPayment] = useState({
    platenumber: '',
    amountpaid: '',
    paymentmethod: 'cash',
    transaction_id: '',
    paymentdate: new Date().toISOString().slice(0, 16),
    slotnumber: '',
    duration: ''
  });

  useEffect(() => {
    fetchPayments();
  }, [filterMethod, dateRange]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      let url = '/api/payments';
      const params = [];
      if (filterMethod !== 'all') params.push(`method=${filterMethod}`);
      if (dateRange.start) params.push(`startDate=${dateRange.start}`);
      if (dateRange.end) params.push(`endDate=${dateRange.end}`);
      if (params.length) url += `?${params.join('&')}`;
      
      const response = await axios.get(url);
      const paymentsData = response.data.payments || response.data;
      setPayments(paymentsData);
      
      // Calculate statistics
      const total = paymentsData.reduce((sum, p) => sum + parseFloat(p.amountpaid), 0);
      setTotalRevenue(total);
      
      const cashTotal = paymentsData.filter(p => p.paymentmethod === 'cash').reduce((sum, p) => sum + parseFloat(p.amountpaid), 0);
      const mobileTotal = paymentsData.filter(p => p.paymentmethod === 'mobile_money').reduce((sum, p) => sum + parseFloat(p.amountpaid), 0);
      const cardTotal = paymentsData.filter(p => p.paymentmethod === 'card').reduce((sum, p) => sum + parseFloat(p.amountpaid), 0);
      
      setStats({
        totalTransactions: paymentsData.length,
        averageAmount: paymentsData.length > 0 ? total / paymentsData.length : 0,
        cashTotal,
        mobileTotal,
        cardTotal,
        dailyAverage: paymentsData.length > 0 ? total / 30 : 0
      });
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/payments', newPayment);
      setNewPayment({
        platenumber: '',
        amountpaid: '',
        paymentmethod: 'cash',
        transaction_id: '',
        paymentdate: new Date().toISOString().slice(0, 16),
        slotnumber: '',
        duration: ''
      });
      setShowAddPayment(false);
      fetchPayments();
      alert('✅ Payment added successfully!');
    } catch (err) {
      alert('❌ Error adding payment: ' + (err.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const viewPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const getPaymentMethodIcon = (method) => {
    if (method === 'cash') return '💵';
    if (method === 'mobile_money') return '📱';
    if (method === 'card') return '💳';
    return '💰';
  };

  const getPaymentMethodColor = (method) => {
    if (method === 'cash') return 'bg-green-100 text-green-800 border-green-300';
    if (method === 'mobile_money') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (method === 'card') return 'bg-purple-100 text-purple-800 border-purple-300';
    return 'bg-gray-100 text-gray-800';
  };

  // Filter payments by search
  const filteredPayments = payments.filter(payment =>
    payment.platenumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.slotnumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-1 shadow-lg">
            <div className="bg-white rounded-xl px-8 py-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                💰 Payment Records
              </h1>
              <p className="text-gray-500 mt-2">Track and manage all payment transactions</p>
              <p className="text-xs text-gray-400 mt-1">MUNYABUGINGO Theophile - SmartPark PSSMS</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">{totalRevenue.toLocaleString()} FRW</p>
                <p className="text-xs opacity-75 mt-1">All time earnings</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Transactions</p>
                <p className="text-3xl font-bold mt-2">{stats.totalTransactions}</p>
                <p className="text-xs opacity-75 mt-1">Total payments</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Average Payment</p>
                <p className="text-3xl font-bold mt-2">{Math.round(stats.averageAmount).toLocaleString()} FRW</p>
                <p className="text-xs opacity-75 mt-1">Per transaction</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Daily Average</p>
                <p className="text-3xl font-bold mt-2">{Math.round(stats.dailyAverage).toLocaleString()} FRW</p>
                <p className="text-xs opacity-75 mt-1">Last 30 days</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xl">💵</span>
              </div>
              <h3 className="font-bold text-gray-800">Cash Payments</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.cashTotal.toLocaleString()} FRW</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats.totalTransactions > 0 ? Math.round((stats.cashTotal / totalRevenue) * 100) : 0}% of total
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.cashTotal / totalRevenue) * 100 || 0}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">📱</span>
              </div>
              <h3 className="font-bold text-gray-800">Mobile Money</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.mobileTotal.toLocaleString()} FRW</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats.totalTransactions > 0 ? Math.round((stats.mobileTotal / totalRevenue) * 100) : 0}% of total
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats.mobileTotal / totalRevenue) * 100 || 0}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xl">💳</span>
              </div>
              <h3 className="font-bold text-gray-800">Card Payments</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.cardTotal.toLocaleString()} FRW</p>
            <p className="text-sm text-gray-500 mt-2">
              {stats.totalTransactions > 0 ? Math.round((stats.cardTotal / totalRevenue) * 100) : 0}% of total
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(stats.cardTotal / totalRevenue) * 100 || 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Add Payment Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddPayment(!showAddPayment)}
            className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition flex items-center gap-2 shadow-lg"
          >
            {showAddPayment ? '🔽 Cancel' : '➕ Add Payment Record'}
          </button>
        </div>

        {/* Add Payment Form */}
        {showAddPayment && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 animate-slideDown">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">New Payment Record</h3>
            </div>
            <form onSubmit={handleAddPayment}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Plate Number *</label>
                  <input
                    type="text"
                    placeholder="e.g., RAB001C"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={newPayment.platenumber}
                    onChange={(e) => setNewPayment({...newPayment, platenumber: e.target.value.toUpperCase()})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Slot Number</label>
                  <input
                    type="text"
                    placeholder="e.g., A1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={newPayment.slotnumber}
                    onChange={(e) => setNewPayment({...newPayment, slotnumber: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    placeholder="e.g., 2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={newPayment.duration}
                    onChange={(e) => setNewPayment({...newPayment, duration: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Amount *</label>
                  <input
                    type="number"
                    placeholder="Amount in FRW"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={newPayment.amountpaid}
                    onChange={(e) => setNewPayment({...newPayment, amountpaid: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={newPayment.paymentmethod}
                    onChange={(e) => setNewPayment({...newPayment, paymentmethod: e.target.value})}
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="mobile_money">📱 Mobile Money</option>
                    <option value="card">💳 Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Transaction ID</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={newPayment.transaction_id}
                    onChange={(e) => setNewPayment({...newPayment, transaction_id: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Date *</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={newPayment.paymentdate}
                    onChange={(e) => setNewPayment({...newPayment, paymentdate: e.target.value})}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-teal-600 transition font-semibold">
                    💾 Save Payment
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
                <option value="all">📋 All Methods</option>
                <option value="cash">💵 Cash</option>
                <option value="mobile_money">📱 Mobile Money</option>
                <option value="card">💳 Card</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
              <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by plate, transaction..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Showing {filteredPayments.length} of {payments.length} transactions
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Payment History</h3>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading payments...</p>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">💸</div>
              <p className="text-gray-500 text-lg">No payment records found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                      <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Plate Number</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Slot</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Duration</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Method</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Transaction ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedPayments.map((payment, index) => (
                      <tr key={payment.paymentid} className="hover:bg-gray-50 transition animate-fadeIn cursor-pointer" onClick={() => viewPaymentDetails(payment)} style={{ animationDelay: `${index * 0.05}s` }}>
                        <td className="px-6 py-4 font-bold text-gray-800">#{payment.paymentid}</td>
                        <td className="px-6 py-4 font-semibold text-blue-600">{payment.platenumber}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded-lg text-sm">{payment.slotnumber || '-'}</span></td>
                        <td className="px-6 py-4">{payment.duration ? `${payment.duration} hrs` : '-'}</td>
                        <td className="px-6 py-4 font-bold text-green-600">{parseInt(payment.amountpaid).toLocaleString()} FRW</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getPaymentMethodColor(payment.paymentmethod)}`}>
                            {getPaymentMethodIcon(payment.paymentmethod)} {payment.paymentmethod?.replace('_', ' ') || 'cash'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">{payment.transaction_id || '-'}</td>
                        <td className="px-6 py-4 text-sm">{formatDate(payment.paymentdate)}</td>
                        <td className="px-6 py-4 text-center">
                          <button className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition">
                            👁️ View
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

        {/* Payment Details Modal */}
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setShowPaymentModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Payment Details</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl text-white">
                  <p className="text-sm opacity-90">Amount Paid</p>
                  <p className="text-3xl font-bold">{parseInt(selectedPayment.amountpaid).toLocaleString()} FRW</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Transaction ID</p>
                    <p className="font-mono text-sm">{selectedPayment.transaction_id || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Payment Method</p>
                    <p className="font-semibold capitalize">{selectedPayment.paymentmethod || 'cash'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Plate Number</p>
                    <p className="font-semibold">{selectedPayment.platenumber}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Slot Number</p>
                    <p className="font-semibold">{selectedPayment.slotnumber || '-'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-semibold">{selectedPayment.duration ? `${selectedPayment.duration} hours` : '-'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Payment Date</p>
                    <p className="text-sm">{formatDate(selectedPayment.paymentdate)}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                Close
              </button>
            </div>
          </div>
        )}

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
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}

export default Payments;