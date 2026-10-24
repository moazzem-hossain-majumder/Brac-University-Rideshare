const mongoose = require('mongoose');

const activeRideSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'RideRequest', required: true },
  offer: { type: mongoose.Schema.Types.ObjectId, ref: 'RideOffer', required: true },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fare: { type: Number, required: true },
  status: { type: String, enum: ['Ongoing', 'Arrived', 'Completed', 'Cancelled'], default: 'Ongoing' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  paymentMethod: { type: String },
  stripePaymentIntentId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ActiveRide', activeRideSchema);
