'use client';
import { tollTotals } from '@/lib/expenses';
import { formatCurrency } from '@/lib/api';
export default function TollFields({ data, onChange }) {
  const set = (key, value) => onChange({ ...data, tollTripCost: data.tollTripCost ?? 15, tollTrips: data.tollTrips ?? 0, [key]: value, tollCalculationVersion: 2 });
  const totals = tollTotals(data);
  return <section className="section"><h2>Toll Tax / Yearly Pass</h2>
    <p>Yearly recharge example: INR 3,000 / 200 trips = INR 15 per trip. Enter the number of pass trips used on this booking; keep 0 when no toll was used.</p>
    <div className="form-grid">
      <label>Toll Paid By<select value={data.tollPaidBy || 'company'} onChange={e => set('tollPaidBy', e.target.value)}><option value="company">Self / Company</option><option value="customer">Customer</option></select></label>
      <label>Customer Toll Charge (INR)<input type="number" min="0" step="0.01" value={data.toll ?? ''} onChange={e => set('toll', e.target.value)} /></label>
      <label>Self Cost per Pass Trip (INR)<input type="number" min="0" step="0.01" value={data.tollTripCost ?? 15} onChange={e => set('tollTripCost', e.target.value)} /></label>
      <label>Pass Trips Used<input type="number" min="0" step="1" value={data.tollTrips ?? 0} onChange={e => set('tollTrips', e.target.value)} /></label>
    </div>
    {data.tollCalculationVersion === 2 ? <p className="notice">Toll profit / loss: {formatCurrency(totals.tollRevenue)} - {formatCurrency(totals.tollCost)} = {formatCurrency(totals.tollProfit)}</p> : <p>Recorded toll uses the previous calculation. Edit a field above to apply yearly-pass costing.</p>}
  </section>;
}
