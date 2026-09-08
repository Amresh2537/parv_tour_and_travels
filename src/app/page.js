'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, RefreshCw, Pencil, Eye, Calculator, Check } from 'lucide-react';
import { bookingApi, formatCurrency } from '@/lib/api';
import { bookingTotals } from '@/lib/expenses';

export default function DashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    const result = await bookingApi.getAll();
    if (result.success) setBookings(result.data || []); else setError(result.error || 'Unable to load bookings');
    setLoading(false);
  };
  useEffect(() => { const timer = setTimeout(() => { load(); }, 0); return () => clearTimeout(timer); }, []);
  const open = (bookingId, page) => { localStorage.setItem('currentBookingId', bookingId); router.push(page); };
  const confirm = async bookingId => {
    const result = await bookingApi.confirm(bookingId);
    if (!result.success) setError(result.error || 'Unable to confirm'); else await load();
  };
  const visible = bookings.filter(b => (status === 'all' || b.status === status) && [b.customerName, b.phone, b.bookingId, b.from, b.to, b.vehicle, b.driverName].join(' ').toLowerCase().includes(search.toLowerCase()));
  const active = bookings.filter(b => b.status !== 'cancelled');
  const revenue = active.reduce((sum, b) => sum + bookingTotals(b).totalRevenue, 0);
  const profit = active.filter(b => b.status === 'completed').reduce((sum, b) => sum + bookingTotals(b).netProfit, 0);
  const outstanding = active.reduce((sum, b) => sum + Math.max(0, bookingTotals(b).outstanding), 0);
  return <div className="workspace">
    <header className="page-heading"><div><p className="eyebrow">PARV Tour & Travels / Operations</p><h1>Bookings</h1></div><div className="row-actions"><button className="icon-button" title="Refresh bookings" aria-label="Refresh bookings" onClick={load} disabled={loading}><RefreshCw size={17} /></button><Link href="/booking/entry" className="primary-button"><Plus size={17} />New Booking</Link></div></header>
    <div className="metrics">{[['Active Bookings', active.filter(b => b.status !== 'completed').length], ['Booked Revenue', formatCurrency(revenue)], ['Completed Trip Profit', formatCurrency(profit)], ['Customer Balance', formatCurrency(outstanding)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="toolbar"><input aria-label="Search bookings" placeholder="Search customer, route, vehicle..." value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Booking status" value={status} onChange={e => setStatus(e.target.value)}>{['all', 'pending', 'confirmed', 'driver_assigned', 'expenses_added', 'completed', 'cancelled'].map(value => <option key={value} value={value}>{value === 'all' ? 'All statuses' : value.replaceAll('_', ' ')}</option>)}</select></div>
    <div className="table-scroll"><table className="data-table"><thead><tr><th>Customer / Booking</th><th>Journey</th><th>Vehicle / Driver</th><th>Revenue</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="6" className="empty-state">Loading bookings...</td></tr> : visible.map(b => <tr key={b.bookingId}>
        <td className="strong">{b.customerName || 'Customer not entered'}<small>{b.bookingId}</small></td>
        <td>{b.from || '--'} to {b.to || '--'}<small>{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-IN') : 'Date not entered'}</small></td>
        <td>{b.vehicle || 'Unassigned'}<small>{b.driverName || 'Driver unassigned'}</small></td>
        <td className="strong whitespace-nowrap">{formatCurrency(bookingTotals(b).totalRevenue)}</td>
        <td><span className="status-badge">{(b.status || 'pending').replaceAll('_', ' ')}</span></td>
        <td><div className="row-actions"><button className="icon-button" title="View settlement" aria-label="View settlement" onClick={() => open(b.bookingId, '/booking/calculation')}><Eye size={16} /></button><button className="icon-button" title="Edit booking" aria-label="Edit booking" onClick={() => open(b.bookingId, '/booking/edit/' + b.bookingId)}><Pencil size={16} /></button><button className="icon-button" title="Trip and expenses" aria-label="Trip and expenses" onClick={() => open(b.bookingId, '/booking/expenses')}><Calculator size={16} /></button>{b.status === 'pending' && <button className="icon-button" title="Confirm booking" aria-label="Confirm booking" onClick={() => confirm(b.bookingId)}><Check size={16} /></button>}</div></td>
      </tr>)}
      {!loading && !visible.length && <tr><td colSpan="6" className="empty-state">No bookings found</td></tr>}
    </tbody></table></div>
    <p className="eyebrow mt-4">{visible.length} of {bookings.length} bookings</p>
  </div>;
}
