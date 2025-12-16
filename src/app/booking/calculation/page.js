'use client';

import Stepper from '@/components/Stepper';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function CalculationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [calculations, setCalculations] = useState({
    bookingAmount: 0,
    advance: 0,
    totalExpenses: 0,
    outstanding: 0,
    netProfit: 0,
    totalKM: 0
  });

  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    if (!id) {
      router.push('/booking/entry');
      return;
    }
    setBookingId(id);
    
    calculateAll();
  }, []);

  const calculateAll = () => {
    // Get booking data
    const bookingData = JSON.parse(localStorage.getItem('lastBooking') || '{}');
    const expensesData = JSON.parse(localStorage.getItem('expensesData') || '{}');
    const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
    
    const bookingAmount = parseFloat(bookingData.bookingAmount) || 0;
    const advance = parseFloat(bookingData.advance) || 0;
    
    // Calculate expenses
    const fuelRate = parseFloat(expensesData.fuelRate) || 0;
    const liters = parseFloat(expensesData.liters) || 0;
    const fuelCost = fuelRate * liters;
    const toll = parseFloat(expensesData.toll) || 0;
    const driverPayment = parseFloat(expensesData.driverPayment) || 0;
    const otherExpenses = parseFloat(expensesData.otherExpenses) || 0;
    const totalExpenses = fuelCost + toll + driverPayment + otherExpenses;
    
    // Calculate KM
    const startKM = parseFloat(driverData.startKM) || 0;
    const endKM = parseFloat(expensesData.endKM) || 0;
    const totalKM = endKM > startKM ? endKM - startKM : 0;
    
    // Calculate profit
    const outstanding = bookingAmount - advance - totalExpenses;
    const netProfit = bookingAmount - totalExpenses;
    
    setCalculations({
      bookingAmount,
      advance,
      totalExpenses,
      outstanding,
      netProfit,
      totalKM
    });
  };

  const handleCalculate = async () => {
    setLoading(true);
    
    try {
      // Submit to Google Sheets
      const dataToSubmit = {
        action: 'calculate',
        bookingId: bookingId
      };
      
      const form = new FormData();
      Object.keys(dataToSubmit).forEach(key => {
        form.append(key, dataToSubmit[key]);
      });
      
      await fetch('https://script.google.com/macros/s/AKfycbxaaduFrb32moQlbvYCI3yspti0A2OMa-YmjFCzIaYxYPvg2zWP0VCMzL5paKolGtRX/exec', {
        method: 'POST',
        mode: 'no-cors',
        body: form
      });
      
      // Save calculations
      localStorage.setItem('calculations', JSON.stringify(calculations));
      
      alert('✅ Calculation completed!');
      router.push('/booking/summary');
      
    } catch (error) {
      console.error('Error:', error);
      alert('Calculations saved locally. Proceeding to summary...');
      localStorage.setItem('calculations', JSON.stringify(calculations));
      router.push('/booking/summary');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div>
      <Stepper />
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Calculation</h2>
        
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <p className="font-medium">Booking ID: {bookingId}</p>
          <p className="text-sm text-gray-600">Review and calculate trip profitability</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Revenue Section */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Revenue
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-700">Booking Amount</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(calculations.bookingAmount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-700">Advance Received</span>
                <span className="text-lg font-medium text-blue-600">
                  {formatCurrency(calculations.advance)}
                </span>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Expenses
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-700">Total Expenses</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(calculations.totalExpenses)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-700">Total KM</span>
                <span className="text-lg font-medium text-purple-600">
                  {calculations.totalKM} km
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Calculation */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Profit Calculation</h3>
          
          <div className="max-w-md mx-auto space-y-6">
            {/* Net Profit */}
            <div className={`flex justify-between items-center p-4 rounded-lg ${
              calculations.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <div>
                <div className="font-semibold text-gray-700">Net Profit</div>
                <div className="text-sm text-gray-600">Booking Amount - Total Expenses</div>
              </div>
              <div className={`text-2xl font-bold ${
                calculations.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(calculations.netProfit)}
              </div>
            </div>
            
            {/* Outstanding */}
            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-700">Outstanding Amount</div>
                <div className="text-sm text-gray-600">To be collected from customer</div>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(calculations.outstanding)}
              </div>
            </div>
            
            {/* Profit Margin */}
            {calculations.bookingAmount > 0 && (
              <div className="flex justify-between items-center p-4 bg-blue-100 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-700">Profit Margin</div>
                  <div className="text-sm text-gray-600">(Profit / Revenue) × 100</div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {((calculations.netProfit / calculations.bookingAmount) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={() => router.push('/booking/expenses')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={calculateAll}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Re-calculate
            </button>
            
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Complete Calculation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}