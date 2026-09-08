'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { bookingApi } from '@/lib/api';

export default function DriverPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    if (!id) { router.push('/booking/entry'); return; }
    Promise.all([bookingApi.getById(id), bookingApi.getDrivers(), bookingApi.getVehicles()]).then(([booking, d, v]) => {
      if (booking.success) setData(booking.data); else setError(booking.error || 'Unable to load booking');
      setDrivers(d.data || []); setVehicles(v.data || []);
    });
  }, [router]);
  const change = e => {
    const { name, value } = e.target;
    setData(prev => {
      if (name === 'driverName') {
        const driver = drivers.find(d => d.name === value);
        return { ...prev, driverName: value, driverId: driver?.driverId || '', driverPhone: driver?.phone || prev.driverPhone };
      }
      if (name === 'vehicleId') {
        const v = vehicles.find(item => item.vehicleId === value);
        return { ...prev, vehicleId: value, vehicle: v?.type || '', vehicleType: v?.type || '',
          vehicleAverage: v?.average ?? prev.vehicleAverage, customerAverage: v?.customerAverage ?? prev.customerAverage, customerAcAverage: v?.customerAcAverage ?? prev.customerAcAverage };
      }
      return { ...prev, [name]: value };
    });
  };
  const save = async e => {
    e.preventDefault(); setSaving(true); setError('');
    const result = await bookingApi.addDriver(data);
    setSaving(false);
    if (!result.success) { setError(result.error || 'Unable to assign driver'); return; }
    localStorage.setItem('driverData', JSON.stringify(data));
    router.push('/booking/expenses');
  };
  return <div className="workspace">
    <header className="page-heading"><div><p className="eyebrow">{data?.bookingId || 'Booking'} / Assignment</p><h1>Driver & Vehicle</h1></div><Link href="/admin" className="secondary-button">Admin Panel</Link></header>
    {error && <p role="alert" className="notice error">{error}</p>}
    {!data ? <p className="empty-state">{error ? 'Booking unavailable' : 'Loading assignment...'}</p> : <form noValidate onSubmit={save}>
      <section className="section"><div className="form-grid">
        <label>Driver Name<input name="driverName" list="assignment-drivers" value={data.driverName || ''} onChange={change} /><datalist id="assignment-drivers">{drivers.filter(d => d.status === 'Available' || d.driverId === data.driverId).map(d => <option key={d.driverId} value={d.name} />)}</datalist></label>
        <label>Driver Phone<input name="driverPhone" type="tel" value={data.driverPhone || ''} onChange={change} /></label>
        <label>Vehicle<select name="vehicleId" value={data.vehicleId || ''} onChange={change}><option value="">Unassigned</option>{vehicles.filter(v => v.status === 'Available' || v.vehicleId === data.vehicleId).map(v => <option key={v.vehicleId} value={v.vehicleId}>{v.type} / {v.number || '--'}</option>)}</select></label>
        <label>Start Odometer (km)<input name="startKM" type="number" step="any" value={data.startKM ?? ''} onChange={change} /></label>
        <label>Self Average (km/L)<input name="vehicleAverage" type="number" step="any" value={data.vehicleAverage ?? ''} onChange={change} /></label>
      </div></section>
      <footer className="form-actions"><Link href="/booking/confirm" className="secondary-button">Back</Link><button className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save & Add Expenses'}<ArrowRight size={17} /></button></footer>
    </form>}
  </div>;
}
