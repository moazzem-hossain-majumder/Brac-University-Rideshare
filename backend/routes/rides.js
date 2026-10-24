const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'Available' }).populate('rider', 'name phone').populate('vehicle');
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const rides = await Ride.find().populate('rider', 'name phone').populate('vehicle');
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/mine', protect, async (req, res) => {
  try {
    const rides = await Ride.find({ rider: req.user.id }).populate('vehicle');
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const ride = await Ride.create({ ...req.body, rider: req.user.id });
    res.status(201).json(ride);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/status', protect, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
