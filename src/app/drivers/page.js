'use client';

import { useState, useEffect } from 'react';
import { bookingApi } from '@/lib/api';
import { TravelBackground } from '@/components/TravelBackground';
import { motion } from 'framer-motion';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    driverId: '',
    name: '',
    phone: '',
    licenseNumber: '',
    address: '',
    emergencyContact: '',
    salary: '',
    status: 'Available',
    assignedVehicle: '',
    experience: '',
    rating: '0',
    notes: ''
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getDrivers();
      if (response.success) {
        setDrivers(response.data);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
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
        // Update existing driver
        const result = await bookingApi.updateDriver(formData);
        if (result.success) {
          showNotification('Driver updated successfully!', 'success');
        } else {
          showNotification(result.error || 'Failed to update driver', 'error');
          return;
        }
      } else {
        // Add new driver
        const result = await bookingApi.addDriver(formData);
        if (result.success) {
          showNotification('Driver added successfully!', 'success');
        } else {
          showNotification(result.error || 'Failed to add driver', 'error');
          return;
        }
      }
      
      // Reset form and reload data
      setShowForm(false);
      setEditMode(false);
      setFormData({
        driverId: '',
        name: '',
        phone: '',
        licenseNumber: '',
        address: '',
        emergencyContact: '',
        salary: '',
        status: 'Available',
        assignedVehicle: '',
        experience: '',
        rating: '0',
        notes: ''
      });
      
      loadDrivers();
      
    } catch (error) {
      console.error('Error saving driver:', error);
      showNotification('Error saving driver', 'error');
    }
  };

  const handleEdit = (driver) => {
    setFormData({
      ...driver,
      // Make sure all fields are present
      driverId: driver.driverId || '',
      name: driver.name || '',
      phone: driver.phone || '',
      licenseNumber: driver.licenseNumber || '',
      address: driver.address || '',
      emergencyContact: driver.emergencyContact || '',
      salary: driver.salary || '',
      status: driver.status || 'Available',
      assignedVehicle: driver.assignedVehicle || '',
      experience: driver.experience || '',
      rating: driver.rating || '0',
      notes: driver.notes || ''
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (driverId) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        const result = await bookingApi.deleteDriver(driverId);
        if (result.success) {
          showNotification('Driver deleted successfully!', 'success');
          loadDrivers();
        } else {
          showNotification(result.error || 'Failed to delete driver', 'error');
        }
      } catch (error) {
        console.error('Error deleting driver:', error);
        showNotification('Error deleting driver', 'error');
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
      case 'On Leave': return { bg: 'bg-amber-500/20', text: 'text-amber-700', dot: 'bg-amber-500' };
      case 'Suspended': return { bg: 'bg-rose-500/20', text: 'text-rose-700', dot: 'bg-rose-500' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-700', dot: 'bg-gray-500' };
    }
  };

  // Generate a driver ID if not provided
  const generateDriverId = () => {
    return 'DRV' + Date.now().toString().slice(-6);
  };

  if (loading) {
    return (
      <TravelBackground variant="city">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading drivers data...</p>
          </div>
        </div>
      </TravelBackground>
    );
  }

  return (
    <TravelBackground variant="city">
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
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Drivers Management
                  </h1>
                  <p className="text-gray-600 mt-2">Manage your fleet drivers and their assignments</p>
                  <div className="flex items-center mt-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      {drivers.length} drivers in system
                    </div>
                    <span className="mx-3 text-gray-300">•</span>
                    <div className="text-sm text-gray-500">
                      {drivers.filter(d => d.status === 'Available').length} available
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFormData({
                      driverId: generateDriverId(),
                      name: '',
                      phone: '',
                      licenseNumber: '',
                      address: '',
                      emergencyContact: '',
                      salary: '',
                      status: 'Available',
                      assignedVehicle: '',
                      experience: '',
                      rating: '0',
                      notes: ''
                    });
                    setEditMode(false);
                    setShowForm(true);
                  }}
                  className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center group"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Driver
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
                  <span className="text-xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-3xl font-bold text-gray-800">{drivers.length}</p>
                  <p className="text-sm text-gray-600">Total Drivers</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl text-white shadow-lg">
                  <span className="text-xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-3xl font-bold text-gray-800">{drivers.filter(d => d.status === 'Available').length}</p>
                  <p className="text-sm text-gray-600">Available</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                  <span className="text-xl">🚗</span>
                </div>
                <div className="ml-4">
                  <p className="text-3xl font-bold text-gray-800">{drivers.filter(d => d.status === 'On Trip').length}</p>
                  <p className="text-sm text-gray-600">On Trip</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg">
                  <span className="text-xl">🌟</span>
                </div>
                <div className="ml-4">
                  <p className="text-3xl font-bold text-gray-800">{drivers.filter(d => parseFloat(d.rating) >= 4).length}</p>
                  <p className="text-sm text-gray-600">High Rating (4+)</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Drivers Table */}
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
                  <h2 className="text-xl font-bold text-gray-800">Driver Roster</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {drivers.length} drivers in your fleet
                  </p>
                </div>
                
                <button
                  onClick={loadDrivers}
                  className="mt-4 md:mt-0 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50/50 transition-colors backdrop-blur-sm flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh List
                </button>
              </div>
            </div>

            {drivers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
                  <span className="text-3xl">👨‍✈️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No drivers added yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Add your first driver to manage your fleet operations
                </p>
                <button
                  onClick={() => {
                    setFormData({
                      driverId: generateDriverId(),
                      name: '',
                      phone: '',
                      licenseNumber: '',
                      address: '',
                      emergencyContact: '',
                      salary: '',
                      status: 'Available',
                      assignedVehicle: '',
                      experience: '',
                      rating: '0',
                      notes: ''
                    });
                    setEditMode(false);
                    setShowForm(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                >
                  + Add First Driver
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Driver</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Contact Details</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">License & Experience</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {drivers.map((driver, index) => {
                      const statusColors = getStatusColor(driver.status);
                      return (
                        <tr 
                          key={driver.driverId} 
                          className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-200 group"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl mr-4">
                                <span className="text-blue-600 text-xl">👨‍✈️</span>
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{driver.name}</p>
                                <p className="text-sm text-gray-500">ID: {driver.driverId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-medium text-gray-800 flex items-center">
                                <span className="mr-2">📞</span>
                                {driver.phone}
                              </p>
                              {driver.emergencyContact && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Emergency: {driver.emergencyContact}
                                </p>
                              )}
                              {driver.salary && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Salary: ₹{driver.salary}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-mono text-sm text-gray-700 bg-gray-50/70 px-3 py-1 rounded-lg inline-block">
                                {driver.licenseNumber}
                              </p>
                              <div className="mt-2 flex items-center">
                                {driver.experience && (
                                  <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-lg mr-2">
                                    {driver.experience}
                                  </span>
                                )}
                                {driver.rating && (
                                  <span className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-lg flex items-center">
                                    <span className="mr-1">⭐</span>
                                    {driver.rating}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-2">
                              <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${statusColors.bg} ${statusColors.text} inline-flex items-center w-fit`}>
                                <span className={`w-2 h-2 rounded-full ${statusColors.dot} mr-2 animate-pulse`}></span>
                                {driver.status}
                              </span>
                              {driver.assignedVehicle && (
                                <span className="text-xs px-3 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-lg">
                                  🚗 {driver.assignedVehicle}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(driver)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-sm font-medium flex items-center shadow-sm hover:shadow"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              
                              <button
                                onClick={() => handleDelete(driver.driverId)}
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
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {editMode ? 'Edit Driver' : 'Add New Driver'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditMode(false);
                    }}
                    className="text-white hover:text-blue-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Driver ID
                      </label>
                      <input
                        type="text"
                        name="driverId"
                        value={formData.driverId}
                        onChange={handleChange}
                        required
                        disabled={editMode}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                        placeholder="Auto-generated"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <select
                        name="rating"
                        value={formData.rating}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="0">0 - Not rated</option>
                        <option value="1">1 - Poor</option>
                        <option value="2">2 - Fair</option>
                        <option value="3">3 - Good</option>
                        <option value="4">4 - Very Good</option>
                        <option value="5">5 - Excellent</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter driver name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="9876543210"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Available">Available</option>
                        <option value="On Trip">On Trip</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="DL1234567890"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience
                    </label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 5 years"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Vehicle
                    </label>
                    <input
                      type="text"
                      name="assignedVehicle"
                      value={formData.assignedVehicle}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Innova MH12AB1234"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Driver's address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact
                      </label>
                      <input
                        type="tel"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Emergency phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Salary (₹)
                      </label>
                      <input
                        type="number"
                        name="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Monthly salary"
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
                      rows="2"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes about the driver"
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
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                    >
                      {editMode ? 'Update' : 'Add'} Driver
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