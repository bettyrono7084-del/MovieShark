require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from root directory (frontend files in parent directory)
const rootPath = path.resolve(__dirname, '../../');
const indexPath = path.join(rootPath, 'index.html');
const adminPath = path.join(rootPath, 'admin.html');

console.log('🦈 MovieShark Server Setup');
console.log('Root path:', rootPath);
console.log('Index.html path:', indexPath);
console.log('Index.html exists:', fs.existsSync(indexPath));
console.log('Admin.html exists:', fs.existsSync(adminPath));
try {
  const files = fs.readdirSync(rootPath).filter(f => f.endsWith('.html'));
  console.log('HTML files in root:', files);
} catch (e) {
  console.log('Error reading root directory:', e.message);
}

console.log('Serving static files from:', rootPath);
app.use(express.static(rootPath));

// Routes
const moviesRouter = require('./routes/movies');
const adminRouter = require('./routes/admin');

app.use('/api/movies', moviesRouter);
app.use('/api/admin', adminRouter);

// Serve index.html for root path
app.get('/', (req, res) => {
  console.log('Serving index.html from:', indexPath);
  res.sendFile(indexPath, (err) => {
    if (err) console.error('Error serving index.html:', err.message);
  });
});

// Serve admin.html
app.get('/admin', (req, res) => {
  console.log('Serving admin.html from:', adminPath);
  res.sendFile(adminPath, (err) => {
    if (err) console.error('Error serving admin.html:', err.message);
  });
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
