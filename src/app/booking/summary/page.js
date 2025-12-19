'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/api';

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
    
    // Load all saved data
    const savedBooking = JSON.parse(localStorage.getItem('lastBooking') || '{}');
    const savedDriver = JSON.parse(localStorage.getItem('driverData') || '{}');
    const savedExpenses = JSON.parse(localStorage.getItem('expensesData') || '{}');
    const savedCalculations = JSON.parse(localStorage.getItem('calculations') || '{}');
    
    setBookingData(savedBooking);
    setDriverData(savedDriver);
    setExpensesData(savedExpenses);
    setCalculations(savedCalculations);
  }, [router]);

  const handleFinish = () => {
    // Show success message
    alert('✅ Trip completed successfully! Data saved to Google Sheets.');
    
    // Clear localStorage for this booking
    localStorage.removeItem('currentBookingId');
    localStorage.removeItem('lastBooking');
    localStorage.removeItem('driverData');
    localStorage.removeItem('expensesData');
    localStorage.removeItem('calculations');
    
    // Go to dashboard
    router.push('/dashboard');
  };

  const printSummary = () => {
    const printContent = `
      <html>
        <head>
          <title>Trip Summary - ${bookingId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
            .row { display: flex; margin-bottom: 8px; }
            .col { flex: 1; }
            .amount { text-align: right; font-weight: bold; }
            .total { font-weight: bold; background: #f0f0f0; padding: 10px; }
            .profit-positive { color: green; }
            .profit-negative { color: red; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PARV Tour & Travels</h1>
            <h2>Trip Summary Report</h2>
            <p>Booking ID: ${bookingId} | Date: ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Details</div>
            <div class="row">
              <div class="col">Customer Name:</div>
              <div class="col">${bookingData.customerName || 'N/A'}</div>
            </div>
            <div class="row">
              <div class="col">Phone:</div>
              <div class="col">${bookingData.phone || 'N/A'}</div>
            </div>
            <div class="row">
              <div class="col">From:</div>
              <div class="col">${bookingData.from || 'N/A'}</div>
            </div>
            <div class="row">
              <div class="col">To:</div>
              <div class="col">${bookingData.to || 'N/A'}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Financial Summary</div>
            <div class="row">
              <div class="col">Booking Amount:</div>
              <div class="col amount">₹${bookingData.bookingAmount || '0'}</div>
            </div>
            <div class="row">
              <div class="col">Advance Paid:</div>
              <div class="col amount">₹${bookingData.advance || '0'}</div>
            </div>
            <div class="row">
              <div class="col">Total Expenses:</div>
              <div class="col amount">₹${calculations.totalExpenses || '0'}</div>
            </div>
            <div class="row total">
              <div class="col">Net Profit:</div>
              <div class="col amount ${calculations.netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                ₹${calculations.netProfit || '0'}
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
            <p>PARV Tour & Travels - Professional Travel Solutions</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Trip Summary</h1>
              <p className="text-gray-600 mt-2">
                Booking ID: <span className="font-mono font-medium text-blue-600">{bookingId}</span>
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={printSummary}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                🖨️ Print Summary
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Success Banner */}
          <div className="mb-8 p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
            <div className="flex items-center text-white">
              <div className="mr-4 text-3xl">✅</div>
              <div>
                <h3 className="text-xl font-bold">Trip Completed Successfully!</h3>
                <p className="text-green-100">All data has been saved to Google Sheets.</p>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(bookingData.bookingAmount || 0)}
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 p-6 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600">Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(calculations.totalExpenses || 0)}
                </p>
              </div>
            </div>
            
            <div className={`p-6 rounded-lg ${
              calculations.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="text-center">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${
                  calculations.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(calculations.netProfit || 0)}
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(calculations.outstanding || 0)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Details Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Customer Details */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 Customer Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{bookingData.customerName || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{bookingData.phone || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{bookingData.from || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{bookingData.to || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {/* Trip Details */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🚗 Trip Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="font-medium">{bookingData.vehicle || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Driver:</span>
                    <span className="font-medium">{driverData.driverName || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium text-blue-600">{calculations.totalKM || 0} km</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Financial Summary */}
              <div className="bg-gradient-to-b from-green-50 to-green-100 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Financial Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-gray-700">Booking Amount</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(bookingData.bookingAmount || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-gray-700">Total Expenses</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(calculations.totalExpenses || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-gray-700">Advance Paid</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(bookingData.advance || 0)}
                    </span>
                  </div>
                  
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    calculations.netProfit >= 0 ? 'bg-green-200' : 'bg-red-200'
                  }`}>
                    <span className="font-medium">Net Profit</span>
                    <span className={`text-xl font-bold ${
                      calculations.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(calculations.netProfit || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-yellow-100 rounded-lg">
                    <span className="font-medium">Outstanding Amount</span>
                    <span className="text-xl font-bold text-yellow-600">
                      {formatCurrency(calculations.outstanding || 0)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* What's Next */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 What's Next?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">1</div>
                    <span>Collect outstanding amount from customer: <strong>{formatCurrency(calculations.outstanding || 0)}</strong></span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">2</div>
                    <span>Make payment to driver</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">3</div>
                    <span>Update vehicle maintenance records</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="pt-8 mt-8 border-t">
            <div className="flex justify-center">
              <button
                onClick={handleFinish}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 text-lg font-medium"
              >
                🎉 Finish & Go to Dashboard
              </button>
            </div>
            
            <div className="text-center mt-6">
              <button
                onClick={() => router.push('/booking/calculation')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Back to Calculations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}