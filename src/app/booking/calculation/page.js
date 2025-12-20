'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { bookingApi, formatCurrency, formatDate } from '@/lib/api';
import { TravelBackground } from '@/components/TravelBackground';
import { motion } from 'framer-motion';

export default function CalculationPage() {
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const id = localStorage.getItem('currentBookingId');
      
      if (!id) {
        router.push('/booking/entry');
        return;
      }
      
      setBookingId(id);
      
      // Load booking details
      const bookingRes = await bookingApi.getById(id);
      
      // Load calculations from localStorage
      const savedCalculations = JSON.parse(localStorage.getItem('calculations') || '{}');
      const expensesData = JSON.parse(localStorage.getItem('expensesData') || '{}');
      const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
      
      if (bookingRes.success) {
        setBooking(bookingRes.data);
      } else {
        // Fallback: Use last booking from localStorage
        const lastBooking = JSON.parse(localStorage.getItem('lastBooking') || '{}');
        if (lastBooking.bookingId === id) {
          setBooking(lastBooking);
        }
      }
      
      // Set calculations
      setCalculations({
        ...savedCalculations,
        ...expensesData,
        ...driverData
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = () => {
    if (!booking || !calculations) return { profit: 0, margin: 0 };
    
    const revenue = parseFloat(booking.bookingAmount) || 0;
    const expenses = parseFloat(calculations.totalExpenses) || 0;
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    return {
      profit: parseFloat(profit.toFixed(2)),
      margin: parseFloat(margin.toFixed(2))
    };
  };

  const handleCalculate = async () => {
    try {
      setSaving(true);
      
      const result = await bookingApi.calculate(bookingId);
      
      if (result.success) {
        showNotification('✅ Profit calculated and saved to database!', 'success');
        
        // Update local state with new calculations
        if (result.data) {
          setCalculations(prev => ({
            ...prev,
            netProfit: result.data.netProfit,
            outstanding: result.data.outstanding
          }));
        }
        
        // Mark as completed
        await bookingApi.updateStatus(bookingId, 'completed', 'Profit calculated');
        
      } else {
        showNotification(`⚠️ ${result.error || 'Failed to calculate profit'}`, 'warning');
      }
    } catch (error) {
      console.error('Error calculating profit:', error);
      showNotification('❌ Error calculating profit', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (window.confirm('Mark this booking as completed and finalize all calculations?')) {
      try {
        setSaving(true);
        
        // First calculate profit
        const calcResult = await bookingApi.calculate(bookingId);
        
        if (calcResult.success) {
          // Update status to completed
          const statusResult = await bookingApi.updateStatus(bookingId, 'completed', 'Booking completed');
          
          if (statusResult.success) {
            showNotification('🏁 Booking completed successfully!', 'success');
            
            // Clear local storage for this booking
            localStorage.removeItem('currentBookingId');
            localStorage.removeItem('driverData');
            localStorage.removeItem('expensesData');
            localStorage.removeItem('calculations');
            
            // Redirect to dashboard after delay
            setTimeout(() => {
              router.push('/');
            }, 2000);
          } else {
            showNotification('⚠️ Could not update status', 'warning');
          }
        } else {
          showNotification('⚠️ Could not calculate profit', 'warning');
        }
      } catch (error) {
        console.error('Error completing booking:', error);
        showNotification('❌ Error completing booking', 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
      type === 'success' ? 'bg-emerald-500 text-white' :
      type === 'warning' ? 'bg-amber-500 text-white' :
      'bg-rose-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">${type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✗'}</span>
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

  if (loading) {
    return (
      <TravelBackground variant="minimal">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading calculations...</p>
          </div>
        </div>
      </TravelBackground>
    );
  }

  if (!booking || !calculations) {
    return (
      <TravelBackground variant="minimal">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No booking data found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Please go back and add trip details first
            </p>
            <button
              onClick={() => router.push('/booking/entry')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              ← Back to Booking
            </button>
          </div>
        </div>
      </TravelBackground>
    );
  }

  const profitData = calculateProfit();
  const revenue = parseFloat(booking.bookingAmount) || 0;
  const advance = parseFloat(booking.advance) || 0;
  const balance = revenue - advance;

  return (
    <TravelBackground variant="minimal">
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
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                    Profit Calculation
                  </h1>
                  <p className="text-gray-600 mt-2">Finalize trip calculations and complete booking</p>
                  <div className="flex items-center mt-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      Booking ID: <span className="font-mono ml-2 font-semibold">{bookingId}</span>
                    </div>
                    <span className="mx-3 text-gray-300">•</span>
                    <div className="text-sm text-gray-500">
                      Customer: {booking.customerName}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50/50 transition-colors backdrop-blur-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Report
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Calculation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Revenue Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">💰</span>
                Revenue Details
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(revenue)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Advance Paid</span>
                  <span className="text-lg font-semibold text-blue-600">{formatCurrency(advance)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Balance Due</span>
                  <span className={`text-xl font-bold ${balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Expenses Card */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">📊</span>
                Trip Expenses
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fuel Cost</span>
                  <span className="font-medium">{formatCurrency(calculations.fuelCost || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Driver Payment</span>
                  <span className="font-medium">{formatCurrency(calculations.driverPayment || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Toll Charges</span>
                  <span className="font-medium">{formatCurrency(calculations.toll || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Other Expenses</span>
                  <span className="font-medium">{formatCurrency(calculations.otherExpenses || 0)}</span>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">Total Expenses</span>
                    <span className="text-2xl font-bold text-red-600">{formatCurrency(calculations.totalExpenses || 0)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Profit Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">📈</span>
                Profit Calculation
              </h2>
              
              <div className="text-center py-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Revenue - Expenses = Profit</p>
                  <p className="text-lg font-mono">
                    {formatCurrency(revenue)} - {formatCurrency(calculations.totalExpenses || 0)}
                  </p>
                </div>
                
                <div className="py-4">
                  <p className="text-sm text-gray-600 mb-2">Net Profit</p>
                  <p className={`text-4xl font-bold ${profitData.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(profitData.profit)}
                  </p>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
                  <p className={`text-xl font-semibold ${profitData.margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {profitData.margin.toFixed(2)}%
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Trip Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">Trip Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Distance Traveled</p>
                <p className="text-lg font-semibold text-blue-600">{calculations.distance || 0} km</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Vehicle Average</p>
                <p className="text-lg font-semibold text-blue-600">{calculations.vehicleAverage || '12'} km/L</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Fuel Consumed</p>
                <p className="text-lg font-semibold text-blue-600">{calculations.liters?.toFixed(2) || 0} Liters</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Fuel Rate</p>
                <p className="text-lg font-semibold text-blue-600">₹{calculations.fuelRate || 0}/L</p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-semibold text-gray-800">Finalize Booking</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Save calculations and mark booking as completed
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/booking/expenses')}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  ← Edit Expenses
                </button>
                
                <button
                  onClick={handleCalculate}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Calculating...
                    </>
                  ) : (
                    '💰 Calculate Profit'
                  )}
                </button>
                
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl hover:from-emerald-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 flex items-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    '🏁 Complete Booking'
                  )}
                </button>
                
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </TravelBackground>
  );
}