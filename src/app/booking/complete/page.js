'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingApi } from '@/lib/api';
import Link from 'next/link';

export default function CompletePage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [calculations, setCalculations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profitResult, setProfitResult] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    if (!id) {
      router.push('/booking/entry');
      return;
    }
    setBookingId(id);
    
    const savedCalculations = localStorage.getItem('calculations');
    if (savedCalculations) {
      setCalculations(JSON.parse(savedCalculations));
    }
    
    // Auto-calculate profit
    calculateProfit(id);
  }, [router]);

  const calculateProfit = async (id) => {
    setLoading(true);
    try {
      const result = await bookingApi.calculate(id);
      setProfitResult(result);
      
      if (result.success) {
        showNotification('✅ Profit calculated successfully!');
      }
    } catch (error) {
      console.error('Error calculating profit:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `custom-notification fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  };

  const handleNewBooking = () => {
    // Clear local storage data
    ['currentBookingId', 'lastBooking', 'driverData', 'expensesData', 'calculations'].forEach(key => {
      localStorage.removeItem(key);
    });
    router.push('/booking/entry');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Booking Complete! 🎉</h1>
          <p className="text-gray-600 mt-2">Booking ID: <span className="font-mono font-bold">{bookingId}</span></p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Success Message */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Process Completed!</h2>
              <p className="text-gray-600 mb-6">All details have been saved successfully to Google Sheets.</p>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleNewBooking}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create New Booking
                </button>
                <Link
                  href="/"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href={`/booking/${bookingId}`}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  View Booking Details
                </Link>
              </div>
            </div>
          </div>

          {/* Expense Summary */}
          {calculations && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Expense Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuel Cost</span>
                  <span className="font-medium">₹{calculations.fuelCost?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="font-medium text-red-600">₹{calculations.totalExpenses?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500">Saved at: {new Date(calculations.timestamp).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Profit Calculation */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Profit Calculation</h3>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">Calculating profit...</p>
              </div>
            ) : profitResult?.success ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Amount</span>
                  <span className="font-medium">₹{profitResult.bookingAmount || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="font-medium">₹{profitResult.totalExpenses || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Advance Paid</span>
                  <span className="font-medium">₹{profitResult.advance || '0'}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Outstanding</span>
                    <span className={`font-bold ${profitResult.outstanding >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{profitResult.outstanding || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="font-medium">Net Profit</span>
                    <span className={`text-xl font-bold ${profitResult.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{profitResult.netProfit || '0'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Profit calculation not available</p>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Next Steps</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Collect Payment</p>
                  <p className="text-sm text-gray-600">Collect remaining payment from customer</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Driver Settlement</p>
                  <p className="text-sm text-gray-600">Settle payment with driver</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Vehicle Check</p>
                  <p className="text-sm text-gray-600">Check vehicle condition and maintenance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.print()}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">🖨️</div>
              <p className="font-medium">Print Invoice</p>
            </button>
            
            <Link
              href="/reports"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📊</div>
              <p className="font-medium">View Reports</p>
            </Link>
            
            <button
              onClick={handleNewBooking}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">🚗</div>
              <p className="font-medium">New Booking</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}