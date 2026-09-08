'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { bookingApi, formatCurrency } from '@/lib/api';
import TollFields from '@/components/TollFields';
import FuelFields from '@/components/FuelFields';
import FuelComparison from '@/components/FuelComparison';
import { bookingTotals, DEFAULT_SETTINGS, fuelTotals } from '@/lib/expenses';

const fields = [
  ['startKM', 'Start KM'], ['endKM', 'End KM'],
   ['driverPayment', 'Driver Payment (INR)'],
  ['parking', 'Parking (INR)'], ['food', 'Food (INR)'], ['maintenance', 'Maintenance (INR)'],
  ['otherExpenses', 'Other Expenses (INR)'],
];

export default function ExpensesPage() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState('');
  const [tripData, setTripData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const id = localStorage.getItem('currentBookingId');
    if (!id) { router.push('/booking/entry'); return; }
    bookingApi.getById(id).then(result => {
      setBookingId(id);
      if (result.success) setTripData({ ...DEFAULT_SETTINGS, ...result.data, fuelCalculationVersion: 2 });
      else setError(result.error || 'Unable to load booking');
      setLoading(false);
    });
  }, [router]);
  const fuel = fuelTotals(tripData);
  const totals = bookingTotals({ ...tripData, ...fuel });
  const change = e => setTripData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const save = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const data = { ...tripData, ...fuel, ...totals, bookingId };
    const result = await bookingApi.addExpenses(data);
    setSaving(false);
    if (!result.success) { setError(result.error || 'Unable to save expenses'); return; }
    localStorage.setItem('expensesData', JSON.stringify(data));
    localStorage.setItem('calculations', JSON.stringify(data));
    router.push('/booking/calculation');
  };
  return (
    <main className="workspace">
      <div className="max-w-5xl mx-auto">
        <header className="border-b border-gray-200 pb-5 mb-6">
          <p className="text-sm text-gray-500 mb-2">{bookingId || 'Booking'}</p>
          <h1 className="text-2xl font-semibold text-gray-900">Trip & Expenses</h1>
          <p className="mt-2 text-gray-600">{tripData.customerName || 'Customer not entered'} Â· {tripData.vehicle || 'Vehicle not selected'}</p>
        </header>
        {error && <p role="alert" className="mb-5 p-3 bg-red-50 text-red-700">{error}</p>}
        {loading ? <p role="status">Loading trip details...</p> : <form noValidate onSubmit={save}>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-b border-gray-200 pb-6 mb-6">
            {[['Distance', fuel.distance + ' km'], ['Fuel Required', fuel.liters.toFixed(2) + ' L'],
              ['Company Expenses', formatCurrency(totals.totalExpenses)], ['Customer-paid Costs', formatCurrency(totals.customerPaid)]].map(([label, value]) =>
              <div key={label}><dt className="text-sm text-gray-500">{label}</dt><dd className="mt-1 text-xl font-semibold text-gray-900 break-words">{value}</dd></div>)}
          </dl>
          <TollFields data={tripData} onChange={setTripData} /><section className="section"><h2>Fuel & Averages</h2><FuelFields data={tripData} onChange={setTripData} /><FuelComparison data={tripData} /></section>
          <section className="section"><div className="form-grid">
            <label>Distance Entry<select name="distanceMode" value={tripData.distanceMode || 'odometer'} onChange={change}><option value="odometer">Odometer readings</option><option value="manual">Enter total km</option></select></label>
            {tripData.distanceMode === 'manual' && <label>Total Distance (km)<input name="tripDistance" type="number" step="any" value={tripData.tripDistance ?? ''} onChange={change} /></label>}
          </div></section>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {fields.filter(([name]) => tripData.distanceMode !== 'manual' || !['startKM', 'endKM'].includes(name)).map(([name, label]) => <label key={name} className="block text-sm font-medium text-gray-700">{label}
              <input name={name} type="number" step="any" value={tripData[name] ?? ''} onChange={change} placeholder="0"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:ring-2 focus:ring-emerald-600" />
            </label>)}
          </section>
          <section className="py-6">
            <h2 className="text-lg font-semibold mb-4">Expense Breakdown</h2>
            <div className="overflow-x-auto"><table className="w-full text-sm text-left">
              <thead className="border-b border-gray-300 text-gray-500"><tr><th className="py-3">Expense</th><th>Amount</th><th>Paid By</th><th className="text-right">Company Cost</th></tr></thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  ['Oil / Fuel', fuel.fuelCost, tripData.fuelPaidBy || 'company', totals.companyFuel],
                  ['Toll Tax', Number(tripData.toll) || 0, tripData.tollPaidBy || 'company', totals.companyToll],
                  ...fields.filter(([key]) => !['startKM', 'endKM', 'toll'].includes(key)).map(([key, label]) => [label.replace(' (INR)', ''), Number(tripData[key]) || 0, 'company', Number(tripData[key]) || 0])
                ].map(([label, value, payer, cost]) => <tr key={label}><td className="py-3 pr-3">{label}</td><td className="pr-3 whitespace-nowrap">{formatCurrency(value)}</td><td className="capitalize pr-3">{payer}</td><td className="text-right whitespace-nowrap">{formatCurrency(cost)}</td></tr>)}
              </tbody>
              <tfoot className="border-t-2 border-gray-300 font-semibold"><tr><td colSpan="3" className="py-4">Total Company Expenses</td><td className="text-right">{formatCurrency(totals.totalExpenses)}</td></tr></tfoot>
            </table></div>
          </section>
          <footer className="flex flex-wrap justify-between gap-3 border-t border-gray-200 pt-5">
            <button type="button" onClick={() => router.push('/booking/driver')} className="px-4 py-3 border border-gray-300 rounded-lg">Back to Driver</button>
            <button disabled={saving || !tripData.bookingId} type="submit" className="px-5 py-3 bg-emerald-700 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save & Review'}</button>
          </footer>
        </form>}
      </div>
    </main>
  );
}
