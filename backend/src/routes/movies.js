const express = require('express');
const router = express.Router();
const { allAsync, getAsync, runAsync } = require('../db/init');
const fs = require('fs');
const path = require('path');

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
    if (!movie || !movie.videoFile) {
      return res.status(404).json({ error: 'Movie or video file not found' });
    }

    const videoPath = path.join('/app/uploads', movie.videoFile);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found on disk' });
    }

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
    if (!movie || !movie.videoFile) {
      return res.status(404).json({ error: 'Movie or video file not found' });
    }

    const videoPath = path.join('/app/uploads', movie.videoFile);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found on disk' });
    }

    res.download(videoPath, `${movie.title}.mp4`, (err) => {
      if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error('Download error:', err);
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
