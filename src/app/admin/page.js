'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, RefreshCw, SlidersHorizontal, Users, CarFront } from 'lucide-react';
import { bookingApi } from '@/lib/api';
import { DEFAULT_SETTINGS } from '@/lib/expenses';
import FuelComparison from '@/components/FuelComparison';

const driverFields = [['name', 'Name'], ['phone', 'Phone', 'tel'], ['licenseNumber', 'License Number'], ['experience', 'Experience'], ['notes', 'Notes']];
const vehicleFields = [['type', 'Vehicle Name / Type'], ['number', 'Registration'], ['model', 'Model'], ['capacity', 'Seats', 'number'], ['average', 'Self Average (km/L)', 'number'], ['customerAverage', 'Customer Average (km/L)', 'number'], ['customerAcAverage', 'Customer AC Average (km/L)', 'number'], ['currentKM', 'Odometer', 'number'], ['insuranceExpiry', 'Insurance Expiry', 'date'], ['notes', 'Notes']];

export default function AdminPage() {
  const [tab, setTab] = useState('settings');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [records, setRecords] = useState({ drivers: [], vehicles: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    const [config, drivers, vehicles] = await Promise.all([bookingApi.getSettings(), bookingApi.getDrivers(), bookingApi.getVehicles()]);
    if (config.success) setSettings(config.data);
    setRecords({ drivers: drivers.data || [], vehicles: vehicles.data || [] });
    const failed = [config, drivers, vehicles].find(result => !result.success);
    if (failed) setError(failed.error || 'Unable to load admin data');
    setLoading(false);
  };
  useEffect(() => { const timer = setTimeout(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (['settings', 'drivers', 'vehicles'].includes(requested)) setTab(requested);
    load();
  }, 0); return () => clearTimeout(timer); }, []);
  const saveSettings = async e => {
    e.preventDefault(); setSaving(true); setMessage(''); setError('');
    const result = await bookingApi.saveSettings(settings);
    if (result.success) setMessage('Fuel defaults saved. Existing bookings retain their saved rates.');
    else setError(result.error || 'Unable to save settings');
    setSaving(false);
  };
  const saveRecord = async e => {
    e.preventDefault(); setSaving(true); setError(''); setMessage('');
    const { _id, ...data } = form;
    const result = tab === 'drivers'
      ? await (data.driverId ? bookingApi.updateDriver(data) : bookingApi.addDriverRecord(data))
      : await (data.vehicleId ? bookingApi.updateVehicle(data) : bookingApi.addVehicle(data));
    setSaving(false);
    if (!result.success) { setError(result.error || 'Unable to save record'); return; }
    setForm(null); setMessage('Record saved'); await load();
  };
  const remove = async record => {
    if (!window.confirm('Delete ' + (record.name || record.type || 'this record') + '?')) return;
    setSaving(true);
    const result = tab === 'drivers' ? await bookingApi.deleteDriver(record.driverId) : await bookingApi.deleteVehicle(record.vehicleId);
    setSaving(false);
    if (!result.success) setError(result.error || 'Unable to delete record'); else await load();
  };
  const changeTab = value => { setTab(value); setForm(null); setSearch(''); setMessage(''); };
  const list = (records[tab] || []).filter(item => [item.name, item.type, item.number, item.phone, item.status].join(' ').toLowerCase().includes(search.toLowerCase()));
  return <div className="workspace">
    <header className="page-heading"><div><p className="eyebrow">Operations / Administration</p><h1>Admin Panel</h1></div><button className="icon-button" title="Refresh data" aria-label="Refresh data" onClick={load} disabled={loading}><RefreshCw size={18} /></button></header>
    <div className="tabs" role="tablist" aria-label="Admin sections">{[['settings', 'Fuel & Averages', SlidersHorizontal], ['drivers', 'Drivers', Users], ['vehicles', 'Vehicles', CarFront]].map(([key, label, Icon]) => <button key={key} role="tab" aria-selected={tab === key} onClick={() => changeTab(key)}><Icon size={17} />{label}{key !== 'settings' && <span className="count">{records[key].length}</span>}</button>)}</div>
    {error && <p className="notice error" role="alert">{error}</p>}{message && <p className="notice" role="status">{message}</p>}
    {loading ? <p className="empty-state" role="status">Loading administration...</p> : tab === 'settings' ? <>
      <form onSubmit={saveSettings} className="section"><h2>Default Fuel Rates</h2><div className="form-grid">
        {Object.entries({ fuelRate: 'Oil Rate (INR/L)', customerAverage: 'Customer Average (km/L)', customerAcAverage: 'Customer AC Average (km/L)', vehicleAverage: 'Self Average (km/L)' }).map(([key, label]) => <label key={key}>{label}<input type="number" step="any" min="0.01" required value={settings[key]} onChange={e => setSettings({ ...settings, [key]: e.target.value })} /></label>)}
      </div><div className="form-actions"><button className="primary-button" disabled={saving}><Save size={17} />{saving ? 'Saving...' : 'Save Defaults'}</button></div></form>
      <section className="section"><h2>160 km Estimate</h2><FuelComparison data={{ ...settings, tripDistance: 160, distanceMode: 'manual' }} /></section>
    </> : <>
      <div className="toolbar"><input aria-label="Search records" placeholder={'Search ' + tab} value={search} onChange={e => setSearch(e.target.value)} /><button className="primary-button" onClick={() => setForm({ status: 'Available', ...(tab === 'vehicles' ? { average: settings.vehicleAverage, customerAverage: settings.customerAverage, customerAcAverage: settings.customerAcAverage, fuelType: 'Diesel' } : {}) })}><Plus size={17} />Add {tab === 'drivers' ? 'Driver' : 'Vehicle'}</button></div>
      {form && <form noValidate onSubmit={saveRecord} className="section record-editor"><div className="page-heading"><h2>{form.driverId || form.vehicleId ? 'Edit' : 'Add'} {tab === 'drivers' ? 'Driver' : 'Vehicle'}</h2><button type="button" className="icon-button" title="Close editor" aria-label="Close editor" onClick={() => setForm(null)}><X size={18} /></button></div>
        <div className="form-grid">{(tab === 'drivers' ? driverFields : vehicleFields).map(([key, label, type]) => <label key={key}>{label}<input type={type || 'text'} step="any" value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} /></label>)}
          <label>Status<select value={form.status || 'Available'} onChange={e => setForm({ ...form, status: e.target.value })}>{['Available', 'On Trip', tab === 'drivers' ? 'On Leave' : 'Maintenance', 'Inactive'].map(status => <option key={status}>{status}</option>)}</select></label>
          {tab === 'vehicles' && <label>Fuel Type<select value={form.fuelType || 'Diesel'} onChange={e => setForm({ ...form, fuelType: e.target.value })}>{['Diesel', 'Petrol', 'CNG', 'Electric'].map(type => <option key={type}>{type}</option>)}</select></label>}
        </div><div className="form-actions"><button className="primary-button" disabled={saving}><Save size={17} />Save {tab === 'drivers' ? 'Driver' : 'Vehicle'}</button></div>
      </form>}
      <div className="table-scroll"><table className="data-table"><thead><tr><th>{tab === 'drivers' ? 'Driver' : 'Vehicle'}</th><th>{tab === 'drivers' ? 'Phone' : 'Registration'}</th><th>{tab === 'drivers' ? 'License' : 'Self / Customer / AC Average'}</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {list.map(item => <tr key={item.driverId || item.vehicleId || item._id}><td className="strong">{item.name || item.type || 'Not entered'}</td><td>{(tab === 'drivers' ? item.phone : item.number) || '--'}</td><td>{tab === 'drivers' ? item.licenseNumber || '--' : [item.average ?? settings.vehicleAverage, item.customerAverage ?? settings.customerAverage, item.customerAcAverage ?? settings.customerAcAverage].join(' / ') + ' km/L'}</td><td><span className="status-badge">{item.status || 'Available'}</span></td><td><div className="row-actions"><button className="icon-button" title="Edit record" aria-label="Edit record" onClick={() => setForm(item)}><Pencil size={16} /></button><button className="icon-button danger" title="Delete record" aria-label="Delete record" disabled={saving} onClick={() => remove(item)}><Trash2 size={16} /></button></div></td></tr>)}
        {!list.length && <tr><td colSpan="5" className="empty-state">No {tab} found</td></tr>}
      </tbody></table></div>
    </>}
  </div>;
}
