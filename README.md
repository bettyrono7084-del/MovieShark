<<<<<<< HEAD
# MovieShark 🦈

A full-stack movie streaming and download platform with admin management system.

## Project Structure

```
MovieShark/
├── frontend/
│   ├── index.html        # Main streaming page
│   └── admin.html        # Admin panel
├── backend/              # Node.js Express server
│   ├── src/
│   │   ├── server.js
│   │   ├── db/
│   │   ├── middleware/
│   │   └── routes/
│   ├── uploads/          # Movie files
│   ├── package.json
│   ├── .env
│   └── README.md
└── movies.db            # SQLite database
```

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
# Copy example config
cp .env.example .env

# Edit .env if needed (defaults work for local development)
```

4. Start the server:
```bash
# Development with auto-reload
npm run dev

# Or production
npm start
```

Server runs on `http://localhost:3000`

### Access Points

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
  - Default username: `admin`
  - Default password: `admin123`

## Features

### User Features
- 🎬 Stream movies in HD/4K
- ⬇️ Download movies
- 🔍 Search and filter by genre
- 📊 Browse trending movies
- 🎨 Dark modern UI

### Admin Features
- 📤 Upload new movies with metadata
- 🎯 Manage movie library
- 📈 Dashboard with statistics
- 🗑️ Delete or clear movies (protect seed movies)
- 🔐 Secure JWT authentication

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript
- Fetch API for backend communication
- Responsive design

### Backend
- Node.js + Express
- SQLite for database
- JWT for authentication
- Multer for file uploads
- CORS support

## Configuration

### Environment Variables (`.env`)

```
PORT=3000                           # Server port
NODE_ENV=development               # Environment
JWT_SECRET=your-secret-key         # JWT signing key
ADMIN_USERNAME=admin               # Admin username
ADMIN_PASSWORD=admin123            # Admin password
UPLOAD_DIR=./uploads               # Video directory
MAX_FILE_SIZE=5000000000           # Max upload size (5GB)
```

## API Endpoints
[README.md](mobile/README.md)
### Public
- `GET /api/movies` - List all movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/:id/stream` - Stream video
- `GET /api/movies/:id/download` - Download video
- `GET /api/movies/genre/:genre` - Filter by genre

### Admin (requires auth)
- `POST /api/admin/login` - Get JWT token
- `POST /api/admin/upload` - Upload movie
- `GET /api/admin/library` - List movies
- `DELETE /api/admin/:id` - Delete movie
- `POST /api/admin/clear-all` - Clear custom movies

## Database

SQLite database automatically initializes with:
- 10 seed movies (pre-loaded sample data)
- Full-text search support
- Automatic timestamp tracking

## File Uploads

Supported video formats:
- MP4
- MKV
- AVI
- MOV

Maximum file size: 5GB (configurable)

## Security

- JWT authentication for admin panel
- Protected seed movie data (cannot be deleted)
- Environment-based configuration
- CORS enabled for API access

⚠️ **Production Notes:**
- Change `JWT_SECRET` and admin password
- Use environment-specific configs
- Enable HTTPS
- Add rate limiting
- Consider reverse proxy (nginx)

## Development

### Hot Reload
Server auto-restarts on file changes with nodemon

### Debug Logs
Enable detailed logging in production by checking server output

### Database
SQLite database is file-based at `./movies.db`
- No server setup needed
- Easy backup and migration

## Deployment

### Local Development
```bash
cd backend
npm install
npm run dev
```

### Production
```bash
cd backend
npm install
NODE_ENV=production npm start
```

### Docker (Optional)
Create `Dockerfile`:
```dockerfile
FROM node:16
WORKDIR /app
COPY backend .
RUN npm install
CMD ["npm", "start"]
```

### PM2 (Process Manager)
```bash
npm install -g pm2
cd backend
pm2 start src/server.js --name "movieshark"
pm2 save
```

## Troubleshooting

### Backend won't start
- Check Node.js version (14+)
- Verify PORT 3000 is free
- Check `.env` file exists

### API calls failing
- Ensure backend is running
- Check browser console for CORS errors
- Verify JWT token if admin features

### Upload issues
- Check upload directory permissions
- Verify file size under limit
- Ensure video format supported

### Database issues
- Delete `movies.db` to reset
- Check file permissions
- Verify disk space available

## Contributing

Improvements welcome! Consider:
- User authentication
- Movie recommendations
- Subtitle support
- Analytics dashboard
- Progressive web app

## License

MIT License - Free to use and modify

## Support

For issues or questions:
1. Check troubleshooting section
2. Review backend README
3. Check console logs for errors

---

**Built with ❤️ for movie enthusiasts**
=======
# MovieShark
Streaming platform 
>>>>>>> 613bb7aabe0d007ca25d2a7eae7154a67f8b287e
