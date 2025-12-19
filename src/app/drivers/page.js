'use client';

import { useState, useEffect } from 'react';
import { bookingApi } from '@/lib/api';

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
        await bookingApi.updateDriver(formData);
        showNotification('Driver updated successfully!');
      } else {
        await bookingApi.addDriver(formData);
        showNotification('Driver added successfully!');
      }
      
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
    setFormData(driver);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (driverId) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await bookingApi.deleteDriver(driverId);
        showNotification('Driver deleted successfully!');
        loadDrivers();
      } catch (error) {
        console.error('Error deleting driver:', error);
        showNotification('Error deleting driver', 'error');
      }
    }
  };

  const showNotification = (message, type = 'success') => {
    // Your notification code here
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'On Trip': return 'bg-blue-100 text-blue-800';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers Management</h1>
          <p className="text-gray-600">Manage your fleet drivers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Driver
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {editMode ? 'Edit Driver' : 'Add New Driver'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 5 years"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditMode(false);
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  {editMode ? 'Update' : 'Add'} Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drivers Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Driver</th>
              <th className="p-4 text-left">Contact</th>
              <th className="p-4 text-left">License</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => (
              <tr key={driver.driverId} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <div>
                    <p className="font-medium">{driver.name}</p>
                    <p className="text-sm text-gray-500">{driver.experience}</p>
                  </div>
                </td>
                <td className="p-4">
                  <p>{driver.phone}</p>
                  <p className="text-sm text-gray-500">{driver.emergencyContact}</p>
                </td>
                <td className="p-4">
                  <p className="font-mono text-sm">{driver.licenseNumber}</p>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(driver.status)}`}>
                    {driver.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(driver)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(driver.driverId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}