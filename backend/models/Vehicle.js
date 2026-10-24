const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleType: { type: String, required: true },
  licensePlate: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
