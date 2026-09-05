export function amount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function expenseTotals(data = {}) {
  const fuelCost = amount(data.fuelCost);
  const toll = amount(data.toll ?? data.tollAmount);
  const companyFuel = data.fuelPaidBy === 'customer' ? 0 : fuelCost;
  const companyToll = data.tollPaidBy === 'customer' ? 0 : toll;
  const other = ['driverPayment', 'otherExpenses', 'maintenance', 'food', 'parking']
    .reduce((total, key) => total + amount(data[key]), 0);
  return {
    companyFuel,
    companyToll,
    customerPaid: fuelCost + toll - companyFuel - companyToll,
    totalExpenses: Math.round((companyFuel + companyToll + other) * 100) / 100,
  };
}

export function fuelTotals(data = {}) {
  const distance = data.startKM === '' || data.endKM === '' ? 0
    : Math.max(0, amount(data.endKM) - amount(data.startKM));
  const average = amount(data.vehicleAverage);
  const liters = average > 0 ? distance / average : 0;
  return { distance, liters, fuelLiters: liters, fuelCost: Math.round(liters * amount(data.fuelRate) * 100) / 100 };
}
