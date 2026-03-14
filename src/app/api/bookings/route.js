export const runtime = 'nodejs';

import { ObjectId } from 'mongodb';
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
        .aggregate([{ $group: { _id: null, total: { $sum: { $toDouble: '$bookingAmount' } } } }])
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

  if (!result.value) {
    return createError('Booking not found');
  }

  return createSuccess(result.value);
}

async function applyExpenses(bookingId, payload) {
  const bookingsCol = await getBookingsCollection();

  const fuelCost = Number(payload.fuelCost) || 0;
  const toll = Number(payload.toll) || 0;
  const driverPayment = Number(payload.driverPayment) || 0;
  const otherExpenses = Number(payload.otherExpenses) || 0;
  const maintenance = Number(payload.maintenance) || 0;
  const food = Number(payload.food) || 0;
  const parking = Number(payload.parking) || 0;

  const totalExpenses = fuelCost + toll + driverPayment + otherExpenses + maintenance + food + parking;

  const booking = await bookingsCol.findOne({ bookingId });
  if (!booking) {
    return createError('Booking not found');
  }

  const bookingAmount = Number(booking.bookingAmount) || 0;
  const advance = Number(booking.advance) || 0;

  const netProfit = bookingAmount - totalExpenses;
  const outstanding = bookingAmount - advance - totalExpenses;

  const update = {
    $set: {
      startKM: payload.startKM,
      endKM: payload.endKM,
      distance: payload.distance,
      fuelRate: payload.fuelRate,
      liters: payload.liters,
      fuelCost,
      toll,
      driverPayment,
      otherExpenses,
      maintenance,
      food,
      parking,
      totalExpenses,
      netProfit,
      outstanding,
      updatedAt: new Date(),
    },
  };

  await bookingsCol.updateOne({ bookingId }, update);

  return createSuccess({
    bookingId,
    totalExpenses,
    netProfit,
    outstanding,
  });
}

async function recalculateProfit(bookingId) {
  const bookingsCol = await getBookingsCollection();
  const booking = await bookingsCol.findOne({ bookingId });

  if (!booking) {
    return createError('Booking not found');
  }

  const bookingAmount = Number(booking.bookingAmount) || 0;
  const advance = Number(booking.advance) || 0;

  const fuelCost = Number(booking.fuelCost) || 0;
  const toll = Number(booking.toll) || 0;
  const driverPayment = Number(booking.driverPayment) || 0;
  const otherExpenses = Number(booking.otherExpenses) || 0;
  const maintenance = Number(booking.maintenance) || 0;
  const food = Number(booking.food) || 0;
  const parking = Number(booking.parking) || 0;

  const totalExpenses = fuelCost + toll + driverPayment + otherExpenses + maintenance + food + parking;

  const netProfit = bookingAmount - totalExpenses;
  const outstanding = bookingAmount - advance - totalExpenses;

  await bookingsCol.updateOne(
    { bookingId },
    {
      $set: {
        totalExpenses,
        netProfit,
        outstanding,
        updatedAt: new Date(),
      },
    },
  );

  return createSuccess({
    bookingId,
    totalExpenses,
    netProfit,
    outstanding,
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...payload } = body || {};

    if (!action) {
      return Response.json(createError('action is required'), { status: 400 });
    }

    if (action === 'create') {
      const bookingsCol = await getBookingsCollection();
      const now = new Date();
      const bookingId = payload.bookingId || buildBookingId();

      const doc = {
        bookingId,
        customerName: payload.customerName || '',
        phone: payload.phone || '',
        from: payload.from || '',
        to: payload.to || '',
        vehicle: payload.vehicle || '',
        vehicleAverage: payload.vehicleAverage || '12',
        bookingAmount: payload.bookingAmount || '0',
        advance: payload.advance || '0',
        passengers: payload.passengers || '',
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

      await bookingsCol.insertOne(doc);

      return Response.json(createSuccess({ bookingId }));
    }

    if (action === 'updateBooking') {
      const bookingsCol = await getBookingsCollection();
      const { bookingId } = payload;

      if (!bookingId) {
        return Response.json(createError('bookingId is required'), { status: 400 });
      }

      const updatePayload = { ...payload };
      delete updatePayload.bookingId;

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

      if (!result.value) {
        return Response.json(createError('Booking not found'), { status: 404 });
      }

      return Response.json(createSuccess(result.value));
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
          vehicleAverage: payload.vehicleAverage || '12',
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

      return Response.json(createSuccess(result.value));
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

      return Response.json(createSuccess(result.value));
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
