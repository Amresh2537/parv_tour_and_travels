PARV Tour & Travels - SaaS Application
A complete Tour & Travel Management System built with Next.js, Google Apps Script, and Google Sheets as database.

🚀 Live Demo
Frontend: https://parv-tour-travels.vercel.app

Backend API: https://script.google.com/macros/s/AKfycbx.../exec

📋 Features
✅ Core Features
Multi-step Booking Workflow (6 Steps)

Google Sheets as Database (No SQL needed)

Real-time Calculations

Vehicle Management

Financial Reporting

Driver Assignment

Expense Tracking

📊 Booking Workflow
Booking Entry - Customer & trip details

Confirm Booking - Review & confirmation

Driver & Start KM - Assign driver & record start KM

Expenses & End KM - Add expenses & end KM reading

Calculation - Auto-calculate profit & outstanding

Summary - Complete trip summary

🛠 Tech Stack
Frontend
Next.js 14 (App Router, src-based)

Tailwind CSS (Styling)

React Hooks (State management)

JavaScript/ES6+

Backend
Google Apps Script (Serverless API)

Google Sheets (Database)

No additional servers needed

📁 Project Structure
text
parv-tour-travels/
├── src/
│   ├── app/
│   │   ├── layout.js           # Root layout
│   │   ├── page.js             # Dashboard
│   │   ├── booking/            # Booking workflow
│   │   │   ├── entry/page.js   # Step 1: Booking Entry
│   │   │   ├── confirm/page.js # Step 2: Confirm Booking
│   │   │   ├── driver/page.js  # Step 3: Driver & Start KM
│   │   │   ├── expenses/page.js# Step 4: Expenses & End KM
│   │   │   ├── calculation/page.js # Step 5: Calculation
│   │   │   └── summary/page.js # Step 6: Summary
│   │   ├── vehicles/page.js    # Vehicle Management
│   │   ├── reports/page.js     # Reports & Analytics
│   │   └── api/                # API Routes (Proxy)
│   ├── components/
│   │   ├── Stepper.jsx         # Booking step indicator
│   │   ├── BookingForm.jsx     # Booking form component
│   │   ├── Navbar.jsx          # Navigation
│   │   └── ...other components
│   └── lib/
│       ├── api.js              # API utilities
│       └── googleSheet.js      # Google Sheets service
├── public/                     # Static assets
├── package.json
├── .env.local                  # Environment variables
└── README.md                   # This file
🚀 Quick Start
Prerequisites
Node.js 18+

Google Account

Google Sheets (for database)

Edit .env.local:

env
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
NEXT_PUBLIC_APP_NAME="PARV Tour & Travels"
Set up Google Apps Script Backend

Step A: Create Google Apps Script

Go to script.google.com

Create new project

Copy code from apps-script-backend.js

Replace YOUR_SHEET_ID with your Google Sheet ID

Deploy as Web App

Step B: Create Google Sheet

Create new Google Sheet

Get Sheet ID from URL: docs.google.com/spreadsheets/d/{SHEET_ID}/edit

Share with "Anyone with link can edit"

Run the development server

bash
npm run dev
Open http://localhost:3000

📊 Google Sheets Structure
Main Sheet: PARV_Bookings
Column	Description
bookingId	Unique booking ID
date	Booking date
customerName	Customer name
phone	Customer phone
from	Starting location
to	Destination
vehicle	Vehicle type
bookingAmount	Total amount
advance	Advance paid
status	Booking status
driverName	Driver name
driverPhone	Driver phone
startKM	Starting KM
endKM	Ending KM
totalKM	Total kilometers
fuelRate	Fuel rate per liter
liters	Fuel liters
fuelCost	Total fuel cost
toll	Toll charges
driverPayment	Driver payment
otherExpenses	Other expenses
totalExpenses	Total expenses
outstanding	Outstanding amount
netProfit	Net profit
createdAt	Created timestamp
updatedAt	Updated timestamp
🔧 API Endpoints
Google Apps Script API
text
GET  /exec?action=ping           # Test connection
GET  /exec?action=getAll         # Get all bookings
GET  /exec?action=getBooking&bookingId=ID  # Get single booking

POST /exec
Body: action=create&customerName=...       # Create booking
Body: action=confirm&bookingId=ID          # Confirm booking
Body: action=addDriver&bookingId=ID&...    # Add driver details
Body: action=addExpenses&bookingId=ID&...  # Add expenses
Body: action=calculate&bookingId=ID        # Calculate profit
Local API (Proxy)
text
GET  /api/bookings              # Get all bookings
GET  /api/bookings?id=ID        # Get single booking
POST /api/bookings              # Create/Update booking
💰 Calculation Formulas
javascript
// Total KM
totalKM = endKM - startKM

// Fuel Cost
fuelCost = fuelRate * liters

// Total Expenses
totalExpenses = fuelCost + toll + driverPayment + otherExpenses

// Outstanding
outstanding = bookingAmount - advance - totalExpenses

// Net Profit
netProfit = bookingAmount - totalExpenses
🎨 UI Components
1. Stepper Component
Visual indicator for 6-step booking process

2. BookingForm
Customer details

Trip information

Payment details

Vehicle selection

3. Dashboard
Statistics cards

Recent bookings

Quick actions

Revenue summary

4. Reports Page
Daily performance

Vehicle-wise analytics

Financial reports

Filter by date/vehicle

🚗 Vehicle Management
Add/Edit vehicles

Vehicle status tracking

Driver assignment

Maintenance tracking

📈 Reports & Analytics
Daily Performance - Last 7 days

Vehicle-wise Reports - Revenue by vehicle

Financial Summary - Profit & loss

Booking Statistics - Status breakdown

🔒 Security Features
Google Sheets security

Input validation

Error handling

Data backup (Google Sheets auto-save)

📱 Responsive Design
Mobile-first approach

Tailwind CSS utilities

Responsive grids

Touch-friendly interfaces

🚀 Deployment
Deploy Frontend (Vercel)
bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
Deploy Backend (Google Apps Script)
Deploy as Web App

Set "Execute as" to "Me"

Set "Who has access" to "Anyone"

🐛 Troubleshooting
Common Issues
CORS Errors

javascript
// Use no-cors mode for development
mode: 'no-cors'
Google Sheets Permission Errors

Share sheet with editor access

Check Sheet ID is correct

Apps Script Deployment Errors

Redeploy after code changes

Check execution logs

Data Not Saving

Test Apps Script directly

Check network tab for errors

Verify form data format

Debugging Tools
javascript
// Test Apps Script directly
fetch('https://script.google.com/macros/s/YOUR_ID/exec?action=ping')
  .then(r => r.text())
  .then(console.log)

// Check localStorage
console.log(localStorage.getItem('currentBookingId'))
📝 Development Guide
Adding New Features
New Page

bash
# Create new page
mkdir -p src/app/new-feature
touch src/app/new-feature/page.js
New Component

javascript
// src/components/NewComponent.jsx
'use client';
export default function NewComponent() {
  return <div>New Component</div>;
}
New API Endpoint

javascript
// src/app/api/new-endpoint/route.js
export async function GET(request) {
  return Response.json({ message: 'New endpoint' });
}
Code Style
ESLint configured

Prettier for formatting

Tailwind CSS classes

Component-based architecture

📚 Learning Resources
Next.js Documentation

Tailwind CSS

Google Apps Script

Google Sheets API