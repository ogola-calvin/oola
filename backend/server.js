require('dotenv').config();
const express = require('express');
const cors = require('cors');

const patientRoutes = require('./routes/patients');
const vitalRoutes = require('./routes/vitals');
const visitRoutes = require('./routes/visits');
const { fail } = require('./utils/response');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple request log - handy while testing with Postman
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/patients', patientRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/visits', visitRoutes);

// 404 handler
app.use((req, res) => fail(res, 'Route not found', 404));

// Central error handler (catches anything thrown/rejected and not
// already handled inside a controller's try/catch)
app.use((err, req, res, next) => {
  console.error(err);
  return fail(res, 'Internal server error', 500);
});

const PORT = process.env.PORT || 8181;
app.listen(PORT, () => {
  console.log(`Patient Management API running at http://localhost:${PORT}/api`);
});
