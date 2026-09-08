export function amount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function expenseTotals(data = {}) {
  const fuelCost = amount(data.fuelCost);
  const toll = amount(data.toll ?? data.tollAmount);
  const companyFuel = data.fuelPaidBy === 'customer' ? 0 : fuelCost;
  const companyToll = data.tollCalculationVersion === 2 ? tollTotals(data).tollCost : data.tollPaidBy === 'customer' ? 0 : toll;
  const other = ['driverPayment', 'otherExpenses', 'maintenance', 'food', 'parking']
    .reduce((total, key) => total + amount(data[key]), 0);
  return {
    companyFuel,
    companyToll,
    customerPaid: fuelCost - companyFuel + (data.tollCalculationVersion === 2 ? 0 : toll - companyToll),
    totalExpenses: Math.round((companyFuel + companyToll + other) * 100) / 100,
  };
}

export function fuelTotals(data = {}) {
  const distance = data.distanceMode === 'manual' ? amount(data.tripDistance)
    : data.startKM === '' || data.endKM === '' ? 0
    : Math.max(0, amount(data.endKM) - amount(data.startKM));
  const average = amount(data.vehicleAverage);
  const liters = average > 0 ? distance / average : 0;
  const customerAverage = amount(data.acEnabled ? data.customerAcAverage : data.customerAverage);
  const customerLiters = customerAverage > 0 ? distance / customerAverage : 0;
  const fuelCost = roundMoney(liters * amount(data.fuelRate));
  const customerFuelCharge = roundMoney(customerLiters * amount(data.fuelRate));
  return { distance, liters, fuelLiters: liters, fuelCost, customerLiters,
    effectiveCustomerAverage: customerAverage, customerFuelCharge,
    fuelProfit: roundMoney(customerFuelCharge - fuelCost) };
}

export const roundMoney = value => Math.round((value + Number.EPSILON) * 100) / 100;

export function tollTotals(data = {}) {
  const tollCost = roundMoney(amount(data.tollTripCost ?? 15) * amount(data.tollTrips ?? 0));
  const tollRevenue = data.tollPaidBy === 'customer' ? roundMoney(amount(data.toll)) : 0;
  return { tollCost, tollRevenue, tollProfit: roundMoney(tollRevenue - tollCost) };
}

export const DEFAULT_SETTINGS = {
  fuelRate: 113.63, customerAverage: 10, customerAcAverage: 8, vehicleAverage: 17,
};

export function bookingTotals(data = {}) {
  // Legacy bookings retain their recorded fuel cost until explicitly edited.
  const fuel = data.fuelCalculationVersion === 2 ? fuelTotals(data) : {};
  const merged = { ...data, ...fuel };
  const expenses = expenseTotals(merged);
  const fuelRevenue = merged.fuelBillingMode === 'separate' && merged.fuelPaidBy !== 'customer'
    ? amount(merged.customerFuelCharge) : 0;
  const toll = data.tollCalculationVersion === 2 ? tollTotals(data) : { tollRevenue: 0 };
  const totalRevenue = roundMoney(amount(data.bookingAmount) + fuelRevenue + toll.tollRevenue);
  return { ...fuel, ...expenses, ...toll, fuelRevenue, totalRevenue,
    netProfit: roundMoney(totalRevenue - expenses.totalExpenses),
    outstanding: roundMoney(totalRevenue - amount(data.advance)) };
}
