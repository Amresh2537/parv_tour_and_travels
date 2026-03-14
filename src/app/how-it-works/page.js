'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TravelBackground } from '@/components/TravelBackground';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay },
});

function FormulaBox({ label, formula, result, color = 'blue' }) {
  const colors = {
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    label: 'text-blue-700',    badge: 'bg-blue-100 text-blue-800' },
    green:   { bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'text-amber-700',   badge: 'bg-amber-100 text-amber-800' },
    rose:    { bg: 'bg-rose-50',    border: 'border-rose-200',    label: 'text-rose-700',    badge: 'bg-rose-100 text-rose-800' },
    purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  label: 'text-purple-700',  badge: 'bg-purple-100 text-purple-800' },
  };
  const c = colors[color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${c.label}`}>{label}</p>
      <p className="font-mono text-sm text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-100 mb-2 break-all">
        {formula}
      </p>
      {result && (
        <span className={`inline-block text-xs font-semibold rounded-full px-3 py-1 ${c.badge}`}>
          {result}
        </span>
      )}
    </div>
  );
}

function StepCard({ step, icon, title, desc, color = 'blue', delay = 0 }) {
  const ringColors = {
    blue: 'ring-blue-500 bg-blue-500',
    green: 'ring-emerald-500 bg-emerald-500',
    amber: 'ring-amber-500 bg-amber-500',
    purple: 'ring-purple-500 bg-purple-500',
    rose: 'ring-rose-500 bg-rose-500',
    cyan: 'ring-cyan-500 bg-cyan-500',
  };
  return (
    <motion.div {...fadeUp(delay)} className="flex gap-4 items-start">
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-10 h-10 rounded-full ${ringColors[color]} text-white flex items-center justify-center text-lg font-bold shadow-lg z-10`}>
          {step}
        </div>
      </div>
      <div className="flex-1 bg-white/90 backdrop-blur rounded-2xl border border-white/40 shadow-md p-5 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="text-3xl mt-0.5">{icon}</div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('process');

  const tabs = [
    { id: 'process',  label: 'Booking Process' },
    { id: 'fuel',     label: 'Fuel Calculation' },
    { id: 'profit',   label: 'Profit & Loss' },
    { id: 'advance',  label: 'Advance & Balance' },
    { id: 'example',  label: 'Live Example' },
  ];

  /* ── Live Example numbers ── */
  const ex = {
    bookingAmount: 5000,
    advance: 2000,
    startKM: 10000,
    endKM: 10350,
    vehicleAverage: 12,
    fuelRate: 105,
    driverPayment: 600,
    toll: 150,
    otherExpenses: 100,
  };
  ex.totalKM       = ex.endKM - ex.startKM;                        // 350
  ex.liters        = +(ex.totalKM / ex.vehicleAverage).toFixed(2); // 29.17
  ex.fuelCost      = +(ex.liters * ex.fuelRate).toFixed(2);        // 3062.5
  ex.totalExpenses = ex.fuelCost + ex.driverPayment + ex.toll + ex.otherExpenses; // 3912.5
  ex.netProfit     = ex.bookingAmount - ex.totalExpenses;           // 1087.5
  ex.balance       = ex.bookingAmount - ex.advance;                 // 3000
  ex.outstanding   = ex.balance - ex.totalExpenses;                 // -912.5
  ex.margin        = +((ex.netProfit / ex.bookingAmount) * 100).toFixed(1); // 21.75

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <TravelBackground variant="minimal">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto">

          {/* ── Header ── */}
          <motion.div {...fadeUp(0)} className="mb-8">
            <div className="rounded-3xl border border-blue-100/60 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 p-6 md:p-8 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-cyan-100 mb-3">
                    Documentation
                  </p>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    How Calculations Work
                  </h1>
                  <p className="mt-2 text-cyan-100/90 max-w-xl">
                    Complete guide to booking workflow, fuel estimation, profit analysis and advance management in PARV Tour & Travels.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="shrink-0 inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
                >
                  ← Dashboard
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Tabs ── */}
          <motion.div {...fadeUp(0.05)} className="mb-8">
            <div className="flex flex-wrap gap-2 bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow p-2">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 min-w-[120px] rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === t.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ══════════════════════════════════════
              TAB: BOOKING PROCESS
          ══════════════════════════════════════ */}
          {activeTab === 'process' && (
            <motion.div {...fadeUp(0.1)} className="space-y-4">
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/40 shadow-lg p-6 md:p-8">
                <SectionHeader icon="🗺️" title="Complete Booking Workflow" subtitle="6 sequential steps from inquiry to trip completion" />

                <div className="relative">
                  {/* vertical connector line */}
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 to-emerald-300 -z-0" />

                  <div className="space-y-4">
                    <StepCard step="1" icon="📋" color="blue" delay={0.05}
                      title="Entry — Customer & Trip Details"
                      desc="Enter customer name, phone, pickup & drop location, vehicle type, booking amount and advance payment. A unique Booking ID is generated automatically." />
                    <StepCard step="2" icon="✅" color="cyan" delay={0.1}
                      title="Confirm — Review & Approve"
                      desc="Double-check all entered details before confirming. Once confirmed the booking status moves to 'confirmed' and locks core trip info." />
                    <StepCard step="3" icon="👨‍✈️" color="purple" delay={0.15}
                      title="Driver — Assign Driver & Record Start KM"
                      desc="Select an available driver from the database. Record the vehicle's starting odometer reading (Start KM). Status moves to 'driver_assigned'." />
                    <StepCard step="4" icon="⛽" color="amber" delay={0.2}
                      title="Expenses — Add End KM & All Costs"
                      desc="Enter End KM. System auto-calculates distance, fuel consumed and fuel cost. Add toll, driver payment and any other expenses manually." />
                    <StepCard step="5" icon="📈" color="rose" delay={0.25}
                      title="Calculation — Profit & Outstanding"
                      desc="System computes Net Profit = Booking Amount − Total Expenses. Outstanding = Balance (Amount − Advance) − Total Expenses." />
                    <StepCard step="6" icon="🏁" color="green" delay={0.3}
                      title="Complete — Finalize & Archive"
                      desc="Mark booking completed. All data saved to MongoDB. Driver and vehicle status reset to 'Available'. Booking archived for reports." />
                  </div>
                </div>
              </div>

              {/* Status flow */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/40 shadow-lg p-6">
                <SectionHeader icon="🔄" title="Status Lifecycle" subtitle="How booking status changes at each step" />
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
                    { label: '→', color: 'text-gray-400 border-transparent bg-transparent' },
                    { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-300' },
                    { label: '→', color: 'text-gray-400 border-transparent bg-transparent' },
                    { label: 'Driver Assigned', color: 'bg-purple-100 text-purple-800 border-purple-300' },
                    { label: '→', color: 'text-gray-400 border-transparent bg-transparent' },
                    { label: 'Expenses Added', color: 'bg-orange-100 text-orange-800 border-orange-300' },
                    { label: '→', color: 'text-gray-400 border-transparent bg-transparent' },
                    { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                  ].map((s, i) => (
                    <span key={i} className={`border rounded-full px-3 py-1 text-sm font-semibold ${s.color}`}>
                      {s.label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">* A booking can be marked <span className="font-semibold text-rose-600">Cancelled</span> at any stage.</p>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════
              TAB: FUEL CALCULATION
          ══════════════════════════════════════ */}
          {activeTab === 'fuel' && (
            <motion.div {...fadeUp(0.1)} className="space-y-6">
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/40 shadow-lg p-6 md:p-8">
                <SectionHeader icon="⛽" title="Fuel Calculation" subtitle="How total fuel cost is estimated from KM readings" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <FormulaBox color="blue" label="Step 1 — Distance"
                    formula="Distance (km) = End KM − Start KM"
                    result="e.g. 10350 − 10000 = 350 km" />
                  <FormulaBox color="amber" label="Step 2 — Fuel Consumed"
                    formula="Liters = Distance ÷ Vehicle Average (km/L)"
                    result="e.g. 350 ÷ 12 = 29.17 L" />
                  <FormulaBox color="rose" label="Step 3 — Fuel Cost"
                    formula="Fuel Cost (₹) = Liters × Fuel Rate (₹/L)"
                    result="e.g. 29.17 × ₹105 = ₹3,062.85" />
                  <FormulaBox color="green" label="Key Input — Vehicle Average"
                    formula="Set per vehicle in Fleet Management (km per litre)"
                    result="Default: 12 km/L if not set" />
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">
                  <h4 className="font-bold text-blue-800 mb-3">📌 Important Notes</h4>
                  <ul className="space-y-2 text-sm text-blue-900">
                    <li className="flex items-start gap-2"><span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" /> Vehicle Average is set when you <strong>add a vehicle</strong> in Fleet Management → it auto-populates in the booking.</li>
                    <li className="flex items-start gap-2"><span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" /> Fuel Rate is entered manually during the <strong>Expenses step</strong> to match current petrol/diesel prices.</li>
                    <li className="flex items-start gap-2"><span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" /> Fuel cost is <strong>auto-calculated</strong> when End KM or Fuel Rate is entered — no manual entry needed.</li>
                    <li className="flex items-start gap-2"><span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" /> You can <strong>override</strong> the fuel cost field if actual fuel receipt differs from the calculated value.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/40 shadow-lg p-6">
                <SectionHeader icon="🚗" title="Vehicle Average Guide" subtitle="Typical mileage values for common vehicles" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 to-blue-50">
                        <th className="py-3 px-4 text-left font-semibold text-gray-700 rounded-l-xl">Vehicle</th>
                        <th className="py-3 px-4 text-left font-semibold text-gray-700">Type</th>
                        <th className="py-3 px-4 text-left font-semibold text-gray-700">Avg Mileage</th>
                        <th className="py-3 px-4 text-left font-semibold text-gray-700 rounded-r-xl">Seats</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        ['Innova Crysta', 'SUV', '10–11 km/L', '7'],
                        ['Toyota Fortuner', 'SUV', '9–10 km/L', '7'],
                        ['Maruti Ertiga', 'MPV', '15–17 km/L', '7'],
                        ['Maruti Swift', 'Sedan', '18–20 km/L', '4'],
                        ['Mahindra Scorpio', 'SUV', '10–12 km/L', '7'],
                        ['Tata Nexon', 'Compact SUV', '17–19 km/L', '5'],
                        ['Tempo Traveller', 'Van', '7–9 km/L', '12+'],
                        ['Mini Bus', 'Bus', '4–6 km/L', '25+'],
                      ].map(([v, t, m, s]) => (
                        <tr key={v} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">{v}</td>
                          <td className="py-3 px-4 text-gray-600">{t}</td>
                          <td className="py-3 px-4 text-blue-700 font-semibold">{m}</td>
                          <td className="py-3 px-4 text-gray-600">{s}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════
              TAB: PROFIT & LOSS
          ══════════════════════════════════════ */}
          {activeTab === 'profit' && (
            <motion.div {...fadeUp(0.1)} className="space-y-6">
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/40 shadow-lg p-6 md:p-8">
                <SectionHeader icon="📈" title="Profit & Loss Calculation" subtitle="How net profit and profit margin are computed" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <FormulaBox color="rose" label="Total Expenses"
                    formula="Total Expenses = Fuel Cost + Driver Payment + Toll + Other Expenses"
                    result="Sum of all trip costs" />
                  <FormulaBox color="green" label="Net Profit"
                    formula="Net Profit = Booking Amount − Total Expenses"
                    result="Core profitability metric" />
                  <FormulaBox color="purple" label="Profit Margin %"
                    formula="Margin (%) = (Net Profit ÷ Booking Amount) × 100"
                    result="% of revenue retained as profit" />
                  <FormulaBox color="amber" label="Outstanding Amount"
                    formula="Outstanding = (Booking Amount − Advance) − Total Expenses"
                    result="Amount still to be collected/adjusted" />
                </div>

                {/* Profit interpretation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                    <div className="text-3xl mb-2">📗</div>
                    <p className="font-bold text-emerald-700">Profit &gt; 0</p>
                    <p className="text-sm text-emerald-600 mt-1">Trip was profitable. Revenue exceeded all expenses.</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                    <div className="text-3xl mb-2">📒</div>
                    <p className="font-bold text-amber-700">Profit = 0</p>
                    <p className="text-sm text-amber-600 mt-1">Break-even. Revenue exactly covered expenses.</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-center">
                    <div className="text-3xl mb-2">📕</div>
                    <p className="font-bold text-rose-700">Profit &lt; 0</p>
                    <p className="text-sm text-rose-600 mt-1">Loss. Expenses exceeded booking revenue.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/40 shadow-lg p-6">
                <SectionHeader icon="🧾" title="Expense Components" subtitle="What goes into Total Expenses" />
                <div className="space-y-3">
                  {[
                    { name: 'Fuel Cost', desc: 'Auto-calculated from KM + average + fuel rate', icon: '⛽', color: 'bg-blue-50 border-blue-200' },
                    { name: 'Driver Payment', desc: 'Daily allowance or per-trip payment to driver', icon: '👨‍✈️', color: 'bg-purple-50 border-purple-200' },
                    { name: 'Toll Charges', desc: 'Highway toll taxes paid during the trip', icon: '🛣️', color: 'bg-amber-50 border-amber-200' },
                    { name: 'Other Expenses', desc: 'Parking, food, maintenance, miscellaneous', icon: '📦', color: 'bg-gray-50 border-gray-200' },
                  ].map(e => (
                    <div key={e.name} className={`flex items-center gap-4 rounded-xl border ${e.color} p-4`}>
                      <span className="text-2xl shrink-0">{e.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-800">{e.name}</p>
                        <p className="text-sm text-gray-500">{e.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════
              TAB: ADVANCE & BALANCE
          ══════════════════════════════════════ */}
          {activeTab === 'advance' && (
            <motion.div {...fadeUp(0.1)} className="space-y-6">
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/40 shadow-lg p-6 md:p-8">
                <SectionHeader icon="💳" title="Advance & Balance Calculation" subtitle="How partial payments and outstanding are tracked" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <FormulaBox color="blue" label="Balance at Booking"
                    formula="Balance = Booking Amount − Advance Paid"
                    result="Amount customer still owes" />
                  <FormulaBox color="amber" label="Outstanding After Trip"
                    formula="Outstanding = Balance − Total Expenses"
                    result="Final settlement amount" />
                </div>

                {/* Scenarios */}
                <h3 className="font-bold text-gray-800 mb-4">Outstanding — 3 Scenarios</h3>
                <div className="space-y-3">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="font-bold text-emerald-800">Outstanding &gt; 0 → Customer still owes money</p>
                        <p className="text-sm text-emerald-700 mt-1">
                          Example: Amount ₹5000, Advance ₹2000, Expenses ₹2500<br />
                          <span className="font-mono">Outstanding = (5000 − 2000) − 2500 = <strong>+₹500</strong></span>
                          <br />→ Collect ₹500 from customer
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🔵</span>
                      <div>
                        <p className="font-bold text-blue-800">Outstanding = 0 → Fully settled</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Example: Amount ₹5000, Advance ₹2000, Expenses ₹3000<br />
                          <span className="font-mono">Outstanding = (5000 − 2000) − 3000 = <strong>₹0</strong></span>
                          <br />→ No further collection needed
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🔴</span>
                      <div>
                        <p className="font-bold text-rose-800">Outstanding &lt; 0 → Refund due to customer</p>
                        <p className="text-sm text-rose-700 mt-1">
                          Example: Amount ₹5000, Advance ₹2000, Expenses ₹3500<br />
                          <span className="font-mono">Outstanding = (5000 − 2000) − 3500 = <strong>−₹500</strong></span>
                          <br />→ Company owes ₹500 refund to customer
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-sm text-slate-700">
                    <strong>💡 Key difference:</strong> <br />
                    <span className="font-mono">Net Profit</span> measures business profitability (Revenue vs Expenses).<br />
                    <span className="font-mono">Outstanding</span> measures customer payment settlement (What's left to collect/refund).
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════
              TAB: LIVE EXAMPLE
          ══════════════════════════════════════ */}
          {activeTab === 'example' && (
            <motion.div {...fadeUp(0.1)} className="space-y-6">
              {/* Inputs */}
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/40 shadow-lg p-6 md:p-8">
                <SectionHeader icon="📝" title="Live Example" subtitle="Step-by-step walkthrough with real numbers" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Booking Amount', value: fmt(ex.bookingAmount), color: 'bg-green-50 border-green-200 text-green-800' },
                    { label: 'Advance Paid', value: fmt(ex.advance), color: 'bg-blue-50 border-blue-200 text-blue-800' },
                    { label: 'Start KM', value: ex.startKM.toLocaleString(), color: 'bg-gray-50 border-gray-200 text-gray-700' },
                    { label: 'End KM', value: ex.endKM.toLocaleString(), color: 'bg-gray-50 border-gray-200 text-gray-700' },
                    { label: 'Vehicle Average', value: `${ex.vehicleAverage} km/L`, color: 'bg-purple-50 border-purple-200 text-purple-800' },
                    { label: 'Fuel Rate', value: `₹${ex.fuelRate}/L`, color: 'bg-amber-50 border-amber-200 text-amber-800' },
                    { label: 'Driver Payment', value: fmt(ex.driverPayment), color: 'bg-rose-50 border-rose-200 text-rose-800' },
                    { label: 'Toll + Other', value: fmt(ex.toll + ex.otherExpenses), color: 'bg-orange-50 border-orange-200 text-orange-800' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl border ${color} p-3 text-center`}>
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</p>
                      <p className="text-lg font-bold">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Calculation chain */}
                <h3 className="font-bold text-gray-800 mb-4">Step-by-Step Calculation</h3>
                <div className="space-y-3">
                  {[
                    { step: '1', label: 'Distance', formula: `${ex.endKM} − ${ex.startKM}`, result: `${ex.totalKM} km`, color: 'blue' },
                    { step: '2', label: 'Fuel Consumed', formula: `${ex.totalKM} ÷ ${ex.vehicleAverage}`, result: `${ex.liters} L`, color: 'amber' },
                    { step: '3', label: 'Fuel Cost', formula: `${ex.liters} L × ₹${ex.fuelRate}`, result: fmt(ex.fuelCost), color: 'rose' },
                    { step: '4', label: 'Total Expenses', formula: `Fuel ${fmt(ex.fuelCost)} + Driver ${fmt(ex.driverPayment)} + Toll ${fmt(ex.toll)} + Other ${fmt(ex.otherExpenses)}`, result: fmt(ex.totalExpenses), color: 'purple' },
                    { step: '5', label: 'Net Profit', formula: `${fmt(ex.bookingAmount)} − ${fmt(ex.totalExpenses)}`, result: fmt(ex.netProfit), color: 'green' },
                    { step: '6', label: 'Balance Due', formula: `${fmt(ex.bookingAmount)} − ${fmt(ex.advance)}`, result: fmt(ex.balance), color: 'blue' },
                    { step: '7', label: 'Outstanding', formula: `${fmt(ex.balance)} − ${fmt(ex.totalExpenses)}`, result: `${fmt(ex.outstanding)} (Customer owes)`, color: 'amber' },
                    { step: '8', label: 'Profit Margin', formula: `(${fmt(ex.netProfit)} ÷ ${fmt(ex.bookingAmount)}) × 100`, result: `${ex.margin}%`, color: 'green' },
                  ].map(({ step, label, formula, result, color }) => {
                    const chip = {
                      blue:   'bg-blue-100 text-blue-800',
                      amber:  'bg-amber-100 text-amber-800',
                      rose:   'bg-rose-100 text-rose-800',
                      purple: 'bg-purple-100 text-purple-800',
                      green:  'bg-emerald-100 text-emerald-800',
                    };
                    return (
                      <div key={step} className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${chip[color].replace('bg-', 'bg-').replace('-100', '-500').replace('text-', 'text-').replace('-800', '-50')}`}
                          style={{ background: `var(--tw-bg-opacity)` }}
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${{ blue:'bg-blue-500', amber:'bg-amber-500', rose:'bg-rose-500', purple:'bg-purple-500', green:'bg-emerald-500' }[color]}`}>
                            {step}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                          <p className="font-mono text-sm text-gray-700 mt-0.5 truncate">{formula}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${chip[color]}`}>
                          {result}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Final summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/90 backdrop-blur rounded-2xl border border-emerald-200 shadow-lg p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">Net Profit</p>
                  <p className="text-4xl font-bold text-emerald-600">{fmt(ex.netProfit)}</p>
                  <p className="text-sm text-gray-500 mt-2">Margin: {ex.margin}%</p>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-2xl border border-rose-200 shadow-lg p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-1">Total Expenses</p>
                  <p className="text-4xl font-bold text-rose-600">{fmt(ex.totalExpenses)}</p>
                  <p className="text-sm text-gray-500 mt-2">Incl. fuel {fmt(ex.fuelCost)}</p>
                </div>
                <div className="bg-white/90 backdrop-blur rounded-2xl border border-amber-200 shadow-lg p-6 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-1">Outstanding</p>
                  <p className="text-4xl font-bold text-amber-600">{fmt(ex.outstanding)}</p>
                  <p className="text-sm text-gray-500 mt-2">To collect from customer</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Footer nav ── */}
          <motion.div {...fadeUp(0.3)} className="mt-8 flex flex-wrap gap-3 justify-between items-center bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow p-4">
            <p className="text-sm text-gray-500">PARV Tour & Travels — Calculation Reference Guide</p>
            <div className="flex gap-2">
              <button onClick={() => router.push('/booking/entry')}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
                New Booking
              </button>
              <button onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition">
                Dashboard
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </TravelBackground>
  );
}
