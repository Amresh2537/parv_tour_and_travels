'use client';

import { useState, useEffect } from 'react';
import { bookingApi } from '@/lib/api';
import Link from 'next/link';

export default function ManagementDashboard() {
  const [stats, setStats] = useState({
    drivers: { total: 0, available: 0, onTrip: 0 },
    vehicles: { total: 0, available: 0, onTrip: 0 },
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load drivers
      const driversRes = await bookingApi.getDrivers();
      const drivers = driversRes.success ? driversRes.data : [];
      
      // Load vehicles
      const vehiclesRes = await bookingApi.getVehicles();
      const vehicles = vehiclesRes.success ? vehiclesRes.data : [];
      
      // Load recent bookings
      const bookingsRes = await bookingApi.getRecentActivity(5);
      const recentBookings = bookingsRes.success ? bookingsRes.data : [];
      
      setStats({
        drivers: {
          total: drivers.length,
          available: drivers.filter(d => d.status === 'Available').length,
          onTrip: drivers.filter(d => d.status === 'On Trip').length
        },
        vehicles: {
          total: vehicles.length,
          available: vehicles.filter(v => v.status === 'Available').length,
          onTrip: vehicles.filter(v => v.status === 'On Trip').length
        },
        recentBookings
      });
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Management Dashboard</h1>
      <p className="text-gray-600 mb-8">Manage your drivers, vehicles, and operations</p>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/management/drivers" className="block">
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold">{stats.drivers.total}</h3>
                <p className="text-gray-600">Total Drivers</p>
                <div className="flex space-x-2 mt-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {stats.drivers.available} Available
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {stats.drivers.onTrip} On Trip
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/management/vehicles" className="block">
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold">{stats.vehicles.total}</h3>
                <p className="text-gray-600">Total Vehicles</p>
                <div className="flex space-x-2 mt-2">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {stats.vehicles.available} Available
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {stats.vehicles.onTrip} On Trip
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/booking/driver" className="block">
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-purple-600">Quick Assign</h3>
                <p className="text-gray-600">Assign driver to booking</p>
              </div>
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-2xl font-bold">Reports</h3>
              <p className="text-gray-600">View analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/management/drivers" className="block">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Drivers Management</h3>
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">Add, edit, or remove drivers from your fleet</p>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                View All Drivers
              </button>
              <button className="px-4 py-2 bg-white border border-blue-500 text-blue-700 rounded-lg text-sm font-medium">
                Add New
              </button>
            </div>
          </div>
        </Link>

        <Link href="/management/vehicles" className="block">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Vehicles Management</h3>
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">Manage your vehicle fleet and maintenance</p>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                View All Vehicles
              </button>
              <button className="px-4 py-2 bg-white border border-green-500 text-green-700 rounded-lg text-sm font-medium">
                Add New
              </button>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {stats.recentBookings.length > 0 ? (
            stats.recentBookings.map((activity, index) => (
              <div key={index} className="flex items-center p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-grow">
                  <p className="font-medium">{activity.message}</p>
                  <p className="text-sm text-gray-500">
                    Booking: {activity.bookingId} • {activity.customerName}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(activity.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}