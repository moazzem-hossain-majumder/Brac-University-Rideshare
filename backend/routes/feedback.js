const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const ActiveRide = require('../models/ActiveRide');
const { protect, adminOnly } = require('../middleware/auth');

// Submit feedback after ride
router.post('/', protect, async (req, res) => {
  try {
    const { rideId, rating, comment } = req.body;
    const existing = await Feedback.findOne({ ride: rideId, passenger: req.user.id });
    if (existing) return res.status(400).json({ message: 'Already submitted feedback for this ride' });
    const fb = await Feedback.create({ ride: rideId, passenger: req.user.id, rating, comment });
    res.status(201).json(fb);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get all feedback (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const fb = await Feedback.find()
      .populate('passenger', 'name email profilePicture')
      .populate({ path: 'ride', populate: [{ path: 'rider', select: 'name' }, { path: 'request' }] })
      .sort('-createdAt');
    res.json(fb);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Toggle visibility
router.patch('/:id/visibility', protect, adminOnly, async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    fb.status = fb.status === 'Visible' ? 'Hidden' : 'Visible';
    await fb.save();
    res.json(fb);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
