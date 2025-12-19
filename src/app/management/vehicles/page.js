'use client';

import { useState, useEffect } from 'react';
import { bookingApi } from '@/lib/api';
import Link from 'next/link';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'Innova',
    number: '',
    model: '',
    year: new Date().getFullYear().toString(),
    fuelType: 'Petrol',
    average: '12',
    capacity: '4',
    status: 'Available',
    assignedDriver: '',
    insuranceExpiry: '',
    lastService: '',
    nextService: '',
    currentKM: '',
    notes: ''
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getVehicles();
      if (response.success) {
        setVehicles(response.data || []);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      showNotification('Error loading vehicles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode) {
        const response = await bookingApi.updateVehicle(formData);
        if (response.success) {
          showNotification('Vehicle updated successfully!', 'success');
        }
      } else {
        const response = await bookingApi.addVehicle(formData);
        if (response.success) {
          showNotification('Vehicle added successfully!', 'success');
        }
      }
      
      setShowForm(false);
      setEditMode(false);
      resetForm();
      loadVehicles();
      
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showNotification('Error saving vehicle', 'error');
    }
  };

  const handleEdit = (vehicle) => {
    // Format dates for input fields
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      } catch (e) {
        return dateString;
      }
    };

    setFormData({
      ...vehicle,
      insuranceExpiry: formatDateForInput(vehicle.insuranceExpiry),
      lastService: formatDateForInput(vehicle.lastService),
      nextService: formatDateForInput(vehicle.nextService)
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        const response = await bookingApi.deleteVehicle(vehicleId);
        if (response.success) {
          showNotification('Vehicle deleted successfully!', 'success');
          loadVehicles();
        }
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        showNotification('Error deleting vehicle', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      type: 'Innova',
      number: '',
      model: '',
      year: new Date().getFullYear().toString(),
      fuelType: 'Petrol',
      average: '12',
      capacity: '4',
      status: 'Available',
      assignedDriver: '',
      insuranceExpiry: '',
      lastService: '',
      nextService: '',
      currentKM: '',
      notes: ''
    });
  };

  const showNotification = (message, type = 'success') => {
    // Create and show notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-yellow-500 text-white'
    }`;
    notification.innerHTML = `
      <div class="flex items-center">
        <span class="mr-2">${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'On Trip': return 'bg-blue-100 text-blue-800';
      case 'Maintenance': return 'bg-red-100 text-red-800';
      case 'Servicing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Available': return '✅';
      case 'On Trip': return '🚗';
      case 'Maintenance': return '🔧';
      case 'Servicing': return '🛠️';
      default: return '📋';
    }
  };

  const getFuelIcon = (fuelType) => {
    switch(fuelType) {
      case 'Petrol': return '⛽';
      case 'Diesel': return '⛽';
      case 'CNG': return '🔥';
      case 'Electric': return '⚡';
      default: return '⛽';
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    // Filter by status
    if (filterStatus !== 'all' && vehicle.status !== filterStatus) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        vehicle.type?.toLowerCase().includes(searchLower) ||
        vehicle.number?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower) ||
        vehicle.vehicleId?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Calculate statistics
  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'Available').length,
    onTrip: vehicles.filter(v => v.status === 'On Trip').length,
    maintenance: vehicles.filter(v => v.status === 'Maintenance' || v.status === 'Servicing').length
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicles Management</h1>
            <p className="text-gray-600">Manage your vehicle fleet and maintenance</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Vehicle
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold">{stats.total}</h3>
                <p className="text-gray-600">Total Vehicles</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold">{stats.available}</h3>
                <p className="text-gray-600">Available</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold">{stats.onTrip}</h3>
                <p className="text-gray-600">On Trip</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold">{stats.maintenance}</h3>
                <p className="text-gray-600">Maintenance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by vehicle number, type, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Servicing">Servicing</option>
              </select>
              <button
                onClick={loadVehicles}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editMode ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditMode(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="Innova">Toyota Innova</option>
                      <option value="Swift">Maruti Swift Dzire</option>
                      <option value="Ertiga">Maruti Ertiga</option>
                      <option value="Scorpio">Mahindra Scorpio</option>
                      <option value="XUV700">Mahindra XUV700</option>
                      <option value="Alto">Maruti Alto</option>
                      <option value="Tempo">Tempo Traveller</option>
                      <option value="Bus">Bus</option>
                      <option value="SUV">SUV</option>
                      <option value="Sedan">Sedan</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Number *
                    </label>
                    <input
                      type="text"
                      name="number"
                      value={formData.number}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., DL1C AB 1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model Name
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., Innova Crysta 2.4 GX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturing Year
                    </label>
                    <input
                      type="number"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      min="2000"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Type *
                    </label>
                    <select
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="CNG">CNG</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Average (km per liter) *
                    </label>
                    <input
                      type="number"
                      name="average"
                      value={formData.average}
                      onChange={handleChange}
                      required
                      step="0.1"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., 12.5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Fuel efficiency of the vehicle</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seating Capacity *
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Servicing">Servicing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current KM Reading
                    </label>
                    <input
                      type="number"
                      name="currentKM"
                      value={formData.currentKM}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Expiry Date
                    </label>
                    <input
                      type="date"
                      name="insuranceExpiry"
                      value={formData.insuranceExpiry}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Service Date
                    </label>
                    <input
                      type="date"
                      name="lastService"
                      value={formData.lastService}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Next Service Due
                    </label>
                    <input
                      type="date"
                      name="nextService"
                      value={formData.nextService}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Any additional notes about the vehicle..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditMode(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editMode ? 'Update Vehicle' : 'Add Vehicle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Vehicles Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">All Vehicles ({filteredVehicles.length})</h2>
            <p className="text-gray-600 mt-1">Manage your fleet operations</p>
          </div>

          {filteredVehicles.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="mt-4 text-gray-500">No vehicles found</p>
              <p className="text-sm text-gray-400">Add your first vehicle to get started</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Vehicle
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Vehicle</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Number</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Type & Fuel</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Avg & Capacity</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">KM Reading</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.vehicleId} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-medium block">{vehicle.vehicleId || 'N/A'}</span>
                            <span className="text-sm text-gray-500">{vehicle.model || vehicle.type || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-medium">{vehicle.number || 'N/A'}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm mr-2">
                            {vehicle.type || 'N/A'}
                          </span>
                          <span className="text-sm">{getFuelIcon(vehicle.fuelType)} {vehicle.fuelType || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <span className="block text-sm font-medium">{vehicle.average || '0'} km/L</span>
                          <span className="block text-sm text-gray-500">{vehicle.capacity || '0'} seats</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <span className="mr-2">{getStatusIcon(vehicle.status)}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                            {vehicle.status || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono">{vehicle.currentKM ? `${vehicle.currentKM} km` : '-'}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                            title="Edit Vehicle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.vehicleId)}
                            className="text-red-600 hover:text-red-800 p-1 transition-colors"
                            title="Delete Vehicle"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/booking/driver"
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Assign to Booking
            </Link>
            <button
              onClick={() => {
                setFormData(prev => ({ ...prev, status: 'Maintenance' }));
                setShowForm(true);
              }}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark for Maintenance
            </button>
            <button
              onClick={loadVehicles}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}