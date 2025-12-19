// lib/api.js - CORRECT VERSION
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxqMMyM9yuq5UppzD8oBcXjqDR0IUYdaPWnTJ_hmVEAkFn1M0YQjUlb1qmNKpLeTDU0/exec';

export async function apiRequest(data = null, method = 'GET') {
  try {
    console.log('📡 API Request:', { method, data });
    
    let url = APPS_SCRIPT_URL;
    
    if (method === 'GET' && data) {
      const params = new URLSearchParams();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          params.append(key, data[key]);
        }
      });
      url = `${url}?${params.toString()}`;
    }
    
    const options = {
      method: method,
    };
    
    if (method === 'POST' && data) {
      const formData = new URLSearchParams();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });
      
      options.body = formData.toString();
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
    }
    
    console.log('Fetching URL:', url);
    const response = await fetch(url, options);
    const text = await response.text();
    console.log('API Response:', text);
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', e);
      return { success: false, error: 'Invalid JSON response', raw: text };
    }
    
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: error.message };
  }
}
export const bookingApi = {
  ping: () => apiRequest({ action: 'ping' }, 'GET'),
  getAll: () => apiRequest({ action: 'getAll' }, 'GET'),
  getById: (bookingId) => apiRequest({ action: 'getBooking', bookingId }, 'GET'),
  getStats: () => apiRequest({ action: 'getStats' }, 'GET'),
  create: (data) => apiRequest({ action: 'create', ...data }, 'POST'),
  confirm: (bookingId) => apiRequest({ action: 'confirm', bookingId }, 'POST'),
  addDriver: (data) => apiRequest({ action: 'addDriver', ...data }, 'POST'),
  addExpenses: (data) => apiRequest({ action: 'addExpenses', ...data }, 'POST'),
  calculate: (bookingId) => apiRequest({ action: 'calculate', bookingId }, 'POST'),
  updateStatus: (bookingId, status, reason) => 
    apiRequest({ action: 'updateStatus', bookingId, status, reason }, 'POST'),
  cancelBooking: (bookingId, reason) => 
    apiRequest({ action: 'cancelBooking', bookingId, reason }, 'POST'),
  getStatusHistory: (bookingId) => 
    apiRequest({ action: 'getStatusHistory', bookingId }, 'GET'),
  searchBookings: (params) => 
    apiRequest({ action: 'searchBookings', ...params }, 'GET'),
  getRecentActivity: (limit) => 
    apiRequest({ action: 'getRecentActivity', limit }, 'GET'),
  
  // Driver Management
  getDrivers: () => apiRequest({ action: 'getDrivers' }, 'GET'),
  addDriver: (data) => apiRequest({ action: 'addDriver', ...data }, 'POST'),
  updateDriver: (data) => apiRequest({ action: 'updateDriver', ...data }, 'POST'),
  deleteDriver: (driverId) => apiRequest({ action: 'deleteDriver', driverId }, 'POST'),
  
  // Vehicle Management
  getVehicles: () => apiRequest({ action: 'getVehicles' }, 'GET'),
  addVehicle: (data) => apiRequest({ action: 'addVehicle', ...data }, 'POST'),
  updateVehicle: (data) => apiRequest({ action: 'updateVehicle', ...data }, 'POST'),
  deleteVehicle: (vehicleId) => apiRequest({ action: 'deleteVehicle', vehicleId }, 'POST'),
};
// Trip calculator functions
export const tripCalculator = {
  calculateFuel: (startKM, endKM, vehicleAverage, fuelRate) => {
    const distance = (parseFloat(endKM) || 0) - (parseFloat(startKM) || 0);
    if (distance <= 0 || !vehicleAverage) {
      return { liters: 0, cost: 0 };
    }
    
    const liters = distance / parseFloat(vehicleAverage);
    const cost = liters * (parseFloat(fuelRate) || 0);
    
    return {
      distance,
      liters: parseFloat(liters.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      fuelRate: parseFloat(fuelRate) || 0
    };
  },
  
  calculateTotalExpenses: (expenses, tollPaidBy = 'customer') => {
    const fuelCost = parseFloat(expenses.fuelCost) || 0;
    const tollAmount = tollPaidBy === 'company' ? parseFloat(expenses.tollAmount) || 0 : 0;
    const driverPayment = parseFloat(expenses.driverPayment) || 0;
    const maintenance = parseFloat(expenses.maintenance) || 0;
    const parking = parseFloat(expenses.parking) || 0;
    const food = parseFloat(expenses.food) || 0;
    const otherExpenses = parseFloat(expenses.otherExpenses) || 0;
    
    const total = fuelCost + tollAmount + driverPayment + maintenance + parking + food + otherExpenses;
    
    return {
      total: parseFloat(total.toFixed(2)),
      breakdown: {
        fuelCost,
        tollAmount,
        driverPayment,
        maintenance,
        parking,
        food,
        otherExpenses
      }
    };
  }
};

// Trip storage functions
export const tripStorage = {
  saveTrip: (tripData) => {
    try {
      const trips = tripStorage.getTrips();
      const existingIndex = trips.findIndex(t => t.bookingId === tripData.bookingId);
      
      if (existingIndex >= 0) {
        trips[existingIndex] = {
          ...trips[existingIndex],
          ...tripData,
          updatedAt: new Date().toISOString()
        };
      } else {
        trips.push({
          ...tripData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      localStorage.setItem('trips', JSON.stringify(trips));
      return { success: true, data: tripData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  getTrips: () => {
    try {
      const data = localStorage.getItem('trips');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  },
  
  getTrip: (bookingId) => {
    const trips = tripStorage.getTrips();
    return trips.find(t => t.bookingId === bookingId) || null;
  },
  
  searchTrips: (query) => {
    const trips = tripStorage.getTrips();
    if (!query) return trips;
    
    return trips.filter(trip => {
      return (
        trip.bookingId?.toLowerCase().includes(query.toLowerCase()) ||
        trip.customerName?.toLowerCase().includes(query.toLowerCase()) ||
        trip.customerPhone?.includes(query) ||
        trip.pickupLocation?.toLowerCase().includes(query.toLowerCase()) ||
        trip.dropLocation?.toLowerCase().includes(query.toLowerCase())
      );
    });
  },
  
  deleteTrip: (bookingId) => {
    try {
      const trips = tripStorage.getTrips();
      const filtered = trips.filter(t => t.bookingId !== bookingId);
      localStorage.setItem('trips', JSON.stringify(filtered));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Status management helper
export const statusManager = {
  availableStatuses: [
    { value: 'pending', label: 'Pending', color: 'yellow', icon: '⏳', nextAction: 'Confirm Booking' },
    { value: 'confirmed', label: 'Confirmed', color: 'blue', icon: '✅', nextAction: 'Assign Driver' },
    { value: 'driver_assigned', label: 'Driver Assigned', color: 'purple', icon: '👨‍✈️', nextAction: 'Add Expenses' },
    { value: 'expenses_added', label: 'Expenses Added', color: 'orange', icon: '💰', nextAction: 'Calculate Profit' },
    { value: 'completed', label: 'Completed', color: 'green', icon: '🏁', nextAction: 'View Details' },
    { value: 'cancelled', label: 'Cancelled', color: 'red', icon: '❌', nextAction: 'View Details' },
  ],
  
  getStatusInfo: (status) => {
    const info = statusManager.availableStatuses.find(s => s.value === status) || 
                 { value: status, label: status, color: 'gray', icon: '📋', nextAction: 'Manage' };
    return info;
  },
  
  getStatusColor: (status) => {
    const info = statusManager.getStatusInfo(status);
    return {
      bg: `bg-${info.color}-100`,
      text: `text-${info.color}-800`,
      border: `border-${info.color}-300`,
      ring: `ring-${info.color}-500`,
    };
  }
};

// Helper functions
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
}

export function formatShortDate(dateString) {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

// Local storage helpers
export function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function getFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

export function clearBookingData() {
  ['currentBookingId', 'lastBooking', 'driverData', 'expensesData', 'calculations'].forEach(key => {
    localStorage.removeItem(key);
  });
  return { success: true };
}