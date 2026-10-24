const express = require('express');
const router = express.Router();
const RideOffer = require('../models/RideOffer');
const RideRequest = require('../models/RideRequest');
const ActiveRide = require('../models/ActiveRide');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Rider sends an offer for a request
router.post('/', protect, async (req, res) => {
  try {
    const { requestId, fare, note } = req.body;
    const request = await RideRequest.findById(requestId);
    if (!request || request.status !== 'Open') {
      return res.status(400).json({ message: 'Request not available' });
    }
    // Prevent duplicate offer from same rider
    const existing = await RideOffer.findOne({ request: requestId, rider: req.user.id });
    if (existing) return res.status(400).json({ message: 'You already sent an offer' });

    const offer = await RideOffer.create({ request: requestId, rider: req.user.id, fare, note });
    const populated = await offer.populate('rider', 'name profilePicture location department phone');

    // Notify passenger
    await Notification.create({
      receiver: request.passenger,
      message: `${req.user.name} offered Tk ${fare} for your ride request`
    });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get offers for a request (passenger sees these)
router.get('/request/:requestId', protect, async (req, res) => {
  try {
    const offers = await RideOffer.find({ request: req.params.requestId })
      .populate('rider', 'name profilePicture location department phone');
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Passenger accepts an offer → creates active ride
router.patch('/:id/accept', protect, async (req, res) => {
  try {
    const offer = await RideOffer.findById(req.params.id).populate('request');
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    const request = offer.request;
    if (request.passenger.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Mark offer accepted, reject others
    await RideOffer.updateMany({ request: request._id }, { status: 'Rejected' });
    await RideOffer.findByIdAndUpdate(offer._id, { status: 'Accepted' });
    await RideRequest.findByIdAndUpdate(request._id, { status: 'Accepted', acceptedOffer: offer._id });

    // Create active ride
    const activeRide = await ActiveRide.create({
      request: request._id,
      offer: offer._id,
      rider: offer.rider,
      passenger: req.user.id,
      fare: offer.fare,
    });

    // Notify rider
    await Notification.create({
      receiver: offer.rider,
      message: `${req.user.name} accepted your offer of Tk ${offer.fare}`
    });

    const populated = await activeRide.populate([
      { path: 'rider', select: 'name phone profilePicture' },
      { path: 'passenger', select: 'name phone profilePicture' },
      { path: 'request' }
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
