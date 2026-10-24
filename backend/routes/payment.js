const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const ActiveRide = require('../models/ActiveRide');
const { protect } = require('../middleware/auth');

// Create payment intent
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await ActiveRide.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(ride.fare * 100), // paise/cents
      currency: 'bdt',
      metadata: { rideId: rideId.toString() },
    });

    await ActiveRide.findByIdAndUpdate(rideId, { stripePaymentIntentId: paymentIntent.id });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
