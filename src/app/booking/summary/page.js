'use client';

import Stepper from '@/components/Stepper';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SummaryPage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [bookingData, setBookingData] = useState({});
  const [driverData, setDriverData] = useState({});
  const [expensesData, setExpensesData] = useState({});
  const [calculations, setCalculations] = useState({});

  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    if (!id) {
      router.push('/booking/entry');
      return;
    }
    setBookingId(id);
    
    // Load all data
    setBookingData(JSON.parse(localStorage.getItem('lastBooking') || '{}'));
    setDriverData(JSON.parse(localStorage.getItem('driverData') || '{}'));
    setExpensesData(JSON.parse(localStorage.getItem('expensesData') || '{}'));
    setCalculations(JSON.parse(localStorage.getItem('calculations') || '{}'));
  }, []);

  const handleFinish = () => {
    // Clear booking data
    localStorage.removeItem('currentBookingId');
    localStorage.removeItem('lastBooking');
    localStorage.removeItem('driverData');
    localStorage.removeItem('expensesData');
    localStorage.removeItem('calculations');
    
    alert('✅ Trip completed successfully!');
    router.push('/');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const printSummary = () => {
    window.print();
  };

  return (
    <div>
      <Stepper />
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Trip Summary</h2>
            <p className="text-gray-600">Complete overview of the booking</p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={printSummary}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Summary
            </button>
          </div>
        </div>

        {/* Booking ID Header */}
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
          <div className="flex justify-between items-center text-white">
            <div>
              <div className="text-sm font-medium">Booking ID</div>
              <div className="text-2xl font-bold">{bookingId}</div>
            </div>
            <div className="text-right">
              <div className="text-sm">Status</div>
              <div className="text-lg font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full inline-block">
                Completed
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Trip Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Customer Details</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Name</div>
                    <div className="font-medium">{bookingData.customerName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Phone</div>
                    <div className="font-medium">{bookingData.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Date</div>
                    <div className="font-medium">{bookingData.date || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Trip Details</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Route</div>
                    <div className="font-medium">
                      {bookingData.from || 'N/A'} → {bookingData.to || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Vehicle</div>
                    <div className="font-medium">{bookingData.vehicle || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Distance</div>
                    <div className="font-medium">{calculations.totalKM || 0} km</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Details */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Driver Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Driver Name</div>
                  <div className="font-medium">{driverData.driverName || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-medium">{driverData.driverPhone || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">KM Readings</div>
                  <div className="font-medium">
                    {driverData.startKM || 0} → {expensesData.endKM || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Breakdown */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Expenses Breakdown</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded border">
                    <div className="text-sm text-gray-600">Fuel Cost</div>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency((expensesData.fuelRate || 0) * (expensesData.liters || 0))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {expensesData.fuelRate || 0} ₹/liter × {expensesData.liters || 0} liters
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded border">
                    <div className="text-sm text-gray-600">Toll Charges</div>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(expensesData.toll || 0)}
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded border">
                    <div className="text-sm text-gray-600">Driver Payment</div>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(expensesData.driverPayment || 0)}
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded border">
                    <div className="text-sm text-gray-600">Other Expenses</div>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(expensesData.otherExpenses || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="space-y-6">
            <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Financial Summary</h3>
              
              <div className="space-y-4">
                {/* Revenue */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Total Revenue</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculations.bookingAmount)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Booking Amount
                  </div>
                </div>
                
                {/* Expenses */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-600">Total Expenses</div>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(calculations.totalExpenses)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    All trip costs
                  </div>
                </div>
                
                {/* Net Profit */}
                <div className={`p-4 rounded-lg shadow-sm ${
                  calculations.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <div className="text-sm text-gray-700">Net Profit</div>
                  <div className={`text-3xl font-bold ${
                    calculations.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(calculations.netProfit)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {calculations.bookingAmount > 0 && 
                      `Margin: ${((calculations.netProfit / calculations.bookingAmount) * 100).toFixed(1)}%`
                    }
                  </div>
                </div>
                
                {/* Outstanding */}
                <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-700">Outstanding Amount</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(calculations.outstanding)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    To be collected from customer
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Trip Statistics</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance Traveled</span>
                  <span className="font-medium">{calculations.totalKM || 0} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost per KM</span>
                  <span className="font-medium">
                    {calculations.totalKM > 0 
                      ? formatCurrency(calculations.totalExpenses / calculations.totalKM)
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue per KM</span>
                  <span className="font-medium">
                    {calculations.totalKM > 0 
                      ? formatCurrency(calculations.bookingAmount / calculations.totalKM)
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Notes & Remarks</h3>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            placeholder="Add any additional notes or remarks about this trip..."
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={() => router.push('/booking/calculation')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back to Calculation
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              Save as Draft
            </button>
            
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Complete & Finish Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}