'use client';

import { useState, useEffect } from 'react';
import { bookingApi } from '@/lib/api';
import { TravelBackground } from '@/components/TravelBackground';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export default function ReportsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(true); // Changed to true by default
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [searchVehicle, setSearchVehicle] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTrips: 0,
    pendingTrips: 0,
    confirmedTrips: 0,
    driverAssignedTrips: 0,
    expensesAddedTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    vehicleWise: {},
    driverWise: {},
    dailyStats: [],
    monthlyStats: [],
    topRoutes: [],
    filteredData: []
  });

  useEffect(() => {
    fetchBookings();
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const result = await bookingApi.getVehicles();
      if (result.success) {
        setVehicles(result.data || []);
      } else {
        console.error('Error fetching vehicles:', result.error);
        setVehicles([]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const result = await bookingApi.getAll();
      if (result.success) {
        setBookings(result.data);
        calculateReportData(result.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleOptions = () => {
    const options = [
      { value: 'all', label: 'All Vehicles', number: '', type: 'all' }
    ];

    // Add vehicles from database
    vehicles.forEach(vehicle => {
      if (vehicle.type) {
        options.push({
          value: vehicle.type,
          label: `${vehicle.type} ${vehicle.number ? `(${vehicle.number})` : ''}`,
          number: vehicle.number || '',
          type: vehicle.type
        });
      }
    });

    // Add any vehicles from bookings that might not be in database
    const bookingVehicles = new Set();
    bookings.forEach(b => b.vehicle && bookingVehicles.add(b.vehicle));
    
    bookingVehicles.forEach(vehicle => {
      if (!options.some(opt => opt.value === vehicle)) {
        options.push({
          value: vehicle,
          label: vehicle,
          number: '',
          type: vehicle
        });
      }
    });

    return options;
  };

  const getFilteredVehicleOptions = () => {
    const options = getVehicleOptions();
    if (!searchVehicle) return options;
    
    return options.filter(option => 
      option.label.toLowerCase().includes(searchVehicle.toLowerCase()) ||
      option.value.toLowerCase().includes(searchVehicle.toLowerCase()) ||
      (option.number && option.number.toLowerCase().includes(searchVehicle.toLowerCase()))
    );
  };

  const getDriverNames = () => {
    const drivers = new Set();
    bookings.forEach(b => b.driverName && b.driverName.trim() !== '' && drivers.add(b.driverName));
    return ['all', ...Array.from(drivers)].filter(Boolean);
  };

  const calculateReportData = (data) => {
    // Apply filters
    const filteredData = data.filter(booking => {
      const bookingDate = new Date(booking.date || booking.createdAt);
      const withinDateRange = bookingDate >= startDate && bookingDate <= endDate;
      const matchesVehicle = vehicleFilter === 'all' || booking.vehicle === vehicleFilter;
      const matchesDriver = driverFilter === 'all' || booking.driverName === driverFilter;
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      return withinDateRange && matchesVehicle && matchesDriver && matchesStatus;
    });

    // Status counts
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      driver_assigned: 0,
      expenses_added: 0,
      completed: 0,
      cancelled: 0
    };

    filteredData.forEach(booking => {
      if (booking.status && statusCounts[booking.status] !== undefined) {
        statusCounts[booking.status]++;
      }
    });

    // Completed bookings for financial calculations
    const completedBookings = filteredData.filter(b => b.status === 'completed');
    
    let totalRevenue = 0;
    let totalExpenses = 0;
    let netProfit = 0;
    let vehicleWise = {};
    let driverWise = {};
    let routeMap = {};
    
    completedBookings.forEach(booking => {
      const revenue = parseFloat(booking.bookingAmount) || 0;
      const expenses = parseFloat(booking.totalExpenses) || 0;
      const profit = revenue - expenses;
      
      totalRevenue += revenue;
      totalExpenses += expenses;
      netProfit += profit;
      
      // Vehicle-wise stats
      const vehicle = booking.vehicle || 'Unknown';
      if (!vehicleWise[vehicle]) {
        vehicleWise[vehicle] = { count: 0, revenue: 0, expenses: 0, profit: 0 };
      }
      vehicleWise[vehicle].count++;
      vehicleWise[vehicle].revenue += revenue;
      vehicleWise[vehicle].expenses += expenses;
      vehicleWise[vehicle].profit += profit;
      
      // Driver-wise stats
      const driver = booking.driverName || 'Unknown';
      if (driver && driver !== '') {
        if (!driverWise[driver]) {
          driverWise[driver] = { count: 0, revenue: 0, expenses: 0, profit: 0, phone: booking.driverPhone || '' };
        }
        driverWise[driver].count++;
        driverWise[driver].revenue += revenue;
        driverWise[driver].expenses += expenses;
        driverWise[driver].profit += profit;
      }
      
      // Route analysis
      const routeKey = `${booking.from || 'Unknown'} → ${booking.to || 'Unknown'}`;
      if (!routeMap[routeKey]) {
        routeMap[routeKey] = { count: 0, avgRevenue: 0, totalRevenue: 0 };
      }
      routeMap[routeKey].count++;
      routeMap[routeKey].totalRevenue += revenue;
      routeMap[routeKey].avgRevenue = routeMap[routeKey].totalRevenue / routeMap[routeKey].count;
    });
    
    // Daily stats (last 30 days)
    const dailyStats = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayBookings = filteredData.filter(b => {
        const bookingDate = b.date || b.createdAt;
        return bookingDate && bookingDate.includes(dateStr);
      });
      
      const completedDayBookings = dayBookings.filter(b => b.status === 'completed');
      const dayRevenue = completedDayBookings.reduce((sum, b) => sum + (parseFloat(b.bookingAmount) || 0), 0);
      const dayProfit = completedDayBookings.reduce((sum, b) => sum + (parseFloat(b.bookingAmount) || 0) - (parseFloat(b.totalExpenses) || 0), 0);
      
      dailyStats.push({
        date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        fullDate: date,
        trips: dayBookings.length,
        completed: completedDayBookings.length,
        revenue: dayRevenue,
        profit: dayProfit
      });
    }
    
    // Monthly stats (last 6 months)
    const monthlyStats = [];
    const currentMonth = today.getMonth();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), currentMonth - i, 1);
      const monthEnd = new Date(today.getFullYear(), currentMonth - i + 1, 0);
      const monthName = monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      
      const monthBookings = filteredData.filter(b => {
        const bookingDate = new Date(b.date || b.createdAt);
        return bookingDate >= monthDate && bookingDate <= monthEnd;
      });
      
      const completedMonthBookings = monthBookings.filter(b => b.status === 'completed');
      const monthRevenue = completedMonthBookings.reduce((sum, b) => sum + (parseFloat(b.bookingAmount) || 0), 0);
      const monthProfit = completedMonthBookings.reduce((sum, b) => sum + (parseFloat(b.bookingAmount) || 0) - (parseFloat(b.totalExpenses) || 0), 0);
      
      monthlyStats.push({
        month: monthName,
        monthStart: monthDate,
        trips: monthBookings.length,
        completed: completedMonthBookings.length,
        revenue: monthRevenue,
        profit: monthProfit,
        avgRevenue: completedMonthBookings.length > 0 ? monthRevenue / completedMonthBookings.length : 0
      });
    }
    
    // Top routes
    const topRoutes = Object.entries(routeMap)
      .map(([route, data]) => ({
        route,
        ...data
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    setReportData({
      totalRevenue,
      totalExpenses,
      netProfit,
      totalTrips: filteredData.length,
      pendingTrips: statusCounts.pending,
      confirmedTrips: statusCounts.confirmed,
      driverAssignedTrips: statusCounts.driver_assigned,
      expensesAddedTrips: statusCounts.expenses_added,
      completedTrips: statusCounts.completed,
      cancelledTrips: statusCounts.cancelled,
      vehicleWise,
      driverWise,
      dailyStats,
      monthlyStats,
      topRoutes,
      filteredData
    });
  };

  const handleFilterApply = () => {
    calculateReportData(bookings);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    const today = new Date();
    let start = new Date();
    
    switch(range) {
      case 'today':
        start = new Date(today);
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(today.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'all':
        start = new Date(0);
        break;
      default:
        start.setMonth(today.getMonth() - 1);
    }
    
    setStartDate(start);
    setEndDate(today);
    calculateReportData(bookings);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateString = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      driver_assigned: 'bg-purple-100 text-purple-800',
      expenses_added: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const exportToCSV = () => {
    const headers = ['Booking ID', 'Date', 'Customer', 'Phone', 'From', 'To', 'Vehicle', 'Driver', 
                     'Status', 'Booking Amount', 'Advance', 'Expenses', 'Profit', 'Outstanding'];
    
    const csvData = bookings.map(booking => [
      booking.bookingId || '',
      booking.date || '',
      booking.customerName || '',
      booking.phone || '',
      booking.from || '',
      booking.to || '',
      booking.vehicle || '',
      booking.driverName || '',
      booking.status || '',
      booking.bookingAmount || 0,
      booking.advance || 0,
      booking.totalExpenses || 0,
      (parseFloat(booking.bookingAmount || 0) - parseFloat(booking.totalExpenses || 0)).toFixed(2),
      booking.outstanding || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PARV_Reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <TravelBackground variant="minimal">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
          </div>
        </div>
      </TravelBackground>
    );
  }

  return (
    <TravelBackground variant="minimal">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 md:p-8 shadow-xl border border-white/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Advanced Reports & Analytics
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {formatDateString(startDate)} to {formatDateString(endDate)} • {reportData.totalTrips} bookings analyzed
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50/50 transition-colors backdrop-blur-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters Panel - Always Visible by Default */}
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 shadow-lg border border-white/20 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📅 Date Range
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <DatePicker
                      selected={startDate}
                      onChange={date => {
                        setStartDate(date);
                        calculateReportData(bookings);
                      }}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      maxDate={endDate}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                      dateFormat="dd/MM/yyyy"
                    />
                    <span className="text-gray-500">to</span>
                    <DatePicker
                      selected={endDate}
                      onChange={date => {
                        setEndDate(date);
                        calculateReportData(bookings);
                      }}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate}
                      maxDate={new Date()}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['today', 'week', 'month', 'quarter', 'year', 'all'].map((range) => (
                      <button
                        key={range}
                        onClick={() => handleTimeRangeChange(range)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          timeRange === range
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {range === 'today' && 'Today'}
                        {range === 'week' && 'Last 7 Days'}
                        {range === 'month' && 'Last Month'}
                        {range === 'quarter' && 'Last Quarter'}
                        {range === 'year' && 'Last Year'}
                        {range === 'all' && 'All Time'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Dynamic Vehicle Filter with Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🚗 Vehicle Filter
                </label>
                
                <div className="relative">
                  <div 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm flex justify-between items-center cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => setShowVehicleDropdown(!showVehicleDropdown)}
                  >
                    <span className="flex items-center">
                      {vehicleFilter === 'all' ? (
                        <span className="text-gray-700">All Vehicles</span>
                      ) : (
                        <>
                          <span className="font-medium">{vehicleFilter}</span>
                          {getVehicleOptions().find(v => v.value === vehicleFilter)?.number && (
                            <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {getVehicleOptions().find(v => v.value === vehicleFilter)?.number}
                            </span>
                          )}
                        </>
                      )}
                    </span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {showVehicleDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {/* Search Input */}
                      <div className="p-2 border-b">
                        <input
                          type="text"
                          placeholder="Search vehicles..."
                          value={searchVehicle}
                          onChange={(e) => setSearchVehicle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                      
                      {/* Vehicle Options */}
                      <div className="py-1">
                        {loadingVehicles ? (
                          <div className="px-4 py-3 text-center text-gray-500">
                            Loading vehicles...
                          </div>
                        ) : getFilteredVehicleOptions().length > 0 ? (
                          getFilteredVehicleOptions().map(option => (
                            <div
                              key={option.value}
                              className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between ${
                                vehicleFilter === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                              }`}
                              onClick={() => {
                                setVehicleFilter(option.value);
                                setShowVehicleDropdown(false);
                                setSearchVehicle('');
                                calculateReportData(bookings);
                              }}
                            >
                              <div>
                                <div className="font-medium">{option.label}</div>
                                {option.number && (
                                  <div className="text-xs text-gray-500">{option.number}</div>
                                )}
                              </div>
                              {vehicleFilter === option.value && (
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-center text-gray-500">
                            No vehicles found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {showVehicleDropdown && (
                  <div 
                    className="fixed inset-0 z-0"
                    onClick={() => setShowVehicleDropdown(false)}
                  />
                )}
                
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {vehicleFilter === 'all' 
                      ? 'Showing all vehicles' 
                      : `Filtered by: ${vehicleFilter}`}
                  </p>
                  <button
                    onClick={() => {
                      setVehicleFilter('all');
                      calculateReportData(bookings);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              {/* Driver Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  👨‍✈️ Driver Filter
                </label>
                <select
                  value={driverFilter}
                  onChange={(e) => {
                    setDriverFilter(e.target.value);
                    calculateReportData(bookings);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                >
                  <option value="all">All Drivers</option>
                  {getDriverNames().map(driver => driver !== 'all' && (
                    <option key={driver} value={driver}>
                      {driver}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {driverFilter === 'all' 
                      ? 'Showing all drivers' 
                      : `Filtered by: ${driverFilter}`}
                  </p>
                  <button
                    onClick={() => {
                      setDriverFilter('all');
                      calculateReportData(bookings);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                📊 Status Filter
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'confirmed', 'driver_assigned', 'expenses_added', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      calculateReportData(bookings);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' && 'All Status'}
                    {status === 'pending' && '⏳ Pending'}
                    {status === 'confirmed' && '✅ Confirmed'}
                    {status === 'driver_assigned' && '👨‍✈️ Driver Assigned'}
                    {status === 'expenses_added' && '💰 Expenses Added'}
                    {status === 'completed' && '🏁 Completed'}
                    {status === 'cancelled' && '❌ Cancelled'}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">
                  {statusFilter === 'all' 
                    ? 'Showing all statuses' 
                    : `Filtered by: ${statusFilter}`}
                </p>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    calculateReportData(bookings);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {/* Reset All Filters Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Active Filters:</span>
                  <span className="ml-2">
                    {[
                      timeRange !== 'month' && `Time: ${timeRange}`,
                      vehicleFilter !== 'all' && `Vehicle: ${vehicleFilter}`,
                      driverFilter !== 'all' && `Driver: ${driverFilter}`,
                      statusFilter !== 'all' && `Status: ${statusFilter}`
                    ].filter(Boolean).join(' • ') || 'No active filters'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setTimeRange('month');
                    setStartDate(new Date(new Date().setMonth(new Date().getMonth() - 1)));
                    setEndDate(new Date());
                    setVehicleFilter('all');
                    setDriverFilter('all');
                    setStatusFilter('all');
                    calculateReportData(bookings);
                  }}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors backdrop-blur-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Reset All Filters
                </button>
              </div>
            </div>
          </motion.div>

          {/* Status Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: 'Total Bookings',
                value: reportData.totalTrips,
                icon: '📋',
                color: 'from-blue-500 to-cyan-600',
                subText: `${reportData.completedTrips} completed`
              },
              {
                title: 'Total Revenue',
                value: formatCurrency(reportData.totalRevenue),
                icon: '💰',
                color: 'from-emerald-500 to-green-600',
                subText: `${reportData.completedTrips} trips`
              },
              {
                title: 'Total Expenses',
                value: formatCurrency(reportData.totalExpenses),
                icon: '📉',
                color: 'from-rose-500 to-pink-600',
                subText: `${reportData.completedTrips} trips`
              },
              {
                title: 'Net Profit',
                value: formatCurrency(reportData.netProfit),
                icon: '📊',
                color: 'from-purple-500 to-violet-600',
                subText: `${reportData.totalRevenue > 0 ? ((reportData.netProfit / reportData.totalRevenue) * 100).toFixed(1) : 0}% margin`
              }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="backdrop-blur-lg bg-white/90 rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-2">{stat.subText}</p>
                  </div>
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { status: 'pending', count: reportData.pendingTrips, label: 'Pending' },
              { status: 'confirmed', count: reportData.confirmedTrips, label: 'Confirmed' },
              { status: 'driver_assigned', count: reportData.driverAssignedTrips, label: 'Driver Assigned' },
              { status: 'expenses_added', count: reportData.expensesAddedTrips, label: 'Expenses Added' },
              { status: 'completed', count: reportData.completedTrips, label: 'Completed' },
              { status: 'cancelled', count: reportData.cancelledTrips, label: 'Cancelled' }
            ].map((stat, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
                <div className={`px-3 py-1 rounded-lg text-xs font-medium mb-2 inline-block ${getStatusColor(stat.status)}`}>
                  {stat.label}
                </div>
                <p className="text-2xl font-bold text-gray-800">{stat.count}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {reportData.totalTrips > 0 ? `${((stat.count / reportData.totalTrips) * 100).toFixed(1)}%` : '0%'} of total
                </p>
              </div>
            ))}
          </div>

          {/* Vehicle and Driver Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Vehicle Wise Performance */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">🚗</span>
                Vehicle Performance
                {vehicleFilter !== 'all' && (
                  <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Filtered: {vehicleFilter}
                  </span>
                )}
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {Object.entries(reportData.vehicleWise).length > 0 ? (
                  Object.entries(reportData.vehicleWise)
                    .sort(([, a], [, b]) => b.revenue - a.revenue)
                    .map(([vehicle, data], index) => {
                      const profitMargin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
                      return (
                        <div key={vehicle} className="flex items-center p-3 hover:bg-gray-50/50 rounded-lg transition-colors">
                          <div className="w-32">
                            <span className="px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-lg text-sm font-medium">
                              {vehicle}
                            </span>
                          </div>
                          <div className="flex-1 ml-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">
                                <span className="font-semibold">{data.count}</span> trips
                              </span>
                              <span className="font-bold text-green-600">{formatCurrency(data.revenue)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                Profit: {formatCurrency(data.profit)}
                              </span>
                              <span className={`font-medium ${profitMargin >= 20 ? 'text-green-600' : profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {profitMargin.toFixed(1)}% margin
                              </span>
                            </div>
                            <div className="h-1.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner mt-2">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                                style={{ width: `${Math.min(100, (data.revenue / Math.max(...Object.values(reportData.vehicleWise).map(d => d.revenue)) * 100))}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No vehicle data available for selected filters
                  </div>
                )}
              </div>
            </motion.div>

            {/* Driver Wise Performance */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">👨‍✈️</span>
                Driver Performance
                {driverFilter !== 'all' && (
                  <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Filtered: {driverFilter}
                  </span>
                )}
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {Object.entries(reportData.driverWise).length > 0 ? (
                  Object.entries(reportData.driverWise)
                    .sort(([, a], [, b]) => b.revenue - a.revenue)
                    .map(([driver, data], index) => {
                      const profitMargin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
                      return (
                        <div key={driver} className="flex items-center p-3 hover:bg-gray-50/50 rounded-lg transition-colors">
                          <div className="w-40">
                            <div>
                              <span className="font-medium text-gray-800">{driver}</span>
                              {data.phone && (
                                <p className="text-xs text-gray-500 truncate">{data.phone}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 ml-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">
                                <span className="font-semibold">{data.count}</span> trips
                              </span>
                              <span className="font-bold text-green-600">{formatCurrency(data.revenue)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                                Profit: {formatCurrency(data.profit)}
                              </span>
                              <span className={`font-medium ${profitMargin >= 20 ? 'text-green-600' : profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {profitMargin.toFixed(1)}% margin
                              </span>
                            </div>
                            <div className="h-1.5 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner mt-2">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                style={{ width: `${Math.min(100, (data.revenue / Math.max(...Object.values(reportData.driverWise).map(d => d.revenue)) * 100))}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No driver data available for selected filters
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Top Routes */}
          {reportData.topRoutes.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 p-6 mb-8"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-2">📍</span>
                Top Routes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {reportData.topRoutes.map((route, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-white/50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-800 text-sm">{route.route}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {route.count} trips
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Avg. Revenue:</span>
                        <span className="text-xs font-semibold text-green-600">{formatCurrency(route.avgRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Total Revenue:</span>
                        <span className="text-xs font-semibold text-blue-600">{formatCurrency(route.totalRevenue)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Popularity</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                              style={{ width: `${Math.min(100, (route.count / reportData.topRoutes[0].count) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Detailed Report Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-lg bg-white/90 rounded-2xl shadow-xl border border-white/20 overflow-hidden"
          >
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Detailed Bookings Report</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {reportData.filteredData.length} bookings matching your criteria
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Completed
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                      Pending
                    </span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                      Cancelled
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Booking ID</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Customer</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Route</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Vehicle</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Driver</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Revenue</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Expenses</th>
                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.filteredData.map((booking) => {
                    const revenue = parseFloat(booking.bookingAmount) || 0;
                    const expenses = parseFloat(booking.totalExpenses) || 0;
                    const profit = revenue - expenses;
                    
                    return (
                      <tr key={booking.bookingId} className="border-t hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-white transition-all duration-200">
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs font-semibold text-blue-700">{booking.bookingId}</span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {booking.date ? formatDateString(booking.date) : '-'}
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium">{booking.customerName}</p>
                          <p className="text-xs text-gray-500">{booking.phone}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm">{booking.from || '-'}</p>
                          <p className="text-xs text-gray-500">→ {booking.to || '-'}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                            {booking.vehicle || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          {booking.driverName || '-'}
                          {booking.driverPhone && (
                            <p className="text-xs text-gray-500">{booking.driverPhone}</p>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status === 'pending' && '⏳'}
                            {booking.status === 'confirmed' && '✅'}
                            {booking.status === 'driver_assigned' && '👨‍✈️'}
                            {booking.status === 'expenses_added' && '💰'}
                            {booking.status === 'completed' && '🏁'}
                            {booking.status === 'cancelled' && '❌'}
                            {' '}
                            {booking.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-sm font-bold ${revenue > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            {revenue > 0 ? formatCurrency(revenue) : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-sm ${expenses > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {expenses > 0 ? formatCurrency(expenses) : '-'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-sm font-bold ${profit > 0 ? 'text-blue-600' : profit < 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                            {booking.status === 'completed' ? formatCurrency(profit) : '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {reportData.filteredData.length === 0 && (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
                    <span className="text-3xl">📊</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No bookings found
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Try adjusting your filters to see more results
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Footer Info */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Report generated on {new Date().toLocaleString('en-IN')}</p>
            <p className="mt-1">PARV Tour & Travels Analytics Dashboard</p>
          </div>
        </div>
      </div>
    </TravelBackground>
  );
}