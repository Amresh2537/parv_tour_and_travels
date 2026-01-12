# PARV Tour & Travels - AI Coding Agent Instructions

## Project Overview
PARV is a **SaaS tour booking management system** built with Next.js (App Router) frontend and Google Apps Script + Google Sheets backend. No traditional database—Google Sheets serves as the entire data layer with Apps Script providing serverless APIs.

**Key architectural insight**: The frontend and backend are *loosely coupled* via HTTP requests to a deployed Google Apps Script. This means:
- Frontend handles UI/UX and client-side calculations
- Backend (Apps Script) is the single source of truth for data persistence
- All data flows through the `apiRequest()` function in `src/lib/api.js`

## Critical Architecture Patterns

### 1. Multi-Step Booking Workflow (Core Feature)
The booking process is split into 6 sequential steps, each a separate page in `/src/app/booking/`:
- `entry/page.js` → Collect customer & trip details
- `confirm/page.js` → Review & confirm
- `driver/page.js` → Assign driver, record start KM
- `expenses/page.js` → Add expenses & end KM
- `calculation/page.js` → Auto-calculate profit/outstanding
- `summary/page.js` → Final trip summary

**Pattern**: Each page saves the booking ID to `localStorage.currentBookingId`, then fetches the full booking record from Apps Script. The `Stepper.jsx` component shows progress using the current pathname.

### 2. Data Storage & Retrieval
- **Database**: Google Sheet named "PARV_Bookings" with columns: `bookingId`, `customerName`, `phone`, `from`, `to`, `vehicle`, `bookingAmount`, `advance`, `driverName`, `startKM`, `endKM`, `totalKM`, `fuelCost`, `toll`, `driverPayment`, `otherExpenses`, `totalExpenses`, `outstanding`, `netProfit`, `status`, etc.
- **API Gateway**: `src/lib/api.js` exports `bookingApi` object with methods like `create()`, `getById()`, `addDriver()`, `calculate()` that construct HTTP requests to the Apps Script URL.
- **Request Format**: Query parameters for GET, URL-encoded form data for POST. All requests include an `action` parameter to route to different Apps Script handler functions.

### 3. Client-Side State Management
Uses React `useState` + `localStorage` (not Redux/Context). Key pattern:
```javascript
// 1. Save booking ID to localStorage after creation
localStorage.setItem('currentBookingId', bookingId);

// 2. On subsequent pages, fetch from Apps Script
const booking = await bookingApi.getById(currentBookingId);

// 3. Update localStorage cache for offline fallback
localStorage.setItem('lastBooking', JSON.stringify(booking));
```

### 4. Form Submission & Notifications
- Forms use `handleSubmit` event handler with `setLoading` state during API calls
- Errors trigger in-page notifications (not global toast—see `BookingForm.jsx` for pattern)
- On failure, generate local booking ID (`'PARV' + Date.now()`) and continue (graceful degradation)

## Calculation Logic
All calculations happen server-side in Apps Script, but the frontend has duplicates for preview/estimation:

```javascript
// From src/lib/api.js: tripCalculator object
totalKM = endKM - startKM
fuelCost = (totalKM / vehicleAverage) * fuelRate
totalExpenses = fuelCost + toll + driverPayment + otherExpenses
outstanding = bookingAmount - advance - totalExpenses
netProfit = bookingAmount - totalExpenses
```

When updating expense data, **always call `bookingApi.calculate(bookingId)`** to sync calculations with server.

## UI/Component Conventions
- **Layout wrapper**: `src/components/Layout.jsx` wraps all pages with Navbar
- **Background**: `src/components/TravelBackground.js` provides rotating background images via `BackgroundImage.jsx`
- **Styling**: Tailwind CSS only (no CSS modules). Common classes: `bg-white rounded-xl shadow-lg p-8`, grid layouts with `md:grid-cols-2`
- **Form inputs**: Controlled components with `useState` + `onChange` handlers
- **Links**: Use Next.js `<Link>` for navigation, `useRouter().push()` for programmatic routing

## Key Files to Reference
| File | Purpose |
|------|---------|
| `src/lib/api.js` | API utilities & `bookingApi` object (touch this for API changes) |
| `src/components/Stepper.jsx` | Step indicator—shows current path position |
| `src/app/booking/*/page.js` | Booking workflow pages (isolated, each handles own form) |
| `src/app/page.js` | Dashboard—fetches all bookings + stats |
| `src/components/BookingForm.jsx` | Reusable form component (used in entry step) |

## Common Developer Tasks

### Adding a New Form Field to Booking Entry
1. Add to `formData` state in `/booking/entry/page.js` (e.g., `tripType: 'one-way'`)
2. Add input element in JSX
3. Update Apps Script to accept the new field in its `create()` function
4. Update Google Sheet column if needed

### Fetching Booking Data Across Steps
```javascript
// Pattern used in confirm/driver/expenses pages:
useEffect(() => {
  const bookingId = localStorage.getItem('currentBookingId');
  if (bookingId) {
    bookingApi.getById(bookingId).then(res => {
      if (res.success) setBooking(res.data);
    });
  }
}, []);
```

### Updating Booking Status
```javascript
// After any form submission that changes state:
await bookingApi.updateStatus(bookingId, 'confirmed', 'User confirmed');
// or
await bookingApi.addDriver({ bookingId, driverName, startKM, ... });
```

## Integration Points to Know
- **External dependency**: Apps Script URL hardcoded in `apiRequest()` function. Environment variable `NEXT_PUBLIC_APPS_SCRIPT_URL` is defined in `.env.local` but not currently used—consider standardizing.
- **Framer Motion**: Imported but minimally used; add animations cautiously to preserve performance.
- **React DatePicker**: Used in booking forms; check `/src/components/` for examples.
- **UUID**: Used for generating unique IDs (imported but verify Apps Script generates `bookingId`, not frontend).

## Local Development Workflow
```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Production build
npm run lint         # Run ESLint
```

No tests configured. Debugging: Use `console.log()` and browser DevTools (check Network tab for Apps Script requests, LocalStorage tab for cached data).

## Common Pitfalls
1. **Forgetting to save bookingId to localStorage** → user returns to page, booking ID is lost
2. **Calling `/api/bookings` instead of `bookingApi.*`** → local proxy endpoint, use the library functions
3. **Not checking `result.success`** → Apps Script returns `{ success: false, error: '...' }` on failure
4. **Frontend calculations out of sync** → always call `calculate()` after expense updates; don't rely on client-side math
5. **Hardcoded Apps Script URL** → if deployment URL changes, update the URL in `src/lib/api.js`

## When Extending the System
- **New booking fields**: Add to Google Sheet, update Apps Script handler, then frontend form
- **New workflow step**: Create `/src/app/booking/step-name/page.js`, add to `Stepper.jsx` steps array, add API methods if needed
- **Reports/Analytics**: Use existing `getStats()` and `searchBookings()` methods; create new pages under `/reports/`
- **Driver/Vehicle Management**: Already partially implemented; check `/drivers/page.js` and `/vehicles/page.js` for patterns
