const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');

// Get my vehicles
router.get('/mine', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ rider: req.user.id });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add vehicle
router.post('/', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.create({ ...req.body, rider: req.user.id });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
