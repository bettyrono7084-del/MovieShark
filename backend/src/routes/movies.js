const express = require('express');
const router = express.Router();
const { allAsync, getAsync, runAsync } = require('../db/init');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Use environment variable for upload directory (Railway Volume or local)
const UPLOAD_DIR = process.env.UPLOAD_DIR 
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '../../uploads');

// TMDB Search Helper
function searchTMDB(query) {
  return new Promise((resolve) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
      console.log('TMDB API Key not configured. Skipping external search.');
      return resolve([]);
    }

    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`;

    https.get(url, (res) => {
      let data = '';
      
      // Check for HTTP error status
      if (res.statusCode !== 200) {
        console.warn(`TMDB API returned status ${res.statusCode}`);
      }
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          // Check for API errors
          if (json.error || json.errors) {
            console.warn('TMDB API error:', json.error || json.errors);
            return resolve([]);
          }
          
          const results = (json.results || []).slice(0, 10).map(m => ({
            id: `ext_${m.id}`,
            title: m.title,
            year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
            genre: 'Online',
            rating: m.vote_average,
            description: m.overview,
            poster_url: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            quality: 'HD',
            is_external: true,
            badge: 'ONLINE'
          }));
          resolve(results);
        } catch (e) {
          console.error('Error parsing TMDB response:', e);
          resolve([]);
        }
      });
    }).on('error', (err) => {
      console.error('TMDB request error:', err);
      resolve([]);
    });
  });
}

// Get all movies
router.get('/', async (req, res) => {
  try {
    const movies = await allAsync('SELECT * FROM movies ORDER BY uploaded_at DESC');
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search movies (local + external)
router.get('/search/:query', async (req, res) => {
  try {
    const queryStr = req.params.query;
    const queryParam = `%${queryStr}%`;

    // Search local DB
    const localMovies = await allAsync(
      "SELECT * FROM movies WHERE title LIKE ? OR description LIKE ? ORDER BY uploaded_at DESC",
      [queryParam, queryParam]
    );

    // Search External (TMDB)
    const externalMovies = await searchTMDB(queryStr);

    // Combine results (Local first)
    const combined = [...localMovies, ...externalMovies];

    res.json(combined);
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

// Get user's watchlist (requires authentication)
router.get('/watchlist/my-list', authenticateToken, async (req, res) => {
  try {
    const movies = await allAsync(`
      SELECT m.* FROM movies m
      INNER JOIN watchlist w ON m.id = w.movie_id
      WHERE w.user_id = (SELECT id FROM users WHERE username = ?)
      ORDER BY w.added_at DESC
    `, [req.user.username]);
    res.json(movies);
  } catch (err) {
    console.error('Watchlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add movie to watchlist (requires authentication)
router.post('/:id/watchlist/add', authenticateToken, async (req, res) => {
  try {
    const movieId = req.params.id;
    
    // Verify movie exists
    const movie = await getAsync('SELECT id FROM movies WHERE id = ?', [movieId]);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Get user ID
    const user = await getAsync('SELECT id FROM users WHERE username = ?', [req.user.username]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add to watchlist
    await runAsync(
      'INSERT OR IGNORE INTO watchlist (user_id, movie_id) VALUES (?, ?)',
      [user.id, movieId]
    );

    res.json({ success: true, message: 'Added to watchlist' });
  } catch (err) {
    console.error('Add to watchlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove movie from watchlist (requires authentication)
router.post('/:id/watchlist/remove', authenticateToken, async (req, res) => {
  try {
    const movieId = req.params.id;

    // Get user ID
    const user = await getAsync('SELECT id FROM users WHERE username = ?', [req.user.username]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from watchlist
    await runAsync(
      'DELETE FROM watchlist WHERE user_id = ? AND movie_id = ?',
      [user.id, movieId]
    );

    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (err) {
    console.error('Remove from watchlist error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check if movie is in user's watchlist (requires authentication)
router.get('/:id/watchlist/check', authenticateToken, async (req, res) => {
  try {
    const movieId = req.params.id;

    // Get user ID
    const user = await getAsync('SELECT id FROM users WHERE username = ?', [req.user.username]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if in watchlist
    const inWatchlist = await getAsync(
      'SELECT id FROM watchlist WHERE user_id = ? AND movie_id = ?',
      [user.id, movieId]
    );

    res.json({ inWatchlist: !!inWatchlist });
  } catch (err) {
    console.error('Watchlist check error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
