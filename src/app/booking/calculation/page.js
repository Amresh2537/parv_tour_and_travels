'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { bookingApi, tripCalculator } from '@/lib/api';

export default function CalculationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [bookingId, setBookingId] = useState('');
  
  // Calculations state
  const [calculations, setCalculations] = useState({
    bookingAmount: 0,
    advance: 0,
    totalExpenses: 0,
    outstanding: 0,
    netProfit: 0,
    totalKM: 0,
    fuelLiters: 0,
    fuelCost: 0
  });

  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    if (!id) {
      router.push('/booking/entry');
      return;
    }
    setBookingId(id);
    loadAndCalculate();
  }, [router]);

  const loadAndCalculate = () => {
    // Load all saved data
    const savedBooking = JSON.parse(localStorage.getItem('lastBooking') || '{}');
    const savedDriver = JSON.parse(localStorage.getItem('driverData') || '{}');
    const savedExpenses = JSON.parse(localStorage.getItem('expensesData') || '{}');
    
    // Extract values
    const bookingAmount = parseFloat(savedBooking.bookingAmount) || 0;
    const advance = parseFloat(savedBooking.advance) || 0;
    const startKM = parseFloat(savedDriver.startKM) || 0;
    const endKM = parseFloat(savedExpenses.endKM) || 0;
    const vehicleAverage = parseFloat(savedDriver.vehicleAverage) || 12;
    const fuelRate = parseFloat(savedExpenses.fuelRate) || 0;
    const toll = parseFloat(savedExpenses.toll) || 0;
    const driverPayment = parseFloat(savedExpenses.driverPayment) || 0;
    const otherExpenses = parseFloat(savedExpenses.otherExpenses) || 0;
    
    // Calculate distance
    const totalKM = endKM > startKM ? endKM - startKM : 0;
    
    // Calculate fuel (automatic from vehicle average)
    const fuelCalc = tripCalculator.calculateFuel(startKM, endKM, vehicleAverage, fuelRate);
    const fuelLiters = fuelCalc.liters;
    const fuelCost = fuelCalc.cost;
    
    // Total expenses
    const totalExpenses = fuelCost + toll + driverPayment + otherExpenses;
    
    // Profit calculations
    const netProfit = bookingAmount - totalExpenses;
    const outstanding = bookingAmount - advance - totalExpenses;
    
    setCalculations({
      bookingAmount,
      advance,
      totalExpenses,
      outstanding,
      netProfit,
      totalKM,
      fuelLiters,
      fuelCost
    });
  };

  const handleCalculate = async () => {
    setCalculating(true);
    
    try {
      // Save calculations to localStorage
      localStorage.setItem('calculations', JSON.stringify({
        ...calculations,
        bookingId,
        timestamp: new Date().toISOString()
      }));
      
      // Update status in Google Sheets
      const result = await bookingApi.calculate(bookingId);
      
      if (result.success) {
        alert('✅ Calculations saved to Google Sheets!');
      } else {
        alert('⚠️ Calculations saved locally. Google Sheets update may need manual check.');
      }
      
      // Navigate to summary
      router.push('/booking/summary');
      
    } catch (error) {
      console.error('Error:', error);
      alert('⚠️ Error saving calculations. Proceeding to summary...');
      router.push('/booking/summary');
    } finally {
      setCalculating(false);
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Profit Calculation</h1>
          <p className="text-gray-600 mt-2">
            Booking ID: <span className="font-mono font-medium text-blue-600">{bookingId}</span>
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculations.bookingAmount)}
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(calculations.totalExpenses)}
                </p>
              </div>
            </div>
            
            <div className={`p-6 rounded-lg border ${
              calculations.netProfit >= 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'
            }`}>
              <div className="text-center">
                <p className="text-sm text-gray-600">Net Profit/Loss</p>
                <p className={`text-2xl font-bold ${
                  calculations.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(calculations.netProfit)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Detailed Breakdown */}
          <div className="space-y-6">
            {/* Revenue Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Revenue</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded border">
                  <p className="text-sm text-gray-600">Booking Amount</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(calculations.bookingAmount)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <p className="text-sm text-gray-600">Advance Received</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(calculations.advance)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Expenses Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 Expenses Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded border">
                  <p className="text-sm text-gray-600">Fuel Cost</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(calculations.fuelCost)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {calculations.fuelLiters.toFixed(2)} liters
                  </p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <p className="text-sm text-gray-600">Driver Payment</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(calculations.totalExpenses - calculations.fuelCost)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Distance & Efficiency */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📏 Trip Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded border">
                  <p className="text-sm text-gray-600">Distance Traveled</p>
                  <p className="text-xl font-bold text-blue-600">
                    {calculations.totalKM} km
                  </p>
                </div>
                <div className="bg-white p-4 rounded border">
                  <p className="text-sm text-gray-600">Cost per Kilometer</p>
                  <p className="text-xl font-bold text-purple-600">
                    {calculations.totalKM > 0 ? formatCurrency(calculations.totalExpenses / calculations.totalKM) : '₹0'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Final Calculations */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📊 Final Calculations</h3>
              
              <div className="space-y-4 max-w-md mx-auto">
                <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow">
                  <div>
                    <p className="font-medium">Outstanding Amount</p>
                    <p className="text-sm text-gray-600">To collect from customer</p>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(calculations.outstanding)}
                  </p>
                </div>
                
                {calculations.bookingAmount > 0 && (
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow">
                    <div>
                      <p className="font-medium">Profit Margin</p>
                      <p className="text-sm text-gray-600">Efficiency ratio</p>
                    </div>
                    <p className={`text-2xl font-bold ${
                      (calculations.netProfit / calculations.bookingAmount * 100) >= 20 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {((calculations.netProfit / calculations.bookingAmount) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between pt-8 mt-8 border-t">
            <button
              onClick={() => router.push('/booking/expenses')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ← Back to Expenses
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={loadAndCalculate}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ↻ Recalculate
              </button>
              
              <button
                onClick={handleCalculate}
                disabled={calculating}
                className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {calculating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save & View Summary →'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}