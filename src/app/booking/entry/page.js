'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { bookingApi } from '@/lib/api';
import { DEFAULT_SETTINGS } from '@/lib/expenses';
import FuelFields from '@/components/FuelFields';

const initial = { customerName: '', phone: '', from: '', to: '', vehicle: '', vehicleId: '', driverName: '', driverPhone: '', bookingAmount: '', advance: '', passengers: 4, tollCalculationVersion: 2, tollTripCost: 15, tollTrips: 0, tripType: 'one-way', bookingDate: '', notes: '', fuelCalculationVersion: 2, fuelBillingMode: 'separate', fuelPaidBy: 'company', tollPaidBy: 'company', acEnabled: false };
export default function BookingEntryPage() {
  const router = useRouter();
  const [data, setData] = useState({ ...initial, ...DEFAULT_SETTINGS });
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [defaults, setDefaults] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([bookingApi.getVehicles(), bookingApi.getDrivers(), bookingApi.getSettings()]).then(([v, d, s]) => {
      const settings = s.success ? s.data : DEFAULT_SETTINGS;
      setDefaults(settings); setData(prev => ({ ...prev, ...settings }));
      setVehicles(v.success ? v.data : []); setDrivers(d.success ? d.data : []);
      if (!v.success || !d.success || !s.success) setError('Some admin data could not be loaded. You can still enter booking details.');
      setLoading(false);
    });
  }, []);
  const change = e => {
    const { name, value } = e.target;
    setData(prev => {
      if (name === 'vehicleId') {
        const vehicle = vehicles.find(v => v.vehicleId === value);
        return { ...prev, vehicleId: value, vehicle: vehicle?.type || vehicle?.name || '', vehicleAverage: vehicle?.average ?? defaults.vehicleAverage, customerAverage: vehicle?.customerAverage ?? defaults.customerAverage, customerAcAverage: vehicle?.customerAcAverage ?? defaults.customerAcAverage };
      }
      const driver = name === 'driverName' ? drivers.find(d => d.name === value) : null;
      return { ...prev, [name]: value, ...(name === 'driverName' ? { driverId: driver?.driverId || '', driverPhone: driver?.phone || prev.driverPhone } : {}) };
    });
  };
  const save = async e => {
    e.preventDefault(); setSaving(true); setError('');
    const result = await bookingApi.create(data);
    setSaving(false);
    if (!result.success) { setError(result.error || 'Unable to create booking'); return; }
    const bookingId = result.data?.bookingId || result.bookingId;
    ['driverData', 'expensesData', 'calculations'].forEach(key => localStorage.removeItem(key));
    localStorage.setItem('currentBookingId', bookingId);
    localStorage.setItem('lastBooking', JSON.stringify({ ...data, bookingId }));
    router.push('/booking/confirm');
  };
  return <div className="workspace">
    <header className="page-heading"><div><p className="eyebrow">Bookings / New Entry</p><h1>New Booking</h1></div><Link href="/" className="secondary-button">Back to Bookings</Link></header>
    {error && <p className="notice error" role="alert">{error}</p>}
    {loading ? <p role="status" className="empty-state">Loading booking defaults...</p> : <form noValidate onSubmit={save}>
      <section className="section"><h2>Customer & Journey</h2><div className="form-grid">
        {[['customerName', 'Customer Name'], ['phone', 'Phone', 'tel'], ['from', 'Pickup Location'], ['to', 'Destination'], ['bookingDate', 'Departure Date', 'date'], ['passengers', 'Passengers', 'number']].map(([name, label, type]) => <label key={name}>{label}<input name={name} type={type || 'text'} value={data[name]} onChange={change} /></label>)}
        <label>Trip Type<select name="tripType" value={data.tripType} onChange={change}>{[['one-way', 'One Way'], ['round-trip', 'Round Trip'], ['multi-city', 'Multi City'], ['hourly', 'Hourly'], ['daily', 'Daily']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div></section>
      <section className="section"><h2>Vehicle & Driver</h2><div className="form-grid">
        <label>Vehicle<select name="vehicleId" value={data.vehicleId} onChange={change}><option value="">Unassigned</option>{vehicles.filter(v => v.status === 'Available' || !v.status).map(v => <option key={v.vehicleId} value={v.vehicleId}>{v.type || v.name} {v.number ? ' / ' + v.number : ''}</option>)}</select></label>
        <label>Driver Name<input name="driverName" list="booking-drivers" value={data.driverName} onChange={change} /><datalist id="booking-drivers">{drivers.filter(d => d.status === 'Available' || !d.status).map(d => <option key={d.driverId} value={d.name} />)}</datalist></label>
        <label>Driver Phone<input name="driverPhone" type="tel" value={data.driverPhone} onChange={change} /></label>
      </div><Link href="/admin" className="text-link">Manage vehicles & drivers</Link></section>
      <section className="section"><h2>Fuel & Averages</h2><FuelFields data={data} onChange={setData} /></section>
      <section className="section"><h2>Fare & Payment</h2><div className="form-grid">
        <label>Booking Fare (INR)<input name="bookingAmount" type="number" step="any" value={data.bookingAmount} onChange={change} /></label>
        <label>Advance (INR)<input name="advance" type="number" step="any" value={data.advance} onChange={change} /></label>
        <label>Toll Paid By<select name="tollPaidBy" value={data.tollPaidBy} onChange={change}><option value="company">Self / Company</option><option value="customer">Customer</option></select></label>
        <label className="full-width">Notes<textarea name="notes" value={data.notes} onChange={change} rows={3} /></label>
      </div></section>
      <footer className="form-actions"><button type="button" className="secondary-button" onClick={() => setData({ ...initial, ...defaults })}>Clear</button><button className="primary-button" disabled={saving}>{saving ? 'Creating...' : 'Create Booking'}<ArrowRight size={17} /></button></footer>
    </form>}
  </div>;
}
