'use client';

import Stepper from '@/components/Stepper';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ExpensesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [formData, setFormData] = useState({
    fuelRate: '',
    liters: '',
    toll: '',
    driverPayment: '',
    otherExpenses: '',
    endKM: ''
  });

  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    if (!id) {
      router.push('/booking/entry');
      return;
    }
    setBookingId(id);
    
    // Load saved expenses if any
    const savedExpenses = localStorage.getItem('expensesData');
    if (savedExpenses) {
      setFormData(JSON.parse(savedExpenses));
    }
  }, []);

  const handleChange = (e) => {
    const newData = {
      ...formData,
      [e.target.name]: e.target.value
    };
    setFormData(newData);
    localStorage.setItem('expensesData', JSON.stringify(newData));
  };

  const calculateFuelCost = () => {
    const rate = parseFloat(formData.fuelRate) || 0;
    const liters = parseFloat(formData.liters) || 0;
    return rate * liters;
  };

  const calculateTotalExpenses = () => {
    const fuelCost = calculateFuelCost();
    const toll = parseFloat(formData.toll) || 0;
    const driverPayment = parseFloat(formData.driverPayment) || 0;
    const otherExpenses = parseFloat(formData.otherExpenses) || 0;
    
    return fuelCost + toll + driverPayment + otherExpenses;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save to localStorage
      localStorage.setItem('expensesData', JSON.stringify(formData));
      
      // Submit to Google Sheets
      const dataToSubmit = {
        action: 'addExpenses',
        bookingId: bookingId,
        ...formData
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
      
      alert('✅ Expenses added successfully!');
      router.push('/booking/calculation');
      
    } catch (error) {
      console.error('Error:', error);
      alert('Expenses saved locally. Proceeding to calculation...');
      router.push('/booking/calculation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Stepper />
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Expenses & End KM</h2>
        
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <p className="font-medium">Booking ID: {bookingId}</p>
          <p className="text-sm text-gray-600">Add all trip expenses and end kilometer reading</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Fuel Expenses */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fuel Expenses
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Rate (₹/liter)
                </label>
                <input
                  type="number"
                  name="fuelRate"
                  value={formData.fuelRate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 95"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liters
                </label>
                <input
                  type="number"
                  name="liters"
                  value={formData.liters}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 20"
                />
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Cost
                </label>
                <div className="text-xl font-bold text-red-600">
                  ₹{calculateFuelCost().toFixed(2)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated
                </p>
              </div>
            </div>
          </div>

          {/* Other Expenses */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Other Expenses
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toll Charges (₹)
                </label>
                <input
                  type="number"
                  name="toll"
                  value={formData.toll}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Payment (₹)
                </label>
                <input
                  type="number"
                  name="driverPayment"
                  value={formData.driverPayment}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Expenses (₹)
                </label>
                <input
                  type="number"
                  name="otherExpenses"
                  value={formData.otherExpenses}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 300"
                />
              </div>
            </div>
          </div>

          {/* End KM */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              End Kilometer Reading
            </h3>
            
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End KM Reading *
              </label>
              <input
                type="number"
                name="endKM"
                value={formData.endKM}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 45000"
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter the odometer reading at trip end
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Expenses Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuel Cost:</span>
                  <span className="font-medium">₹{calculateFuelCost().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Toll Charges:</span>
                  <span className="font-medium">₹{parseFloat(formData.toll || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver Payment:</span>
                  <span className="font-medium">₹{parseFloat(formData.driverPayment || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Other Expenses:</span>
                  <span className="font-medium">₹{parseFloat(formData.otherExpenses || 0).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-700">Total Expenses:</span>
                  <span className="text-2xl font-bold text-red-600">
                    ₹{calculateTotalExpenses().toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  This amount will be deducted from booking revenue
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/booking/driver')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Save Expenses & Continue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}