'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { bookingApi, formatCurrency, formatDate, statusManager } from '@/lib/api';

export default function BookingSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId;
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      const res = await bookingApi.getById(bookingId);
      if (res.success && res.data) {
        setBooking(res.data);
      } else {
        setError('Booking not found');
      }
    } catch (error) {
      console.error('Error loading booking:', error);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    router.push(`/booking/edit/${bookingId}`);
  };

  const handleRecalculate = async () => {
    try {
      await bookingApi.calculate(bookingId);
      loadBookingDetails(); // Reload data
    } catch (error) {
      console.error('Error recalculating:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading booking summary...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-medium text-gray-800 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested booking does not exist.'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = statusManager.getStatusInfo(booking.status || 'pending');

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Booking Summary</h1>
              <p className="text-gray-600 mt-2">
                Booking ID: <span className="font-mono font-medium text-blue-600">{bookingId}</span>
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ← Dashboard
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Booking
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Print Summary
              </button>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`inline-flex items-center px-4 py-2 rounded-lg ${statusInfo.color}-100 ${statusInfo.color}-800`}>
            <span className="mr-2">{statusInfo.icon}</span>
            <span className="font-medium">{statusInfo.label}</span>
          </div>
        </div>
        
        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Booking Info */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📋 Booking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Booking ID</p>
                  <p className="font-medium">{booking.bookingId || bookingId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Booking Date</p>
                  <p className="font-medium">{booking.date || formatDate(booking.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-medium">{booking.customerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium">{booking.phone || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">From</p>
                  <p className="font-medium">{booking.from || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To</p>
                  <p className="font-medium">{booking.to || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-medium">{booking.vehicle || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle Average</p>
                  <p className="font-medium">{booking.vehicleAverage || '12'} km/L</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Driver & Trip Info */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">👨‍✈️ Driver & Trip Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Driver Name</p>
                  <p className="font-medium">{booking.driverName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Driver Phone</p>
                  <p className="font-medium">{booking.driverPhone || 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Start KM</p>
                  <p className="font-medium">{booking.startKM || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End KM</p>
                  <p className="font-medium">{booking.endKM || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="font-medium">{booking.totalKM || '0'} km</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Expenses & Profit */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">💰 Expenses & Profit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Fuel Rate</p>
                  <p className="font-medium">{booking.fuelRate ? `₹${booking.fuelRate}/liter` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fuel Used</p>
                  <p className="font-medium">{booking.liters || '0'} liters</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fuel Cost</p>
                  <p className="font-medium">{formatCurrency(booking.fuelCost)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Toll Charges</p>
                  <p className="font-medium">{formatCurrency(booking.toll)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Driver Payment</p>
                  <p className="font-medium">{formatCurrency(booking.driverPayment)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Other Expenses</p>
                  <p className="font-medium">{formatCurrency(booking.otherExpenses)}</p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-xl font-bold">{formatCurrency(booking.totalExpenses)}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Booking Amount</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(booking.bookingAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Advance Paid</p>
                  <p className="font-medium">{formatCurrency(booking.advance)}</p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(booking.netProfit)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Outstanding</p>
                  <p className={`text-xl font-bold ${parseFloat(booking.outstanding) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(booking.outstanding)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {booking.notes && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📝 Notes</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-line">{booking.notes}</p>
              </div>
            </div>
          )}
          
          {/* System Info */}
          <div className="text-sm text-gray-500">
            <p>Created: {formatDate(booking.createdAt)}</p>
            <p>Last Updated: {formatDate(booking.updatedAt)}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRecalculate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Recalculate Profit
          </button>
          
          <button
            onClick={() => router.push(`/booking/edit/${bookingId}`)}
            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Edit Booking
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}