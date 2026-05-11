# MovieShark Pre-Deployment Checklist

## Before You Deploy to Railway

### 1. Local Testing ✓
- [ ] Backend starts without errors: `npm start` in `/backend`
- [ ] Frontend loads at `http://localhost:3000`
- [ ] Can access `/admin` panel
- [ ] Can upload a test video through admin panel
- [ ] Can stream the uploaded video on main site
- [ ] Can download the uploaded video

### 2. GitHub Setup ✓
- [ ] Repository pushed to GitHub
- [ ] All files committed (check: `git status`)
- [ ] No sensitive data in commits (check `.env` is in `.gitignore`)

### 3. Railway Deployment ✓ 
- [ ] Railway account created
- [ ] Project created and connected to GitHub repo
- [ ] Environment variables set:
  ```
  PORT=3000
  NODE_ENV=production
  JWT_SECRET=<generate-strong-random-string>
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD=<strong-password>
  UPLOAD_DIR=/data/uploads
  MAX_FILE_SIZE=5000000000
  ```

### 4. CRITICAL: Persistent Storage Setup ⚠️
- [ ] Create a **Disk** in Railway (`Data` tab)
- [ ] Mount Path: `/data`
- [ ] Environment variable `UPLOAD_DIR=/data/uploads` is set
- [ ] **WITHOUT THIS, VIDEOS WILL DISAPPEAR AFTER REDEPLOY**

### 5. Post-Deployment Testing ✓
- [ ] Visit your Railway URL
- [ ] Test uploading a video through `/admin`
- [ ] Reload page - video still shows
- [ ] Wait 5 minutes, reload again - video still there
- [ ] Redeploy from Railway dashboard (manually or via GitHub push)
- [ ] Video still shows after redeploy ← **This proves persistence works**

### 6. Common Issues

**Problem**: Videos disappear after redeploy
**Solution**: Follow step 4 (Persistent Storage Setup)

**Problem**: Can't access `/admin`
**Solution**: 
- Check JWT_SECRET is set
- Verify ADMIN_USERNAME and ADMIN_PASSWORD are correct
- Check backend logs in Railway dashboard

**Problem**: Upload fails
**Solution**:
- Check MAX_FILE_SIZE setting (larger files need bigger limit)
- Verify UPLOAD_DIR=/data/uploads exists
- Check Railway disk is created at /data

## Railway Dashboard Locations

- **Logs**: Project → Logs tab
- **Variables**: Project → Variables tab
- **Data/Volumes**: Project → Data tab
- **Redeploy**: Project → Deployments tab (or auto via GitHub)

## Quick Commands

```bash
# Push changes to GitHub (auto-triggers Railway redeploy)
git add .
git commit -m "message"
git push origin main

# SSH into Railway to debug
railway shell

# View logs
railway logs

# Force redeploy
railway up
```

---

**✅ Once all checkboxes are completed, you're ready to deploy!**

🦈 Good luck with your MovieShark deployment!
