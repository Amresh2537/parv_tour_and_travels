'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { bookingApi } from '@/lib/api';

export default function DriverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState({
    driverId: '',
    driverName: '',
    driverPhone: '',
    vehicleId: '',
    vehicleType: '',
    vehicleAverage: '12',
    startKM: '',
    selectedDriver: null,
    selectedVehicle: null
  });

  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    if (!id) {
      router.push('/booking/entry');
      return;
    }
    setBookingId(id);
    
    // Load saved data
    const savedDriver = localStorage.getItem('driverData');
    if (savedDriver) {
      setFormData(JSON.parse(savedDriver));
    }
    
    // Load drivers and vehicles from database
    loadDriversAndVehicles();
  }, [router]);

  const loadDriversAndVehicles = async () => {
    try {
      setLoadingData(true);
      
      // Load available drivers
      const driversResponse = await bookingApi.getDrivers();
      if (driversResponse.success) {
        const availableDrivers = driversResponse.data.filter(
          driver => driver.status === 'Available'
        );
        setDrivers(availableDrivers);
      }
      
      // Load available vehicles
      const vehiclesResponse = await bookingApi.getVehicles();
      if (vehiclesResponse.success) {
        const availableVehicles = vehiclesResponse.data.filter(
          vehicle => vehicle.status === 'Available'
        );
        setVehicles(availableVehicles);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'driverId') {
      const selectedDriver = drivers.find(d => d.driverId === value);
      if (selectedDriver) {
        setFormData(prev => ({
          ...prev,
          driverId: value,
          driverName: selectedDriver.name,
          driverPhone: selectedDriver.phone,
          selectedDriver
        }));
      }
    } 
    else if (name === 'vehicleId') {
      const selectedVehicle = vehicles.find(v => v.vehicleId === value);
      if (selectedVehicle) {
        setFormData(prev => ({
          ...prev,
          vehicleId: value,
          vehicleType: selectedVehicle.type,
          vehicleAverage: selectedVehicle.average || '12',
          selectedVehicle
        }));
      }
    } 
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save to local storage
      localStorage.setItem('driverData', JSON.stringify(formData));
      
      // Update driver and vehicle status in database
      if (formData.driverId) {
        await bookingApi.updateDriver({
          driverId: formData.driverId,
          status: 'On Trip',
          assignedVehicle: formData.vehicleId
        });
      }
      
      if (formData.vehicleId) {
        await bookingApi.updateVehicle({
          vehicleId: formData.vehicleId,
          status: 'On Trip',
          assignedDriver: formData.driverId,
          currentKM: formData.startKM
        });
      }
      
   const result = await bookingApi.addDriver({
  bookingId: bookingId,
  driverName: formData.driverName,
  driverPhone: formData.driverPhone,
  vehicleAverage: formData.vehicleAverage,
  startKM: formData.startKM
});
      
      if (result.success) {
        showNotification('✅ Driver and vehicle assigned successfully!');
        router.push('/booking/expenses');
      } else {
        showNotification('⚠️ Error assigning driver. Please try again.', 'warning');
      }
      
    } catch (error) {
      console.error('Error:', error);
      showNotification('Driver details saved locally.', 'warning');
      router.push('/booking/expenses');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    // Your notification code here
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading drivers and vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Assign Driver & Vehicle</h2>
        
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <p className="font-medium">Booking ID: {bookingId}</p>
          <p className="text-sm text-gray-600">Select from available drivers and vehicles</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Driver Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Select Driver</h3>
            
            {drivers.length === 0 ? (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-700">No available drivers. Please add drivers first.</p>
                <button
                  type="button"
                  onClick={() => router.push('/management/drivers')}
                  className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                >
                  Go to Drivers Management
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Driver *
                  </label>
                  <select
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a driver</option>
                    {drivers.map(driver => (
                      <option key={driver.driverId} value={driver.driverId}>
                        {driver.name} - {driver.phone} ({driver.experience})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driver Phone
                  </label>
                  <input
                    type="text"
                    value={formData.driverPhone}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            )}
            
            {formData.selectedDriver && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-medium text-green-800">Selected Driver:</p>
                <p className="text-sm text-green-600">
                  {formData.selectedDriver.name} | License: {formData.selectedDriver.licenseNumber} | 
                  Experience: {formData.selectedDriver.experience}
                </p>
              </div>
            )}
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold text-gray-700">Select Vehicle</h3>
            
            {vehicles.length === 0 ? (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-700">No available vehicles. Please add vehicles first.</p>
                <button
                  type="button"
                  onClick={() => router.push('/management/vehicles')}
                  className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                >
                  Go to Vehicles Management
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Vehicle *
                  </label>
                  <select
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a vehicle</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                        {vehicle.type} - {vehicle.number} (Avg: {vehicle.average} km/L)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Average (km/L)
                  </label>
                  <input
                    type="text"
                    name="vehicleAverage"
                    value={formData.vehicleAverage}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
            
            {formData.selectedVehicle && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-800">Selected Vehicle:</p>
                <p className="text-sm text-blue-600">
                  {formData.selectedVehicle.type} ({formData.selectedVehicle.number}) | 
                  Fuel: {formData.selectedVehicle.fuelType} | 
                  Capacity: {formData.selectedVehicle.capacity} seats
                </p>
              </div>
            )}
          </div>

          {/* Start KM Reading */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Kilometer Reading *
            </label>
            <input
              type="number"
              name="startKM"
              value={formData.startKM}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Current odometer reading"
            />
          </div>

          {/* Calculation Preview */}
          {formData.startKM && formData.vehicleAverage && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Fuel Calculation Formula</h4>
              <p className="text-sm text-green-700">
                Distance (km) ÷ Vehicle Average ({formData.vehicleAverage} km/L) = Fuel Required (Liters)
              </p>
              <p className="text-sm text-green-600 mt-2">
                Example: 250 km ÷ {formData.vehicleAverage} km/L = {(250 / parseFloat(formData.vehicleAverage)).toFixed(2)} Liters
              </p>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/booking/confirm')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            
            <button
              type="submit"
              disabled={loading || !formData.driverId || !formData.vehicleId || !formData.startKM}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Assigning...' : 'Assign & Continue'}
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t text-sm text-gray-500">
          <p className="font-medium mb-2">Need to manage drivers/vehicles?</p>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/management/drivers')}
              className="text-blue-600 hover:text-blue-800"
            >
              Manage Drivers
            </button>
            <button
              onClick={() => router.push('/management/vehicles')}
              className="text-blue-600 hover:text-blue-800"
            >
              Manage Vehicles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}