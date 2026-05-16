const express = require('express');
const router = express.Router();
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Configuration
const MAX_CONCURRENT_JOBS = 2;
let activeJobsCount = 0;
const queue = [];
const jobs = {};

// Temporary storage for downloads
const TEMP_DIR = path.join(__dirname, '../../temp_downloads');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Periodic cleanup of old files (older than 1 hour)
setInterval(() => {
  const now = Date.now();
  Object.keys(jobs).forEach(jobId => {
    if (now - parseInt(jobId) > 60 * 60 * 1000) {
      const job = jobs[jobId];
      const filePath = path.join(TEMP_DIR, `${jobId}.${job.format}`);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (!err) console.log(`Cleaned up expired job: ${jobId}`);
        });
      }
      delete jobs[jobId];
    }
  });
}, 15 * 60 * 1000);

/**
 * Internal: Process the conversion queue
 */
function processQueue() {
  if (activeJobsCount >= MAX_CONCURRENT_JOBS || queue.length === 0) return;

  const { jobId, url, outputPath, format, quality } = queue.shift();
  activeJobsCount++;
  jobs[jobId].status = 'processing';

  let ffmpegCommand;
  if (format === 'mp3') {
    const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
    ffmpegCommand = ffmpeg(stream).audioBitrate(quality).format('mp3');
  } else {
    const stream = ytdl(url, { 
      quality: 'highestvideo',
      filter: (f) => f.container === 'mp4' && !f.colorInfo 
    });
    ffmpegCommand = ffmpeg(stream)
      .format('mp4')
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(`?x${quality}`);
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

// Route: Get video info
router.get('/info', async (req, res) => {
  const { url } = req.query;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ message: 'Valid YouTube URL is required' });
  }
  try {
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

// Route: Search YouTube
router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Search query is required' });
  try {
    // Note: ytdl-core doesn't have a native search, this assumes you use a search-capable fork or helper
    // For this implementation, we'll suggest using @distube/ytdl-core's search if available or a similar utility
    const results = await ytdl.search(query, { limit: 10 });
    const formatted = results.map(item => ({
      id: item.id,
      title: item.title,
      author: item.author.name,
      thumbnail: item.thumbnails.pop()?.url || '',
      url: `https://www.youtube.com/watch?v=${item.id}`
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

// Route: Start Download
router.get('/download', async (req, res) => {
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

// Route: Progress (SSE)
router.get('/progress/:jobId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const timer = setInterval(() => {
    const job = jobs[req.params.jobId];
    if (!job) return res.end();
    res.write(`data: ${JSON.stringify(job)}\n\n`);
    if (job.status === 'completed' || job.status === 'error') {
      clearInterval(timer);
      res.end();
    }
  }, 1000);
});

// Route: Retrieve File
router.get('/retrieve/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job || job.status !== 'completed') return res.status(404).send('File not ready');
  const filePath = path.join(TEMP_DIR, `${req.params.jobId}.${job.format}`);
  res.download(filePath, `${job.title}.${job.format}`, () => {
    fs.unlink(filePath, () => delete jobs[req.params.jobId]);
  });
});

module.exports = router;