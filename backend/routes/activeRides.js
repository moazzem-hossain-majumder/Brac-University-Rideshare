const express = require('express');
const router = express.Router();
const ActiveRide = require('../models/ActiveRide');
const { protect } = require('../middleware/auth');

// Get my active ride (either as rider or passenger)
router.get('/mine', protect, async (req, res) => {
  try {
    const ride = await ActiveRide.findOne({
      $or: [{ rider: req.user.id }, { passenger: req.user.id }],
      status: { $in: ['Ongoing', 'Arrived'] }
    }).populate('rider', 'name phone profilePicture')
      .populate('passenger', 'name phone profilePicture')
      .populate({ path: 'request' });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all my past rides
router.get('/history', protect, async (req, res) => {
  try {
    const rides = await ActiveRide.find({
      $or: [{ rider: req.user.id }, { passenger: req.user.id }],
      status: 'Completed'
    }).populate('rider', 'name').populate('passenger', 'name').populate('request').sort('-createdAt');
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rider marks arrived at destination
router.patch('/:id/arrived', protect, async (req, res) => {
  try {
    const ride = await ActiveRide.findOneAndUpdate(
      { _id: req.params.id, rider: req.user.id },
      { status: 'Arrived' },
      { new: true }
    );
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark completed after payment
router.patch('/:id/complete', protect, async (req, res) => {
  try {
    const ride = await ActiveRide.findByIdAndUpdate(
      req.params.id,
      { status: 'Completed', paymentStatus: 'Paid', paymentMethod: req.body.paymentMethod },
      { new: true }
    );
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
