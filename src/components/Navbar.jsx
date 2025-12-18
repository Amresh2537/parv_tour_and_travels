'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const navItems = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Bookings', href: '/booking/entry', icon: '📝' },
    { name: 'Vehicles', href: '/vehicles', icon: '🚗' },
    { name: 'Drivers', href: '/drivers', icon: '👨‍✈️' },
    { name: 'Reports', href: '/reports', icon: '📈' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', color: 'blue' },
    { value: 'driver_assigned', label: 'Driver Assigned', color: 'purple' },
    { value: 'expenses_added', label: 'Expenses Added', color: 'orange' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
  ];

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setShowStatusMenu(false);
    // Navigate with status filter or update global state
    router.push(`/?status=${status}`);
  };

  const handleCancelBooking = () => {
    // Add cancel booking logic here
    const bookingId = prompt('Enter Booking ID to cancel:');
    if (bookingId) {
      if (confirm(`Are you sure you want to cancel booking ${bookingId}?`)) {
        // Call cancel API
        alert(`Booking ${bookingId} cancelled successfully`);
      }
    }
  };

  const handleStatusEdit = () => {
    const bookingId = prompt('Enter Booking ID to edit status:');
    if (bookingId) {
      const newStatus = prompt('Enter new status (pending/confirmed/driver_assigned/expenses_added/completed/cancelled):');
      if (newStatus) {
        // Call update status API
        alert(`Booking ${bookingId} status updated to ${newStatus}`);
      }
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-blue-600 font-bold text-xl">P</span>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight">PARV Tour & Travels</span>
                <p className="text-xs text-blue-100 opacity-80">Professional Travel Solutions</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 rounded-lg mx-1 transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-white/20 backdrop-blur-sm shadow-inner'
                    : 'hover:bg-white/10'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            {/* Status Management Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Status Tools
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-3 border-b">
                    <h4 className="font-semibold text-gray-800">Status Management</h4>
                    <p className="text-xs text-gray-600 mt-1">Edit status or cancel bookings</p>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={handleStatusEdit}
                      className="w-full flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg mb-1"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Booking Status
                    </button>
                    
                    <button
                      onClick={handleCancelBooking}
                      className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cancel Booking
                    </button>
                  </div>

                  <div className="p-3 border-t">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Filter by Status:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 hover:opacity-90"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="font-bold">A</span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="font-medium text-sm">Admin User</p>
                  <p className="text-xs text-blue-100 opacity-80">Super Admin</p>
                </div>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b">
                    <p className="font-medium text-gray-800">Admin User</p>
                    <p className="text-sm text-gray-600">admin@parvtravels.com</p>
                  </div>
                  <div className="p-2">
                    <Link href="/profile" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                      Profile Settings
                    </Link>
                    <Link href="/settings" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                      System Settings
                    </Link>
                    <button className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg mt-1">
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-3 border-t border-white/20">
          <div className="flex justify-around">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center p-2 rounded-lg ${
                  pathname === item.href ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}