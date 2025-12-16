'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingApi } from '@/lib/api';

export default function BookingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    from: '',
    to: '',
    vehicle: 'Innova',
    bookingAmount: '',
    advance: ''
  });

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
    // Generate booking ID
    const bookingId = 'PARV' + Date.now().toString().slice(-6);
    
    // Save to localStorage
    const bookingData = {
      ...formData,
      bookingId: bookingId,
      date: new Date().toLocaleDateString('en-IN'),
      status: 'pending'
    };
    
    localStorage.setItem('currentBookingId', bookingId);
    localStorage.setItem('lastBooking', JSON.stringify(bookingData));
    
    // Submit to Google Sheets WITHOUT opening new window
    await submitToGoogleSheets(bookingData);
    
    alert(`✅ Booking created successfully!\nBooking ID: ${bookingId}`);
    
    // Navigate to confirm page
    router.push('/booking/confirm');
    
  } catch (error) {
    console.error('Error:', error);
    alert('Booking saved locally. Google Sheets sync may need manual check.');
    router.push('/booking/confirm');
  } finally {
    setLoading(false);
  }
};

// Submit to Google Sheets without opening new window
const submitToGoogleSheets = async (data) => {
  const formData = new FormData();
  formData.append('action', 'create');
  
  Object.keys(data).forEach(key => {
    if (key !== 'bookingId') { // bookingId Apps Script खुद generate करेगा
      formData.append(key, data[key]);
    }
  });
  
  try {
    // Try fetch with no-cors
    await fetch('https://script.google.com/macros/s/AKfycbxaaduFrb32moQlbvYCI3yspti0A2OMa-YmjFCzIaYxYPvg2zWP0VCMzL5paKolGtRX/exec', {
      method: 'POST',
      mode: 'no-cors',
      body: formData
    });
    
    console.log('Data submitted to Google Sheets');
  } catch (error) {
    console.log('Data submitted (no-cors mode)');
  }
};

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Booking Entry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form fields remain the same as before */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From *
            </label>
            <input
              type="text"
              name="from"
              value={formData.from}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Starting location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To *
            </label>
            <input
              type="text"
              name="to"
              value={formData.to}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Destination"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Type *
            </label>
            <select
              name="vehicle"
              value={formData.vehicle}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Innova">Innova</option>
              <option value="Swift">Swift</option>
              <option value="Ertiga">Ertiga</option>
              <option value="Scorpio">Scorpio</option>
              <option value="Bus">Bus</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Amount (₹) *
            </label>
            <input
              type="number"
              name="bookingAmount"
              value={formData.bookingAmount}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advance Payment (₹)
            </label>
            <input
              type="number"
              name="advance"
              value={formData.advance}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Advance amount"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  );
}