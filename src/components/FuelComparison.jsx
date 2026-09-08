'use client';

import { fuelTotals } from '@/lib/expenses';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(value || 0);

export default function FuelComparison({ data }) {
  const fuel = fuelTotals(data);
  return <section className="fuel-comparison" aria-label="Fuel calculation">
    <div><p className="eyebrow">Customer {data.acEnabled ? '/ AC' : '/ Non-AC'}</p>
      <p className="formula">{fuel.distance} km / {fuel.effectiveCustomerAverage || '--'} km/L x {money(data.fuelRate)}</p>
      <strong>{money(fuel.customerFuelCharge)}</strong></div>
    <div><p className="eyebrow">Self / Actual Cost</p>
      <p className="formula">{fuel.distance} km / {data.vehicleAverage || '--'} km/L x {money(data.fuelRate)}</p>
      <strong>{money(fuel.fuelCost)}</strong></div>
    <div className="fuel-profit"><p className="eyebrow">Fuel Margin</p>
      <p className="formula">{money(fuel.customerFuelCharge)} - {money(fuel.fuelCost)}</p>
      <strong>{money(fuel.fuelProfit)}</strong></div>
  </section>;
}
