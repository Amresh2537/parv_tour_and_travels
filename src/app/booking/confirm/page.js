'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ConfirmPage() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedBooking = localStorage.getItem('lastBooking');
    if (!savedBooking) {
      router.push('/booking/entry');
      return;
    }
    
    setBookingData(JSON.parse(savedBooking));
    setLoading(false);
  }, [router]);

  const handleConfirm = () => {
    // Navigate to driver page
    router.push('/booking/driver');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Booking Confirmation</h1>
          <p className="text-gray-600 mt-2">Review booking details before proceeding</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Success Message */}
          <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Booking Created Successfully!</h3>
                <p className="text-gray-600">Booking ID: <span className="font-mono font-bold">{bookingData.bookingId}</span></p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Customer Details</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Customer Name</div>
                  <div className="font-medium text-lg">{bookingData.customerName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Phone Number</div>
                  <div className="font-medium">{bookingData.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Booking Date</div>
                  <div className="font-medium">{bookingData.date}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Trip Details</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Route</div>
                  <div className="font-medium text-lg">
                    {bookingData.from} → {bookingData.to}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Vehicle Type</div>
                  <div className="font-medium">{bookingData.vehicle}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Booking Amount</div>
                  <div className="font-bold text-xl text-blue-600">
                    {formatCurrency(bookingData.bookingAmount)}
                  </div>
                </div>
                {bookingData.advance && (
                  <div>
                    <div className="text-sm text-gray-600">Advance Paid</div>
                    <div className="font-bold text-green-600">
                      {formatCurrency(bookingData.advance)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Next Steps in Booking Process</h3>
            <div className="space-y-4">
              <div className="flex items-center p-4 border rounded-lg hover:bg-gray-50">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Assign Driver</p>
                  <p className="text-sm text-gray-600">Assign a driver and record starting kilometer</p>
                </div>
                <span className="text-blue-600">Next →</span>
              </div>
              
              <div className="flex items-center p-4 border rounded-lg opacity-60">
                <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Add Expenses</p>
                  <p className="text-sm text-gray-600">Add fuel, toll, and other trip expenses</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 border rounded-lg opacity-60">
                <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">Calculate Profit</p>
                  <p className="text-sm text-gray-600">Calculate net profit and outstanding amount</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Link
              href="/booking/entry"
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              ← Edit Booking
            </Link>
            
            <div className="flex space-x-4">
              <Link
                href="/"
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Back to Dashboard
              </Link>
              
              <button
                onClick={handleConfirm}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue to Driver Assignment →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}