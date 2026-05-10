const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { allAsync, getAsync, runAsync } = require('../db/init');
const { authenticateToken, generateToken } = require('../middleware/auth');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/x-msvideo', 'video/x-matroska', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5000000000 // 5GB default
  }
});

// Admin login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken(username);
    return res.json({ success: true, token, message: 'Login successful' });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

// Get admin dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalMovies = await getAsync('SELECT COUNT(*) as count FROM movies');
    const customMovies = await getAsync('SELECT COUNT(*) as count FROM movies WHERE is_seed = 0');
    const genres = await getAsync('SELECT COUNT(DISTINCT genre) as count FROM movies');
    
    res.json({
      totalMovies: totalMovies.count,
      customMovies: customMovies.count,
      seedMovies: 10,
      genres: genres.count + 9 // seed genres
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get movie library
router.get('/library', authenticateToken, async (req, res) => {
  try {
    const movies = await allAsync(`
      SELECT id, title, year, genre, rating, quality, emoji, is_seed, uploaded_at
      FROM movies
      ORDER BY uploaded_at DESC
    `);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload new movie
router.post('/upload', authenticateToken, upload.single('videoFile'), async (req, res) => {
  try {
    const { title, year, genre, description, rating, quality, badge, emoji, tags } = req.body;

    // Validation
    if (!title || !year || !genre || !description) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Missing required fields: title, year, genre, description' });
    }

    // Split tags
    const tagArray = tags ? tags.split(',').map(t => t.trim()).join(',') : '';

    // Insert movie into database
    const result = await runAsync(
      `INSERT INTO movies (title, year, genre, rating, description, quality, badge, emoji, tags, videoFile)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        parseInt(year),
        genre,
        rating ? parseFloat(rating) : null,
        description,
        quality || '1080p',
        badge || null,
        emoji || '🎬',
        tagArray,
        req.file ? req.file.filename : null
      ]
    );

    res.json({
      success: true,
      message: 'Movie uploaded successfully',
      movieId: result.lastID
    });
  } catch (err) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete movie
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const movie = await getAsync('SELECT * FROM movies WHERE id = ? AND is_seed = 0', [req.params.id]);
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found or cannot delete seed movies' });
    }

    // Delete video file
    if (movie.videoFile) {
      const videoPath = path.join(UPLOAD_DIR, movie.videoFile);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    // Delete from database
    await runAsync('DELETE FROM movies WHERE id = ?', [req.params.id]);

    res.json({ success: true, message: 'Movie deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all custom movies
router.post('/clear-all', authenticateToken, async (req, res) => {
  try {
    // Get custom movies to delete files
    const customMovies = await allAsync('SELECT * FROM movies WHERE is_seed = 0');
    
    for (const movie of customMovies) {
      if (movie.videoFile) {
        const videoPath = path.join(UPLOAD_DIR, movie.videoFile);
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
      }
    }

    // Delete from database
    await runAsync('DELETE FROM movies WHERE is_seed = 0');

    res.json({ success: true, message: 'All custom movies cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all custom movies count
router.get('/count/custom', authenticateToken, async (req, res) => {
  try {
    const result = await getAsync('SELECT COUNT(*) as count FROM movies WHERE is_seed = 0');
    res.json({ count: result.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
