const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  startLocation: { type: String, required: true },
  endLocation: { type: String, required: true },
  rideDateTime: { type: Date, required: true },
  fare: { type: Number, required: true },
  seats: { type: Number, default: 3 },
  status: { type: String, enum: ['Available', 'Booked', 'Completed'], default: 'Available' },
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
