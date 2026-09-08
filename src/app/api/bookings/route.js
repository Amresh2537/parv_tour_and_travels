export const runtime = 'nodejs';

import { bookingTotals, DEFAULT_SETTINGS } from '@/lib/expenses';
import { getDb } from '@/lib/mongodb';

async function getBookingsCollection() {
  const db = await getDb();
  return db.collection('bookings');
}

async function getDriversCollection() {
  const db = await getDb();
  return db.collection('drivers');
}

async function getVehiclesCollection() {
  const db = await getDb();
  return db.collection('vehicles');
}

function createSuccess(data = null, extra = {}) {
  return { success: true, data, ...extra };
}

function createError(message, extra = {}) {
  return { success: false, error: message, ...extra };
}

function buildBookingId() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BKG-${datePart}-${randomPart}`;
}

async function computeStats() {
  const bookingsCol = await getBookingsCollection();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalBookings, todayBookings, thisMonthBookings, byStatus, revenueAgg, profitAgg] =
    await Promise.all([
      bookingsCol.countDocuments({}),
      bookingsCol.countDocuments({ createdAt: { $gte: startOfToday } }),
      bookingsCol.countDocuments({ createdAt: { $gte: startOfMonth } }),
      bookingsCol
        .aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ])
        .toArray(),
      bookingsCol
        .aggregate([{ $group: { _id: null, total: { $sum: { $convert: { input: { $ifNull: ['$totalRevenue', '$bookingAmount'] }, to: 'double', onError: 0, onNull: 0 } } } } }])
        .toArray(),
      bookingsCol
        .aggregate([{ $group: { _id: null, total: { $sum: { $toDouble: '$netProfit' } } } }])
        .toArray(),
    ]);

  const statusMap = byStatus.reduce((acc, cur) => {
    acc[cur._id || 'unknown'] = cur.count;
    return acc;
  }, {});

  return {
    totalBookings,
    todayBookings,
    thisMonthBookings,
    totalRevenue: revenueAgg[0]?.total || 0,
    totalProfit: profitAgg[0]?.total || 0,
    ...statusMap,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'getAll';
    const bookingId = searchParams.get('bookingId') || searchParams.get('id');

    if (action === 'getSettings') {
      const db = await getDb();
      const settings = await db.collection('settings').findOne({ key: 'fuel' });
      return Response.json(createSuccess({ ...DEFAULT_SETTINGS, ...(settings?.values || {}) }));
    }

    if (action === 'ping') {
      return Response.json(createSuccess({ message: 'MongoDB API online' }));
    }

    if (action === 'getAll') {
      const bookingsCol = await getBookingsCollection();
      const items = await bookingsCol
        .find({})
        .sort({ createdAt: -1 })
        .limit(500)
        .toArray();

      return Response.json(createSuccess(items));
    }

    if (action === 'getBooking') {
      if (!bookingId) {
        return Response.json(createError('bookingId is required'), { status: 400 });
      }

      const bookingsCol = await getBookingsCollection();
      const booking = await bookingsCol.findOne({ bookingId });

      if (!booking) {
        return Response.json(createError('Booking not found'), { status: 404 });
      }

      return Response.json(createSuccess(booking));
    }

    if (action === 'getStats') {
      const stats = await computeStats();
      return Response.json(createSuccess(stats));
    }

    if (action === 'getRecentActivity') {
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const bookingsCol = await getBookingsCollection();
      const items = await bookingsCol
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      return Response.json(createSuccess(items));
    }

    if (action === 'searchBookings') {
      const query = searchParams.get('q') || '';
      const bookingsCol = await getBookingsCollection();

      if (!query) {
        const items = await bookingsCol.find({}).sort({ createdAt: -1 }).limit(200).toArray();
        return Response.json(createSuccess(items));
      }

      const regex = new RegExp(query, 'i');
      const items = await bookingsCol
        .find({
          $or: [
            { bookingId: regex },
            { customerName: regex },
            { phone: regex },
            { from: regex },
            { to: regex },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();

      return Response.json(createSuccess(items));
    }

    if (action === 'getDrivers') {
      const driversCol = await getDriversCollection();
      const items = await driversCol.find({}).sort({ name: 1 }).toArray();
      return Response.json(createSuccess(items));
    }

    if (action === 'getVehicles' || action === 'getAvailableVehicles') {
      const vehiclesCol = await getVehiclesCollection();
      const filter = action === 'getAvailableVehicles' ? { status: 'Available' } : {};
      const items = await vehiclesCol.find(filter).sort({ type: 1 }).toArray();
      return Response.json(createSuccess(items));
    }

    return Response.json(createError(`Unknown action: ${action}`), { status: 400 });
  } catch (error) {
    console.error('[BOOKINGS_API][GET] Error:', error);
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 },
    );
  }
}

async function updateBookingStatus(bookingId, status, reason) {
  const bookingsCol = await getBookingsCollection();
  const now = new Date();

  const update = {
    $set: {
      status,
      updatedAt: now,
      statusChangeDate: now.toISOString(),
      statusChangedBy: 'system',
    },
    $push: {
      statusHistory: {
        status,
        reason: reason || '',
        date: now.toISOString(),
      },
    },
  };

  const result = await bookingsCol.findOneAndUpdate(
    { bookingId },
    update,
    { returnDocument: 'after' },
  );

  if (!result) {
    return createError('Booking not found');
  }

  if (status === 'completed' || status === 'cancelled') {
    const drivers = await getDriversCollection();
    const vehicles = await getVehiclesCollection();
    await drivers.updateMany({ assignedBookingId: bookingId }, { $set: { status: 'Available', assignedVehicle: '', assignedBookingId: '' } });
    await vehicles.updateMany({ assignedBookingId: bookingId }, { $set: { status: 'Available', assignedDriver: '', assignedBookingId: '' } });
  }

  return createSuccess(result);
}

const expenseFields = ['vehicleAverage', 'customerAverage', 'customerAcAverage', 'acEnabled', 'fuelCalculationVersion',
  'fuelBillingMode', 'distanceMode', 'tripDistance', 'fuelPaidBy', 'tollPaidBy', 'startKM', 'endKM',
  'tollCalculationVersion', 'tollTripCost', 'tollTrips', 'fuelRate', 'liters', 'fuelCost', 'toll', 'driverPayment', 'otherExpenses', 'maintenance', 'food', 'parking'];

async function applyExpenses(bookingId, payload) {
  const col = await getBookingsCollection();
  const booking = await col.findOne({ bookingId });
  if (!booking) return createError('Booking not found');
  const changes = Object.fromEntries(expenseFields.filter(key => payload[key] !== undefined).map(key => [key, payload[key]]));
  const totals = bookingTotals({ ...booking, ...changes });
  await col.updateOne({ bookingId }, { $set: { ...changes, ...totals, updatedAt: new Date() } });
  return createSuccess({ bookingId, ...totals });
}

async function recalculateProfit(bookingId) {
  const col = await getBookingsCollection();
  const booking = await col.findOne({ bookingId });
  if (!booking) return createError('Booking not found');
  const totals = bookingTotals(booking);
  await col.updateOne({ bookingId }, { $set: { ...totals, updatedAt: new Date() } });
  return createSuccess({ bookingId, ...totals });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...payload } = body || {};

    if (!action) {
      return Response.json(createError('action is required'), { status: 400 });
    }

    if (action === 'saveSettings') {
      const values = {};
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        const value = Number(payload[key]);
        if (!Number.isFinite(value) || value <= 0) return Response.json(createError('Settings must be positive numbers'), { status: 400 });
        values[key] = value;
      }
      const db = await getDb();
      await db.collection('settings').updateOne({ key: 'fuel' }, { $set: { values, updatedAt: new Date() } }, { upsert: true });
      return Response.json(createSuccess(values));
    }

    if (action === 'create') {
      const bookingsCol = await getBookingsCollection();
      const now = new Date();
      const bookingId = payload.bookingId || buildBookingId();

      const doc = {
        bookingId,
        fuelCalculationVersion: payload.fuelCalculationVersion || 1,
        fuelBillingMode: payload.fuelBillingMode || 'included',
        customerAverage: payload.customerAverage ?? DEFAULT_SETTINGS.customerAverage,
        customerAcAverage: payload.customerAcAverage ?? DEFAULT_SETTINGS.customerAcAverage,
        fuelRate: payload.fuelRate ?? DEFAULT_SETTINGS.fuelRate,
        acEnabled: payload.acEnabled === true,
        driverName: payload.driverName || '',
        driverPhone: payload.driverPhone || '',
        fuelPaidBy: payload.fuelPaidBy || 'company',
        tollPaidBy: payload.tollPaidBy || 'company',
        tollCalculationVersion: payload.tollCalculationVersion || 1,
        tollTripCost: payload.tollTripCost ?? 15,
        tollTrips: payload.tollTrips ?? 0,
        toll: payload.toll ?? 0,
        customerName: payload.customerName || '',
        phone: payload.phone || '',
        from: payload.from || '',
        to: payload.to || '',
        vehicleId: payload.vehicleId || '',
        driverId: payload.driverId || '',
        vehicle: payload.vehicle || '',
        vehicleAverage: payload.vehicleAverage || DEFAULT_SETTINGS.vehicleAverage,
        bookingAmount: payload.bookingAmount || '0',
        advance: payload.advance || '0',
        passengers: payload.passengers || 4,
        tripType: payload.tripType || 'one-way',
        bookingDate: payload.bookingDate || now.toISOString(),
        notes: payload.notes || '',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        statusHistory: [
          {
            status: 'pending',
            date: now.toISOString(),
            reason: 'Booking created',
          },
        ],
      };

      Object.assign(doc, bookingTotals(doc));
      await bookingsCol.insertOne(doc);

      return Response.json(createSuccess({ bookingId }));
    }

    if (action === 'updateBooking') {
      const bookingsCol = await getBookingsCollection();
      const { bookingId } = payload;

      if (!bookingId) {
        return Response.json(createError('bookingId is required'), { status: 400 });
      }

      const existing = await bookingsCol.findOne({ bookingId });
      if (!existing) return Response.json(createError('Booking not found'), { status: 404 });
      const merged = { ...existing, ...payload };
      const totals = bookingTotals(merged);
      const updatePayload = { ...payload, ...totals };
      delete updatePayload.bookingId;
      delete updatePayload._id;

      if (updatePayload.bookingDate && typeof updatePayload.bookingDate === 'string') {
        updatePayload.bookingDate = updatePayload.bookingDate;
      }

      const result = await bookingsCol.findOneAndUpdate(
        { bookingId },
        {
          $set: {
            ...updatePayload,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      if (!result) {
        return Response.json(createError('Booking not found'), { status: 404 });
      }

      return Response.json(createSuccess(result));
    }

    if (action === 'confirm') {
      const { bookingId } = payload;
      if (!bookingId) {
        return Response.json(createError('bookingId is required'), { status: 400 });
      }
      const res = await updateBookingStatus(bookingId, 'confirmed', 'Confirmed from dashboard');
      return Response.json(res, { status: res.success ? 200 : 400 });
    }

    if (action === 'updateStatus') {
      const { bookingId, status, reason } = payload;
      if (!bookingId || !status) {
        return Response.json(createError('bookingId and status are required'), { status: 400 });
      }
      const res = await updateBookingStatus(bookingId, status, reason);
      return Response.json(res, { status: res.success ? 200 : 400 });
    }

    if (action === 'cancelBooking') {
      const { bookingId, reason } = payload;
      if (!bookingId) {
        return Response.json(createError('bookingId is required'), { status: 400 });
      }
      const res = await updateBookingStatus(bookingId, 'cancelled', reason || 'Cancelled');
      return Response.json(res, { status: res.success ? 200 : 400 });
    }

    if (action === 'addDriver') {
      const { bookingId } = payload;
      if (!bookingId) {
        return Response.json(createError('bookingId is required'), { status: 400 });
      }

      const bookingsCol = await getBookingsCollection();
      const update = {
        $set: {
          driverId: payload.driverId || '',
          driverName: payload.driverName || '',
          driverPhone: payload.driverPhone || '',
          vehicleId: payload.vehicleId || '',
          vehicleType: payload.vehicleType || '',
          ...(payload.vehicle !== undefined ? { vehicle: payload.vehicle } : {}),
          ...(payload.customerAverage !== undefined ? { customerAverage: payload.customerAverage } : {}),
          ...(payload.customerAcAverage !== undefined ? { customerAcAverage: payload.customerAcAverage } : {}),
          vehicleAverage: payload.vehicleAverage ?? '',
          startKM: payload.startKM || '',
          updatedAt: new Date(),
        },
      };

      const result = await bookingsCol.updateOne({ bookingId }, update);
      if (!result.matchedCount) {
        return Response.json(createError('Booking not found'), { status: 404 });
      }

      // Also mark status as driver_assigned
      await updateBookingStatus(bookingId, 'driver_assigned', 'Driver assigned');
      if (payload.driverId) {
        const drivers = await getDriversCollection();
        await drivers.updateOne({ driverId: payload.driverId }, { $set: { status: 'On Trip', assignedVehicle: payload.vehicleId || '', assignedBookingId: bookingId } });
      }
      if (payload.vehicleId) {
        const vehicles = await getVehiclesCollection();
        await vehicles.updateOne({ vehicleId: payload.vehicleId }, { $set: { status: 'On Trip', assignedDriver: payload.driverId || '', assignedBookingId: bookingId } });
      }

      return Response.json(createSuccess({ bookingId }));
    }

    if (action === 'addExpenses') {
      const { bookingId } = payload;
      if (!bookingId) {
        return Response.json(createError('bookingId is required'), { status: 400 });
      }

      const res = await applyExpenses(bookingId, payload);
      return Response.json(res, { status: res.success ? 200 : 400 });
    }

    if (action === 'calculate') {
      const { bookingId } = payload;
      if (!bookingId) {
        return Response.json(createError('bookingId is required'), { status: 400 });
      }

      const res = await recalculateProfit(bookingId);
      return Response.json(res, { status: res.success ? 200 : 400 });
    }

    if (action === 'addDriverRecord') {
      const driversCol = await getDriversCollection();
      const now = new Date();
      const driverId = payload.driverId || `DRV-${now.getTime().toString(36).toUpperCase()}`;

      await driversCol.insertOne({
        ...payload,
        driverId,
        createdAt: now,
        updatedAt: now,
      });

      return Response.json(createSuccess({ driverId }));
    }

    if (action === 'updateDriver') {
      const driversCol = await getDriversCollection();

      if (!payload.driverId) {
        return Response.json(createError('driverId is required'), { status: 400 });
      }

      const updatePayload = { ...payload };
      delete updatePayload.action;

      const result = await driversCol.findOneAndUpdate(
        { driverId: payload.driverId },
        {
          $set: {
            ...updatePayload,
            updatedAt: new Date(),
          },
        },
        { upsert: false, returnDocument: 'after' },
      );

      return Response.json(createSuccess(result));
    }

    if (action === 'deleteDriver') {
      const driversCol = await getDriversCollection();
      if (!payload.driverId) {
        return Response.json(createError('driverId is required'), { status: 400 });
      }

      await driversCol.deleteOne({ driverId: payload.driverId });
      return Response.json(createSuccess({ driverId: payload.driverId }));
    }

    if (action === 'addVehicle' || action === 'updateVehicle') {
      const vehiclesCol = await getVehiclesCollection();
      const now = new Date();
      const vehicleId = payload.vehicleId || `VEH-${now.getTime().toString(36).toUpperCase()}`;

      const updatePayload = { ...payload, vehicleId };
      delete updatePayload.action;

      const result = await vehiclesCol.findOneAndUpdate(
        { vehicleId },
        {
          $set: {
            ...updatePayload,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true, returnDocument: 'after' },
      );

      return Response.json(createSuccess(result));
    }

    if (action === 'deleteVehicle') {
      const vehiclesCol = await getVehiclesCollection();
      if (!payload.vehicleId) {
        return Response.json(createError('vehicleId is required'), { status: 400 });
      }

      await vehiclesCol.deleteOne({ vehicleId: payload.vehicleId });
      return Response.json(createSuccess({ vehicleId: payload.vehicleId }));
    }

    if (action === 'getStatusHistory') {
      const { bookingId } = payload;
      if (!bookingId) {
        return Response.json(createError('bookingId is required'), { status: 400 });
      }

      const bookingsCol = await getBookingsCollection();
      const booking = await bookingsCol.findOne(
        { bookingId },
        { projection: { statusHistory: 1, _id: 0 } },
      );

      return Response.json(createSuccess(booking?.statusHistory || []));
    }

    return Response.json(createError(`Unknown action: ${action}`), { status: 400 });
  } catch (error) {
    console.error('[BOOKINGS_API][POST] Error:', error);
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
