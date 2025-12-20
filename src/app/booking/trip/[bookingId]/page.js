'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingApi, formatCurrency, formatDate, statusManager } from '@/lib/api';
import { TravelBackground } from '@/components/TravelBackground';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function BookingTripPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId;
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backgroundVariant, setBackgroundVariant] = useState('road');

  useEffect(() => {
    fetchBookingDetails();
    
    // Set background based on vehicle type
    const variants = ['road', 'mountains', 'city', 'car', 'minimal'];
    setBackgroundVariant(variants[Math.floor(Math.random() * variants.length)]);
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getById(bookingId);
      
      if (response.success) {
        setBooking(response.data);
      } else {
        // Try to get from local storage if API fails
        const storedBooking = localStorage.getItem('lastBooking');
        if (storedBooking) {
          const parsedBooking = JSON.parse(storedBooking);
          if (parsedBooking.bookingId === bookingId) {
            setBooking(parsedBooking);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Booking Details - ${booking?.bookingId}`,
          text: `Check out booking details for ${booking?.customerName}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const getStatusInfo = (status) => {
    return statusManager.getStatusInfo(status);
  };

  const calculateBalance = () => {
    if (!booking) return 0;
    const total = parseFloat(booking.bookingAmount) || 0;
    const advance = parseFloat(booking.advance) || 0;
    return total - advance;
  };

  const calculateNetProfit = () => {
    if (!booking) return 0;
    const revenue = parseFloat(booking.bookingAmount) || 0;
    const expenses = parseFloat(booking.totalExpenses) || 0;
    return revenue - expenses;
  };

  if (loading) {
    return (
      <TravelBackground variant="road">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading booking details...</p>
          </div>
        </div>
      </TravelBackground>
    );
  }

  if (!booking) {
    return (
      <TravelBackground variant="road">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Booking not found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              The booking you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </TravelBackground>
    );
  }

  const statusInfo = getStatusInfo(booking.status);
  const balance = calculateBalance();
  const netProfit = calculateNetProfit();

  return (
    <TravelBackground variant={backgroundVariant}>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 md:p-8 shadow-xl border border-white/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <div className="flex items-center mb-4">
                    <Link
                      href="/"
                      className="mr-4 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </Link>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        Booking Summary
                      </h1>
                      <p className="text-gray-600 mt-1">Complete details of booking #{booking.bookingId}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border} flex items-center`}>
                      <span className="mr-2">{statusInfo.icon}</span>
                      {statusInfo.label}
                    </span>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">📅</span>
                      Created: {formatDate(booking.createdAt || booking.date)}
                    </div>
                    
                    {booking.time && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">⏰</span>
                        Time: {booking.time}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex space-x-3">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50/50 transition-colors backdrop-blur-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Booking Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Customer & Journey Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <span className="mr-2">👤</span>
                    Customer Information
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Customer Name</span>
                      <span className="font-semibold text-gray-800">{booking.customerName}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Phone Number</span>
                      <span className="font-semibold text-blue-600">{booking.phone}</span>
                    </div>
                    
                    {booking.passengers > 0 && (
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-gray-600">Passengers</span>
                        <span className="font-semibold text-gray-800">{booking.passengers} persons</span>
                      </div>
                    )}
                    
                    {booking.notes && (
                      <div className="pt-3">
                        <span className="text-gray-600 block mb-2">Notes</span>
                        <p className="text-gray-800 bg-gray-50/70 p-3 rounded-lg">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <span className="mr-2">📍</span>
                    Journey Details
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="w-0.5 h-8 bg-blue-300 mx-auto"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="mb-2">
                          <p className="text-sm text-gray-500 mb-1">From</p>
                          <p className="text-lg font-bold text-gray-800">{booking.from}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">To</p>
                          <p className="text-lg font-bold text-gray-800">{booking.to}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                        <p className="font-semibold text-gray-800">{booking.vehicle || 'Not specified'}</p>
                      </div>
                      
                      {booking.totalKM > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Distance</p>
                          <p className="font-semibold text-gray-800">{booking.totalKM} km</p>
                        </div>
                      )}
                    </div>
                    
                    {booking.tripType && (
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Trip Type</p>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                          {booking.tripType === 'one-way' ? 'One Way' : 
                           booking.tripType === 'round-trip' ? 'Round Trip' : 
                           booking.tripType === 'multi-city' ? 'Multi City' : booking.tripType}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Financial Summary */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className="mr-2">💰</span>
                  Financial Summary
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Booking Amount</span>
                    <span className="text-2xl font-bold text-green-600">{formatCurrency(booking.bookingAmount || 0)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Advance Paid</span>
                    <span className="text-xl font-semibold text-blue-600">{formatCurrency(booking.advance || 0)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-gray-600">Balance Due</span>
                    <span className={`text-xl font-bold ${balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                  
                  {booking.totalExpenses > 0 && (
                    <>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-gray-600">Total Expenses</span>
                        <span className="text-xl font-semibold text-red-600">{formatCurrency(booking.totalExpenses || 0)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Net Profit</span>
                        <span className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(netProfit)}
                        </span>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Profit Margin</span>
                          <span className={`text-lg font-semibold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {booking.bookingAmount > 0 ? `${((netProfit / booking.bookingAmount) * 100).toFixed(1)}%` : '0%'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Driver & Expenses Details */}
              {booking.driverName && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <span className="mr-2">👨‍✈️</span>
                    Driver & Trip Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Driver Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Driver Name</p>
                          <p className="font-medium text-gray-800">{booking.driverName}</p>
                        </div>
                        
                        {booking.driverPhone && (
                          <div>
                            <p className="text-sm text-gray-500">Driver Phone</p>
                            <p className="font-medium text-gray-800">{booking.driverPhone}</p>
                          </div>
                        )}
                        
                        {booking.driverVehicle && (
                          <div>
                            <p className="text-sm text-gray-500">Assigned Vehicle</p>
                            <p className="font-medium text-gray-800">{booking.driverVehicle}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {booking.expensesData && booking.expensesData.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Expenses Breakdown</h3>
                        <div className="space-y-2">
                          {booking.expensesData.map((expense, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50/70 rounded-lg">
                              <span className="text-gray-700">{expense.category}</span>
                              <span className="font-semibold text-red-600">{formatCurrency(expense.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Column - Quick Actions & Timeline */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
                
                <div className="space-y-4">
                  <Link
                    href={`/booking/edit/${bookingId}`}
                    className="block w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-center font-medium"
                  >
                    ✏️ Edit Booking
                  </Link>
                  
                  {!booking.driverName && (
                    <Link
                      href={`/booking/driver/${bookingId}`}
                      className="block w-full px-4 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 rounded-xl hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200 text-center font-medium"
                    >
                      👨‍✈️ Assign Driver
                    </Link>
                  )}
                  
                  {booking.driverName && !booking.totalExpenses && (
                    <Link
                      href={`/booking/expenses/${bookingId}`}
                      className="block w-full px-4 py-3 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 rounded-xl hover:from-amber-100 hover:to-amber-200 transition-all duration-200 text-center font-medium"
                    >
                      💰 Add Expenses
                    </Link>
                  )}
                  
                  {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        if (confirm('Mark this booking as completed?')) {
                          // Implement complete booking logic
                          alert('Booking marked as completed!');
                        }
                      }}
                      className="block w-full px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 text-center font-medium"
                    >
                      ✅ Mark Completed
                    </button>
                  )}
                  
                  <button
                    onClick={() => router.push('/')}
                    className="block w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 text-center font-medium"
                  >
                    ← Back to Dashboard
                  </button>
                </div>
              </motion.div>

              {/* Booking Timeline */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">Booking Timeline</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="mr-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600">📋</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Booking Created</p>
                      <p className="text-sm text-gray-500">{formatDate(booking.createdAt || booking.date)}</p>
                    </div>
                  </div>
                  
                  {booking.confirmedAt && (
                    <div className="flex items-start">
                      <div className="mr-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-600">✅</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Booking Confirmed</p>
                        <p className="text-sm text-gray-500">{formatDate(booking.confirmedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {booking.driverAssignedAt && (
                    <div className="flex items-start">
                      <div className="mr-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600">👨‍✈️</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Driver Assigned</p>
                        <p className="text-sm text-gray-500">{formatDate(booking.driverAssignedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {booking.expensesAddedAt && (
                    <div className="flex items-start">
                      <div className="mr-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                          <span className="text-amber-600">💰</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Expenses Added</p>
                        <p className="text-sm text-gray-500">{formatDate(booking.expensesAddedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {booking.completedAt && (
                    <div className="flex items-start">
                      <div className="mr-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-600">🏁</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Trip Completed</p>
                        <p className="text-sm text-gray-500">{formatDate(booking.completedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Payment Status */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Status</h2>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Paid: {formatCurrency(booking.advance || 0)}</span>
                    <span>Due: {formatCurrency(balance)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full"
                      style={{ 
                        width: `${booking.bookingAmount > 0 ? ((booking.advance || 0) / booking.bookingAmount * 100) : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status</span>
                    <span className={`font-semibold ${
                      balance === 0 ? 'text-green-600' : 
                      balance < (booking.bookingAmount || 0) ? 'text-amber-600' : 
                      'text-gray-600'
                    }`}>
                      {balance === 0 ? 'Fully Paid' : 
                       balance < (booking.bookingAmount || 0) ? 'Partially Paid' : 
                       'Unpaid'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium text-gray-800">{booking.paymentMethod || 'Cash'}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-semibold text-gray-800">Booking #{booking.bookingId}</h3>
                <p className="text-gray-600 text-sm">Last updated: {formatDate(booking.updatedAt || booking.createdAt)}</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  ← Back to List
                </Link>
                
                <button
                  onClick={handlePrint}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                >
                  🖨️ Print Summary
                </button>
                
                <Link
                  href={`/booking/edit/${bookingId}`}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl hover:from-emerald-700 hover:to-green-800 transition-all duration-300"
                >
                  ✏️ Edit Booking
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </TravelBackground>
  );
}