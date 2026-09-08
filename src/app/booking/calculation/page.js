'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Printer, Check, Pencil, RefreshCw } from 'lucide-react';
import { bookingApi, formatCurrency } from '@/lib/api';
import { bookingTotals } from '@/lib/expenses';
import FuelComparison from '@/components/FuelComparison';

export default function CalculationPage() {
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    if (!id) { router.push('/booking/entry'); return; }
    bookingApi.getById(id).then(result => {
      if (result.success) setBooking(result.data);
      else setNotice(result.error || 'Unable to load booking');
      setLoading(false);
    });
  }, [router]);
  const save = async complete => {
    if (complete && !window.confirm('Complete this booking?')) return;
    setSaving(true); setNotice('');
    const result = await bookingApi.calculate(booking.bookingId);
    if (!result.success) { setNotice(result.error || 'Unable to save calculation'); setSaving(false); return; }
    setBooking(prev => ({ ...prev, ...result.data }));
    if (complete) {
      const status = await bookingApi.updateStatus(booking.bookingId, 'completed', 'Booking completed');
      if (!status.success) { setNotice(status.error || 'Unable to complete booking'); setSaving(false); return; }
      ['currentBookingId', 'driverData', 'expensesData', 'calculations'].forEach(key => localStorage.removeItem(key));
      router.push('/');
    } else setNotice('Calculation saved');
    setSaving(false);
  };
  if (loading) return <div className="workspace empty-state" role="status">Loading calculation...</div>;
  if (!booking) return <div className="workspace"><p role="alert">{notice || 'Booking not found'}</p><Link className="text-link" href="/">Back to bookings</Link></div>;
  const totals = bookingTotals(booking);
  return <div className="workspace">
    <a className="secondary-button" href={`/booking/report/${booking.bookingId}`}>Customer / Company Reports</a><header className="page-heading"><div><p className="eyebrow">{booking.bookingId} / Trip Settlement</p><h1>Profit & Settlement</h1></div><button className="secondary-button" onClick={() => window.print()}><Printer size={17} />Print</button></header>
    {notice && <p className="notice" role="status">{notice}</p>}
    <div className="metrics">{[['Total Revenue', totals.totalRevenue], ['Company Expenses', totals.totalExpenses], ['Net Profit', totals.netProfit], ['Customer Balance', totals.outstanding]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{formatCurrency(value)}</strong></div>)}</div>
    {booking.fuelCalculationVersion === 2 && <section className="section"><h2>Customer vs Self Fuel</h2><FuelComparison data={booking} /></section>}
    <section className="section"><h2>Settlement Breakdown</h2><div className="table-scroll"><table className="data-table"><tbody>
      {[['Booking Fare', booking.bookingAmount], ['Fuel Charged Above Fare', totals.fuelRevenue], ['Toll Revenue', totals.tollRevenue], ['Toll Profit / Loss', totals.tollProfit], ['Total Revenue', totals.totalRevenue], ['Self Fuel Expense', totals.companyFuel], ['Company Toll', totals.companyToll],
        ...['driverPayment', 'parking', 'food', 'maintenance', 'otherExpenses'].map(key => [({ driverPayment: 'Driver Payment', otherExpenses: 'Other Expenses' })[key] || key, booking[key]]),
        ['Total Company Expenses', totals.totalExpenses], ['Net Profit', totals.netProfit], ['Advance Received', booking.advance], ['Customer Balance', totals.outstanding]].map(([label, value]) => <tr key={label}><td className="strong capitalize">{label}</td><td className="text-right">{formatCurrency(value)}</td></tr>)}
    </tbody></table></div></section>
    <section className="section"><h2>Trip Details</h2><div className="form-grid">{[['Customer', booking.customerName], ['Vehicle', booking.vehicle], ['Driver', booking.driverName], ['Distance', (totals.distance ?? booking.distance ?? 0) + ' km'], ['Fuel Billing', booking.fuelPaidBy === 'customer' ? 'Customer pays directly' : booking.fuelBillingMode === 'separate' ? 'Above booking fare' : 'Included in booking fare'], ['Toll Paid By', booking.tollPaidBy || 'company']].map(([label, value]) => <div key={label}><p className="eyebrow">{label}</p><p className="strong capitalize">{value || 'Not entered'}</p></div>)}</div></section>
    <footer className="form-actions"><Link className="secondary-button" href="/booking/expenses"><Pencil size={16} />Edit Expenses</Link><button disabled={saving} className="secondary-button" onClick={() => save(false)}><RefreshCw size={16} />Save Calculation</button><button disabled={saving || booking.status === 'completed'} className="primary-button" onClick={() => save(true)}><Check size={17} />{booking.status === 'completed' ? 'Completed' : 'Complete Booking'}</button></footer>
  </div>;
}
