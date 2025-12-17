'use client';

import Stepper from '@/components/Stepper';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { bookingApi, formatCurrency } from '@/lib/api';

export default function ConfirmBookingPage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    const storedBooking = localStorage.getItem('lastBooking');
    
    if (id && storedBooking) {
      setBookingId(id);
      setBooking(JSON.parse(storedBooking));
    } else {
      router.push('/booking/entry');
    }
  }, [router]);

  const handleConfirm = async () => {
    setLoading(true);
    
    try {
      const result = await bookingApi.confirm(bookingId);
      console.log('Confirm result:', result);
      
      if (result.success) {
        // Update local storage
        const updatedBooking = { ...booking, status: 'confirmed' };
        localStorage.setItem('lastBooking', JSON.stringify(updatedBooking));
        setBooking(updatedBooking);
        
        alert('✅ Booking confirmed! Data saved to Google Sheets.');
        setTimeout(() => router.push('/booking/driver'), 500);
      } else {
        alert('⚠️ ' + (result.error || 'Failed to confirm booking'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('⚠️ Error confirming booking');
    } finally {
      setLoading(false);
    }
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
          <p className="text-gray-600 text-sm">Review and confirm booking details</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Customer Details</h3>
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

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Trip Details</h3>
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

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Details</h3>
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
                  {formatCurrency(booking.bookingAmount - (booking.advance || 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Status & Actions</h3>
            <div className="space-y-4">
              <div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {booking.status === 'pending' ? 'Pending Confirmation' : 'Confirmed'}
                </div>
              </div>
              
              <p className="text-sm text-gray-600">
                Click confirm to proceed with driver assignment.
              </p>
              
              <button
                onClick={() => router.push('/booking/entry')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                Edit Booking Details
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}