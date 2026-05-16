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
// Locally: __dirname is backend/src, so go up 2 levels to root, then public/
// Railway: __dirname is /app/src, so public is /app/public
let rootPath = path.resolve(__dirname, '../../public');
let publicPath = rootPath;

// Fallback for Railway structure
if (!fs.existsSync(path.join(rootPath, 'index.html'))) {
  publicPath = path.resolve(__dirname, '../public');
  rootPath = publicPath;
}

const indexPath = path.join(publicPath, 'index.html');
const adminPath = path.join(publicPath, 'admin.html');

console.log('\n🦈 MovieShark Backend Configuration');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Current __dirname:', __dirname);
console.log('Public folder path:', publicPath);
console.log('Index.html full path:', indexPath);
console.log('Index.html exists:', fs.existsSync(indexPath));
console.log('Admin.html exists:', fs.existsSync(adminPath));

// List actual files in public directory
try {
  const allFiles = fs.readdirSync(publicPath);
  const htmlFiles = allFiles.filter(f => f.endsWith('.html'));
  console.log('HTML files in public:', htmlFiles.length > 0 ? htmlFiles : 'NONE FOUND');
  console.log('First 10 files in public:', allFiles.slice(0, 10));
} catch (e) {
  console.log('ERROR reading public directory:', e.message);
}

console.log('Serving static files from:', publicPath);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

app.use(express.static(publicPath));

// Setup uploads directory - IMPORTANT for persistence
// Use UPLOAD_DIR env variable if set (for Railway/deployment), otherwise use local path
const uploadsPath = process.env.UPLOAD_DIR 
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✓ Created uploads directory:', uploadsPath);
}
// Serve uploaded files as static
app.use('/uploads', express.static(uploadsPath));
console.log('✓ Serving uploads from:', uploadsPath);
console.log('✓ Using UPLOAD_DIR:', process.env.UPLOAD_DIR || '(not set, using local path)\n');

// Routes
const moviesRouter = require('./routes/movies');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const songsRouter = require('./routes/songs');

app.use('/api/movies', moviesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/songs', songsRouter);

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
