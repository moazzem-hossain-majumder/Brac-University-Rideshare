const express = require('express');
const router = express.Router();
const RideRequest = require('../models/RideRequest');
const { protect } = require('../middleware/auth');

// Passenger posts a ride request
router.post('/', protect, async (req, res) => {
  try {
    const { startLocation, endLocation, scheduledTime, seatsNeeded } = req.body;
    const request = await RideRequest.create({
      passenger: req.user.id,
      startLocation, endLocation, scheduledTime, seatsNeeded
    });
    const populated = await request.populate('passenger', 'name profilePicture location');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all open requests (for riders to see)
router.get('/open', protect, async (req, res) => {
  try {
    const requests = await RideRequest.find({ status: 'Open' })
      .populate('passenger', 'name profilePicture location department')
      .sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my requests (passenger)
router.get('/mine', protect, async (req, res) => {
  try {
    const requests = await RideRequest.find({ passenger: req.user.id })
      .populate('acceptedOffer')
      .sort('-createdAt');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel a request
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const request = await RideRequest.findOneAndUpdate(
      { _id: req.params.id, passenger: req.user.id },
      { status: 'Cancelled' },
      { new: true }
    );
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
