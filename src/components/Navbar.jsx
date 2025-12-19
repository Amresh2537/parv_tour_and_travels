'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { bookingApi } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Refs for dropdowns
  const statusMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setShowStatusMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowStatusMenu(false);
        setShowProfileMenu(false);
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Bookings', href: '/booking/entry' },
    { name: 'Vehicles', href: '/vehicles' },
    { name: 'Drivers', href: '/drivers' },
    { name: 'Reports', href: '/reports' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'driver_assigned', label: 'Driver Assigned' },
    { value: 'expenses_added', label: 'Expenses Added' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setShowStatusMenu(false);
    if (pathname === '/') {
      router.push(`/?status=${status}`);
      router.refresh();
    }
  };

  const handleStatusEdit = async () => {
    const bookingId = prompt('Enter Booking ID to edit status:');
    if (!bookingId) return;

    const currentStatus = prompt('Current status of booking:');
    const newStatus = prompt(`Enter new status for ${bookingId}:\n\nOptions:\n- pending\n- confirmed\n- driver_assigned\n- expenses_added\n- completed\n- cancelled`);
    
    if (newStatus && newStatus !== currentStatus) {
      if (confirm(`Change status from "${currentStatus}" to "${newStatus}"?`)) {
        setIsLoading(true);
        try {
          const result = await bookingApi.updateStatus(bookingId, newStatus);
          if (result.success) {
            alert(`✅ Status updated successfully!\nBooking: ${bookingId}\nNew Status: ${newStatus}`);
            router.refresh();
          } else {
            alert(`❌ Failed: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error:', error);
          alert('⚠️ Error updating status');
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleCancelBooking = async () => {
    const bookingId = prompt('Enter Booking ID to cancel:');
    if (!bookingId) return;

    const reason = prompt('Reason for cancellation:');
    if (!reason) return;

    if (confirm(`Are you sure you want to cancel booking ${bookingId}?\nReason: ${reason}`)) {
      setIsLoading(true);
      try {
        const result = await bookingApi.cancelBooking(bookingId, reason);
        if (result.success) {
          alert(`✅ Booking cancelled successfully!\nID: ${bookingId}\nReason: ${reason}`);
          router.refresh();
        } else {
          alert(`❌ Failed: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('⚠️ Error cancelling booking');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleQuickActions = (action) => {
    switch(action) {
      case 'new_booking':
        router.push('/booking/entry');
        break;
      case 'view_all':
        router.push('/?status=all');
        break;
      case 'pending_only':
        router.push('/?status=pending');
        break;
      case 'completed_only':
        router.push('/?status=completed');
        break;
      case 'today_report':
        router.push('/reports?period=today');
        break;
    }
  };

  return (
    <nav className="bg-[#1a2332] border-b border-[#2d3748] sticky top-0 z-50" style={{ fontFamily: 'Inter, -apple-system, system-ui, sans-serif' }}>
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex justify-between items-center h-14">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 bg-[#2d5bff] rounded flex items-center justify-center">
                <span className="text-white font-semibold text-sm">P</span>
              </div>
              <div className="hidden md:block">
                <span className="text-sm font-semibold text-white tracking-tight">PARV Tour & Travels</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 text-[13px] font-medium rounded ${
                  pathname === item.href
                    ? 'bg-[#2d5bff] text-white'
                    : 'text-[#a0aec0] hover:text-white hover:bg-[#2d3748]'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-[#a0aec0] hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Right Side Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Status Management Dropdown */}
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isLoading}
                className="flex items-center px-3 py-1.5 bg-[#2d3748] hover:bg-[#374151] text-[#e2e8f0] rounded text-[13px] font-medium disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Status Tools
                    <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              {showStatusMenu && !isLoading && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-[#e2e8f0] z-50">
                  <div className="p-3 border-b border-[#e2e8f0]">
                    <h4 className="text-sm font-semibold text-[#1a2332]">Quick Actions</h4>
                    <p className="text-xs text-[#718096] mt-0.5">Manage bookings & status</p>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={handleStatusEdit}
                      className="w-full flex items-center px-3 py-2 text-[13px] text-[#1a2332] hover:bg-[#f7fafc] rounded"
                    >
                      <svg className="w-4 h-4 mr-2 text-[#2d5bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Booking Status
                    </button>
                    
                    <button
                      onClick={handleCancelBooking}
                      className="w-full flex items-center px-3 py-2 text-[13px] text-[#e53e3e] hover:bg-[#fff5f5] rounded"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cancel Booking
                    </button>
                  </div>

                  <div className="p-3 border-t border-[#e2e8f0]">
                    <label className="block text-xs font-medium text-[#4a5568] mb-1.5">Filter Bookings:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => handleStatusFilter(e.target.value)}
                      className="w-full text-[13px] border border-[#cbd5e0] rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2d5bff] focus:border-transparent"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 border-t border-[#e2e8f0] bg-[#f7fafc]">
                    <label className="block text-xs font-medium text-[#4a5568] mb-2">Quick Links:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleQuickActions('new_booking')}
                        className="text-xs px-3 py-1.5 bg-[#2d5bff] text-white hover:bg-[#2451e6] rounded"
                      >
                        New Booking
                      </button>
                      <button
                        onClick={() => handleQuickActions('pending_only')}
                        className="text-xs px-3 py-1.5 bg-white border border-[#cbd5e0] text-[#4a5568] hover:bg-[#edf2f7] rounded"
                      >
                        Pending Only
                      </button>
                      <button
                        onClick={() => handleQuickActions('completed_only')}
                        className="text-xs px-3 py-1.5 bg-white border border-[#cbd5e0] text-[#4a5568] hover:bg-[#edf2f7] rounded"
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => handleQuickActions('today_report')}
                        className="text-xs px-3 py-1.5 bg-white border border-[#cbd5e0] text-[#4a5568] hover:bg-[#edf2f7] rounded"
                      >
                        Today's Report
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-[#a0aec0] hover:text-white hover:bg-[#2d3748] rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#e53e3e] rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 hover:bg-[#2d3748] px-2 py-1.5 rounded"
              >
                <div className="w-7 h-7 bg-[#2d5bff] rounded-full flex items-center justify-center">
                  <span className="font-semibold text-white text-xs">A</span>
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[13px] font-medium text-white leading-tight">Admin User</p>
                  <p className="text-[11px] text-[#a0aec0] leading-tight">Super Admin</p>
                </div>
                <svg className="w-3.5 h-3.5 text-[#a0aec0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-[#e2e8f0] z-50">
                  <div className="p-3 border-b border-[#e2e8f0]">
                    <p className="text-sm font-semibold text-[#1a2332]">Admin User</p>
                    <p className="text-xs text-[#718096]">admin@parvtravels.com</p>
                  </div>
                  <div className="p-2">
                    <Link href="/profile" className="block px-3 py-2 text-[13px] text-[#1a2332] hover:bg-[#f7fafc] rounded">
                      Profile Settings
                    </Link>
                    <Link href="/settings" className="block px-3 py-2 text-[13px] text-[#1a2332] hover:bg-[#f7fafc] rounded">
                      System Settings
                    </Link>
                    <Link href="/logs" className="block px-3 py-2 text-[13px] text-[#1a2332] hover:bg-[#f7fafc] rounded">
                      Activity Logs
                    </Link>
                    <button className="block w-full text-left px-3 py-2 text-[13px] text-[#e53e3e] hover:bg-[#fff5f5] rounded mt-1 border-t border-[#e2e8f0]">
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-[#2d3748]" ref={mobileMenuRef}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-[13px] font-medium rounded ${
                    pathname === item.href
                      ? 'bg-[#2d5bff] text-white'
                      : 'text-[#a0aec0] hover:text-white hover:bg-[#2d3748]'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
            <div className="px-4 py-3 border-t border-[#2d3748]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#2d5bff] rounded-full flex items-center justify-center">
                  <span className="font-semibold text-white text-xs">A</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-[#a0aec0]">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}