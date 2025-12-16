'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { bookingApi } from '@/lib/api';

export default function Home() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    totalRevenue: 0,
    totalProfit: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both bookings and stats in parallel
      const [bookingsResult, statsResult] = await Promise.allSettled([
        bookingApi.getAll(),
        bookingApi.getStats()
      ]);
      
      if (bookingsResult.status === 'fulfilled' && bookingsResult.value.success) {
        setBookings(bookingsResult.value.data || []);
      }
      
      if (statsResult.status === 'fulfilled' && statsResult.value.success) {
        const statsData = statsResult.value.data;
        setStats({
          total: statsData.total || 0,
          pending: statsData.pending || 0,
          completed: statsData.completed || 0,
          totalRevenue: statsData.totalRevenue || 0,
          totalProfit: statsData.totalProfit || 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      // If API fails, show empty state but don't show error
      setBookings([]);
    } finally {
      setLoading(false);
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">PARV Tour & Travels Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your tours and bookings efficiently</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <p className="text-gray-600">Pending Bookings</p>
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
              <p className="text-gray-600">Completed Trips</p>
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

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/booking/entry" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition-colors">
            <div className="text-blue-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-medium text-gray-700">New Booking</span>
          </Link>

          <Link href="/vehicles" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center transition-colors">
            <div className="text-green-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-medium text-gray-700">Manage Vehicles</span>
          </Link>

          <Link href="/reports" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition-colors">
            <div className="text-purple-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-medium text-gray-700">View Reports</span>
          </Link>

          <button 
            onClick={fetchData}
            disabled={loading}
            className="bg-orange-50 hover:bg-orange-100 p-4 rounded-lg text-center transition-colors disabled:opacity-50"
          >
            <div className="text-orange-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="font-medium text-gray-700">
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </span>
          </button>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Recent Bookings</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${bookings.length} bookings`}
              </span>
              <button 
                onClick={fetchData} 
                disabled={loading}
                className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dynamic data from Google Sheets...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">No bookings found in your Google Sheet</p>
              <p className="text-gray-500 text-sm mb-4">Create your first booking to see data here</p>
              <Link href="/booking/entry" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create First Booking
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Booking ID</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Route</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Vehicle</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Amount</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 10).map((booking) => (
                  <tr key={booking.bookingId} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-medium text-sm">{booking.bookingId || 'N/A'}</td>
                    <td className="p-4">{booking.customerName || 'N/A'}</td>
                    <td className="p-4">
                      {booking.from || 'N/A'} → {booking.to || 'N/A'}
                    </td>
                    <td className="p-4">{booking.vehicle || 'N/A'}</td>
                    <td className="p-4 font-medium">{formatCurrency(booking.bookingAmount)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status || 'unknown'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">{booking.date || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {bookings.length > 10 && (
          <div className="p-4 border-t text-center">
            <Link href="/reports" className="text-blue-600 hover:text-blue-800">
              View all {bookings.length} bookings →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}