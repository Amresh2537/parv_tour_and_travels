'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { bookingApi, formatCurrency } from '@/lib/api';

export default function Home() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    driver_assigned: 0,
    expenses_added: 0,
    completed: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortBookings();
  }, [bookings, statusFilter, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings and stats in parallel
      const [bookingsResult, statsResult] = await Promise.all([
        bookingApi.getAll(),
        bookingApi.getStats()
      ]);
      
      if (bookingsResult.success) {
        let bookingsData = [];
        if (Array.isArray(bookingsResult.data)) {
          bookingsData = bookingsResult.data;
        } else if (bookingsResult.data?.data && Array.isArray(bookingsResult.data.data)) {
          bookingsData = bookingsResult.data.data;
        }
        
        // Sort by date (newest first)
        bookingsData.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB - dateA;
        });
        
        setBookings(bookingsData);
      }
      
      if (statsResult.success && statsResult.data) {
        setStats({
          total: statsResult.data.total || 0,
          pending: statsResult.data.pending || 0,
          confirmed: statsResult.data.confirmed || 0,
          driver_assigned: statsResult.data.driver_assigned || 0,
          expenses_added: statsResult.data.expenses_added || 0,
          completed: statsResult.data.completed || 0,
          totalRevenue: statsResult.data.totalRevenue || 0,
          totalExpenses: statsResult.data.totalExpenses || 0,
          totalProfit: statsResult.data.totalProfit || 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBookings = () => {
    let filtered = [...bookings];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => 
        booking.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.customerName?.toLowerCase().includes(term) ||
        booking.bookingId?.toLowerCase().includes(term) ||
        booking.phone?.includes(term) ||
        booking.from?.toLowerCase().includes(term) ||
        booking.to?.toLowerCase().includes(term)
      );
    }
    
    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'driver_assigned': return 'bg-purple-100 text-purple-800';
      case 'expenses_added': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'driver_assigned': return '👨‍✈️';
      case 'expenses_added': return '💰';
      case 'completed': return '🏁';
      default: return '📋';
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
  };

  const getProfitColor = (profit) => {
    return profit >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const calculateProfitMargin = (booking) => {
    const revenue = parseFloat(booking.bookingAmount) || 0;
    const profit = parseFloat(booking.netProfit) || 0;
    if (revenue > 0) {
      return ((profit / revenue) * 100).toFixed(1);
    }
    return '0.0';
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PARV Tour & Travels</h1>
            <p className="text-gray-600 mt-2">Dashboard - Manage your bookings efficiently</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold">{stats.total}</h3>
              <p className="text-gray-600">Total Bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold">{stats.pending}</h3>
              <p className="text-gray-600">Pending</p>
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
              <h3 className="text-2xl font-bold">{stats.completed}</h3>
              <p className="text-gray-600">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold">{formatCurrency(stats.totalProfit)}</h3>
              <p className="text-gray-600">Total Profit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Status Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { key: 'pending', label: 'Pending', color: 'bg-yellow-500', count: stats.pending },
            { key: 'confirmed', label: 'Confirmed', color: 'bg-blue-500', count: stats.confirmed },
            { key: 'driver_assigned', label: 'Driver Assigned', color: 'bg-purple-500', count: stats.driver_assigned },
            { key: 'expenses_added', label: 'Expenses Added', color: 'bg-orange-500', count: stats.expenses_added },
            { key: 'completed', label: 'Completed', color: 'bg-green-500', count: stats.completed }
          ].map((item) => (
            <div key={item.key} className="text-center p-4 rounded-lg border">
              <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2`}>
                {item.count}
              </div>
              <div className="text-sm font-medium text-gray-700">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
              </div>
              <div className="text-green-500 text-2xl">💰</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Expenses</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</div>
              </div>
              <div className="text-red-500 text-2xl">📉</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Net Profit Margin</div>
                <div className={`text-2xl font-bold ${getProfitColor(stats.totalProfit)}`}>
                  {stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) + '%' : '0%'}
                </div>
              </div>
              <div className="text-blue-500 text-2xl">📊</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">All Bookings</h2>
            <p className="text-gray-600 text-sm">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="driver_assigned">Driver Assigned</option>
              <option value="expenses_added">Expenses Added</option>
              <option value="completed">Completed</option>
            </select>
            
            {(statusFilter !== 'all' || searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter !== 'all' || searchTerm 
                ? 'Try changing your filters or search term' 
                : 'Create your first booking to get started'
              }
            </p>
            <Link href="/booking/entry" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create New Booking
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Booking ID</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Route</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Vehicle</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Amount</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Profit</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBookings.map((booking) => (
                    <tr key={booking.bookingId} className="border-t hover:bg-gray-50">
                      <td className="p-4 font-mono text-sm">
                        <Link href={`/booking/${booking.bookingId}`} className="text-blue-600 hover:text-blue-800">
                          {booking.bookingId}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{booking.customerName}</div>
                        <div className="text-sm text-gray-500">{booking.phone}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{booking.from} → {booking.to}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                          {booking.vehicle || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{formatCurrency(booking.bookingAmount)}</td>
                      <td className="p-4">
                        <div className={`font-medium ${getProfitColor(booking.netProfit)}`}>
                          {formatCurrency(booking.netProfit)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {calculateProfitMargin(booking)}% margin
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <span className="mr-2">{getStatusIcon(booking.status)}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{booking.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-6 pt-6 border-t">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <span className="text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length}
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-300'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/booking/entry" className="group">
            <div className="bg-blue-50 hover:bg-blue-100 p-6 rounded-lg text-center transition-all duration-300 group-hover:shadow-md">
              <div className="text-blue-600 text-4xl mb-3">📝</div>
              <h3 className="font-bold text-gray-800 mb-2">New Booking</h3>
              <p className="text-sm text-gray-600">Create a new booking entry</p>
            </div>
          </Link>

          <Link href="/vehicles" className="group">
            <div className="bg-green-50 hover:bg-green-100 p-6 rounded-lg text-center transition-all duration-300 group-hover:shadow-md">
              <div className="text-green-600 text-4xl mb-3">🚗</div>
              <h3 className="font-bold text-gray-800 mb-2">Manage Vehicles</h3>
              <p className="text-sm text-gray-600">View and manage vehicle fleet</p>
            </div>
          </Link>

          <Link href="/drivers" className="group">
            <div className="bg-purple-50 hover:bg-purple-100 p-6 rounded-lg text-center transition-all duration-300 group-hover:shadow-md">
              <div className="text-purple-600 text-4xl mb-3">👨‍✈️</div>
              <h3 className="font-bold text-gray-800 mb-2">Drivers</h3>
              <p className="text-sm text-gray-600">Manage driver details</p>
            </div>
          </Link>

          <Link href="/reports" className="group">
            <div className="bg-orange-50 hover:bg-orange-100 p-6 rounded-lg text-center transition-all duration-300 group-hover:shadow-md">
              <div className="text-orange-600 text-4xl mb-3">📊</div>
              <h3 className="font-bold text-gray-800 mb-2">Reports</h3>
              <p className="text-sm text-gray-600">View detailed reports</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats Summary at Bottom */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Data last updated: {new Date().toLocaleString('en-IN')}</p>
        <p className="mt-1">Total {stats.total} bookings • {stats.completed} completed • ₹{stats.totalProfit.toLocaleString('en-IN')} total profit</p>
      </div>
    </div>
  );
}