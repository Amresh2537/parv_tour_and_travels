import test from 'node:test';
import assert from 'node:assert/strict';
import { expenseTotals, fuelTotals } from './expenses.js';

test('payer combinations exclude only customer-paid fuel and toll', () => {
  const base = { fuelCost: 2000, toll: 500, driverPayment: 1000, maintenance: 100, parking: 50, food: 150, otherExpenses: 200 };
  for (const [fuelPaidBy, tollPaidBy, expected] of [
    ['company', 'company', 4000], ['customer', 'company', 2000],
    ['company', 'customer', 3500], ['customer', 'customer', 1500],
  ]) {
    const totals = expenseTotals({ ...base, fuelPaidBy, tollPaidBy });
    assert.equal(totals.totalExpenses, expected);
    assert.equal(totals.customerPaid, 4000 - expected);
  }
  assert.equal(expenseTotals(base).totalExpenses, 4000);
});

test('fuel calculation accepts zero odometer and updates from latest inputs', () => {
  const data = { startKM: 0, endKM: 240, vehicleAverage: 12, fuelRate: 100 };
  assert.equal(fuelTotals(data).fuelCost, 2000);
  assert.equal(fuelTotals({ ...data, endKM: 360 }).fuelCost, 3000);
  assert.equal(fuelTotals({ ...data, vehicleAverage: 0 }).fuelCost, 0);
  assert.equal(fuelTotals({ ...data, startKM: '' }).distance, 0);
});

test('blank and invalid amounts remain finite', () => {
  assert.equal(expenseTotals({}).totalExpenses, 0);
  assert.equal(expenseTotals({ fuelCost: Infinity, toll: 'invalid', driverPayment: -1 }).totalExpenses, 0);
  assert.equal(fuelTotals({}).fuelCost, 0);
});
