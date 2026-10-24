const mongoose = require('mongoose');

const rideRequestSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startLocation: { type: String, required: true },
  endLocation: { type: String, required: true },
  scheduledTime: { type: Date, required: true },
  seatsNeeded: { type: Number, default: 1 },
  status: { type: String, enum: ['Open', 'Accepted', 'Cancelled'], default: 'Open' },
  acceptedOffer: { type: mongoose.Schema.Types.ObjectId, ref: 'RideOffer' },
}, { timestamps: true });

module.exports = mongoose.model('RideRequest', rideRequestSchema);
