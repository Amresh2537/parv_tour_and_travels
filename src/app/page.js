'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingApi, formatCurrency, formatDate, statusManager } from '@/lib/api';
import BackgroundImage from '@/components/BackgroundImage';

export default function DashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [backgroundVariant, setBackgroundVariant] = useState('road');

  useEffect(() => {
    fetchDashboardData();
    
    // Rotate background images every 30 seconds
    const variants = ['road', 'mountains', 'city', 'car', 'luxury'];
    const interval = setInterval(() => {
      setBackgroundVariant(variants[Math.floor(Math.random() * variants.length)]);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        bookingApi.getAll(),
        bookingApi.getStats()
      ]);
      
      if (bookingsRes.success) {
        setBookings(bookingsRes.data || []);
      }
      
      if (statsRes.success) {
        setStats(statsRes.data || {});
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Action handlers remain the same...
  const handleEditBooking = (bookingId) => {
    localStorage.setItem('currentBookingId', bookingId);
    router.push(`/booking/edit/${bookingId}`);
  };

  const handleViewTrip = (bookingId) => {
    localStorage.setItem('currentBookingId', bookingId);
    router.push(`/booking/trip/${bookingId}`);
  };

  const handleConfirmBooking = async (bookingId) => {
    if (confirm('Confirm this booking?')) {
      try {
        const result = await bookingApi.confirm(bookingId);
        if (result.success) {
          alert('✅ Booking confirmed!');
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error confirming booking:', error);
        alert('❌ Failed to confirm booking');
      }
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (confirm('Are you sure? This action cannot be undone.')) {
      try {
        const result = await bookingApi.cancelBooking(bookingId, 'Deleted from dashboard');
        if (result.success) {
          alert('✅ Booking deleted!');
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('❌ Failed to delete booking');
      }
    }
  };

  const handleNewBooking = () => {
    ['currentBookingId', 'lastBooking', 'driverData', 'expensesData', 'calculations'].forEach(key => {
      localStorage.removeItem(key);
    });
    router.push('/booking/entry');
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerPhone?.includes(searchTerm) ||
      booking.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.to?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <BackgroundImage variant={backgroundVariant} opacity={0.08} blur={2}>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Glassmorphism Header */}
          <div className="mb-8">
            <div className="backdrop-blur-lg bg-white/80 rounded-2xl p-6 md:p-8 shadow-xl border border-white/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    PARV Tour & Travels
                  </h1>
                  <p className="text-gray-600 mt-2">Premium Travel Management System</p>
                  <div className="flex items-center mt-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      System Online
                    </div>
                    <span className="mx-3 text-gray-300">•</span>
                    <div className="text-sm text-gray-500">
                      {new Date().toLocaleDateString('en-IN', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleNewBooking}
                  className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center group"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Booking
                </button>
              </div>
            </div>
          </div>

          {/* Glassmorphism Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: 'Total Bookings',
                value: stats.totalBookings || bookings.length || 0,
                change: `+${stats.todayBookings || 0} today`,
                icon: '📋',
                color: 'blue',
                gradient: 'from-blue-500 to-blue-600'
              },
              {
                title: 'Total Revenue',
                value: formatCurrency(stats.totalRevenue || 0),
                change: `Profit: ${formatCurrency(stats.totalProfit || 0)}`,
                icon: '💰',
                color: 'green',
                gradient: 'from-emerald-500 to-green-600'
              },
              {
                title: 'Active Trips',
                value: stats.driver_assigned || 0,
                change: `${stats.completed || 0} completed`,
                icon: '🚗',
                color: 'purple',
                gradient: 'from-purple-500 to-indigo-600'
              },
              {
                title: 'This Month',
                value: stats.thisMonthBookings || 0,
                change: 'Active bookings',
                icon: '📊',
                color: 'amber',
                gradient: 'from-amber-500 to-orange-600'
              }
            ].map((stat, index) => (
              <div 
                key={index}
                className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-2">{stat.change}</p>
                  </div>
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${stat.gradient}`}
                      style={{ width: `${Math.min(100, (parseInt(stat.value) / 50) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Card */}
          <div className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Booking Management</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredBookings.length} of {bookings.length} bookings
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                </div>
                
                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search bookings, customers, destinations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    />
                    <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                  >
                    <option value="all">📊 All Status</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="confirmed">✅ Confirmed</option>
                    <option value="driver_assigned">👨‍✈️ Driver Assigned</option>
                    <option value="expenses_added">💰 Expenses Added</option>
                    <option value="completed">🏁 Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                  
                  <button
                    onClick={fetchDashboardData}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50/50 transition-colors backdrop-blur-sm flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            
            {/* Loading State */}
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading bookings from database...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
                  <span className="text-3xl">📭</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {searchTerm ? 'No matching bookings found' : 'No bookings yet'}
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start by creating your first booking to manage your travel services'}
                </p>
                <button
                  onClick={handleNewBooking}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                >
                  + Create First Booking
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Booking ID</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Customer Details</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Journey</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBookings.map((booking) => {
                      const statusInfo = statusManager.getStatusInfo(booking.status);
                      return (
                        <tr 
                          key={booking.bookingId} 
                          className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-200 group"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                <span className="text-blue-600">📋</span>
                              </div>
                              <div>
                                <span className="font-mono font-semibold text-blue-700">{booking.bookingId}</span>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDate(booking.createdAt)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-semibold text-gray-800">{booking.customerName}</p>
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <span className="mr-2">📞</span>
                                {booking.phone}
                              </p>
                              {booking.passengers > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  👥 {booking.passengers} passengers
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="max-w-xs">
                              <div className="flex items-start">
                                <div className="mr-3 mt-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <div className="w-0.5 h-6 bg-blue-300 mx-auto"></div>
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 truncate">{booking.from}</p>
                                  <p className="text-sm text-gray-600 truncate mt-1">{booking.to}</p>
                                </div>
                              </div>
                              {booking.vehicle && (
                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                  <span className="mr-2">🚗</span>
                                  {booking.vehicle}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm">
                              <p className="font-medium text-gray-800">{booking.date || 'N/A'}</p>
                              {booking.time && (
                                <p className="text-gray-500">⏰ {booking.time}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-bold text-lg text-green-600">
                                {formatCurrency(booking.bookingAmount || 0)}
                              </p>
                              {booking.advance > 0 && (
                                <div className="text-xs">
                                  <span className="text-blue-600">Advance: {formatCurrency(booking.advance)}</span>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                    <div 
                                      className="bg-blue-500 h-1.5 rounded-full"
                                      style={{ width: `${(booking.advance / booking.bookingAmount) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-2">
                              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border} inline-flex items-center justify-center w-fit`}>
                                <span className="mr-2">{statusInfo.icon}</span>
                                {statusInfo.label}
                              </span>
                              {booking.totalExpenses > 0 && (
                                <p className="text-xs text-gray-600">
                                  💰 Expenses: {formatCurrency(booking.totalExpenses)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleEditBooking(booking.bookingId)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-sm font-medium flex items-center shadow-sm hover:shadow"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              
                              <button
                                onClick={() => handleViewTrip(booking.bookingId)}
                                className="px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-200 text-sm font-medium flex items-center shadow-sm hover:shadow"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                              
                              {/* Quick Info Badges */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {booking.driverName && (
                                  <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-lg flex items-center">
                                    <span className="mr-2">👨‍✈️</span>
                                    {booking.driverName}
                                  </span>
                                )}
                                {booking.totalKM > 0 && (
                                  <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg flex items-center">
                                    <span className="mr-2">📏</span>
                                    {booking.totalKM} km
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Table Footer */}
            {!loading && filteredBookings.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white/50 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{filteredBookings.length}</span> bookings displayed
                    {searchTerm && ` for "${searchTerm}"`}
                  </div>
                  <div className="mt-2 md:mt-0">
                    <button
                      onClick={handleNewBooking}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                    >
                      + New Booking
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </BackgroundImage>
  );
}