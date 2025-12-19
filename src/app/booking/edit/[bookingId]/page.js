'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { bookingApi, tripCalculator, tripStorage } from '@/lib/api';

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tripData, setTripData] = useState(null);
  const [activeTab, setActiveTab] = useState('booking');
  
  // Data for dropdowns
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    if (bookingId) {
      loadBookingData();
    }
  }, [bookingId]);

  const loadBookingData = async () => {
    setLoading(true);
    try {
      // Load booking details from Google Sheets
      const bookingRes = await bookingApi.getById(bookingId);
      
      if (bookingRes.success && bookingRes.data) {
        // Your Google Sheets already has all data in one row
        const combinedData = bookingRes.data;
        setTripData(combinedData);
        
        // Load vehicles and drivers (you might want to create separate sheets for these)
        // For now, using dummy data
        setVehicles([
          { id: '1', name: 'Toyota Innova (MH12AB1234)', average: 12 },
          { id: '2', name: 'Swift Dzire (MH12CD5678)', average: 18 },
          { id: '3', name: 'Tempo Traveller (MH12EF9012)', average: 8 }
        ]);
        
        setDrivers([
          { id: '1', name: 'Rajesh Kumar', phone: '9876543210' },
          { id: '2', name: 'Suresh Patel', phone: '9876543211' },
          { id: '3', name: 'Amit Sharma', phone: '9876543212' }
        ]);
        
      } else {
        // Fallback to localStorage
        const localData = tripStorage.getTrip(bookingId);
        if (localData) {
          setTripData(localData);
        } else {
          console.error('Booking not found in API or localStorage');
          // Don't redirect immediately, show the error message
        }
      }
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    setTripData(prev => {
      const updated = { ...prev, [name]: value };
      
      // If KM readings change, calculate fuel
      if (name === 'startKM' || name === 'endKM') {
        const fuelCalc = tripCalculator.calculateFuel(
          updated.startKM || 0,
          updated.endKM || 0,
          12, // Default vehicle average - you should get this from vehicle selection
          updated.fuelRate || 0
        );
        
        updated.totalKM = fuelCalc.distance;
        updated.liters = fuelCalc.liters;
        updated.fuelCost = fuelCalc.cost;
        
        // Recalculate total expenses
        const expenses = {
          fuelCost: fuelCalc.cost,
          tollAmount: updated.toll || 0,
          driverPayment: updated.driverPayment || 0,
          otherExpenses: updated.otherExpenses || 0
        };
        
        const totalExp = tripCalculator.calculateTotalExpenses(expenses);
        updated.totalExpenses = totalExp.total;
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      tripStorage.saveTrip(tripData);
      
      // Prepare data for Google Sheets update
      const updateData = {
        bookingId: tripData.bookingId,
        customerName: tripData.customerName,
        phone: tripData.phone,
        from: tripData.from,
        to: tripData.to,
        vehicle: tripData.vehicle,
        bookingAmount: tripData.bookingAmount,
        advance: tripData.advance,
        driverName: tripData.driverName,
        driverPhone: tripData.driverPhone,
        startKM: tripData.startKM,
        endKM: tripData.endKM,
        totalKM: tripData.totalKM,
        fuelRate: tripData.fuelRate,
        liters: tripData.liters,
        fuelCost: tripData.fuelCost,
        toll: tripData.toll,
        driverPayment: tripData.driverPayment,
        otherExpenses: tripData.otherExpenses,
        totalExpenses: tripData.totalExpenses,
        status: tripData.status || 'pending'
      };
      
      // Note: You'll need to create an 'updateBooking' action in your Google Script
      // For now, just show success
      console.log('Would update booking:', updateData);
      
      alert('✅ Booking updated successfully!');
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error saving:', error);
      alert('⚠️ Error saving booking');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Discard changes?')) {
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-medium text-gray-800 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">The requested booking does not exist.</p>
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Edit Booking</h1>
              <p className="text-gray-600 mt-2">
                Booking ID: <span className="font-mono font-medium text-blue-600">{bookingId}</span>
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-white rounded-lg shadow p-1 mb-8">
            <button
              onClick={() => setActiveTab('booking')}
              className={`flex-1 py-3 px-4 rounded-md text-center font-medium ${
                activeTab === 'booking' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📋 Booking Details
            </button>
            <button
              onClick={() => setActiveTab('driver')}
              className={`flex-1 py-3 px-4 rounded-md text-center font-medium ${
                activeTab === 'driver' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              👨‍✈️ Driver & KM
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 py-3 px-4 rounded-md text-center font-medium ${
                activeTab === 'expenses' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              💰 Expenses
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Booking Details Tab */}
          {activeTab === 'booking' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Customer & Booking Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={tripData.customerName || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={tripData.phone || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From (Pickup) *
                  </label>
                  <input
                    type="text"
                    name="from"
                    value={tripData.from || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To (Drop) *
                  </label>
                  <input
                    type="text"
                    name="to"
                    value={tripData.to || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle
                  </label>
                  <select
                    name="vehicle"
                    value={tripData.vehicle || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose Vehicle</option>
                    <option value="Innova">Toyota Innova</option>
                    <option value="Swift Dzire">Swift Dzire</option>
                    <option value="Tempo Traveller">Tempo Traveller</option>
                    <option value="XUV700">XUV700</option>
                    <option value="Scorpio">Scorpio</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="bookingAmount"
                    value={tripData.bookingAmount || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance (₹)
                  </label>
                  <input
                    type="number"
                    name="advance"
                    value={tripData.advance || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={tripData.status || 'pending'}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="driver_assigned">Driver Assigned</option>
                    <option value="expenses_added">Expenses Added</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={tripData.date || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
          
          {/* Driver & KM Tab */}
          {activeTab === 'driver' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Driver & Distance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    name="driverName"
                    value={tripData.driverName || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driver Phone
                  </label>
                  <input
                    type="tel"
                    name="driverPhone"
                    value={tripData.driverPhone || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start KM
                  </label>
                  <input
                    type="number"
                    name="startKM"
                    value={tripData.startKM || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End KM
                  </label>
                  <input
                    type="number"
                    name="endKM"
                    value={tripData.endKM || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {tripData.startKM && tripData.endKM && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Distance Calculated:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {tripData.totalKM || 0} km
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Expenses Management</h3>
              
              {/* Fuel Calculation */}
              <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                <h4 className="font-medium text-gray-700 mb-4">⛽ Fuel Calculation</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Rate (₹ per liter)
                    </label>
                    <input
                      type="number"
                      name="fuelRate"
                      value={tripData.fuelRate || ''}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Fuel Cost</p>
                      <p className="text-2xl font-bold">
                        ₹{tripData.fuelCost || '0'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {tripData.liters || '0'} liters
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Other Expenses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Toll Charges (₹)
                  </label>
                  <input
                    type="number"
                    name="toll"
                    value={tripData.toll || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driver Payment (₹)
                  </label>
                  <input
                    type="number"
                    name="driverPayment"
                    value={tripData.driverPayment || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other Expenses (₹)
                  </label>
                  <input
                    type="number"
                    name="otherExpenses"
                    value={tripData.otherExpenses || ''}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-end">
                  <div className="w-full p-4 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-xl font-bold">
                      ₹{tripData.totalExpenses || '0'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Calculations */}
              {tripData.bookingAmount && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">💰 Profit Calculation</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Booking Amount</p>
                      <p className="text-lg font-bold">₹{tripData.bookingAmount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Expenses</p>
                      <p className="text-lg font-bold">₹{tripData.totalExpenses || '0'}</p>
                    </div>
                    <div className="col-span-2 pt-4 border-t">
                      <p className="text-sm text-gray-600">Net Profit</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{(parseFloat(tripData.bookingAmount) - parseFloat(tripData.totalExpenses || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Bottom Actions */}
          <div className="pt-8 mt-8 border-t">
            <div className="flex justify-between">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ← Back to Dashboard
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}