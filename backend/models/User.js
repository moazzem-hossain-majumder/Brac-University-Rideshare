const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  userType: { type: String, enum: ['admin', 'student'], required: true },
  studentId: { type: String },
  status: { type: String, enum: ['Pending', 'Approved'], default: 'Pending' },
  // Profile fields
  profilePicture: { type: String, default: '' },
  location: { type: String, default: '' },
  department: { type: String, default: '' },
  bio: { type: String, default: '' },
  profileComplete: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
