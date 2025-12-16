'use client';

import Stepper from '@/components/Stepper';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ConfirmBookingPage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get booking data from localStorage
    const storedBooking = localStorage.getItem('lastBooking');
    const id = localStorage.getItem('currentBookingId');
    
    if (storedBooking) {
      setBooking(JSON.parse(storedBooking));
    }
    
    if (id) {
      setBookingId(id);
    } else {
      // Generate a new booking ID if none exists
      const newId = 'PARV' + Date.now().toString().slice(-6);
      setBookingId(newId);
      localStorage.setItem('currentBookingId', newId);
    }
    
    // Set default booking data if none exists
    if (!storedBooking) {
      const defaultBooking = {
        customerName: 'Customer Name',
        phone: 'Phone Number',
        from: 'From Location',
        to: 'To Location',
        vehicle: 'Innova',
        bookingAmount: 0,
        advance: 0,
        status: 'pending'
      };
      setBooking(defaultBooking);
      localStorage.setItem('lastBooking', JSON.stringify(defaultBooking));
    }
  }, []);

  const handleConfirm = () => {
    // Update booking status
    const updatedBooking = {
      ...booking,
      status: 'confirmed'
    };
    
    setBooking(updatedBooking);
    localStorage.setItem('lastBooking', JSON.stringify(updatedBooking));
    
    // Show success message
    alert('✅ Booking confirmed successfully!');
    
    // Navigate to next step
    setTimeout(() => {
      router.push('/booking/driver');
    }, 500);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (!booking) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading booking details...</p>
      </div>
    );
  }

  return (
    <div>
      <Stepper />
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Confirm Booking</h2>
        
        <div className="mb-8">
          <div className="inline-block bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-semibold mb-4">
            Booking ID: {bookingId}
          </div>
          <p className="text-gray-600 text-sm">
            Review and confirm the booking details below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Customer Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Customer Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{booking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{booking.phone}</span>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Trip Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">From:</span>
                <span className="font-medium">{booking.from}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">To:</span>
                <span className="font-medium">{booking.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle:</span>
                <span className="font-medium">{booking.vehicle}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Payment Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Amount:</span>
                <span className="font-medium">{formatCurrency(booking.bookingAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Advance Paid:</span>
                <span className="font-medium">{formatCurrency(booking.advance)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-700 font-medium">Balance Due:</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(booking.bookingAmount - booking.advance)}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status & Actions
            </h3>
            <div className="space-y-4">
              <div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {booking.status === 'pending' ? 'Pending Confirmation' : 'Confirmed'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Click confirm to proceed with driver assignment. Data will be saved to Google Sheets.
              </p>
              
              <button
                onClick={() => router.push('/booking/entry')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Edit Booking Details
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={() => {
                // Save to localStorage
                localStorage.setItem('lastBooking', JSON.stringify(booking));
                localStorage.setItem('currentBookingId', bookingId);
                alert('Draft saved successfully!');
              }}
              className="px-6 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              Save as Draft
            </button>
            
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> This app uses Google Apps Script as backend. 
            When you confirm, data will be saved to your Google Sheet. 
            Check your Google Sheet to verify the booking was created.
          </p>
        </div>
      </div>
    </div>
  );
}