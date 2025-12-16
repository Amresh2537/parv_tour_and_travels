'use client';

import Stepper from '@/components/Stepper';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function DriverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [formData, setFormData] = useState({
    driverName: '',
    driverPhone: '',
    startKM: ''
  });

  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    if (!id) {
      router.push('/booking/entry');
      return;
    }
    setBookingId(id);
    
    // Load saved driver data if any
    const savedDriver = localStorage.getItem('driverData');
    if (savedDriver) {
      setFormData(JSON.parse(savedDriver));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save to localStorage
      localStorage.setItem('driverData', JSON.stringify(formData));
      
      // Submit to Google Sheets
      const dataToSubmit = {
        action: 'addDriver',
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
      
      alert('✅ Driver assigned successfully!');
      router.push('/booking/expenses');
      
    } catch (error) {
      console.error('Error:', error);
      alert('Driver details saved locally. Proceeding to expenses...');
      router.push('/booking/expenses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Stepper />
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Assign Driver & Start KM</h2>
        
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <p className="font-medium">Booking ID: {bookingId}</p>
          <p className="text-sm text-gray-600">Assign driver and record starting kilometer reading</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Name *
              </label>
              <input
                type="text"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter driver name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Phone *
              </label>
              <input
                type="tel"
                name="driverPhone"
                value={formData.driverPhone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter driver phone"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Kilometer Reading *
              </label>
              <input
                type="number"
                name="startKM"
                value={formData.startKM}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter starting KM (e.g., 45000)"
              />
              <p className="text-sm text-gray-500 mt-2">
                Record the odometer reading before trip starts
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/booking/confirm')}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Assign Driver & Continue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}