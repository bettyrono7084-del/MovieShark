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

// Get root path
// Locally: __dirname is backend/src, so go up 2 levels to root
// Railway: __dirname is /app/src, so go up 1 level to /app
// Use __dirname/../.. first, fallback to __dirname/.. if files not found
let rootPath = path.resolve(__dirname, '../../');
if (!fs.existsSync(path.join(rootPath, 'index.html'))) {
  rootPath = path.resolve(__dirname, '../');
}
const indexPath = path.join(rootPath, 'index.html');
const adminPath = path.join(rootPath, 'admin.html');

console.log('\n🦈 MovieShark Backend Configuration');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Current __dirname:', __dirname);
console.log('Calculated rootPath:', rootPath);
console.log('Index.html full path:', indexPath);
console.log('Index.html exists:', fs.existsSync(indexPath));
console.log('Admin.html exists:', fs.existsSync(adminPath));

// List actual files in root directory
try {
  const allFiles = fs.readdirSync(rootPath);
  const htmlFiles = allFiles.filter(f => f.endsWith('.html'));
  console.log('HTML files in root:', htmlFiles.length > 0 ? htmlFiles : 'NONE FOUND');
  console.log('First 10 files in root:', allFiles.slice(0, 10));
} catch (e) {
  console.log('ERROR reading root directory:', e.message);
}

console.log('Serving static files from:', rootPath);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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
