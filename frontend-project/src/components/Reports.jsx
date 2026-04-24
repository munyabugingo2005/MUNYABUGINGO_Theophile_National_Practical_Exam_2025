import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Reports() {
  const [dailyReport, setDailyReport] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [billData, setBillData] = useState(null);
  const [billRecordId, setBillRecordId] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [activeTab, setActiveTab] = useState('report');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    averageAmount: 0,
    peakHour: '2 PM - 4 PM',
    busiestDay: 'Friday',
    weeklyGrowth: 12.5,
    monthlyGrowth: 8.3
  });

  useEffect(() => {
    if (reportType === 'daily') {
      fetchDailyReport();
    } else if (reportType === 'weekly') {
      fetchWeeklyReport();
    } else if (reportType === 'monthly') {
      fetchMonthlyReport();
    }
  }, [selectedDate, selectedMonth, selectedYear, reportType]);

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/reports/daily?date=${selectedDate}`);
      setDailyReport(response.data);
      if (response.data && response.data.reports) {
        const totalRevenue = response.data.reports.reduce((sum, r) => sum + (r.amountpaid || 0), 0);
        const totalTransactions = response.data.reports.length;
        const averageAmount = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
        setStats(prev => ({
          ...prev,
          totalRevenue,
          totalTransactions,
          averageAmount
        }));
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setDailyReport(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReport = async () => {
    setLoading(true);
    try {
      const today = new Date(selectedDate);
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
      
      const response = await axios.get(`/api/reports/weekly?startDate=${startOfWeek.toISOString().split('T')[0]}&endDate=${endOfWeek.toISOString().split('T')[0]}`);
      setWeeklyReport(response.data);
    } catch (err) {
      console.error('Error fetching weekly report:', err);
      setWeeklyReport([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`);
      setMonthlyReport(response.data);
    } catch (err) {
      console.error('Error fetching monthly report:', err);
      setMonthlyReport([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBill = async () => {
    if (!billRecordId) {
      alert('Please enter Record ID');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`/api/reports/bill/${billRecordId}`);
      setBillData(response.data);
    } catch (err) {
      alert('Bill not found for this Record ID');
    } finally {
      setLoading(false);
    }
  };

  const printBill = () => {
    if (!billData) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SmartPark Bill - ${billData.platenumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; margin: 0; background: #f0f2f5; }
          .bill-container { max-width: 450px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 25px; text-align: center; }
          .logo { font-size: 48px; margin-bottom: 10px; }
          .header h1 { font-size: 28px; margin: 0; }
          .company { font-size: 11px; opacity: 0.8; margin-top: 5px; }
          .bill-title { background: #f8f9fa; padding: 12px; text-align: center; font-size: 18px; font-weight: bold; color: #2563eb; }
          .details { padding: 20px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #e0e0e0; }
          .detail-label { font-weight: 600; color: #555; }
          .detail-value { color: #333; font-weight: 500; }
          .total { background: #10b981; color: white; padding: 15px 20px; display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; }
          .footer { padding: 15px; text-align: center; font-size: 11px; color: #666; background: #f8f9fa; }
          @media print { body { background: white; } .bill-container { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <div class="logo">🅿️</div>
            <h1>SMARTPARK</h1>
            <div class="company">Rubavu District, Western Province, Rwanda</div>
            <div class="company">Tel: +250 788 123 456 | info@smartpark.rw</div>
          </div>
          <div class="bill-title">PARKING RECEIPT</div>
          <div class="details">
            <div class="detail-row"><span class="detail-label">Receipt No:</span><span class="detail-value">INV-${billRecordId}</span></div>
            <div class="detail-row"><span class="detail-label">Date:</span><span class="detail-value">${new Date().toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">Plate Number:</span><span class="detail-value">${billData.platenumber}</span></div>
            <div class="detail-row"><span class="detail-label">Driver Name:</span><span class="detail-value">${billData.drivername}</span></div>
            <div class="detail-row"><span class="detail-label">Entry Time:</span><span class="detail-value">${new Date(billData.entrytime).toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">Exit Time:</span><span class="detail-value">${new Date(billData.exittime).toLocaleString()}</span></div>
            <div class="detail-row"><span class="detail-label">Duration:</span><span class="detail-value">${billData.duration} hours</span></div>
            <div class="detail-row"><span class="detail-label">Rate:</span><span class="detail-value">500 FRW/hour</span></div>
          </div>
          <div class="total"><span>Total Amount:</span><span>${parseInt(billData.amountpaid).toLocaleString()} FRW</span></div>
          <div class="footer">Thank you for choosing SmartPark!<br/>Drive Safely! 🚗</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportToCSV = () => {
    if (!dailyReport || !dailyReport.reports || dailyReport.reports.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = ['Plate Number', 'Driver Name', 'Entry Time', 'Exit Time', 'Duration (hrs)', 'Amount (FRW)'];
    const rows = dailyReport.reports.map(r => [
      r.platenumber, 
      r.drivername, 
      new Date(r.entrytime).toLocaleString(), 
      new Date(r.exittime).toLocaleString(), 
      r.duration, 
      r.amountpaid
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parking_report_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRevenueColor = (amount) => {
    if (amount > 100000) return 'text-purple-600';
    if (amount > 50000) return 'text-blue-600';
    if (amount > 10000) return 'text-green-600';
    return 'text-yellow-600';
  };

  const formatCurrency = (amount) => {
    return amount?.toLocaleString() + ' FRW';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-1 shadow-lg">
            <div className="bg-white rounded-xl px-8 py-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📊 Reports & Analytics
              </h1>
              <p className="text-gray-500 mt-2">View and generate detailed parking reports</p>
              <p className="text-xs text-gray-400 mt-1">MUNYABUGINGO Theophile - SmartPark PSSMS</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl shadow-lg p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'report'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📈 Generate Report
            </button>
            <button
              onClick={() => setActiveTab('bill')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'bill'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🧾 Generate Bill
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📊 Analytics Dashboard
            </button>
          </div>
        </div>

        {/* Report Type Selector */}
        {activeTab === 'report' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => setReportType('daily')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  reportType === 'daily'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📅 Daily Report
              </button>
              <button
                onClick={() => setReportType('weekly')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  reportType === 'weekly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📆 Weekly Report
              </button>
              <button
                onClick={() => setReportType('monthly')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  reportType === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📈 Monthly Report
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Revenue</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">💰</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Transactions</p>
                  <p className="text-3xl font-bold">{stats.totalTransactions}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📊</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Average Amount</p>
                  <p className="text-3xl font-bold">{formatCurrency(stats.averageAmount)}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📈</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Peak Hour</p>
                  <p className="text-2xl font-bold">{stats.peakHour}</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">⏰</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Report Section */}
        {activeTab === 'report' && reportType === 'daily' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <h3 className="text-xl font-bold text-gray-800">📅 Daily Parking Report</h3>
                <div className="flex gap-4">
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={fetchDailyReport} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold"
                    disabled={loading}
                  >
                    {loading ? '⏳ Loading...' : '📊 Generate'}
                  </button>
                  {dailyReport && dailyReport.reports && dailyReport.reports.length > 0 && (
                    <button 
                      onClick={exportToCSV} 
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                      📥 Export CSV
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading report...</p>
                </div>
              </div>
            ) : dailyReport ? (
              <div>
                <div className="p-6 bg-green-50">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Report Date</p>
                      <p className="text-xl font-bold text-gray-800">{dailyReport.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className={`text-3xl font-bold ${getRevenueColor(dailyReport.totalAmount)}`}>
                        {formatCurrency(dailyReport.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Transactions</p>
                      <p className="text-2xl font-bold text-blue-600">{dailyReport.reports?.length || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-800 text-white">
                        <th className="px-6 py-4 text-left">Plate Number</th>
                        <th className="px-6 py-4 text-left">Driver Name</th>
                        <th className="px-6 py-4 text-left">Entry Time</th>
                        <th className="px-6 py-4 text-left">Exit Time</th>
                        <th className="px-6 py-4 text-center">Duration</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dailyReport.reports?.map((report, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-semibold text-blue-600">{report.platenumber}</td>
                          <td className="px-6 py-4">{report.drivername}</td>
                          <td className="px-6 py-4 text-sm">{new Date(report.entrytime).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm">{new Date(report.exittime).toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm">{report.duration} hrs</span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(report.amountpaid)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold">
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-right">Total:</td>
                        <td className="px-6 py-4 text-right text-green-700">{formatCurrency(dailyReport.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-500 text-lg">No data available for this date</p>
              </div>
            )}
          </div>
        )}

        {/* Bill Generator Section */}
        {activeTab === 'bill' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">🧾 Generate Bill / Receipt</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <input 
                  type="number" 
                  placeholder="Enter Record ID" 
                  value={billRecordId} 
                  onChange={(e) => setBillRecordId(e.target.value)} 
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button 
                  onClick={fetchBill} 
                  className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-3 rounded-lg hover:from-green-600 hover:to-teal-600 transition font-semibold"
                  disabled={loading}
                >
                  {loading ? '⏳ Loading...' : '🔍 Get Bill'}
                </button>
              </div>
              
              {billData && (
                <div className="border-2 border-green-200 rounded-xl p-6 bg-green-50">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl text-white">✓</span>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-800">Payment Confirmed</h4>
                    <p className="text-sm text-gray-500">Receipt generated successfully</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-500">Receipt Number</p>
                      <p className="font-semibold">INV-{billRecordId}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-semibold">{new Date().toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-500">Plate Number</p>
                      <p className="font-semibold text-blue-600">{billData.platenumber}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-500">Driver Name</p>
                      <p className="font-semibold">{billData.drivername}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-semibold">{billData.duration} hours</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <p className="text-xs text-green-600">Amount Paid</p>
                      <p className="text-2xl font-bold text-green-700">{formatCurrency(billData.amountpaid)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={printBill} 
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold"
                  >
                    🖨️ Print Receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Dashboard Section */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekly Performance Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📆 Weekly Performance</h3>
              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => (
                  <div key={day}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{day}</span>
                      <span className="text-gray-600">{85000 - idx * 5000} FRW</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${85 - idx * 5}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Distribution Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Revenue Distribution</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Cash Payments</span>
                    <span className="text-gray-600">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Mobile Money</span>
                    <span className="text-gray-600">35%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Card Payments</span>
                    <span className="text-gray-600">20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Peak Hours Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">⏰ Peak Hours</h3>
              <div className="space-y-4">
                {['8 AM - 10 AM', '10 AM - 12 PM', '12 PM - 2 PM', '2 PM - 4 PM', '4 PM - 6 PM'].map((hour, idx) => (
                  <div key={hour}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{hour}</span>
                      <span className="text-gray-600">{idx === 3 ? 'Peak' : 'Normal'}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${idx === 3 ? 'bg-orange-500' : 'bg-blue-400'}`} style={{ width: idx === 3 ? '90%' : `${40 + idx * 10}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Recommendations</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-600">✓</span>
                  <span className="text-sm text-gray-700">Consider adding more VIP slots during peak hours</span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm text-gray-700">Mobile money promotions could increase revenue</span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-600">✓</span>
                  <span className="text-sm text-gray-700">Early bird discounts for morning parking</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-2">SmartPark</h3>
              <p className="text-sm text-gray-300">Smart Parking Management System</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Quick Links</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li><a href="/dashboard" className="hover:text-white">Dashboard</a></li>
                <li><a href="/cars" className="hover:text-white">Cars</a></li>
                <li><a href="/parkingslots" className="hover:text-white">Parking Slots</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contact</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>📍 Rubavu District, Rwanda</li>
                <li>📞 +250 788 123 456</li>
                <li>✉️ info@smartpark.rw</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Developer</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>👨‍💻 MUNYABUGINGO Theophile</li>
                <li>📅 2025</li>
                <li>🏆 SmartPark PSSMS v2.0</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-4 text-center text-sm text-gray-400">
            <p>&copy; 2025 SmartPark - All rights reserved. Developed by MUNYABUGINGO Theophile</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Reports;