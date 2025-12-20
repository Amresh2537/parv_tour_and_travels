'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingApi } from '@/lib/api';
import { TravelBackground } from '@/components/TravelBackground';
import { motion } from 'framer-motion';

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
    advance: '',
    passengers: '',
    tripType: 'one-way',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await bookingApi.create(formData);
      
      if (result.success) {
        const bookingId = result.bookingId;
        
        localStorage.setItem('currentBookingId', bookingId);
        localStorage.setItem('lastBooking', JSON.stringify({
          ...formData,
          bookingId: bookingId,
          date: new Date().toLocaleDateString('en-IN'),
          status: 'pending'
        }));
        
        showNotification(`Booking created successfully! ID: ${bookingId}`, 'success');
        router.push('/booking/confirm');
      } else {
        showNotification(result.error || 'Failed to create booking', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error creating booking. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
      type === 'success' ? 'bg-emerald-500 text-white' : 
      type === 'error' ? 'bg-rose-500 text-white' : 
      'bg-amber-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">${type === 'success' ? '✓' : '✗'}</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const vehicleOptions = [
    'Innova', 'Swift', 'Ertiga', 'Scorpio', 'XUV700', 
    'Fortuner', 'Crysta', 'Tempo', 'Bus', 'Other'
  ];

  return (
    <TravelBackground variant="road">
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="backdrop-blur-lg bg-white/90 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">New Booking Entry</h1>
                  <p className="text-blue-100 mt-2">Create a new travel booking for your customer</p>
                </div>
                <div className="hidden md:block p-3 bg-white/10 rounded-xl">
                  <span className="text-white font-semibold">📋 Booking Form</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Customer Details */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                      <span className="mr-2">👤</span>
                      Customer Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm transition-all"
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 backdrop-blur-sm"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Journey Details */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center">
                      <span className="mr-2">📍</span>
                      Journey Details
                    </h3>
                    <div className="space-y-4">
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/70 backdrop-blur-sm"
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/70 backdrop-blur-sm"
                          placeholder="Destination"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Vehicle & Travel Details */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                      <span className="mr-2">🚗</span>
                      Travel Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vehicle Type *
                        </label>
                        <select
                          name="vehicle"
                          value={formData.vehicle}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/70 backdrop-blur-sm"
                        >
                          {vehicleOptions.map(vehicle => (
                            <option key={vehicle} value={vehicle}>{vehicle}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Passengers
                          </label>
                          <input
                            type="number"
                            name="passengers"
                            value={formData.passengers}
                            onChange={handleChange}
                            min="1"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/70 backdrop-blur-sm"
                            placeholder="4"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trip Type
                          </label>
                          <select
                            name="tripType"
                            value={formData.tripType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/70 backdrop-blur-sm"
                          >
                            <option value="one-way">One Way</option>
                            <option value="round-trip">Round Trip</option>
                            <option value="multi-city">Multi City</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Financial Details */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="md:col-span-2 lg:col-span-3"
                >
                  <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-100">
                    <h3 className="text-lg font-semibold text-amber-800 mb-6 flex items-center">
                      <span className="mr-2">💰</span>
                      Financial Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Amount (₹) *
                        </label>
                        <input
                          type="number"
                          name="bookingAmount"
                          value={formData.bookingAmount}
                          onChange={handleChange}
                          required
                          min="0"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/70 backdrop-blur-sm text-lg font-semibold"
                          placeholder="5000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Advance (₹)
                        </label>
                        <input
                          type="number"
                          name="advance"
                          value={formData.advance}
                          onChange={handleChange}
                          min="0"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/70 backdrop-blur-sm"
                          placeholder="2000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Balance (₹)
                        </label>
                        <div className="px-4 py-3 bg-gray-50/70 backdrop-blur-sm border border-gray-200 rounded-xl text-lg font-semibold text-gray-800">
                          ₹{((parseInt(formData.bookingAmount) || 0) - (parseInt(formData.advance) || 0)).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Notes */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white/70 backdrop-blur-sm"
                        placeholder="Any special requirements or notes..."
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-100">
                <div className="mb-4 sm:mb-0">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 flex items-center"
                  >
                    <span className="mr-2">←</span>
                    Back to Dashboard
                  </button>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        customerName: '',
                        phone: '',
                        from: '',
                        to: '',
                        vehicle: 'Innova',
                        bookingAmount: '',
                        advance: '',
                        passengers: '',
                        tripType: 'one-way',
                        notes: ''
                      });
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300"
                  >
                    Clear All
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">✓</span>
                        Create Booking
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </TravelBackground>
  );
}