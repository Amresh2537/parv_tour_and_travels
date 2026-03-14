'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
      type === 'success'
        ? 'bg-emerald-500 text-white'
        : type === 'error'
        ? 'bg-rose-500 text-white'
        : 'bg-amber-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">${
          type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠'
        }</span>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

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
    if (window.confirm('Confirm this booking?')) {
      try {
        const result = await bookingApi.confirm(bookingId);
        if (result.success) {
          showNotification('Booking confirmed!', 'success');
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error confirming booking:', error);
        showNotification('Failed to confirm booking', 'error');
      }
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure? This action cannot be undone.')) {
      try {
        const result = await bookingApi.cancelBooking(bookingId, 'Deleted from dashboard');
        if (result.success) {
          showNotification('Booking deleted!', 'success');
          fetchDashboardData();
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        showNotification('Failed to delete booking', 'error');
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
      <div className="relative min-h-screen overflow-hidden p-4 md:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="absolute bottom-20 left-1/3 h-60 w-60 rounded-full bg-emerald-300/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8"
          >
            <div className="rounded-3xl border border-blue-100/70 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 p-6 md:p-8 shadow-2xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="mb-2 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                    Operations Dashboard
                  </p>
                  <h1 className="text-3xl font-bold text-white md:text-5xl tracking-tight">
                    PARV Tour & Travels
                  </h1>
                  <p className="mt-3 max-w-2xl text-cyan-100/90">
                    Manage bookings, fleet availability, driver flow and profitability from one unified command center.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-cyan-100/90">
                    <span className="inline-flex items-center rounded-full bg-emerald-400/20 px-3 py-1">
                      <span className="mr-2 h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                      Live System
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      {new Date().toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  <button
                    onClick={handleNewBooking}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-blue-800 shadow-lg transition hover:bg-blue-50"
                  >
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Booking
                  </button>
                  <Link
                    href="/reports"
                    className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20"
                  >
                    View Reports
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                title: 'Total Bookings',
                value: stats.totalBookings || bookings.length || 0,
                change: `+${stats.todayBookings || 0} today`,
                icon: 'BK',
                gradient: 'from-blue-600 to-cyan-500',
                progress: Math.min(100, ((stats.totalBookings || bookings.length || 0) / 200) * 100)
              },
              {
                title: 'Total Revenue',
                value: formatCurrency(stats.totalRevenue || 0),
                change: `Profit: ${formatCurrency(stats.totalProfit || 0)}`,
                icon: 'INR',
                gradient: 'from-emerald-500 to-teal-500',
                progress: Math.min(100, ((stats.totalRevenue || 0) / 500000) * 100)
              },
              {
                title: 'Active Trips',
                value: stats.driver_assigned || 0,
                change: `${stats.completed || 0} completed`,
                icon: 'TRIP',
                gradient: 'from-fuchsia-500 to-indigo-500',
                progress: Math.min(100, ((stats.driver_assigned || 0) / 40) * 100)
              },
              {
                title: 'This Month',
                value: stats.thisMonthBookings || 0,
                change: 'Active bookings',
                icon: 'MON',
                gradient: 'from-amber-500 to-orange-500',
                progress: Math.min(100, ((stats.thisMonthBookings || 0) / 80) * 100)
              }
            ].map((stat, index) => (
              <div 
                key={index}
                className="group rounded-2xl border border-white/30 bg-white/85 p-6 shadow-lg backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 md:text-3xl">{stat.value}</p>
                    <p className="mt-2 text-xs text-gray-500">{stat.change}</p>
                  </div>
                  <div className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-4 text-xs font-bold tracking-wider text-white shadow-lg`}>
                    <span>{stat.icon}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r ${stat.gradient} transition-all duration-700`}
                      style={{ width: `${stat.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <Link href="/management/drivers" className="group rounded-2xl border border-blue-100 bg-white/80 p-5 shadow-md backdrop-blur hover:shadow-xl transition">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-500 font-semibold">Driver Ops</p>
              <h3 className="mt-2 text-xl font-bold text-gray-800">Manage Drivers</h3>
              <p className="mt-1 text-sm text-gray-600">Update availability, profile and assignments.</p>
            </Link>
            <Link href="/management/vehicles" className="group rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-md backdrop-blur hover:shadow-xl transition">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-600 font-semibold">Fleet</p>
              <h3 className="mt-2 text-xl font-bold text-gray-800">Vehicle Control</h3>
              <p className="mt-1 text-sm text-gray-600">Track status, capacity and readiness.</p>
            </Link>
            <Link href="/booking/entry" className="group rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-md backdrop-blur hover:shadow-xl transition">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-600 font-semibold">Sales</p>
              <h3 className="mt-2 text-xl font-bold text-gray-800">Quick New Booking</h3>
              <p className="mt-1 text-sm text-gray-600">Launch the 6-step workflow instantly.</p>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            className="overflow-hidden rounded-2xl border border-white/40 bg-white/90 shadow-xl backdrop-blur-lg"
          >
            {/* Table Header */}
            <div className="border-b border-gray-100 px-6 py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Booking Management</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredBookings.length} of {bookings.length} bookings
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                </div>
                
                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <input
                      type="text"
                      placeholder="Search bookings, customers, destinations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white/70 py-2.5 pl-10 pr-4 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-gradient-to-r from-slate-50 to-blue-50/40">
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
                          className="group transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-white"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                  <span className="text-blue-600">#</span>
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
                                <span className="mr-2">Call</span>
                                {booking.phone}
                              </p>
                              {booking.passengers > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Pax: {booking.passengers}
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
                                  <span className="mr-2">Vehicle:</span>
                                  {booking.vehicle}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm">
                              <p className="font-medium text-gray-800">{booking.date || 'N/A'}</p>
                              {booking.time && (
                                <p className="text-gray-500">Time: {booking.time}</p>
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
                                  Expenses: {formatCurrency(booking.totalExpenses)}
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
                                    <span className="mr-2">Driver:</span>
                                    {booking.driverName}
                                  </span>
                                )}
                                {booking.totalKM > 0 && (
                                  <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg flex items-center">
                                    <span className="mr-2">Distance:</span>
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
              <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-white/50 px-6 py-4 backdrop-blur-sm">
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
          </motion.div>
        </div>
      </div>
    </BackgroundImage>
  );
}