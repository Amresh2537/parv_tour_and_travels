'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingApi } from '@/lib/api';

export default function BookingEntryPage() {
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
      console.log('Submitting booking:', formData);
      
      // First test the API
      const pingResult = await bookingApi.ping();
      console.log('Ping result:', pingResult);
      
      if (!pingResult.success) {
        throw new Error('API not responding');
      }
      
      // Create booking
      const result = await bookingApi.create(formData);
      console.log('Booking result:', result);
      
      if (result.success) {
        const bookingId = result.bookingId;
        
        // Save to localStorage
        const bookingData = {
          ...formData,
          bookingId: bookingId,
          date: new Date().toLocaleDateString('en-IN'),
          status: 'pending'
        };
        
        localStorage.setItem('currentBookingId', bookingId);
        localStorage.setItem('lastBooking', JSON.stringify(bookingData));
        
        // Show notification
        showNotification(`✅ Booking created successfully! ID: ${bookingId}`);
        router.push('/booking/confirm');
      } else {
        showNotification(`❌ Failed to create booking: ${result.error || 'Unknown error'}`, 'error');
      }
      
    } catch (error) {
      console.error('Error:', error);
      showNotification('⚠️ Booking saved locally. Please check Google Sheet manually.', 'warning');
      
      // Create a local booking ID for offline use
      const localBookingId = 'PARV' + Date.now().toString().slice(-8);
      const bookingData = {
        ...formData,
        bookingId: localBookingId,
        date: new Date().toLocaleDateString('en-IN'),
        status: 'pending'
      };
      
      localStorage.setItem('currentBookingId', localBookingId);
      localStorage.setItem('lastBooking', JSON.stringify(bookingData));
      
      router.push('/booking/confirm');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-yellow-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div id="notification-container"></div>
      
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">New Booking Entry</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                pattern="[0-9]{10}"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="9876543210"
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
                <option value="Tempo">Tempo</option>
                <option value="Other">Other</option>
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
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="5000"
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
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2000"
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
    </div>
  );
}