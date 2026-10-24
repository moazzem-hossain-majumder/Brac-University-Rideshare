const mongoose = require('mongoose');
const feedbackSchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'ActiveRide', required: true },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  status: { type: String, enum: ['Visible', 'Hidden'], default: 'Visible' },
}, { timestamps: true });
module.exports = mongoose.model('Feedback', feedbackSchema);
