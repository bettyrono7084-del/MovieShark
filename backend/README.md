# MovieShark Backend

Backend server for the MovieShark movie streaming platform, built with Node.js, Express, and SQLite.

## Features

- **RESTful API** - Movies, streaming, downloading
- **JWT Authentication** - Secure admin panel access
- **SQLite Database** - Lightweight, file-based persistence
- **File Uploads** - Handle video file uploads with multer
- **Video Streaming** - HTTP range requests for efficient playback
- **Seed Data** - 10 pre-loaded movies

## Installation

### Prerequisites
- Node.js (v14+)
- npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

Default credentials:
- Username: `admin`
- Password: `admin123`

⚠️ **Security**: Change these in production!

3. Start the server:
```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### Public Endpoints

- `GET /api/movies` - Get all movies
- `GET /api/movies/:id` - Get single movie
- `GET /api/movies/:id/stream` - Stream movie (supports range requests)
- `GET /api/movies/:id/download` - Download movie
- `GET /api/movies/genre/:genre` - Filter by genre
- `GET /api/movies/search/:query` - Search movies
- `GET /api/health` - Health check

### Admin Endpoints (requires authentication)

- `POST /api/admin/login` - Login and get JWT token
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/library` - List all movies
- `POST /api/admin/upload` - Upload new movie (multipart/form-data)
- `DELETE /api/admin/:id` - Delete movie
- `POST /api/admin/clear-all` - Delete all custom movies

## Authentication

Send JWT token in Authorization header:
```
Authorization: Bearer <your_token>
```

## File Upload

Send multipart form with:
- `title` (required)
- `year` (required)
- `genre` (required)
- `description` (required)
- `rating` (optional)
- `quality` (optional, default: 1080p)
- `badge` (optional)
- `emoji` (optional)
- `tags` (optional, comma-separated)
- `videoFile` (optional, file upload)

## Database

SQLite database at `./movies.db`

Tables:
- `movies` - Movie records with metadata and file references

## Project Structure

```
backend/
├── src/
│   ├── server.js          # Main Express app
│   ├── db/
│   │   └── init.js        # Database initialization
│   ├── middleware/
│   │   └── auth.js        # JWT authentication
│   └── routes/
│       ├── movies.js      # Public movie endpoints
│       └── admin.js       # Admin management endpoints
├── uploads/               # Uploaded video files
├── package.json
├── .env                   # Configuration
└── .gitignore
```

## Development

- Changes auto-reload with nodemon
- Use `npm run dev` for development
- Check server output for logs

## Security Notes

- Change JWT_SECRET and admin password in production
- Use HTTPS in production
- Implement rate limiting for API
- Validate file uploads properly
- Consider adding user authentication for viewing

## License

MIT
