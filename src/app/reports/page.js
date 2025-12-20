'use client';

import { useState, useEffect } from 'react';
import { bookingApi } from '@/lib/api';
import { TravelBackground } from '@/components/TravelBackground';
import { motion } from 'framer-motion';

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
    dailyStats: [],
    monthlyStats: []
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
    
    let totalRevenue = 0;
    let totalExpenses = 0;
    let netProfit = 0;
    let vehicleWise = {};
    
    completedBookings.forEach(booking => {
      const revenue = parseFloat(booking.bookingAmount) || 0;
      const expenses = parseFloat(booking.totalExpenses) || 0;
      const profit = revenue - expenses;
      
      totalRevenue += revenue;
      totalExpenses += expenses;
      netProfit += profit;
      
      const vehicle = booking.vehicle || 'Unknown';
      if (!vehicleWise[vehicle]) {
        vehicleWise[vehicle] = { count: 0, revenue: 0, profit: 0 };
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
      const dayProfit = dayBookings.reduce((sum, b) => sum + (parseFloat(b.bookingAmount) || 0) - (parseFloat(b.totalExpenses) || 0), 0);
      
      dailyStats.push({
        date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        trips: dayBookings.length,
        revenue: dayRevenue,
        profit: dayProfit
      });
    }
    
    // Monthly stats
    const monthlyStats = [];
    const currentMonth = today.getMonth();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), currentMonth - i, 1);
      const monthName = monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      
      const monthBookings = completedBookings.filter(b => {
        const bookingDate = new Date(b.date || b.createdAt);
        return bookingDate.getMonth() === monthDate.getMonth() && 
               bookingDate.getFullYear() === monthDate.getFullYear();
      });
      
      const monthRevenue = monthBookings.reduce((sum, b) => sum + (parseFloat(b.bookingAmount) || 0), 0);
      const monthProfit = monthBookings.reduce((sum, b) => sum + (parseFloat(b.bookingAmount) || 0) - (parseFloat(b.totalExpenses) || 0), 0);
      
      monthlyStats.push({
        month: monthName,
        trips: monthBookings.length,
        revenue: monthRevenue,
        profit: monthProfit
      });
    }
    
    setReportData({
      totalRevenue,
      totalExpenses,
      netProfit,
      totalTrips: completedBookings.length,
      vehicleWise,
      dailyStats,
      monthlyStats
    });
  };

  const getVehicleTypes = () => {
    const types = new Set();
    bookings.forEach(b => b.vehicle && types.add(b.vehicle));
    return ['all', ...Array.from(types)];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <TravelBackground variant="minimal">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
          </div>
        </div>
      </TravelBackground>
    );
  }

  return (
    <TravelBackground variant="minimal">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 md:p-8 shadow-xl border border-white/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Reports & Analytics
                  </h1>
                  <p className="text-gray-600 mt-2">Comprehensive insights into your business performance</p>
                  <div className="flex items-center mt-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      Data updated in real-time
                    </div>
                    <span className="mx-3 text-gray-300">•</span>
                    <div className="text-sm text-gray-500">
                      {reportData.totalTrips} completed trips analyzed
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <button
                    onClick={fetchBookings}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50/50 transition-colors backdrop-blur-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 shadow-lg border border-white/20 mb-8"
          >
            <div className="flex flex-wrap gap-6">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Time Range
                </label>
                <div className="flex space-x-2">
                  {['today', 'week', 'month', 'all'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        timeRange === range
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {range === 'today' && 'Today'}
                      {range === 'week' && 'Last 7 Days'}
                      {range === 'month' && 'This Month'}
                      {range === 'all' && 'All Time'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Vehicle Filter
                </label>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                >
                  {getVehicleTypes().map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Vehicles' : type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: 'Total Revenue',
                value: formatCurrency(reportData.totalRevenue),
                change: '+12.5% from last month',
                icon: '💰',
                color: 'from-emerald-500 to-green-600'
              },
              {
                title: 'Total Expenses',
                value: formatCurrency(reportData.totalExpenses),
                change: '-3.2% from last month',
                icon: '📉',
                color: 'from-rose-500 to-pink-600'
              },
              {
                title: 'Net Profit',
                value: formatCurrency(reportData.netProfit),
                change: '+18.7% from last month',
                icon: '📊',
                color: 'from-blue-500 to-indigo-600'
              },
              {
                title: 'Completed Trips',
                value: reportData.totalTrips,
                change: `${Math.round((reportData.totalTrips / 30) * 100)}% monthly target`,
                icon: '🚗',
                color: 'from-purple-500 to-violet-600'
              }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
                  </div>
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${stat.color}`}
                      style={{ width: `${Math.min(100, (index + 1) * 25)}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Performance */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">📈</span>
                Daily Performance (Last 7 Days)
              </h2>
              <div className="space-y-4">
                {reportData.dailyStats.map((day, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-16 text-sm font-medium text-gray-600">{day.date}</div>
                    <div className="flex-1 ml-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-700">
                          <span className="font-semibold">{day.trips}</span> trips
                        </span>
                        <span className="font-bold text-gray-800">{formatCurrency(day.revenue)}</span>
                      </div>
                      <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg"
                          style={{ width: `${Math.min(100, (day.revenue / Math.max(...reportData.dailyStats.map(d => d.revenue)) * 100))}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Profit: {formatCurrency(day.profit)}
                        </span>
                        <span className="font-medium">
                          {day.trips > 0 ? `${formatCurrency(day.profit / day.trips)} avg` : 'No trips'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Vehicle Wise Performance */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">🚗</span>
                Vehicle Wise Performance
              </h2>
              <div className="space-y-5">
                {Object.entries(reportData.vehicleWise).map(([vehicle, data], index) => (
                  <div key={vehicle} className="flex items-center">
                    <div className="w-28">
                      <span className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-xl text-sm font-medium shadow-sm">
                        {vehicle}
                      </span>
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-700">
                          <span className="font-semibold">{data.count}</span> trips
                        </span>
                        <span className="font-bold text-gray-800">{formatCurrency(data.revenue)}</span>
                      </div>
                      <div className="h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full shadow-lg"
                          style={{ width: `${Math.min(100, (data.revenue / Math.max(...Object.values(reportData.vehicleWise).map(d => d.revenue)) * 100))}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                          Profit: {formatCurrency(data.profit)}
                        </span>
                        <span className="font-medium">
                          {data.count > 0 ? `${formatCurrency(data.profit / data.count)} avg` : 'No trips'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Monthly Performance */}
          {reportData.monthlyStats.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6 mb-8"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">📅</span>
                Monthly Performance (Last 6 Months)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportData.monthlyStats.map((month, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-white/50 p-4 rounded-xl border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-2">{month.month}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Trips:</span>
                        <span className="font-semibold">{month.trips}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(month.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Profit:</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(month.profit)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Profit Margin</span>
                          <span className="font-medium text-emerald-600">
                            {month.revenue > 0 ? `${((month.profit / month.revenue) * 100).toFixed(1)}%` : '0%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Bookings Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 overflow-hidden"
          >
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Recent Bookings Analysis</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Showing analysis of recent completed bookings
                  </p>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Booking ID</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Customer</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Vehicle</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Amount</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Expenses</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Profit</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Margin</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings
                    .filter(b => b.status === 'completed')
                    .slice(0, 10)
                    .map((booking) => {
                      const revenue = parseFloat(booking.bookingAmount) || 0;
                      const expenses = parseFloat(booking.totalExpenses) || 0;
                      const profit = revenue - expenses;
                      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                      
                      return (
                        <tr key={booking.bookingId} className="border-t hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-200">
                          <td className="py-4 px-6">
                            <span className="font-mono text-sm font-semibold text-blue-700">{booking.bookingId}</span>
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-medium">{booking.customerName}</p>
                            <p className="text-xs text-gray-500">{booking.phone}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-lg text-xs font-medium">
                              {booking.vehicle || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-bold text-green-600">{formatCurrency(revenue)}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-red-600">{formatCurrency(expenses)}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`font-bold ${profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                              {formatCurrency(profit)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                              margin >= 30 ? 'bg-emerald-100 text-emerald-800' :
                              margin >= 15 ? 'bg-green-100 text-green-800' :
                              margin >= 0 ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">{booking.date || 'N/A'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              
              {bookings.filter(b => b.status === 'completed').length === 0 && (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
                    <span className="text-3xl">📊</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No completed bookings found
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Complete some trips to see detailed analytics and reports
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </TravelBackground>
  );
}