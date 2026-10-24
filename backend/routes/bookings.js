const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');

// Get all bookings (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({ path: 'ride', populate: { path: 'rider', select: 'name' } })
      .populate('passenger', 'name email');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my bookings (passenger)
router.get('/mine', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ passenger: req.user.id })
      .populate({ path: 'ride', populate: [{ path: 'rider', select: 'name phone' }, { path: 'vehicle' }] });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Book a ride
router.post('/', protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.body.rideId);
    if (!ride || ride.status !== 'Available') return res.status(400).json({ message: 'Ride not available' });

    const booking = await Booking.create({
      ride: req.body.rideId,
      passenger: req.user.id,
      paymentMethod: req.body.paymentMethod,
      amount: ride.fare,
    });

    // notify rider
    await Notification.create({ receiver: ride.rider, message: `New booking request for your ride from ${req.user.name}` });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update booking status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
