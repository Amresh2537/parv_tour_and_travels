'use client';

import { useState, useEffect } from 'react';
import { bookingApi } from '@/lib/api';
import { TravelBackground } from '@/components/TravelBackground';
import { motion } from 'framer-motion';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    type: 'Innova',
    registration: '',
    driverAssigned: '',
    capacity: '',
    fuelType: 'Petrol',
    status: 'Available',
    lastService: '',
    nextService: '',
    insuranceExpiry: '',
    notes: ''
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getVehicles();
      if (response.success) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode) {
        await bookingApi.updateVehicle(formData);
        showNotification('Vehicle updated successfully!', 'success');
      } else {
        await bookingApi.addVehicle(formData);
        showNotification('Vehicle added successfully!', 'success');
      }
      
      setShowForm(false);
      setEditMode(false);
      setFormData({
        vehicleId: '',
        type: 'Innova',
        registration: '',
        driverAssigned: '',
        capacity: '',
        fuelType: 'Petrol',
        status: 'Available',
        lastService: '',
        nextService: '',
        insuranceExpiry: '',
        notes: ''
      });
      
      loadVehicles();
      
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showNotification('Error saving vehicle', 'error');
    }
  };

  const handleEdit = (vehicle) => {
    setFormData(vehicle);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await bookingApi.deleteVehicle(vehicleId);
        showNotification('Vehicle deleted successfully!', 'success');
        loadVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        showNotification('Error deleting vehicle', 'error');
      }
    }
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
      type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return { bg: 'bg-emerald-500/20', text: 'text-emerald-700', dot: 'bg-emerald-500' };
      case 'On Trip': return { bg: 'bg-blue-500/20', text: 'text-blue-700', dot: 'bg-blue-500' };
      case 'Maintenance': return { bg: 'bg-amber-500/20', text: 'text-amber-700', dot: 'bg-amber-500' };
      case 'Out of Service': return { bg: 'bg-rose-500/20', text: 'text-rose-700', dot: 'bg-rose-500' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-700', dot: 'bg-gray-500' };
    }
  };

  const vehicleTypes = [
    'Innova', 'Swift', 'Ertiga', 'Scorpio', 'XUV700',
    'Fortuner', 'Crysta', 'Tempo', 'Bus', 'Other'
  ];

  if (loading) {
    return (
      <TravelBackground variant="car">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading fleet data...</p>
          </div>
        </div>
      </TravelBackground>
    );
  }

  return (
    <TravelBackground variant="car">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 md:p-8 shadow-xl border border-white/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                    Fleet Management
                  </h1>
                  <p className="text-gray-600 mt-2">Manage your vehicle fleet and maintenance schedule</p>
                  <div className="flex items-center mt-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      {vehicles.length} vehicles in fleet
                    </div>
                    <span className="mx-3 text-gray-300">•</span>
                    <div className="text-sm text-gray-500">
                      {vehicles.filter(v => v.status === 'Available').length} available
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center group"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Vehicle
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: 'Total Vehicles',
                value: vehicles.length,
                icon: '🚗',
                color: 'from-green-500 to-emerald-600'
              },
              {
                title: 'Available',
                value: vehicles.filter(v => v.status === 'Available').length,
                icon: '✅',
                color: 'from-emerald-500 to-green-600'
              },
              {
                title: 'On Trip',
                value: vehicles.filter(v => v.status === 'On Trip').length,
                icon: '🛣️',
                color: 'from-blue-500 to-indigo-600'
              },
              {
                title: 'Maintenance',
                value: vehicles.filter(v => v.status === 'Maintenance').length,
                icon: '🔧',
                color: 'from-amber-500 to-orange-600'
              }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Vehicles Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 overflow-hidden"
          >
            {/* Table Header */}
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Vehicle Roster</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {vehicles.length} vehicles in your fleet
                  </p>
                </div>
                
                <button
                  onClick={loadVehicles}
                  className="mt-4 md:mt-0 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50/50 transition-colors backdrop-blur-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Fleet
                </button>
              </div>
            </div>

            {vehicles.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-6">
                  <span className="text-3xl">🚗</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No vehicles added yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Add your first vehicle to start managing your fleet
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
                >
                  + Add First Vehicle
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Vehicle</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Registration</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Specifications</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Maintenance</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vehicles.map((vehicle, index) => {
                      const statusColors = getStatusColor(vehicle.status);
                      return (
                        <tr 
                          key={vehicle.vehicleId} 
                          className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-white transition-all duration-200 group"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-50 rounded-xl mr-4">
                                <span className="text-green-600 text-xl">🚗</span>
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{vehicle.type}</p>
                                <p className="text-sm text-gray-500">ID: {vehicle.vehicleId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-mono text-lg font-bold text-gray-800 bg-gray-50/70 px-3 py-1 rounded-lg inline-block">
                                {vehicle.registration}
                              </p>
                              {vehicle.driverAssigned && (
                                <p className="text-sm text-gray-600 mt-1">
                                  👨‍✈️ {vehicle.driverAssigned}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded mr-2">
                                  {vehicle.capacity || 'N/A'} seats
                                </span>
                                <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded">
                                  {vehicle.fuelType || 'N/A'}
                                </span>
                              </div>
                              {vehicle.notes && (
                                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                  {vehicle.notes}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-2">
                              <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${statusColors.bg} ${statusColors.text} inline-flex items-center w-fit`}>
                                <span className={`w-2 h-2 rounded-full ${statusColors.dot} mr-2 animate-pulse`}></span>
                                {vehicle.status}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-2">
                              {vehicle.lastService && (
                                <div>
                                  <p className="text-xs text-gray-500">Last Service</p>
                                  <p className="text-sm font-medium">{vehicle.lastService}</p>
                                </div>
                              )}
                              {vehicle.nextService && (
                                <div>
                                  <p className="text-xs text-gray-500">Next Service</p>
                                  <p className="text-sm font-medium text-blue-600">{vehicle.nextService}</p>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(vehicle)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-sm font-medium flex items-center shadow-sm hover:shadow"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              
                              <button
                                onClick={() => handleDelete(vehicle.vehicleId)}
                                className="px-4 py-2 bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700 rounded-lg hover:from-rose-100 hover:to-rose-200 transition-all duration-200 text-sm font-medium flex items-center shadow-sm hover:shadow"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {editMode ? 'Edit Vehicle' : 'Add New Vehicle'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditMode(false);
                    }}
                    className="text-white hover:text-green-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {vehicleTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      name="registration"
                      value={formData.registration}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 uppercase"
                      placeholder="MH12AB1234"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacity
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="7"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuel Type
                      </label>
                      <select
                        name="fuelType"
                        value={formData.fuelType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Out of Service">Out of Service</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Service Date
                      </label>
                      <input
                        type="date"
                        name="lastService"
                        value={formData.lastService}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Next Service Date
                      </label>
                      <input
                        type="date"
                        name="nextService"
                        value={formData.nextService}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Expiry
                    </label>
                    <input
                      type="date"
                      name="insuranceExpiry"
                      value={formData.insuranceExpiry}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Driver Assigned
                    </label>
                    <input
                      type="text"
                      name="driverAssigned"
                      value={formData.driverAssigned}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Driver name"
                    />
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Any additional notes..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditMode(false);
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-green-800 transition-all duration-300"
                    >
                      {editMode ? 'Update' : 'Add'} Vehicle
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </TravelBackground>
  );
}