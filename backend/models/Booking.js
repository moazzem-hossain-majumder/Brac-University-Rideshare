const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Bkash', 'Nagad'] },
  amount: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
