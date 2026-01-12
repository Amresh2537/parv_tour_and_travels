'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { bookingApi, formatCurrency, formatDate } from '@/lib/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function EditBookingPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dynamic dropdown data
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  
  // Form data matching Google Sheets columns
  const [formData, setFormData] = useState({
    // Booking Details
    bookingId: '',
    date: new Date(), // Changed to Date object for DatePicker
    customerName: '',
    phone: '',
    from: '',
    to: '',
    vehicle: '',
    vehicleAverage: '12',
    bookingAmount: '',
    advance: '',
    status: 'pending',
    passengers: '', // Added passengers field
    tripType: 'one-way', // Added trip type
    
    // Driver Details
    driverName: '',
    driverPhone: '',
    startKM: '',
    endKM: '',
    totalKM: '',
    
    // Fuel Details
    fuelRate: '',
    liters: '',
    fuelCost: '',
    
    // Expenses
    toll: '',
    driverPayment: '',
    otherExpenses: '',
    totalExpenses: '',
    
    // Calculations
    outstanding: '',
    netProfit: '',
    
    // Notes
    notes: '',
    
    // System fields (readonly)
    createdAt: '',
    updatedAt: '',
    statusChangedBy: '',
    statusChangeDate: ''
  });
  
  // Status options
  const statusOptions = [
    { value: 'pending', label: '⏳ Pending' },
    { value: 'confirmed', label: '✅ Confirmed' },
    { value: 'driver_assigned', label: '👨‍✈️ Driver Assigned' },
    { value: 'expenses_added', label: '💰 Expenses Added' },
    { value: 'completed', label: '🏁 Completed' },
    { value: 'cancelled', label: '❌ Cancelled' }
  ];

  // Trip type options
  const tripTypeOptions = [
    { value: 'one-way', label: 'One Way' },
    { value: 'round-trip', label: 'Round Trip' },
    { value: 'multi-city', label: 'Multi City' },
    { value: 'hourly', label: 'Hourly Basis' },
    { value: 'daily', label: 'Daily Package' }
  ];

  useEffect(() => {
    if (bookingId) {
      loadAllData();
    }
  }, [bookingId]);

  const loadAllData = async () => {
    setLoading(true);
    setLoadingDropdowns(true);
    setError('');
    
    try {
      // Load dropdown data and booking in parallel
      const [bookingRes, driversRes, vehiclesRes] = await Promise.all([
        bookingApi.getById(bookingId),
        bookingApi.getDrivers(),
        bookingApi.getAvailableVehicles() // Using the new function for dynamic vehicles
      ]);
      
      // Load booking details
      if (bookingRes.success && bookingRes.data) {
        const booking = bookingRes.data;
        
        // Parse booking date (handle both string and date formats)
        let bookingDate = new Date();
        if (booking.date) {
          try {
            // Try to parse Indian date format (DD/MM/YYYY)
            if (typeof booking.date === 'string' && booking.date.includes('/')) {
              const [day, month, year] = booking.date.split('/');
              bookingDate = new Date(year, month - 1, day);
            } else {
              bookingDate = new Date(booking.date);
            }
            if (isNaN(bookingDate.getTime())) {
              bookingDate = new Date();
            }
          } catch (e) {
            bookingDate = new Date();
          }
        }
        
        setFormData({
          // Booking Details
          bookingId: booking.bookingId || bookingId,
          date: bookingDate,
          customerName: booking.customerName || '',
          phone: booking.phone || '',
          from: booking.from || '',
          to: booking.to || '',
          vehicle: booking.vehicle || '',
          vehicleAverage: booking.vehicleAverage || '12',
          bookingAmount: booking.bookingAmount || '',
          advance: booking.advance || '',
          status: booking.status || 'pending',
          passengers: booking.passengers || '',
          tripType: booking.tripType || 'one-way',
          
          // Driver Details
          driverName: booking.driverName || '',
          driverPhone: booking.driverPhone || '',
          startKM: booking.startKM || '',
          endKM: booking.endKM || '',
          totalKM: booking.totalKM || '',
          
          // Fuel Details
          fuelRate: booking.fuelRate || '',
          liters: booking.liters || '',
          fuelCost: booking.fuelCost || '',
          
          // Expenses
          toll: booking.toll || '',
          driverPayment: booking.driverPayment || '',
          otherExpenses: booking.otherExpenses || '',
          totalExpenses: booking.totalExpenses || '',
          
          // Calculations
          outstanding: booking.outstanding || '',
          netProfit: booking.netProfit || '',
          
          // Notes
          notes: booking.notes || '',
          
          // System fields
          createdAt: booking.createdAt || '',
          updatedAt: booking.updatedAt || '',
          statusChangedBy: booking.statusChangedBy || '',
          statusChangeDate: booking.statusChangeDate || ''
        });
      } else {
        setError('Booking not found in database');
      }
      
      // Load drivers data
      if (driversRes.success && driversRes.data) {
        setDrivers(driversRes.data);
      } else {
        console.warn('Could not load drivers from database');
      }
      
      // Load dynamic vehicles data
      if (vehiclesRes.success && vehiclesRes.data) {
        setAvailableVehicles(vehiclesRes.data);
      } else {
        console.warn('Could not load vehicles from database');
        // Fallback to default vehicles
        setAvailableVehicles([
          { id: 'V001', name: 'Innova', type: 'SUV', capacity: 7, average: 12 },
          { id: 'V002', name: 'Swift', type: 'Sedan', capacity: 4, average: 18 },
          { id: 'V003', name: 'Ertiga', type: 'MPV', capacity: 7, average: 15 },
          { id: 'V004', name: 'Scorpio', type: 'SUV', capacity: 7, average: 10 },
          { id: 'V005', name: 'XUV700', type: 'SUV', capacity: 7, average: 11 },
          { id: 'V006', name: 'Fortuner', type: 'SUV', capacity: 7, average: 9 },
          { id: 'V007', name: 'Crysta', type: 'SUV', capacity: 7, average: 10 },
          { id: 'V008', name: 'Tempo', type: 'Van', capacity: 12, average: 8 },
          { id: 'V009', name: 'Bus', type: 'Bus', capacity: 40, average: 4 }
        ]);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
      setLoadingDropdowns(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // If vehicle selection changes, update vehicle average and capacity info
      if (name === 'vehicle') {
        const selectedVehicle = availableVehicles.find(v => 
          v.name === value || v.type === value
        );
        if (selectedVehicle) {
          updated.vehicleAverage = selectedVehicle.average?.toString() || '12';
        }
      }
      
      // If driver selection changes, update driver details
      if (name === 'driverName') {
        const selectedDriver = drivers.find(d => 
          d.name === value
        );
        if (selectedDriver) {
          updated.driverPhone = selectedDriver.phone || '';
        }
      }
      
      // Calculate total KM if start or end KM changes
      if (name === 'startKM' || name === 'endKM') {
        const start = parseFloat(updated.startKM) || 0;
        const end = parseFloat(updated.endKM) || 0;
        const distance = end - start;
        updated.totalKM = distance > 0 ? distance.toString() : '0';
        
        // Auto-calculate fuel if vehicle average and fuel rate are set
        if (updated.vehicleAverage && updated.fuelRate) {
          const avg = parseFloat(updated.vehicleAverage) || 12;
          const rate = parseFloat(updated.fuelRate) || 0;
          if (distance > 0 && avg > 0) {
            const liters = distance / avg;
            updated.liters = liters.toFixed(2);
            updated.fuelCost = (liters * rate).toFixed(2);
          }
        }
      }
      
      // Auto-calculate fuel if vehicle average or fuel rate changes
      if (name === 'vehicleAverage' || name === 'fuelRate') {
        const start = parseFloat(updated.startKM) || 0;
        const end = parseFloat(updated.endKM) || 0;
        const distance = end - start;
        
        if (distance > 0) {
          const avg = parseFloat(updated.vehicleAverage) || 12;
          const rate = parseFloat(updated.fuelRate) || 0;
          
          if (avg > 0) {
            const liters = distance / avg;
            updated.liters = liters.toFixed(2);
            updated.fuelCost = (liters * rate).toFixed(2);
          }
        }
      }
      
      // Recalculate total expenses
      const fuelCost = parseFloat(updated.fuelCost) || 0;
      const toll = parseFloat(updated.toll) || 0;
      const driverPayment = parseFloat(updated.driverPayment) || 0;
      const otherExpenses = parseFloat(updated.otherExpenses) || 0;
      updated.totalExpenses = (fuelCost + toll + driverPayment + otherExpenses).toFixed(2);
      
      // Recalculate profit and outstanding
      const bookingAmount = parseFloat(updated.bookingAmount) || 0;
      const advance = parseFloat(updated.advance) || 0;
      const totalExp = parseFloat(updated.totalExpenses) || 0;
      
      updated.netProfit = (bookingAmount - totalExp).toFixed(2);
      updated.outstanding = (bookingAmount - advance - totalExp).toFixed(2);
      
      return updated;
    });
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date: date
    }));
  };

  const getVehicleCapacity = (vehicleName) => {
    const vehicle = availableVehicles.find(v => v.name === vehicleName);
    return vehicle ? vehicle.capacity : 4;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Format date for API (ISO string)
      const bookingDateStr = formData.date.toISOString();
      // Format for display (DD/MM/YYYY)
      const displayDate = formData.date.toLocaleDateString('en-IN');
      
      // Use the updateBooking API directly
      const updateRes = await bookingApi.updateBooking({
        bookingId: formData.bookingId,
        date: displayDate, // Send display format
        bookingDate: bookingDateStr, // Send ISO format
        customerName: formData.customerName,
        phone: formData.phone,
        from: formData.from,
        to: formData.to,
        vehicle: formData.vehicle,
        vehicleAverage: formData.vehicleAverage,
        bookingAmount: formData.bookingAmount,
        advance: formData.advance,
        passengers: formData.passengers,
        tripType: formData.tripType,
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        startKM: formData.startKM,
        endKM: formData.endKM,
        totalKM: formData.totalKM,
        fuelRate: formData.fuelRate,
        liters: formData.liters,
        fuelCost: formData.fuelCost,
        toll: formData.toll,
        driverPayment: formData.driverPayment,
        otherExpenses: formData.otherExpenses,
        totalExpenses: formData.totalExpenses,
        outstanding: formData.outstanding,
        netProfit: formData.netProfit,
        notes: formData.notes,
        status: formData.status
      });
      
      console.log('Update response:', updateRes);
      
      if (updateRes.success) {
        setSuccess('✅ Booking updated successfully!');
        
        // Reload data to show updated values
        setTimeout(() => {
          loadAllData();
        }, 1000);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
        
      } else {
        setError('⚠️ Failed to update booking: ' + (updateRes.error || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('Error saving booking:', error);
      setError('⚠️ Failed to update booking. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCalculate = async () => {
    setSaving(true);
    try {
      const res = await bookingApi.calculate(bookingId);
      if (res.success) {
        setSuccess('✅ Profit calculated successfully!');
        // Reload data
        await loadAllData();
      } else {
        setError('⚠️ Failed to calculate profit');
      }
    } catch (error) {
      setError('⚠️ Error calculating profit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        const res = await bookingApi.cancelBooking(bookingId, 'Deleted via edit page');
        if (res.success) {
          alert('✅ Booking deleted successfully!');
          router.push('/');
        }
      } catch (error) {
        setError('⚠️ Failed to delete booking');
      }
    }
  };

  // Filter available drivers
  const availableDrivers = drivers.filter(d => 
    d.status === 'Available' || d.name === formData.driverName
  );

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Edit Booking</h1>
              <p className="text-gray-600 mt-2">
                Booking ID: <span className="font-mono font-medium text-blue-600">{bookingId}</span>
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ← Dashboard
              </button>
            </div>
          </div>
          
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          {/* Booking ID & Date */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking ID
                </label>
                <input
                  type="text"
                  value={formData.bookingId}
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 font-mono"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Date *
                </label>
                <div className="relative">
                  <DatePicker
                    selected={formData.date}
                    onChange={handleDateChange}
                    dateFormat="dd/MM/yyyy"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select booking date"
                  />
                  <div className="absolute right-3 top-2.5 text-gray-400">
                    📅
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Customer Details */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">👤 Customer Details</h3>
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location *
                </label>
                <input
                  type="text"
                  name="from"
                  value={formData.from}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drop Location *
                </label>
                <input
                  type="text"
                  name="to"
                  value={formData.to}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Travel Details */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">🚗 Travel Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dynamic Vehicle Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle *
                </label>
                {loadingDropdowns ? (
                  <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-gray-500">Loading vehicles...</span>
                    </div>
                  </div>
                ) : availableVehicles.length > 0 ? (
                  <div>
                    <select
                      name="vehicle"
                      value={formData.vehicle}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Select Vehicle</option>
                      {availableVehicles.map(vehicle => (
                        <option 
                          key={vehicle.id || vehicle.name} 
                          value={vehicle.name}
                          className="py-2"
                        >
                          {vehicle.name} 
                          {vehicle.type && ` (${vehicle.type})`}
                          {vehicle.capacity && ` - ${vehicle.capacity} seats`}
                        </option>
                      ))}
                    </select>
                    {formData.vehicle && (
                      <div className="mt-2 text-xs text-gray-600">
                        {(() => {
                          const vehicle = availableVehicles.find(v => v.name === formData.vehicle);
                          if (vehicle) {
                            return (
                              <>
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded mr-2">
                                  {vehicle.capacity || 4} seats
                                </span>
                                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded">
                                  Avg: {vehicle.average || 12} km/L
                                </span>
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter vehicle name"
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Average (km/L)
                </label>
                <input
                  type="number"
                  name="vehicleAverage"
                  value={formData.vehicleAverage}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
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
                  max={getVehicleCapacity(formData.vehicle)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={`Max: ${getVehicleCapacity(formData.vehicle)}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Vehicle capacity: {getVehicleCapacity(formData.vehicle)} seats
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Type
                </label>
                <select
                  name="tripType"
                  value={formData.tripType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {tripTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Payment Details */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">💰 Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advance Paid (₹)
                </label>
                <input
                  type="number"
                  name="advance"
                  value={formData.advance}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Balance Amount:</p>
                  <p className={`text-2xl font-bold ${(parseFloat(formData.bookingAmount) - parseFloat(formData.advance)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{((parseFloat(formData.bookingAmount) || 0) - (parseFloat(formData.advance) || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Driver Details */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">👨‍✈️ Driver Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Name
                </label>
                {loadingDropdowns ? (
                  <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 animate-pulse">
                    Loading drivers...
                  </div>
                ) : availableDrivers.length > 0 ? (
                  <select
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Driver</option>
                    {availableDrivers.map(driver => (
                      <option 
                        key={driver.driverId} 
                        value={driver.name}
                      >
                        {driver.name} - {driver.phone}
                        {driver.experience ? ` (${driver.experience})` : ''}
                      </option>
                    ))}
                    <option value="Other">Other (Manual Entry)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter driver name"
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Phone
                </label>
                <input
                  type="tel"
                  name="driverPhone"
                  value={formData.driverPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Driver phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start KM Reading
                </label>
                <input
                  type="number"
                  name="startKM"
                  value={formData.startKM}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End KM Reading
                </label>
                <input
                  type="number"
                  name="endKM"
                  value={formData.endKM}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Distance Traveled:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formData.totalKM || 0} km
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Fuel & Expenses */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">⛽ Fuel & Expenses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Rate (₹/liter)
                </label>
                <input
                  type="number"
                  name="fuelRate"
                  value={formData.fuelRate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Used (liters)
                </label>
                <input
                  type="number"
                  name="liters"
                  value={formData.liters}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Cost (₹)
                </label>
                <input
                  type="number"
                  name="fuelCost"
                  value={formData.fuelCost}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toll Charges (₹)
                </label>
                <input
                  type="number"
                  name="toll"
                  value={formData.toll}
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
                  value={formData.driverPayment}
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
                  value={formData.otherExpenses}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Expenses:</p>
                  <p className="text-2xl font-bold">
                    ₹{formData.totalExpenses || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status & Notes */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Status & Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about this booking..."
                />
              </div>
            </div>
          </div>
          
          {/* Calculations Summary */}
          {formData.bookingAmount && (
            <div className="mb-8 p-6 bg-green-50 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">💰 Profit Calculation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Booking Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{formData.bookingAmount}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{formData.totalExpenses || '0'}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg border-2 border-green-300">
                  <p className="text-sm text-gray-600">Net Profit</p>
                  <p className="text-3xl font-bold text-green-700">
                    ₹{formData.netProfit || '0'}
                  </p>
                </div>
                
                <div className="md:col-span-3 text-center p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">Outstanding Amount</p>
                  <p className={`text-2xl font-bold ${parseFloat(formData.outstanding) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{formData.outstanding || '0'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* System Info */}
          {formData.createdAt && (
            <div className="mb-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
              <p>Created: {formatDate(formData.createdAt)}</p>
              <p>Last Updated: {formatDate(formData.updatedAt)}</p>
              <p>Status Last Changed: {formatDate(formData.statusChangeDate)} by {formData.statusChangedBy || 'system'}</p>
              <p>Booking Time: {formData.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="pt-8 border-t">
            <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleQuickCalculate}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Recalculate Profit
                </button>
                
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Booking
                </button>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push(`/booking/summary/${bookingId}`)}
                  className="px-6 py-2.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                >
                  View Summary
                </button>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </form>
        
        {/* Quick Links */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
          <p className="font-medium text-gray-700 mb-2">Need to manage drivers or vehicles?</p>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/management/drivers')}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Manage Drivers
            </button>
            <button
              onClick={() => router.push('/management/vehicles')}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Manage Vehicles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}