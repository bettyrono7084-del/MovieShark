# MovieShark Deployment Guide - Railway

## Prerequisites
- GitHub account
- Railway account (free at https://railway.app)
- Git installed locally

## Step 1: Prepare Your Repository

1. Initialize git in your project (if not already done):
```bash
cd c:\MovieShark
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/MovieShark.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Railway

### Option A: Using Railway CLI (Recommended)

1. **Install Railway CLI**
   - Download from https://railway.app/account/cli
   - Or use npm: `npm install -g @railway/cli`

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Railway Project**
```bash
railway init
```
   - Choose "Create new project"
   - Name it "movieshark"

4. **Deploy**
```bash
railway up
```

### Option B: Using Railway Web Dashboard

1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account and select `MovieShark` repository
4. Railway will auto-detect it's a Node.js project
5. Configure environment variables (see Step 3)
6. Click "Deploy"

## Step 3: Configure Environment Variables in Railway

In your Railway project dashboard:

1. Go to **Variables** tab
2. Add these environment variables:

```
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secure-random-string-here
ADMIN_PASSWORD=your-secure-password
ADMIN_USERNAME=admin
UPLOAD_DIR=/data/uploads
MAX_FILE_SIZE=5000000000
```

⚠️ **Security**: 
- Generate a strong JWT_SECRET: https://cryptotools.com/random/hex
- Change ADMIN_PASSWORD to something strong
- Replace ADMIN_USERNAME if desired

## Step 3b: Configure Persistent Storage (Important for Videos)

**Uploaded videos will disappear on server restart without persistent storage!**

1. In Railway dashboard, go to your MovieShark project
2. Click **Data** → **Create Database** (or use existing volume)
3. Add a persistent volume:
   - Mount Path: `/data`
   - This makes files persist across restarts

4. Set `UPLOAD_DIR=/data/uploads` in Step 3 environment variables

Without this step, all uploaded videos will be lost when your Railway app restarts!

## Step 4: Verify Deployment

Once deployed:

1. Check your Railway project for a public URL (e.g., `https://movieshark-production.up.railway.app`)
2. Visit the URL in your browser
3. Test the admin panel: `/admin`

## Step 5: Update Frontend Configuration (if needed)

Check your frontend JavaScript to ensure it's calling the correct API endpoints:

In `index.html` and `admin.html`, make sure API calls point to your backend URL:

```javascript
// Example - update if hardcoded localhost
const API_URL = window.location.origin + '/api';
// Instead of
const API_URL = 'http://localhost:3000/api';
```

## Database & Files

- **SQLite Database**: Auto-seeded at first deployment
- **Uploaded Files**: Stored in Railway's ephemeral filesystem
  - ⚠️ Files will be lost on redeploy
  - For production, consider: Railway's Volume storage, AWS S3, or Cloud Storage

## Troubleshooting

### ⚠️ **CRITICAL: Uploaded Videos Disappearing?**

This happens because Railway containers are **ephemeral** (temporary). Here's the fix:

**Problem**: Videos uploaded through admin panel disappear after redeploy or server restart

**Root Cause**: Without persistent storage, files saved in `/uploads` are lost when the container restarts

**Solution** - Set up Persistent Volume:
1. Go to Railway Dashboard → Your MovieShark Project
2. Go to **Data** tab
3. Click **Create Disk** 
4. Set **Mount Path** to `/data` and confirm
5. Go to **Variables** tab
6. Set `UPLOAD_DIR=/data/uploads`
7. Redeploy your app

After this, uploaded videos will persist across:
- ✅ Server restarts
- ✅ Redeployments
- ✅ Redeploys from GitHub

**Check if it's working:**
1. Upload a video through the admin panel
2. Redeploy (`railway up` or push to GitHub)
3. Video should still be there

### Other Issues

**Issue**: Deployment fails
- Check build logs in Railway dashboard
- Ensure Node.js dependencies are correct
- Verify `.gitignore` isn't excluding needed files

**Issue**: 502/503 errors
- Check Railway deployment logs
- Verify environment variables are set correctly
- Check if database initialization is working

**Issue**: Database errors
- Railway should auto-initialize SQLite with persistent disk
- If issues persist, SSH into Railway and check: `railway shell`

**Issue**: Videos upload but don't appear after redeploy
- **THIS IS THE PERSISTENT STORAGE ISSUE** - follow the solution above
- Verify `UPLOAD_DIR=/data/uploads` is set
- Verify the disk is mounted at `/data`

## Next Steps

- ✅ Add custom domain (Railway → Project Settings → Domains)
- 📊 Monitor performance in Railway dashboard
- 🔄 Set up auto-deployments from GitHub (Railway does this automatically)
- 💾 Consider persistent storage for uploads

## Useful Commands

```bash
# Connect to Railway project
railway connect

# Deploy latest changes
railway up

# View logs
railway logs

# SSH into environment
railway shell
```

## Support

- Railway Docs: https://docs.railway.app
- MovieShark Issues: Check backend/README.md

---

**Happy Streaming! 🦈**
