'use client';

import { useState } from 'react';
import { bookingApi } from '@/lib/api';

export default function TestDriverPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const testDriverUpdate = async () => {
    setLoading(true);
    try {
      const testData = {
        bookingId: 'PARV632686', // Use your actual booking ID
        driverName: 'Test Driver ' + Date.now(),
        driverPhone: '9876543210',
        startKM: '45000'
      };
      
      console.log('Testing with data:', testData);
      const response = await bookingApi.addDriver(testData);
      setResult(response);
      
      if (response.success) {
        alert('✅ Driver updated successfully! Check Google Sheet.');
      } else {
        alert('❌ Failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Driver Update</h1>
      
      <button
        onClick={testDriverUpdate}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Add Driver'}
      </button>
      
      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-bold text-yellow-800">Debug Info:</h3>
        <p className="text-sm mt-2">Apps Script URL: https://script.google.com/macros/s/AKfycby-_m-3G5O8yr3df333wesQn2yCnPdS-eGGAUIHvFQaB2xgqSqaD8ufDRC8c50njF31/exec</p>
        <p className="text-sm">Booking ID: PARV632686 (use your actual ID)</p>
      </div>
    </div>
  );
}