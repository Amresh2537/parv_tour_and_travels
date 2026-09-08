import test from 'node:test';
import assert from 'node:assert/strict';
import { expenseTotals, fuelTotals, bookingTotals } from './expenses.js';

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

const example = { fuelCalculationVersion: 2, distanceMode: 'manual', tripDistance: 160,
  customerAverage: 10, customerAcAverage: 8, vehicleAverage: 17, fuelRate: 113.63,
  fuelBillingMode: 'separate', bookingAmount: 0, advance: 0 };

test('customer and self averages match the 160 km example with two-decimal rounding', () => {
  const totals = bookingTotals(example);
  assert.equal(totals.customerFuelCharge, 1818.08);
  assert.equal(totals.fuelCost, 1069.46);
  assert.equal(totals.fuelProfit, 748.62);
  assert.equal(totals.netProfit, 748.62);
  assert.equal(totals.outstanding, 1818.08);
});

test('AC uses customer AC average while self average stays independent', () => {
  const totals = bookingTotals({ ...example, acEnabled: true });
  assert.equal(totals.customerFuelCharge, 2272.60);
  assert.equal(totals.fuelCost, 1069.46);
  assert.equal(totals.netProfit, 1203.14);
});

test('included and direct payment do not add fuel charges twice', () => {
  const included = bookingTotals({ ...example, bookingAmount: 5000, fuelBillingMode: 'included' });
  assert.equal(included.totalRevenue, 5000);
  assert.equal(included.netProfit, 3930.54);
  const direct = bookingTotals({ ...example, fuelPaidBy: 'customer', bookingAmount: 5000 });
  assert.equal(direct.totalRevenue, 5000);
  assert.equal(direct.companyFuel, 0);
  assert.equal(direct.netProfit, 5000);
});

test('legacy booking keeps recorded cost and does not add fuel revenue', () => {
  const totals = bookingTotals({ bookingAmount: 5000, advance: 1000, fuelCost: 1500, toll: 200 });
  assert.equal(totals.netProfit, 3300);
  assert.equal(totals.outstanding, 4000);
});


test('yearly toll pass charges customer and retains actual self expense', () => {
  const base = { ...example, tollCalculationVersion: 2, toll: 210, tollTripCost: 15, tollTrips: 1 };
  const customer = bookingTotals({ ...base, tollPaidBy: 'customer' });
  assert.equal(customer.tollRevenue, 210);
  assert.equal(customer.companyToll, 15);
  assert.equal(customer.tollProfit, 195);
  assert.equal(customer.netProfit, 943.62);
  assert.equal(customer.outstanding, 2028.08);
  const self = bookingTotals({ ...base, tollPaidBy: 'company' });
  assert.equal(self.tollRevenue, 0);
  assert.equal(self.tollProfit, -15);
  assert.equal(self.netProfit, 733.62);
  assert.equal(bookingTotals({ ...base, tollTrips: 2, tollTripCost: 20 }).companyToll, 40);
  assert.equal(bookingTotals({ ...base, tollTrips: 0 }).companyToll, 0);
});
