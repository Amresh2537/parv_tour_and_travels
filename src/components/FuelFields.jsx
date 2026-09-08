'use client';

export default function FuelFields({ data, onChange }) {
  const set = (key, value) => onChange({ ...data, [key]: value, fuelCalculationVersion: 2 });
  return <div className="form-grid">
    {[['fuelRate', 'Oil Rate (INR/L)'], ['customerAverage', 'Customer Average (km/L)'],
      ['customerAcAverage', 'Customer AC Average (km/L)'], ['vehicleAverage', 'Self Average (km/L)']].map(([key, label]) =>
      <label key={key}>{label}<input type="number" step="any" value={data[key] ?? ''} onChange={e => set(key, e.target.value)} /></label>)}
    <label>Fuel Billing<select value={data.fuelPaidBy === 'customer' ? 'direct' : data.fuelBillingMode || 'included'} onChange={e => onChange({ ...data, fuelCalculationVersion: 2, fuelPaidBy: e.target.value === 'direct' ? 'customer' : 'company', fuelBillingMode: e.target.value === 'direct' ? 'included' : e.target.value })}>
      <option value="separate">Charge fuel above booking fare</option><option value="included">Fuel included in booking fare</option><option value="direct">Customer pays fuel directly</option>
    </select></label>
    <label className="check-field"><input type="checkbox" checked={!!data.acEnabled} onChange={e => set('acEnabled', e.target.checked)} />AC Used (customer average defaults to 8 km/L)</label>
  </div>;
}
