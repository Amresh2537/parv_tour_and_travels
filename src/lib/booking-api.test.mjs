import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const records = new Map();
const collections = new Map();
globalThis.__bookingTestDb = {
  collection(name) {
    if (!collections.has(name)) {
      const rows = [];
      records.set(name, rows);
      const match = (row, filter) => Object.entries(filter).every(([key, value]) => row[key] === value);
      const update = async (filter, operation, options = {}) => {
        let row = rows.find(row => match(row, filter));
        if (!row && options.upsert) { row = { ...filter }; rows.push(row); }
        if (!row) return { matchedCount: 0 };
        Object.assign(row, operation.$set);
        if (operation.$push) for (const [key, value] of Object.entries(operation.$push)) (row[key] ||= []).push(value);
        return { matchedCount: 1 };
      };
      collections.set(name, {
        findOne: async filter => structuredClone(rows.find(row => match(row, filter)) || null),
        insertOne: async row => { rows.push(structuredClone(row)); },
        updateOne: update,
        updateMany: async (filter, operation) => { for (const row of rows.filter(row => match(row, filter))) Object.assign(row, operation.$set); },
        findOneAndUpdate: async (filter, operation, options) => { await update(filter, operation, options); return structuredClone(rows.find(row => match(row, filter)) || null); },
      });
    }
    return collections.get(name);
  },
};
let source = await readFile(new URL('../app/api/bookings/route.js', import.meta.url), 'utf8');
source = source.replace("from '@/lib/expenses'", "from '" + new URL('./expenses.js', import.meta.url).href + "'")
  .replace("import { getDb } from '@/lib/mongodb';", 'const getDb = async () => globalThis.__bookingTestDb;');
const api = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const post = async data => (await api.POST(new Request('http://localhost/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }))).json();

test('API saves authoritative fuel totals, recalculates edits, and persists settings', async () => {
  const settings = { fuelRate: 113.63, customerAverage: 10, customerAcAverage: 8, vehicleAverage: 17 };
  assert.equal((await post({ action: 'saveSettings', ...settings })).success, true);
  const config = await (await api.GET(new Request('http://localhost/api/bookings?action=getSettings'))).json();
  assert.deepEqual(config.data, settings);
  const created = await post({ action: 'create', ...settings, fuelCalculationVersion: 2, fuelBillingMode: 'separate', bookingAmount: 0 });
  assert.equal(created.success, true);
  const bookingId = created.data.bookingId;
  const saved = await post({ action: 'addExpenses', bookingId, distanceMode: 'manual', tripDistance: 160, fuelCalculationVersion: 2, fuelCost: 1, totalExpenses: 1 });
  assert.equal(saved.data.fuelCost, 1069.46);
  assert.equal(saved.data.netProfit, 748.62);
  const recalculated = await post({ action: 'calculate', bookingId });
  assert.equal(recalculated.data.netProfit, 748.62);
  const edited = await post({ action: 'updateBooking', bookingId, acEnabled: true });
  assert.equal(edited.data.customerFuelCharge, 2272.6);
  assert.equal(edited.data.netProfit, 1203.14);
  await post({ action: 'saveSettings', ...settings, fuelRate: 150 });
  const afterDefaultChange = await post({ action: 'calculate', bookingId });
  assert.equal(afterDefaultChange.data.netProfit, 1203.14);
  assert.equal((await post({ action: 'addExpenses', bookingId: 'missing' })).success, false);
  assert.equal((await post({ action: 'saveSettings', ...settings, vehicleAverage: 0 })).success, false);
});


test('API persists yearly pass cost and customer toll revenue through recalculation', async () => {
  const created = await post({ action: 'create', bookingAmount: 0, tollCalculationVersion: 2 });
  const bookingId = created.data.bookingId;
  const saved = await post({ action: 'addExpenses', bookingId, tollCalculationVersion: 2, toll: 210, tollPaidBy: 'customer', tollTripCost: 15, tollTrips: 1 });
  assert.equal(saved.data.tollProfit, 195);
  assert.equal(saved.data.netProfit, 195);
  assert.equal((await post({ action: 'calculate', bookingId })).data.netProfit, 195);
  const edited = await post({ action: 'updateBooking', bookingId, tollPaidBy: 'company', tollTripCost: 20 });
  assert.equal(edited.data.netProfit, -20);
});
