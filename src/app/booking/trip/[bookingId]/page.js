'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingApi, formatCurrency, formatDate, statusManager } from '@/lib/api';
import { TravelBackground } from '@/components/TravelBackground';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function BookingTripPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId;
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('receipt'); // 'receipt' or 'profit'
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getById(bookingId);
      
      if (response.success) {
        setBooking(response.data);
        setEditFormData(response.data);
      } else {
        const storedBooking = localStorage.getItem('lastBooking');
        if (storedBooking) {
          const parsedBooking = JSON.parse(storedBooking);
          if (parsedBooking.bookingId === bookingId) {
            setBooking(parsedBooking);
            setEditFormData(parsedBooking);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFuelDetails = () => {
    if (!booking || !booking.startKM || !booking.endKM || !booking.vehicleAverage || !booking.fuelRate) {
      return null;
    }

    const start = parseFloat(booking.startKM);
    const end = parseFloat(booking.endKM);
    const average = parseFloat(booking.vehicleAverage);
    const rate = parseFloat(booking.fuelRate);

    if (!start || !end || !average || !rate) return null;

    const distance = end - start;
    const liters = distance / average;
    const fuelCost = liters * rate;

    return {
      distance,
      liters: liters.toFixed(2),
      fuelCost: fuelCost.toFixed(2),
      rate,
      average
    };
  };

  const calculateAllExpenses = () => {
    if (!booking) return { total: 0, breakdown: [] };

    const expenses = [];
    let total = 0;

    // Fuel expenses
    const fuelDetails = calculateFuelDetails();
    if (fuelDetails) {
      expenses.push({
        category: 'Fuel',
        amount: parseFloat(fuelDetails.fuelCost),
        description: `${fuelDetails.liters}L @ ₹${fuelDetails.rate}/L`
      });
      total += parseFloat(fuelDetails.fuelCost);
    }

    // Other expenses
    if (booking.fuelCost && parseFloat(booking.fuelCost) > 0) {
      expenses.push({
        category: 'Fuel',
        amount: parseFloat(booking.fuelCost),
        description: 'Fuel cost'
      });
      total += parseFloat(booking.fuelCost);
    }

    if (booking.tollAmount && parseFloat(booking.tollAmount) > 0 && booking.tollPaidBy === 'company') {
      expenses.push({
        category: 'Toll Tax',
        amount: parseFloat(booking.tollAmount),
        description: 'Toll charges'
      });
      total += parseFloat(booking.tollAmount);
    }

    if (booking.driverPayment && parseFloat(booking.driverPayment) > 0) {
      expenses.push({
        category: 'Driver',
        amount: parseFloat(booking.driverPayment),
        description: 'Driver payment'
      });
      total += parseFloat(booking.driverPayment);
    }

    if (booking.maintenance && parseFloat(booking.maintenance) > 0) {
      expenses.push({
        category: 'Maintenance',
        amount: parseFloat(booking.maintenance),
        description: 'Vehicle maintenance'
      });
      total += parseFloat(booking.maintenance);
    }

    if (booking.parking && parseFloat(booking.parking) > 0) {
      expenses.push({
        category: 'Parking',
        amount: parseFloat(booking.parking),
        description: 'Parking charges'
      });
      total += parseFloat(booking.parking);
    }

    if (booking.food && parseFloat(booking.food) > 0) {
      expenses.push({
        category: 'Food',
        amount: parseFloat(booking.food),
        description: 'Food expenses'
      });
      total += parseFloat(booking.food);
    }

    if (booking.otherExpenses && parseFloat(booking.otherExpenses) > 0) {
      expenses.push({
        category: 'Other',
        amount: parseFloat(booking.otherExpenses),
        description: 'Miscellaneous'
      });
      total += parseFloat(booking.otherExpenses);
    }

    if (booking.expensesData && Array.isArray(booking.expensesData)) {
      booking.expensesData.forEach(expense => {
        expenses.push({
          category: expense.category || 'Expense',
          amount: parseFloat(expense.amount) || 0,
          description: expense.description || ''
        });
        total += parseFloat(expense.amount) || 0;
      });
    }

    return { total, breakdown: expenses };
  };

  const calculateNetProfit = () => {
    if (!booking) return 0;
    const revenue = parseFloat(booking.bookingAmount) || 0;
    const expenses = calculateAllExpenses().total;
    return revenue - expenses;
  };

  const getStatusInfo = (status) => {
    return statusManager.getStatusInfo(status);
  };

  const printReceipt = () => {
    const receiptContent = document.getElementById('customer-receipt');
    if (receiptContent) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${booking.bookingId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
            .details { margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total-row { border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px dashed #666; }
          </style>
        </head>
        <body>
          ${receiptContent.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <TravelBackground variant="road">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading booking details...</p>
          </div>
        </div>
      </TravelBackground>
    );
  }

  if (!booking) {
    return (
      <TravelBackground variant="road">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Booking not found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              The booking you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </TravelBackground>
    );
  }

  const statusInfo = getStatusInfo(booking.status);
  const balance = (parseFloat(booking.bookingAmount) || 0) - (parseFloat(booking.advance) || 0);
  const netProfit = calculateNetProfit();
  const fuelDetails = calculateFuelDetails();
  const allExpenses = calculateAllExpenses();

  return (
    <TravelBackground variant="minimal">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="backdrop-blur-lg bg-white rounded-2xl p-6 md:p-8 shadow-xl border">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <div className="flex items-center mb-4">
                    <Link
                      href="/"
                      className="mr-4 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </Link>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                        Booking #{booking.bookingId}
                      </h1>
                      <p className="text-gray-600 mt-1">
                        {booking.customerName} • {booking.phone} • {formatDate(booking.date || booking.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border} flex items-center`}>
                      <span className="mr-2">{statusInfo.icon}</span>
                      {statusInfo.label}
                    </span>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">🚗</span>
                      {booking.vehicle || 'No vehicle'}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">👨‍✈️</span>
                      {booking.driverName || 'No driver'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                  <button
                    onClick={printReceipt}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Receipt
                  </button>
                  
                  <Link
                    href={`/booking/edit/${bookingId}`}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl hover:from-emerald-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Booking
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('receipt')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'receipt' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Customer Receipt
                </span>
              </button>
              <button
                onClick={() => setActiveTab('profit')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'profit' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Profit & Loss Calculator
                </span>
              </button>
            </div>
          </div>

          {/* Customer Receipt - SIMPLE BLOCK VIEW */}
          {activeTab === 'receipt' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-lg bg-white rounded-2xl shadow-xl border p-6 md:p-8 mb-8"
            >
              <div id="customer-receipt" className="max-w-md mx-auto">
                {/* Receipt Header */}
                <div className="text-center mb-8">
                  <div className="text-3xl font-bold text-blue-600 mb-2">PARV TOUR & TRAVELS</div>
                  <div className="text-sm text-gray-600">Contact: +91 9999999999 | GSTIN: 07AABCP1234M1Z5</div>
                  <div className="text-sm text-gray-600">Trip Receipt • #{booking.bookingId}</div>
                </div>

                {/* Trip Details Block */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">TRIP DETAILS</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold">{formatDate(booking.date || booking.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-semibold">{booking.time || 'Full Day'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">From:</span>
                      <span className="font-semibold text-right">{booking.from}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To:</span>
                      <span className="font-semibold text-right">{booking.to}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vehicle:</span>
                      <span className="font-semibold">{booking.vehicle || 'Car'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Passengers:</span>
                      <span className="font-semibold">{booking.passengers || 1} Person(s)</span>
                    </div>
                  </div>
                </div>

                {/* Customer Details Block */}
                <div className="bg-blue-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">CUSTOMER DETAILS</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-bold text-gray-800">{booking.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-semibold text-blue-600">{booking.phone}</span>
                    </div>
                    {booking.notes && (
                      <div className="mt-4 pt-3 border-t border-blue-200">
                        <span className="text-gray-600 block mb-2">Special Instructions:</span>
                        <p className="text-sm text-gray-700 bg-white/70 p-3 rounded-lg">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver Details Block */}
                {booking.driverName && (
                  <div className="bg-green-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">DRIVER DETAILS</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Driver Name:</span>
                        <span className="font-semibold">{booking.driverName}</span>
                      </div>
                      {booking.driverPhone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Driver Phone:</span>
                          <span className="font-semibold">{booking.driverPhone}</span>
                        </div>
                      )}
                      {booking.driverVehicle && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned Vehicle:</span>
                          <span className="font-semibold">{booking.driverVehicle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Summary Block - CLEAN & SIMPLE */}
                <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">PAYMENT SUMMARY</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Trip Fare:</span>
                      <span className="font-medium">₹{parseFloat(booking.bookingAmount || 0).toFixed(2)}</span>
                    </div>
                    
                    {booking.advance && parseFloat(booking.advance) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Advance Paid:</span>
                        <span className="font-medium text-green-600">-₹{parseFloat(booking.advance).toFixed(2)}</span>
                      </div>
                    )}

                    {balance > 0 && (
                      <div className="pt-3 border-t border-blue-200">
                        <div className="flex justify-between text-base font-bold">
                          <span className="text-gray-800">Balance Due:</span>
                          <span className="text-blue-700">₹{balance.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-blue-200">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-gray-800">TOTAL PAYABLE:</span>
                        <span className="text-emerald-700">₹{parseFloat(booking.bookingAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <div className="text-xs text-gray-500 text-center">
                        <div className="mb-1">Payment Status: 
                          <span className={`ml-2 font-medium ${balance === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                            {balance === 0 ? 'Fully Paid' : 'Partially Paid'}
                          </span>
                        </div>
                        <div>Payment Method: {booking.paymentMethod || 'Cash'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Receipt Footer */}
                <div className="mt-8 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
                  <div className="mb-3">
                    <div className="font-semibold text-gray-700">Thank you for choosing PARV TOUR & TRAVELS!</div>
                    <div className="mt-1">For any queries, contact: +91 9999999999</div>
                  </div>
                  <div className="text-xs">
                    <div>GSTIN: 07AABCP1234M1Z5</div>
                    <div>Receipt generated on: {new Date().toLocaleString()}</div>
                    <div className="mt-2 text-gray-400">This is a computer-generated receipt</div>
                  </div>
                </div>
              </div>

              {/* Print Button for Receipt */}
              <div className="mt-8 text-center">
                <button
                  onClick={printReceipt}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Receipt
                </button>
              </div>
            </motion.div>
          )}

          {/* Profit & Loss Calculator - INTERNAL USE ONLY */}
          {activeTab === 'profit' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Fuel Calculation Block */}
              {fuelDetails && (
                <div className="backdrop-blur-lg bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-xl border border-blue-200 p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <span className="mr-2">⛽</span>
                    Fuel Calculation
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/70 p-4 rounded-xl border border-blue-100">
                      <div className="text-sm text-gray-600 mb-1">Distance Covered</div>
                      <div className="text-2xl font-bold text-blue-700">{fuelDetails.distance} km</div>
                    </div>
                    
                    <div className="bg-white/70 p-4 rounded-xl border border-blue-100">
                      <div className="text-sm text-gray-600 mb-1">Fuel Required</div>
                      <div className="text-2xl font-bold text-blue-700">{fuelDetails.liters} L</div>
                    </div>
                    
                    <div className="bg-white/70 p-4 rounded-xl border border-blue-100">
                      <div className="text-sm text-gray-600 mb-1">Fuel Rate</div>
                      <div className="text-2xl font-bold text-blue-700">₹{fuelDetails.rate}/L</div>
                    </div>
                    
                    <div className="bg-white/70 p-4 rounded-xl border border-blue-100">
                      <div className="text-sm text-gray-600 mb-1">Fuel Cost</div>
                      <div className="text-2xl font-bold text-red-600">₹{fuelDetails.fuelCost}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/70 p-4 rounded-lg border border-blue-100">
                    <div className="text-sm text-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>Start KM: <span className="font-medium">{booking.startKM} km</span></div>
                      <div>End KM: <span className="font-medium">{booking.endKM} km</span></div>
                      <div>Average: <span className="font-medium">{fuelDetails.average} km/L</span></div>
                      <div>Formula: <span className="font-medium">({fuelDetails.distance} ÷ {fuelDetails.average}) × {fuelDetails.rate}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expenses Breakdown Block */}
              <div className="backdrop-blur-lg bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl border border-amber-200 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className="mr-2">💰</span>
                  Expenses Breakdown (Internal)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {allExpenses.breakdown.map((expense, index) => (
                    <div key={index} className="bg-white/70 p-4 rounded-xl border border-amber-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-700">{expense.category}</span>
                        <span className="text-lg font-bold text-red-600">₹{expense.amount.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-600">{expense.description}</div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white/70 p-4 rounded-lg border border-amber-100">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Total Expenses</span>
                    <span className="text-2xl font-bold text-red-700">₹{allExpenses.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Profit & Loss Calculation Block */}
              <div className="backdrop-blur-lg bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-xl border border-emerald-200 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className="mr-2">📊</span>
                  Profit & Loss Calculation
                </h3>
                
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div className="bg-white/70 p-5 rounded-xl border border-green-100">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-700">Revenue</h4>
                      <span className="text-2xl font-bold text-green-700">₹{parseFloat(booking.bookingAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base Fare</span>
                        <span className="font-medium">₹{parseFloat(booking.bookingAmount || 0).toFixed(2)}</span>
                      </div>
                      {booking.advance && parseFloat(booking.advance) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Advance Received</span>
                          <span className="font-medium text-green-600">₹{parseFloat(booking.advance).toFixed(2)}</span>
                        </div>
                      )}
                      {balance > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Balance Pending</span>
                          <span className="font-medium text-amber-600">₹{balance.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div className="bg-white/70 p-5 rounded-xl border border-red-100">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-gray-700">Total Expenses</h4>
                      <span className="text-2xl font-bold text-red-700">₹{allExpenses.total.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Includes fuel, driver payment, toll, maintenance, etc.
                    </div>
                  </div>

                  {/* Net Profit Section */}
                  <div className={`bg-gradient-to-r ${netProfit >= 0 ? 'from-emerald-100 to-green-100' : 'from-rose-100 to-red-100'} p-6 rounded-xl border ${netProfit >= 0 ? 'border-emerald-300' : 'border-red-300'}`}>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">
                        {netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS'}
                      </div>
                      <div className={`text-4xl font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        ₹{Math.abs(netProfit).toFixed(2)}
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        Margin: {booking.bookingAmount > 0 ? ((netProfit / booking.bookingAmount) * 100).toFixed(2) : 0}%
                      </div>
                    </div>
                  </div>

                  {/* Profit Formula */}
                  <div className="bg-white/70 p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-700 font-mono text-center">
                      ₹{parseFloat(booking.bookingAmount || 0).toFixed(2)} (Revenue) - ₹{allExpenses.total.toFixed(2)} (Expenses) = ₹{netProfit.toFixed(2)} ({netProfit >= 0 ? 'Profit' : 'Loss'})
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-blue-200">
                  <div className="text-sm text-gray-600 mb-2">Profit per KM</div>
                  <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₹{fuelDetails ? (netProfit / fuelDetails.distance).toFixed(2) : 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">per kilometer</div>
                </div>
                
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-blue-200">
                  <div className="text-sm text-gray-600 mb-2">Profit per Passenger</div>
                  <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₹{booking.passengers > 0 ? (netProfit / booking.passengers).toFixed(2) : netProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">per passenger</div>
                </div>
                
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-5 border border-blue-200">
                  <div className="text-sm text-gray-600 mb-2">Expense Ratio</div>
                  <div className="text-2xl font-bold text-amber-600">
                    {booking.bookingAmount > 0 ? ((allExpenses.total / booking.bookingAmount) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-gray-500 mt-2">of revenue</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Footer Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 backdrop-blur-lg bg-white rounded-2xl shadow-xl border p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-semibold text-gray-800">Booking #{booking.bookingId}</h3>
                <p className="text-gray-600 text-sm">
                  Status: <span className={`font-medium ${statusInfo.text}`}>{statusInfo.label}</span> • 
                  Profit: <span className={`font-medium ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</span>
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/reports"
                  className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Reports
                </Link>
                
                <Link
                  href="/"
                  className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Dashboard
                </Link>
                
                <Link
                  href={`/booking/edit/${bookingId}`}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-xl hover:from-emerald-700 hover:to-green-800 transition-all duration-300 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Booking
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </TravelBackground>
  );
}