'use client';

import Stepper from '@/components/Stepper';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { updateExpensesWithForm, formatCurrency } from '@/lib/api';

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
    
    const savedExpenses = localStorage.getItem('expensesData');
    if (savedExpenses) {
      setFormData(JSON.parse(savedExpenses));
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateFuelCost = () => {
    return (parseFloat(formData.fuelRate) || 0) * (parseFloat(formData.liters) || 0);
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
      localStorage.setItem('expensesData', JSON.stringify(formData));
      
      const result = await updateExpensesWithForm(bookingId, formData);
      console.log('Expenses update result:', result);
      
      if (result.success) {
        alert('✅ Expenses added! Data saved to Google Sheets.');
      } else {
        alert('⚠️ Form submitted. Check Google Sheet.');
      }
      
      router.push('/booking/calculation');
      
    } catch (error) {
      console.error('Error:', error);
      alert('Expenses saved locally.');
      router.push('/booking/calculation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Stepper />
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Expenses & End KM</h2>
        
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <p className="font-medium">Booking ID: {bookingId}</p>
          <p className="text-sm text-gray-600">Record trip expenses and ending kilometer reading</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Fuel Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Rate (₹/liter) *
                  </label>
                  <input
                    type="number"
                    name="fuelRate"
                    value={formData.fuelRate}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="105.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Liters Purchased *
                  </label>
                  <input
                    type="number"
                    name="liters"
                    value={formData.liters}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="45.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Cost
                  </label>
                  <div className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-red-600">
                    {formatCurrency(calculateFuelCost())}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Other Expenses</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Toll Charges (₹)
                  </label>
                  <input
                    type="number"
                    name="toll"
                    value={formData.toll}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="800"
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
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1500"
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
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Kilometer Reading</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End KM Reading *
                  </label>
                  <input
                    type="number"
                    name="endKM"
                    value={formData.endKM}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="45350"
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">Total Distance</div>
                  <div className="text-lg font-bold text-purple-600">
                    {(() => {
                      const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
                      const startKM = parseFloat(driverData.startKM) || 0;
                      const endKM = parseFloat(formData.endKM) || 0;
                      const distance = endKM - startKM;
                      return distance > 0 ? `${distance} km` : 'Enter end KM';
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Expenses Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Fuel Cost</div>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(calculateFuelCost())}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Other Expenses</div>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(
                    (parseFloat(formData.toll) || 0) + 
                    (parseFloat(formData.driverPayment) || 0) + 
                    (parseFloat(formData.otherExpenses) || 0)
                  )}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Total Expenses</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(calculateTotalExpenses())}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600">Cost per KM</div>
                <div className="text-xl font-bold text-purple-600">
                  {(() => {
                    const driverData = JSON.parse(localStorage.getItem('driverData') || '{}');
                    const startKM = parseFloat(driverData.startKM) || 0;
                    const endKM = parseFloat(formData.endKM) || 0;
                    const distance = endKM - startKM;
                    const totalExpenses = calculateTotalExpenses();
                    
                    if (distance > 0 && totalExpenses > 0) {
                      return formatCurrency(totalExpenses / distance);
                    }
                    return 'N/A';
                  })()}
                </div>
              </div>
            </div>
          </div>

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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Expenses & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}