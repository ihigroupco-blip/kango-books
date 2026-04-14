require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const invoiceRoutes = require('./routes/invoices');
const categoryRoutes = require('./routes/categories');
const clientRoutes = require('./routes/clients');
const reportRoutes = require('./routes/reports');
const leadRoutes = require('./routes/leads');
const bookingRoutes = require('./routes/bookings');
const uploadRoutes = require('./routes/upload');
const vehicleRoutes = require('./routes/vehicles');
const tripRoutes = require('./routes/trips');
const logbookRoutes = require('./routes/logbooks');
const vehicleExpenseRoutes = require('./routes/vehicleExpenses');
const fbtReportRoutes = require('./routes/fbtReports');
const path = require('path');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/logbooks', logbookRoutes);
app.use('/api/vehicle-expenses', vehicleExpenseRoutes);
app.use('/api/fbt-reports', fbtReportRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
