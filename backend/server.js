require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const profileRouter = require('./routes/profile');
const rideRequestsRouter = require('./routes/rideRequests');
const rideOffersRouter = require('./routes/rideOffers');
const activeRidesRouter = require('./routes/activeRides');
const paymentRouter = require('./routes/payment');
const feedbackRouter = require('./routes/feedback');
const notificationsRouter = require('./routes/notifications');
const chatRouter = require('./routes/chat');

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/profile', profileRouter);
app.use('/api/ride-requests', rideRequestsRouter);
app.use('/api/ride-offers', rideOffersRouter);
app.use('/api/active-rides', activeRidesRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/chat', chatRouter);

app.get('/', (req, res) => res.json({ message: 'BRACU Rideshare API running' }));

// Socket.io
io.on('connection', (socket) => {
  // Join personal room for notifications
  socket.on('join_user', (userId) => socket.join('user_' + userId));

  // Join ride chat room
  socket.on('join_ride', (rideId) => socket.join('ride_' + rideId));

  // Real-time chat message
  socket.on('send_message', (data) => {
    io.to('ride_' + data.rideId).emit('receive_message', data);
  });

  // Rider sends offer - broadcast to passenger
  socket.on('new_offer', (data) => {
    io.to('user_' + data.passengerId).emit('offer_received', data);
  });

  // Offer accepted - notify rider
  socket.on('offer_accepted', (data) => {
    io.to('user_' + data.riderId).emit('ride_confirmed', data);
  });

  // Rider marks arrived
  socket.on('rider_arrived', (data) => {
    io.to('user_' + data.passengerId).emit('show_payment', data);
  });
});

// Expose io for use in routes if needed
app.set('io', io);

async function seedSuperAdmin() {
  const User = require('./models/User');
  const existing = await User.findOne({ email: 'admin@gmail.com', userType: 'admin' });
  if (!existing) {
    const hashed = await bcrypt.hash('admin1234', 10);
    await User.create({ name: 'Super Admin', email: 'admin@gmail.com', phone: '01700000000', password: hashed, userType: 'admin', status: 'Approved' });
    console.log('Super admin seeded');
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedSuperAdmin();
    server.listen(process.env.PORT, () => console.log('Server running on port ' + process.env.PORT));
  })
  .catch(err => console.error('MongoDB connection error:', err));
