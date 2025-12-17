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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Submitting booking form:', formData);
      
      // Direct API call - no form submission
      const result = await bookingApi.create(formData);
      console.log('Booking API response:', result);
      
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
        
        // Show success message
        alert(`✅ Booking created successfully!\n\nBooking ID: ${bookingId}\nCustomer: ${formData.customerName}\nAmount: ₹${formData.bookingAmount}`);
        
        // Navigate to confirm page
        router.push('/booking/confirm');
      } else {
        alert(`❌ Failed to create booking: ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Booking form error:', error);
      alert('⚠️ Error creating booking. Data saved locally.');
      
      // Generate local booking ID and save
      const bookingId = 'PARV' + Date.now().toString().slice(-8);
      const bookingData = {
        ...formData,
        bookingId: bookingId,
        date: new Date().toLocaleDateString('en-IN'),
        status: 'pending'
      };
      
      localStorage.setItem('currentBookingId', bookingId);
      localStorage.setItem('lastBooking', JSON.stringify(bookingData));
      
      router.push('/booking/confirm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Booking Entry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Name */}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter customer name"
            />
          </div>

          {/* Phone Number */}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="9876543210"
              title="Please enter 10-digit phone number"
            />
          </div>

          {/* From Location */}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Starting location"
            />
          </div>

          {/* To Location */}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Destination"
            />
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Type *
            </label>
            <select
              name="vehicle"
              value={formData.vehicle}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="Innova">Innova</option>
              <option value="Swift">Swift</option>
              <option value="Ertiga">Ertiga</option>
              <option value="Scorpio">Scorpio</option>
              <option value="Bolero">Bolero</option>
              <option value="Bus">Bus</option>
              <option value="Tempo">Tempo</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Booking Amount */}
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
              step="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="5000"
            />
          </div>

          {/* Advance Payment */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advance Payment (₹)
            </label>
            <input
              type="number"
              name="advance"
              value={formData.advance}
              onChange={handleChange}
              min="0"
              step="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="2000"
            />
            <p className="text-sm text-gray-500 mt-2">
              Leave empty if no advance payment received
            </p>
          </div>
        </div>

        {/* Information Box */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Data will be saved directly to Google Sheets. 
                No new tabs will open. Check your Google Sheet to verify the booking.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Booking'
            )}
          </button>
        </div>
      </form>

      {/* Debug Info (Optional - remove in production) */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <details>
          <summary className="cursor-pointer font-medium text-gray-700">Debug Information</summary>
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-2">Form Data:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
}