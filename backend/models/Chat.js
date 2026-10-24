const mongoose = require('mongoose');
const chatSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String },
  message: { type: String, required: true },
}, { timestamps: true });
module.exports = mongoose.model('Chat', chatSchema);
