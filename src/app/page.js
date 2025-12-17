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
      
      const bookingsResult = await bookingApi.getAll();
      
      if (bookingsResult.success) {
        // Handle both response formats
        let bookingsData = [];
        if (Array.isArray(bookingsResult.data)) {
          bookingsData = bookingsResult.data;
        } else if (bookingsResult.data && Array.isArray(bookingsResult.data.data)) {
          bookingsData = bookingsResult.data.data;
        }
        
        setBookings(bookingsData);
        
        // Calculate stats locally
        calculateStats(bookingsData);
      }
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData) => {
    const stats = {
      total: bookingsData.length,
      pending: 0,
      completed: 0,
      totalRevenue: 0,
      totalProfit: 0
    };
    
    bookingsData.forEach(booking => {
      const amount = parseFloat(booking.bookingAmount) || 0;
      const profit = parseFloat(booking.netProfit) || 0;
      const status = (booking.status || '').toLowerCase();
      
      stats.totalRevenue += amount;
      stats.totalProfit += profit;
      
      if (status === 'pending') stats.pending++;
      if (status === 'completed') stats.completed++;
    });
    
    setStats(stats);
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">PARV Tour & Travels</h1>
        <p className="text-gray-600 mt-2">Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {['Total Bookings', 'Pending', 'Completed', 'Total Profit'].map((title, index) => (
          <div key={title} className="bg-white rounded-xl shadow p-6">
            <h3 className="text-2xl font-bold">
              {index === 0 ? stats.total :
               index === 1 ? stats.pending :
               index === 2 ? stats.completed :
               formatCurrency(stats.totalProfit)}
            </h3>
            <p className="text-gray-600">{title}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/booking/entry" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center">
            <div className="text-blue-600 mb-2">📝</div>
            <span className="font-medium">New Booking</span>
          </Link>

          <Link href="/drivers" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center">
            <div className="text-green-600 mb-2">🚗</div>
            <span className="font-medium">Drivers</span>
          </Link>

          <Link href="/reports" className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center">
            <div className="text-purple-600 mb-2">📊</div>
            <span className="font-medium">Reports</span>
          </Link>

          <button onClick={fetchData} className="bg-orange-50 hover:bg-orange-100 p-4 rounded-lg text-center">
            <div className="text-orange-600 mb-2">🔄</div>
            <span className="font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Recent Bookings</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No bookings found</p>
            <Link href="/booking/entry" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg">
              Create First Booking
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-4 text-left">Booking ID</th>
                  <th className="p-4 text-left">Customer</th>
                  <th className="p-4 text-left">Route</th>
                  <th className="p-4 text-left">Amount</th>
                  <th className="p-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 10).map((booking) => (
                  <tr key={booking.bookingId} className="border-t">
                    <td className="p-4">{booking.bookingId}</td>
                    <td className="p-4">{booking.customerName}</td>
                    <td className="p-4">{booking.from} → {booking.to}</td>
                    <td className="p-4">{formatCurrency(booking.bookingAmount)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}