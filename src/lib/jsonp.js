// JSONP helper for Google Apps Script (no CORS issues)
export function jsonpRequest(url, callbackName = 'callback') {
  return new Promise((resolve, reject) => {
    // Create a unique function name
    const uniqueName = `jsonp_${Date.now()}_${Math.random().toString(36).substr(2)}`;
    
    // Add callback to window
    window[uniqueName] = (data) => {
      resolve(data);
      cleanup();
    };
    
    // Error handling
    const timeout = setTimeout(() => {
      reject(new Error('JSONP timeout'));
      cleanup();
    }, 10000);
    
    // Cleanup function
    const cleanup = () => {
      clearTimeout(timeout);
      delete window[uniqueName];
      document.head.removeChild(script);
    };
    
    // Create script tag
    const script = document.createElement('script');
    script.src = `${url}&${callbackName}=${uniqueName}`;
    script.onerror = () => {
      reject(new Error('JSONP script error'));
      cleanup();
    };
    
    document.head.appendChild(script);
  });
}