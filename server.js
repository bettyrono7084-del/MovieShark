const express = require('express');
const cors = require('cors');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Concurrency and Queue Configuration
const MAX_CONCURRENT_JOBS = 2; 
let activeJobsCount = 0;
const queue = [];

// Initialize Job Tracking and Temp Storage
const jobs = {};
const TEMP_DIR = path.join(__dirname, 'temp_downloads');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// Clean up temp directory on server start to remove leftovers from crashes
if (fs.existsSync(TEMP_DIR)) {
  fs.readdirSync(TEMP_DIR).forEach(file => fs.unlinkSync(path.join(TEMP_DIR, file)));
}

// Automatic Cleanup: Every 15 minutes, delete files older than 1 hour
setInterval(() => {
  const now = Date.now();
  Object.keys(jobs).forEach(jobId => {
    if (now - parseInt(jobId) > 60 * 60 * 1000) { // 1 hour age limit
      const job = jobs[jobId];
      const filePath = path.join(TEMP_DIR, `${jobId}.${job.format || 'mp3'}`);
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => { console.log(`Cleaned up expired job: ${jobId}`); });
      delete jobs[jobId];
    }
  });
}, 15 * 60 * 1000);

// Set FFmpeg path from ffmpeg-static binary
ffmpeg.setFfmpegPath(ffmpegPath);

app.use(cors());
app.use(express.json());

// Serve static files from the public directory (where index.html is located)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * GET /api/songs/info
 * Fetches metadata for a YouTube video using ytdl-core
 */
app.get('/api/songs/info', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  try {
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ message: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    res.json({
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails.pop()?.url || ''
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch video info', error: err.message });
  }
});

/**
 * GET /api/songs/search
 * Searches YouTube for videos based on a query string
 */
app.get('/api/songs/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Search query is required' });

  try {
    const results = await ytdl.search(query, { limit: 10 }); // Limit to top 10 results
    const formattedResults = results.map(item => ({
      id: item.id, // YouTube video ID
      title: item.title,
      author: item.author.name,
      thumbnail: item.thumbnails.pop()?.url || '', // Get highest quality thumbnail
      url: `https://www.youtube.com/watch?v=${item.id}` // Full YouTube URL
    }));
    res.json(formattedResults);
  } catch (err) {
    console.error('YouTube search error:', err.message);
    res.status(500).json({ message: 'Failed to search YouTube', error: err.message });
  }
});

/**
 * Internal function to process the next job in the queue
 */
function processQueue() {
  if (activeJobsCount >= MAX_CONCURRENT_JOBS || queue.length === 0) {
    return;
  }

  const { jobId, url, outputPath, format, quality } = queue.shift();
  activeJobsCount++;
  jobs[jobId].status = 'processing';

  let stream;
  let ffmpegCommand;

  if (format === 'mp3') {
    stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
    ffmpegCommand = ffmpeg(stream)
      .audioBitrate(quality)
      .format('mp3');
  } else {
    // For MP4, we try to find the best format matching the requested resolution
    // Note: ytdl filter 'videoandaudio' usually limits to 720p for combined streams.
    stream = ytdl(url, { 
      quality: 'highestvideo',
      filter: (f) => f.container === 'mp4' && !f.colorInfo // Simple filter for MP4 compatible formats
    });
    ffmpegCommand = ffmpeg(stream)
      .format('mp4')
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`?x${quality}`); // Rescale if necessary to match selection
  }

  ffmpegCommand
    .on('progress', (p) => {
      if (p.percent) jobs[jobId].progress = Math.floor(p.percent);
    })
    .on('end', () => {
      jobs[jobId].progress = 100;
      jobs[jobId].status = 'completed';
      activeJobsCount--;
      processQueue();
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err.message);
      jobs[jobId].status = 'error';
      activeJobsCount--;
      processQueue();
    })
    .save(outputPath);
}

/**
 * GET /api/songs/download
 * Initiates conversion to disk and returns a jobId for progress tracking
 */
app.get('/api/songs/download', async (req, res) => {
  const { url, format, quality } = req.query;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  try {
    const jobId = Date.now().toString();
    const info = await ytdl.getInfo(url);
    const safeTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '') || 'song';
    const extension = format === 'mp4' ? 'mp4' : 'mp3';
    const outputPath = path.join(TEMP_DIR, `${jobId}.${extension}`);

    jobs[jobId] = { progress: 0, status: 'queued', title: safeTitle, format: extension };
    
    queue.push({ jobId, url, outputPath, format, quality: quality || '128' });
    processQueue();

    res.json({ jobId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start conversion' });
  }
});

/**
 * GET /api/songs/progress/:jobId
 * Server-Sent Events endpoint to stream conversion status to the UI
 */
app.get('/api/songs/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const timer = setInterval(() => {
    const job = jobs[jobId];
    if (!job) return res.end();

    res.write(`data: ${JSON.stringify(job)}\n\n`);

    if (job.status === 'completed' || job.status === 'error') {
      clearInterval(timer);
      res.end();
    }
  }, 1000);
});

/**
 * GET /api/songs/retrieve/:jobId
 * Downloads the finished file and deletes it immediately after sending
 */
app.get('/api/songs/retrieve/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs[jobId];
  if (!job || job.status !== 'completed') return res.status(404).send('File not ready');

  const filePath = path.join(TEMP_DIR, `${jobId}.${job.format}`);
  res.download(filePath, `${job.title}.${job.format}`, () => {
    fs.unlink(filePath, () => delete jobs[jobId]);
  });
});

app.listen(PORT, () => {
  console.log(`MovieShark server running at http://localhost:${PORT}`);
});