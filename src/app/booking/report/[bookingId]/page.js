'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { bookingApi, formatCurrency } from '@/lib/api';
import { bookingTotals } from '@/lib/expenses';
import FuelComparison from '@/components/FuelComparison';
export default function BookingReport({ params }) {
  const { bookingId } = use(params);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('customer');
  useEffect(() => { bookingApi.getById(bookingId).then(r => r.success ? setBooking(r.data) : setError(r.error || 'Unable to load report')); }, [bookingId]);
  if (!booking) return <main className="workspace">{error || 'Loading report...'}</main>;
  const t = bookingTotals(booking);
  const customer = mode === 'customer';
  const rows = customer ? [['Booking Fare', booking.bookingAmount], ['Fuel Charged Above Fare', t.fuelRevenue], ['Toll Charge', t.tollRevenue], ['Total Amount', t.totalRevenue], ['Advance Received', booking.advance], ['Balance Due', t.outstanding]] : [['Booking Fare', booking.bookingAmount], ['Fuel Revenue', t.fuelRevenue], ['Toll Revenue', t.tollRevenue], ['Total Revenue', t.totalRevenue], ['Self Fuel Cost', t.companyFuel], ['Self Toll Cost', t.companyToll], ['Toll Profit / Loss', t.tollProfit], ...['driverPayment','parking','food','maintenance','otherExpenses'].map(k => [k, booking[k]]), ['Total Expenses', t.totalExpenses], ['Net Profit / Loss', t.netProfit]];
  return <main className="workspace">
    <div className="toolbar report-controls"><div className="tabs"><button aria-selected={customer} onClick={() => setMode('customer')}>Customer Report</button><button aria-selected={!customer} onClick={() => setMode('company')}>Company Report</button></div><button className="secondary-button" onClick={() => window.print()}>Print / Save PDF</button></div>
    <h1>Parv Tour & Travels ? {customer ? 'Customer' : 'Company'} Report</h1>
    <section className="section"><p>{booking.bookingId} | {booking.customerName}</p><p>{booking.from} ? {booking.to}</p><p>Vehicle: {booking.vehicle || '?'} | Distance: {t.distance ?? booking.distance ?? 0} km</p></section>
    {booking.fuelCalculationVersion === 2 && (customer ? <section className="section"><h2>Customer Fuel Calculation</h2><p>{t.distance} km / {t.effectiveCustomerAverage} km/L ? {formatCurrency(booking.fuelRate)} = {formatCurrency(t.customerFuelCharge)}</p><p>{booking.acEnabled ? 'AC used' : 'Non-AC'} ? {booking.fuelPaidBy === 'customer' ? 'Fuel paid directly by customer' : booking.fuelBillingMode === 'separate' ? 'Fuel charged above booking fare' : 'Fuel included in booking fare'}</p></section> : <FuelComparison data={booking} />)}
    <div className="table-scroll"><table className="data-table"><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody>{rows.map(([label,value]) => <tr key={label}><td>{label}</td><td>{formatCurrency(value ?? 0)}</td></tr>)}</tbody></table></div>
    <Link className="text-link report-controls" href="/">Back to bookings</Link>
  </main>;
}
