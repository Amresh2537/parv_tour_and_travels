// lib/config.js - SINGLE SOURCE OF TRUTH FOR ALL SETTINGS

// IMPORTANT: Use only ONE Apps Script URL
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxqMMyM9yuq5UppzD8oBcXjqDR0IUYdaPWnTJ_hmVEAkFn1M0YQjUlb1qmNKpLeTDU0/exec';

// Google Sheet ID
export const SHEET_ID = '15AokywwH3--Ea2pba-I0szlDrYa1Fw3Hb_DnJVHzx8g';

// Sheet name
export const SHEET_NAME = 'PARV_Bookings';

// Company details
export const COMPANY = {
  name: 'PARV Tour & Travels',
  phone: '+91 9876543210',
  address: 'Your Business Address',
  gst: 'GSTIN: 27AAAAA0000A1Z5'
};

// Vehicle options
export const VEHICLE_OPTIONS = [
  'Innova',
  'Swift',
  'Ertiga',
  'Scorpio',
  'Bus',
  'Tempo',
  'Other'
];

// Status options
export const STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'driver_assigned',
  'expenses_added',
  'completed',
  'cancelled'
];

// Default booking form data
export const DEFAULT_BOOKING_DATA = {
  customerName: '',
  phone: '',
  from: '',
  to: '',
  vehicle: 'Innova',
  bookingAmount: '',
  advance: ''
};