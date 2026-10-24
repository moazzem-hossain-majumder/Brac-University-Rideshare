const mongoose = require('mongoose');

const rideOfferSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'RideRequest', required: true },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fare: { type: Number, required: true },
  note: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('RideOffer', rideOfferSchema);
