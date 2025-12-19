'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingApi, formatCurrency, formatDate, statusManager } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
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

  // 🔥 EDIT BOOKING
  const handleEditBooking = (bookingId) => {
    localStorage.setItem('currentBookingId', bookingId);
    router.push(`/booking/edit/${bookingId}`);
  };

  // 🔥 VIEW TRIP DETAILS
  const handleViewTrip = (bookingId) => {
    localStorage.setItem('currentBookingId', bookingId);
    router.push(`/booking/trip/${bookingId}`);
  };

  // 🔥 CONFIRM BOOKING
  const handleConfirmBooking = async (bookingId) => {
    if (confirm('Confirm this booking?')) {
      try {
        const result = await bookingApi.confirm(bookingId);
        if (result.success) {
          alert('✅ Booking confirmed!');
          fetchDashboardData(); // Refresh data
        }
      } catch (error) {
        console.error('Error confirming booking:', error);
        alert('❌ Failed to confirm booking');
      }
    }
  };

  // 🔥 DELETE BOOKING
  const handleDeleteBooking = async (bookingId) => {
    if (confirm('Are you sure? This action cannot be undone.')) {
      try {
        const result = await bookingApi.cancelBooking(bookingId, 'Deleted from dashboard');
        if (result.success) {
          alert('✅ Booking deleted!');
          fetchDashboardData(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('❌ Failed to delete booking');
      }
    }
  };

  // 🔥 CREATE NEW BOOKING
  const handleNewBooking = () => {
    // Clear any previous booking data
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">PARV Tour & Travels Dashboard</h1>
          <p className="text-gray-600 mt-2">Professional Travel Solutions Management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalBookings || bookings.length || 0}</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span className="text-green-600">+{stats.todayBookings || 0} today</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalRevenue || 0)}</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span>Profit: {formatCurrency(stats.totalProfit || 0)}</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <span className="text-2xl">🚗</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Trips</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.driver_assigned || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span className="text-blue-600">{stats.completed || 0} completed</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-800">{stats.thisMonthBookings || 0}</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span className="text-green-600">Active</span>
            </div>
          </div>
        </div>

      

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">All Bookings</h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="confirmed">✅ Confirmed</option>
                <option value="driver_assigned">👨‍✈️ Driver Assigned</option>
                <option value="expenses_added">💰 Expenses Added</option>
                <option value="completed">🏁 Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
              
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading bookings from Google Sheets...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No bookings found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try a different search term' : 'Create your first booking to get started'}
              </p>
              <button
                onClick={handleNewBooking}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                + Create First Booking
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Booking ID</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Customer</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">From → To</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Amount</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.map((booking) => {
                    const statusInfo = statusManager.getStatusInfo(booking.status);
                    return (
                      <tr key={booking.bookingId} className="hover:bg-gray-50 transition-colors group">
                        <td className="py-4 px-6">
                          <span className="font-mono font-medium text-blue-600">{booking.bookingId}</span>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(booking.createdAt)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium">{booking.customerName}</p>
                            <p className="text-sm text-gray-500">{booking.phone}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="max-w-xs">
                            <p className="font-medium truncate">{booking.from}</p>
                            <p className="text-sm text-gray-600 truncate">→ {booking.to}</p>
                            {booking.vehicle && (
                              <p className="text-xs text-gray-500 mt-1">🚗 {booking.vehicle}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm">{booking.date || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-green-600">
                            {formatCurrency(booking.bookingAmount || 0)}
                          </p>
                          {booking.advance > 0 && (
                            <p className="text-xs text-blue-600">Advance: {formatCurrency(booking.advance)}</p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border}`}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                          {booking.totalExpenses > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Expenses: {formatCurrency(booking.totalExpenses)}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-2">
                            {/* EDIT BUTTON */}
                            <button
                              onClick={() => handleEditBooking(booking.bookingId)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium flex items-center group-hover:bg-blue-100"
                              title="Edit booking"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            
                            {/* VIEW TRIP BUTTON */}
                            <button
                              onClick={() => handleViewTrip(booking.bookingId)}
                              className="px-3 py-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors text-xs font-medium"
                              title="View trip details"
                            >
                              👁️ View
                            </button>
                            
                            {/* STATUS SPECIFIC ACTIONS */}
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => handleConfirmBooking(booking.bookingId)}
                                className="px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-md hover:bg-yellow-100 transition-colors text-xs font-medium"
                                title="Confirm booking"
                              >
                                ✅ Confirm
                              </button>
                            )}
                            
                            {booking.status === 'cancelled' && (
                              <button
                                onClick={() => handleDeleteBooking(booking.bookingId)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-xs font-medium"
                                title="Delete permanently"
                              >
                                🗑️ Delete
                              </button>
                            )}
                            
                            {/* QUICK LINKS */}
                            <div className="flex space-x-1 mt-2">
                              {booking.driverName && (
                                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                  👨‍✈️ {booking.driverName}
                                </span>
                              )}
                              {booking.totalKM > 0 && (
                                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                  📏 {booking.totalKM}km
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
            <div className="px-6 py-4 border-t bg-gray-50 flex flex-col md:flex-row md:items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredBookings.length} of {bookings.length} bookings
                {searchTerm && ` for "${searchTerm}"`}
              </div>
              <div className="mt-2 md:mt-0">
                <button
                  onClick={handleNewBooking}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  + New Booking
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h4 className="font-medium text-gray-800 mb-3">📈 Recent Activity</h4>
            <div className="space-y-3">
              {bookings.slice(0, 3).map((booking, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">{booking.bookingId}</p>
                    <p className="text-xs text-gray-500">{formatDate(booking.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <h4 className="font-medium text-gray-800 mb-3">💰 Quick Stats</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Completed Trips</span>
                  <span className="font-medium">{stats.completed || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${((stats.completed || 0) / (stats.totalBookings || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Pending Confirmations</span>
                  <span className="font-medium">{stats.pending || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${((stats.pending || 0) / (stats.totalBookings || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow">
            <h4 className="font-medium text-gray-800 mb-3">🔗 Quick Links</h4>
            <div className="space-y-2">
              <Link href="/booking/manage" className="flex items-center text-blue-600 hover:text-blue-800">
                <span className="mr-2">📋</span>
                <span>Manage All Trips</span>
              </Link>
              <Link href="/drivers" className="flex items-center text-blue-600 hover:text-blue-800">
                <span className="mr-2">👨‍✈️</span>
                <span>Driver Management</span>
              </Link>
              <Link href="/vehicles" className="flex items-center text-blue-600 hover:text-blue-800">
                <span className="mr-2">🚗</span>
                <span>Vehicle Management</span>
              </Link>
              <Link href="/reports" className="flex items-center text-blue-600 hover:text-blue-800">
                <span className="mr-2">📊</span>
                <span>Generate Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}