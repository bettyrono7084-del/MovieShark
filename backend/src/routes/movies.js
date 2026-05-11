const express = require('express');
const router = express.Router();
const { allAsync, getAsync, runAsync } = require('../db/init');
const fs = require('fs');
const path = require('path');

// Use environment variable for upload directory (Railway Volume or local)
const UPLOAD_DIR = process.env.UPLOAD_DIR 
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '../../uploads');

// Get all movies
router.get('/', async (req, res) => {
  try {
    const movies = await allAsync('SELECT * FROM movies ORDER BY uploaded_at DESC');
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get movies by genre
router.get('/genre/:genre', async (req, res) => {
  try {
    const genre = req.params.genre.toLowerCase();
    let sql = 'SELECT * FROM movies';
    
    if (genre !== 'all') {
      sql += " WHERE genre = ?";
      var movies = await allAsync(sql + ' ORDER BY uploaded_at DESC', [genre]);
    } else {
      var movies = await allAsync(sql + ' ORDER BY uploaded_at DESC');
    }
    
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search movies
router.get('/search/:query', async (req, res) => {
  try {
    const query = `%${req.params.query}%`;
    const movies = await allAsync(
      "SELECT * FROM movies WHERE title LIKE ? OR description LIKE ? ORDER BY uploaded_at DESC",
      [query, query]
    );
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single movie
router.get('/:id', async (req, res) => {
  try {
    const movie = await getAsync('SELECT * FROM movies WHERE id = ?', [req.params.id]);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stream movie
router.get('/:id/stream', async (req, res) => {
  try {
    const movie = await getAsync('SELECT * FROM movies WHERE id = ?', [req.params.id]);
    if (!movie) {
      console.warn(`Stream request for movie ${req.params.id} - movie not found`);
      return res.status(404).json({ error: 'Movie not found' });
    }

    if (!movie.videoFile) {
      console.warn(`Stream request for "${movie.title}" - no videoFile. Only custom uploaded videos can be streamed.`);
      return res.status(404).json({ error: 'This movie has no video file. Only custom uploaded movies can be streamed.' });
    }

    const videoPath = path.join(UPLOAD_DIR, movie.videoFile);
    console.log(`Stream requested for: ${movie.title} (${movie.videoFile})`);
    console.log(`Looking for file at: ${videoPath}`);
    
    if (!fs.existsSync(videoPath)) {
      console.error(`Video file not found: ${videoPath}`);
      return res.status(404).json({ error: 'Video file not found on disk. Please re-upload.' });
    }

    console.log(`✓ Streaming: ${videoPath}`);

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunksize = (end - start) + 1;
      const stream = fs.createReadStream(videoPath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download movie
router.get('/:id/download', async (req, res) => {
  try {
    const movie = await getAsync('SELECT * FROM movies WHERE id = ?', [req.params.id]);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    if (!movie.videoFile) {
      console.warn(`Download request for "${movie.title}" - no videoFile. Only custom uploaded videos can be downloaded.`);
      return res.status(404).json({ error: 'This movie has no video file. Only custom uploaded movies can be downloaded.' });
    }

    const videoPath = path.join(UPLOAD_DIR, movie.videoFile);
    console.log(`Download requested for: ${movie.title}`);
    
    if (!fs.existsSync(videoPath)) {
      console.error(`Download: Video file not found at ${videoPath}`);
      return res.status(404).json({ error: 'Video file not found on disk. Please re-upload.' });
    }

    console.log(`✓ Downloading: ${videoPath}`);
    res.download(videoPath, `${movie.title}.mp4`, (err) => {
      if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error('Download error:', err);
      }
    });
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
