const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const productRoutes = require('./api/productRoutes');
const orderRoutes = require('./api/orderRoutes');
const customerRoutes = require('./api/customerRoutes');
const reportRoutes = require('./api/reportRoutes');
const expenseRoutes = require('./api/expenseRoutes');
const authRoutes = require('./api/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const syncRoutes = require('./api/syncRoutes');
const inventoryRoutes = require('./api/inventoryRoutes');

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/inventory', inventoryRoutes);

const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

app.set('io', io);

// Serve Static Files (Production)
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'POS Billing System API is running' });
});

// SPA Routing: Redirect all other requests to index.html
app.use((req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Terminal connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Terminal disconnected');
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Enterprise POS is LIVE on Port ${PORT}`);
  console.log(`Local Access: http://localhost:${PORT}`);
  console.log(`Global Strategy: Serving Unified Production Build`);
});
