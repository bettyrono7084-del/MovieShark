require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from public directory (frontend)
app.use(express.static(path.join(__dirname, '../../')));

// Routes
const moviesRouter = require('./routes/movies');
const adminRouter = require('./routes/admin');

app.use('/api/movies', moviesRouter);
app.use('/api/admin', adminRouter);

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../index.html'));
});

// Serve admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../../admin.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
async function start() {
  try {
    await initDb();
    console.log('✓ Database initialized');

    app.listen(PORT, () => {
      console.log(`\n🦈 MovieShark Backend Running`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🎬 Frontend: http://localhost:${PORT}`);
      console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
