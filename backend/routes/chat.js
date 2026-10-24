const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { protect } = require('../middleware/auth');

// Get messages for a booking
router.get('/:bookingId', protect, async (req, res) => {
  try {
    const messages = await Chat.find({ bookingId: req.params.bookingId }).sort('createdAt');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save a message
router.post('/', protect, async (req, res) => {
  try {
    const msg = await Chat.create({
      bookingId: req.body.bookingId,
      sender: req.user.id,
      senderName: req.user.name,
      message: req.body.message,
    });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
