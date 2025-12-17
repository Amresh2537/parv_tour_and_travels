// lib/api.js - UPDATED WITHOUT FORM SUBMISSION
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxqMMyM9yuq5UppzD8oBcXjqDR0IUYdaPWnTJ_hmVEAkFn1M0YQjUlb1qmNKpLeTDU0/exec';

// Main API function
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
    
    const response = await fetch(url, options);
    const text = await response.text();
    
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

// Form submission (without opening new tab)
export function submitViaForm(data) {
  return new Promise((resolve) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = APPS_SCRIPT_URL;
    // NO form.target = '_blank' - यह नई tab नहीं खोलेगा
    form.style.display = 'none';
    
    Object.keys(data).forEach(key => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = data[key];
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    form.submit();
    
    setTimeout(() => {
      document.body.removeChild(form);
      resolve({ success: true, message: 'Form submitted' });
    }, 1000);
  });
}

// API functions
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
  updateStatus: (bookingId, status) => apiRequest({ action: 'updateStatus', bookingId, status }, 'POST'),
};

// Helper functions - WITHOUT form submission
export async function createBookingWithForm(bookingData) {
  // सिर्फ API call करें
  return await bookingApi.create(bookingData);
}

export async function updateDriverWithForm(bookingId, driverData) {
  const data = { action: 'addDriver', bookingId, ...driverData };
  return await bookingApi.addDriver(data);
}

export async function updateExpensesWithForm(bookingId, expensesData) {
  const data = { action: 'addExpenses', bookingId, ...expensesData };
  return await bookingApi.addExpenses(data);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
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