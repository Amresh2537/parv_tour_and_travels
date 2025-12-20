'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { bookingApi, tripCalculator } from '@/lib/api'; // ✅ tripCalculator import

export default function ExpensesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  
  // State for trip details
  const [tripData, setTripData] = useState({
    vehicle: '',
    vehicleAverage: '', // ✅ AVERAGE FIELD ADDED
    startKM: '',
    endKM: '',
    tripDate: new Date().toISOString().split('T')[0],
    fuelRate: '',
    toll: '',
    driverPayment: '',
    otherExpenses: '',
    maintenance: '',
    food: '',
    parking: ''
  });
  
  // State for calculated values
  const [calculations, setCalculations] = useState({
    fuelLiters: 0, // ✅ NEW: CALCULATED LITERS
    fuelCost: 0,
    totalExpenses: 0,
    distance: 0
  });

  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    if (!id) {
      router.push('/booking/entry');
      return;
    }
    setBookingId(id);
    
    // Load saved data from driver page
    const savedDriver = localStorage.getItem('driverData');
    const savedExpenses = localStorage.getItem('expensesData');
    
    if (savedDriver) {
      const driverData = JSON.parse(savedDriver);
      setTripData(prev => ({
        ...prev,
        startKM: driverData.startKM || '',
        vehicleAverage: driverData.vehicleAverage || '12' // ✅ Load average
      }));
    }
    
    if (savedExpenses) {
      const expensesData = JSON.parse(savedExpenses);
      setTripData(prev => ({ ...prev, ...expensesData }));
    }
    
    calculateTotals();
  }, [router]);

  const calculateTotals = () => {
    const distance = (parseFloat(tripData.endKM) || 0) - (parseFloat(tripData.startKM) || 0);
    
    // ✅ NEW: AUTO-CALCULATE FUEL BASED ON AVERAGE
    let fuelLiters = 0;
    let fuelCost = 0;
    
    if (distance > 0 && tripData.vehicleAverage) {
      fuelLiters = distance / parseFloat(tripData.vehicleAverage);
      fuelCost = fuelLiters * (parseFloat(tripData.fuelRate) || 0);
    }
    
    const toll = parseFloat(tripData.toll) || 0;
    const driverPayment = parseFloat(tripData.driverPayment) || 0;
    const otherExpenses = parseFloat(tripData.otherExpenses) || 0;
    const maintenance = parseFloat(tripData.maintenance) || 0;
    const food = parseFloat(tripData.food) || 0;
    const parking = parseFloat(tripData.parking) || 0;
    
    const total = fuelCost + toll + driverPayment + otherExpenses + maintenance + food + parking;
    
    setCalculations({
      distance: distance > 0 ? distance : 0,
      fuelLiters: parseFloat(fuelLiters.toFixed(2)),
      fuelCost: parseFloat(fuelCost.toFixed(2)),
      totalExpenses: parseFloat(total.toFixed(2))
    });
  };

  const handleChange = (e) => {
    const newData = {
      ...tripData,
      [e.target.name]: e.target.value
    };
    setTripData(newData);
    
    // Recalculate on field change
    setTimeout(() => calculateTotals(), 100);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Save to localStorage with calculated liters
    const dataToSave = {
      ...tripData,
      liters: calculations.fuelLiters,
      fuelCost: calculations.fuelCost
    };
    
    localStorage.setItem('expensesData', JSON.stringify(dataToSave));
    
    // Prepare data for API
    const apiData = {
      bookingId: bookingId,
      ...tripData,
      liters: calculations.fuelLiters,
      fuelCost: calculations.fuelCost,
      totalExpenses: calculations.totalExpenses,
      distance: calculations.distance
    };
    
    console.log('Sending trip data to API:', apiData);
    
    // Call API
    const result = await bookingApi.addExpenses(apiData);
    
    if (result.success) {
      // Save calculations
      localStorage.setItem('calculations', JSON.stringify({
        ...calculations,
        bookingId: bookingId,
        timestamp: new Date().toISOString()
      }));
      
      showNotification(`✅ Trip & Expenses saved! Fuel: ${calculations.fuelLiters}L @ ₹${calculations.fuelCost.toFixed(2)}`);
      
      // 🔥 CHANGE THIS: Redirect to calculation page
      setTimeout(() => {
        router.push('/booking/calculation');
      }, 1500);
      
    } else {
      showNotification(`⚠️ Saved locally. API error: ${result.error || 'Unknown'}`, 'warning');
      
      // 🔥 CHANGE THIS: Also redirect to calculation page
      setTimeout(() => {
        router.push('/booking/calculation');
      }, 2000);
    }
    
  } catch (error) {
    console.error('Error:', error);
    showNotification('⚠️ Trip saved locally only.', 'warning');
    
    // 🔥 CHANGE THIS: Still redirect to calculation page
    setTimeout(() => {
      router.push('/booking/calculation');
    }, 1500);
    
  } finally {
    setLoading(false);
  }
};

  const showNotification = (message, type = 'success') => {
    const existing = document.querySelectorAll('.custom-notification');
    existing.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `custom-notification fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'warning' ? 'bg-yellow-500 text-white' : 
      'bg-red-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌'}</span>
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Add Trip & Expenses</h1>
          <p className="text-gray-600">Booking ID: <span className="font-mono font-medium">{bookingId}</span></p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Summary Card */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Distance</p>
                <p className="text-lg font-bold text-blue-600">{calculations.distance} km</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Vehicle Average</p>
                <p className="text-lg font-bold text-blue-600">{tripData.vehicleAverage || '12'} km/L</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Fuel Required</p>
                <p className="text-lg font-bold text-blue-600">{calculations.fuelLiters.toFixed(2)} L</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-lg font-bold text-red-600">₹{calculations.totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 🚗 Trip Details Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Trip Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Average *
                  </label>
                  <input
                    type="number"
                    name="vehicleAverage"
                    value={tripData.vehicleAverage}
                    onChange={handleChange}
                    required
                    min="1"
                    step="0.1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 12 km/L"
                  />
                  <p className="text-sm text-gray-500 mt-2">Kilometers per liter (from driver page)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start KM Reading *
                  </label>
                  <input
                    type="number"
                    name="startKM"
                    value={tripData.startKM}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 45000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End KM Reading *
                  </label>
                  <input
                    type="number"
                    name="endKM"
                    value={tripData.endKM}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 45250"
                  />
                </div>

                <div className="flex items-end">
                  <div className="w-full p-3 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-600">Distance Traveled</p>
                    <p className="text-lg font-bold text-blue-600">
                      {calculations.distance} km
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ⛽ Fuel Calculation Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Fuel Calculation</h3>
              
              <div className="bg-yellow-50 p-6 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Formula</p>
                    <p className="font-medium">
                      (End KM - Start KM) ÷ Vehicle Average
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Calculation</p>
                    <p className="font-medium">
                      ({tripData.endKM || 0} - {tripData.startKM || 0}) ÷ {tripData.vehicleAverage || 12}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Fuel Required</p>
                    <p className="text-xl font-bold text-green-600">
                      {calculations.fuelLiters.toFixed(2)} Liters
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Rate (₹ per liter) *
                  </label>
                  <input
                    type="number"
                    name="fuelRate"
                    value={tripData.fuelRate}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 98.50"
                  />
                </div>

                <div className="flex items-end">
                  <div className="w-full p-4 bg-green-50 rounded-lg border">
                    <p className="text-sm text-gray-600">Fuel Cost (Auto-calculated)</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{calculations.fuelCost.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {calculations.fuelLiters.toFixed(2)}L × ₹{tripData.fuelRate || 0}/L
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 💰 Other Expenses Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Other Expenses</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Toll Charges (₹)
                  </label>
                  <input
                    type="number"
                    name="toll"
                    value={tripData.toll}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driver Payment (₹) *
                  </label>
                  <input
                    type="number"
                    name="driverPayment"
                    value={tripData.driverPayment}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other Expenses (₹)
                  </label>
                  <input
                    type="number"
                    name="otherExpenses"
                    value={tripData.otherExpenses}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 300"
                  />
                </div>
              </div>
            </div>

            {/* 📊 Expense Summary */}
            <div className="bg-gray-50 rounded-lg border p-6">
              <h4 className="font-medium text-gray-800 mb-4 text-lg">Expense Summary</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-3 px-4 text-left text-gray-700">Expense Type</th>
                      <th className="py-3 px-4 text-left text-gray-700">Amount (₹)</th>
                      <th className="py-3 px-4 text-left text-gray-700">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-3 px-4">Fuel Cost</td>
                      <td className="py-3 px-4 font-medium">₹{calculations.fuelCost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {calculations.fuelLiters.toFixed(2)}L @ ₹{tripData.fuelRate || 0}/L
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Toll Charges</td>
                      <td className="py-3 px-4 font-medium">₹{tripData.toll || '0'}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">Highway tolls</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Driver Payment</td>
                      <td className="py-3 px-4 font-medium">₹{tripData.driverPayment || '0'}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">Driver salary</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Other Expenses</td>
                      <td className="py-3 px-4 font-medium">₹{tripData.otherExpenses || '0'}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">Miscellaneous</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-800 text-white">
                    <tr>
                      <td className="py-4 px-4 font-bold">TOTAL EXPENSES</td>
                      <td colSpan="2" className="py-4 px-4 text-right font-bold text-xl">
                        ₹{calculations.totalExpenses.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ✅ Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/booking/driver')}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                ← Back to Driver
              </button>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving Trip...
                    </>
                  ) : (
                    'Save Trip & Expenses →'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}