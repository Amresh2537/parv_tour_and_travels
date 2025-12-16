'use client';

import { useState, useEffect } from 'react';
import { bookingApi } from '@/lib/api';

export default function ReportsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTrips: 0,
    vehicleWise: {},
    dailyStats: []
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const result = await bookingApi.getAll();
      if (result.success) {
        setBookings(result.data);
        calculateReportData(result.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReportData = (data) => {
    const completedBookings = data.filter(b => b.status === 'completed');
    
    // Calculate totals
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalProfit = 0;
    let vehicleWise = {};
    
    completedBookings.forEach(booking => {
      const revenue = parseFloat(booking.bookingAmount) || 0;
      const expenses = parseFloat(booking.totalExpenses) || 0;
      const profit = parseFloat(booking.netProfit) || 0;
      
      totalRevenue += revenue;
      totalExpenses += expenses;
      totalProfit += profit;
      
      // Vehicle wise data
      const vehicle = booking.vehicle || 'Unknown';
      if (!vehicleWise[vehicle]) {
        vehicleWise[vehicle] = {
          count: 0,
          revenue: 0,
          profit: 0
        };
      }
      vehicleWise[vehicle].count++;
      vehicleWise[vehicle].revenue += revenue;
      vehicleWise[vehicle].profit += profit;
    });
    
    // Daily stats (last 7 days)
    const dailyStats = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayBookings = completedBookings.filter(b => {
        const bookingDate = b.date || b.createdAt;
        return bookingDate && bookingDate.includes(dateStr);
      });
      
      const dayRevenue = dayBookings.reduce((sum, b) => sum + (parseFloat(b.bookingAmount) || 0), 0);
      const dayProfit = dayBookings.reduce((sum, b) => sum + (parseFloat(b.netProfit) || 0), 0);
      
      dailyStats.push({
        date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        trips: dayBookings.length,
        revenue: dayRevenue,
        profit: dayProfit
      });
    }
    
    setReportData({
      totalRevenue,
      totalExpenses,
      netProfit: totalProfit,
      totalTrips: completedBookings.length,
      vehicleWise,
      dailyStats
    });
  };

  const filteredBookings = bookings.filter(booking => {
    if (vehicleFilter !== 'all' && booking.vehicle !== vehicleFilter) {
      return false;
    }
    
    if (timeRange === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return (booking.date || booking.createdAt)?.includes(today);
    }
    
    if (timeRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const bookingDate = new Date(booking.date || booking.createdAt);
      return bookingDate >= weekAgo;
    }
    
    return true;
  });

  const getVehicleTypes = () => {
    const types = new Set();
    bookings.forEach(b => b.vehicle && types.add(b.vehicle));
    return ['all', ...Array.from(types)];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">Track your business performance</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Type
            </label>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {getVehicleTypes().map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Vehicles' : type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchBookings}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold">₹{reportData.totalRevenue.toLocaleString('en-IN')}</h3>
              <p className="text-gray-600">Total Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold">₹{reportData.totalExpenses.toLocaleString('en-IN')}</h3>
              <p className="text-gray-600">Total Expenses</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold">₹{reportData.netProfit.toLocaleString('en-IN')}</h3>
              <p className="text-gray-600">Net Profit</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold">{reportData.totalTrips}</h3>
              <p className="text-gray-600">Completed Trips</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Performance */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Daily Performance (Last 7 Days)</h2>
          <div className="space-y-4">
            {reportData.dailyStats.map((day, index) => (
              <div key={index} className="flex items-center">
                <div className="w-16 text-sm text-gray-600">{day.date}</div>
                <div className="flex-1 ml-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{day.trips} trips</span>
                    <span className="font-medium">₹{day.revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min(100, (day.revenue / Math.max(...reportData.dailyStats.map(d => d.revenue)) * 100))}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Profit: ₹{day.profit.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Wise Performance */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Vehicle Wise Performance</h2>
          <div className="space-y-4">
            {Object.entries(reportData.vehicleWise).map(([vehicle, data]) => (
              <div key={vehicle} className="flex items-center">
                <div className="w-24">
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {vehicle}
                  </span>
                </div>
                <div className="flex-1 ml-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{data.count} trips</span>
                    <span className="font-medium">₹{data.revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${Math.min(100, (data.revenue / Math.max(...Object.values(reportData.vehicleWise).map(d => d.revenue)) * 100))}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Profit: ₹{data.profit.toLocaleString('en-IN')} | Avg: ₹{Math.round(data.profit / data.count).toLocaleString('en-IN')} per trip
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Recent Bookings</h2>
          <p className="text-gray-600 mt-1">Showing {filteredBookings.length} bookings</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Booking ID</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Vehicle</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Amount</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Expenses</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Profit</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="p-4 text-left text-sm font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.slice(0, 10).map((booking) => (
                <tr key={booking.bookingId} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-mono text-sm">{booking.bookingId}</td>
                  <td className="p-4">{booking.customerName}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                      {booking.vehicle || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 font-medium">₹{parseFloat(booking.bookingAmount || 0).toLocaleString('en-IN')}</td>
                  <td className="p-4 text-red-600">₹{parseFloat(booking.totalExpenses || 0).toLocaleString('en-IN')}</td>
                  <td className="p-4 text-green-600 font-medium">
                    ₹{parseFloat(booking.netProfit || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">{booking.date || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredBookings.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No bookings found for the selected filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}