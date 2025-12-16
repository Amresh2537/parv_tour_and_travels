// Apps Script URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-_m-3G5O8yr3df333wesQn2yCnPdS-eGGAUIHvFQaB2xgqSqaD8ufDRC8c50njF31/exec';

// Main API function
export async function apiRequest(data = null, method = 'GET') {
  try {
    console.log('📡 API Request:', { method, data });
    
    let url = APPS_SCRIPT_URL;
    
    // For GET requests
    if (method === 'GET' && data) {
      const params = new URLSearchParams();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          params.append(key, data[key]);
        }
      });
      url = `${url}?${params.toString()}`;
    }
    
    // For POST requests - IMPORTANT: Use URLSearchParams
    if (method === 'POST' && data) {
      const formData = new URLSearchParams();
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });
      
      // Use fetch with form data
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      
      const text = await response.text();
      console.log('📨 Response:', text);
      
      try {
        const result = JSON.parse(text);
        return result;
      } catch (e) {
        console.error('JSON parse error:', e);
        return { success: false, error: 'Invalid response' };
      }
    }
    
    // For GET requests
    const response = await fetch(url);
    const text = await response.text();
    
    try {
      const result = JSON.parse(text);
      return result;
    } catch (e) {
      console.error('JSON parse error:', e);
      return { success: false, error: 'Invalid response' };
    }
    
  } catch (error) {
    console.error('🔥 API Error:', error);
    return { success: false, error: error.message };
  }
}

// API functions
export const bookingApi = {
  // GET requests
  getAll: () => apiRequest({ action: 'getAll' }, 'GET'),
  getById: (bookingId) => apiRequest({ action: 'getBooking', bookingId }, 'GET'),
  
  // POST requests
  create: (data) => apiRequest({ action: 'create', ...data }, 'POST'),
  confirm: (bookingId) => apiRequest({ action: 'confirm', bookingId }, 'POST'),
  addDriver: (bookingId, data) => apiRequest({ action: 'addDriver', bookingId, ...data }, 'POST'),
  addExpenses: (bookingId, data) => apiRequest({ action: 'addExpenses', bookingId, ...data }, 'POST'),
  calculate: (bookingId) => apiRequest({ action: 'calculate', bookingId }, 'POST'),
};