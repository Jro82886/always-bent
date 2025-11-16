# Python Ocean Features Backend - Deployment Guide

## Overview

The Python FastAPI backend provides ocean feature detection (thermal fronts, chlorophyll edges, eddies) for the Always Bent Fishing Intelligence platform.

## Deployment Options

### Option 1: Railway (Recommended - Free & Easy)

**Why Railway?**
- Free tier includes 500 hours/month
- Auto-deploys from GitHub
- Built-in environment variables
- HTTPS included
- Easy to set up

**Steps:**

1. **Sign up at [railway.app](https://railway.app)**

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `always-bent` repository
   - Select the `python` directory as the root path

3. **Configure the service:**
   - Railway will auto-detect the Python app
   - Set the start command (if needed): `cd app && uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Get your deployment URL:**
   - Railway will provide a URL like: `https://your-app-name.up.railway.app`

5. **Update Vercel environment variables:**
   - Go to your Vercel project settings
   - Add environment variable:
     ```
     NEXT_PUBLIC_POLYGONS_URL=https://your-app-name.up.railway.app
     POLYGONS_BACKEND_URL=https://your-app-name.up.railway.app
     ```
   - Redeploy your Vercel app

### Option 2: Render

**Steps:**

1. **Sign up at [render.com](https://render.com)**

2. **Create a new Web Service:**
   - Connect your GitHub repository
   - Set root directory: `python`
   - Build command: `pip install -r requirements.txt`
   - Start command: `cd app && uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Get your deployment URL:**
   - Render will provide a URL like: `https://your-service.onrender.com`

4. **Update Vercel environment variables** (same as Railway above)

### Option 3: Heroku

**Steps:**

1. **Install Heroku CLI and login:**
   ```bash
   brew install heroku/brew/heroku
   heroku login
   ```

2. **Create a Procfile:**
   ```bash
   cd python
   echo "web: cd app && uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile
   ```

3. **Deploy:**
   ```bash
   heroku create always-bent-ocean-features
   git subtree push --prefix python heroku main
   ```

4. **Get your deployment URL:**
   - Heroku will provide a URL like: `https://always-bent-ocean-features.herokuapp.com`

5. **Update Vercel environment variables** (same as Railway above)

## Testing Your Deployment

Once deployed, test the endpoints:

```bash
# Health check
curl https://your-app-url.com/health

# Root endpoint
curl https://your-app-url.com/

# Test thermal fronts
curl "https://your-app-url.com/ocean-features/fronts?bbox=35.5,-75.5,36.5,-74.5&date=2025-11-16"
```

## Environment Variables Needed

The Python backend doesn't require any environment variables for demo mode.

For production with real Copernicus data, you would add:
- `COPERNICUS_USER`
- `COPERNICUS_PASS`

## Monitoring

All platforms provide:
- Logs viewing
- Metrics/analytics
- Auto-restart on crashes

## Cost Estimates

- **Railway**: FREE (500 hours/month, then $5/month)
- **Render**: FREE (spins down after inactivity)
- **Heroku**: $7/month (Eco dynos)

## Troubleshooting

### "Application Error" or 503
- Check logs on your hosting platform
- Verify `requirements.txt` has all dependencies
- Ensure start command is correct

### CORS Errors
- The FastAPI app is configured to allow your Vercel domains
- If you get CORS errors, check the `allow_origins` list in `main.py`

### Slow First Load
- Render free tier spins down after inactivity (takes ~30s to wake up)
- Railway stays active
- Upgrade to paid tier for always-on

## Next Steps After Deployment

1. Update `.env.local` for local development:
   ```bash
   NEXT_PUBLIC_POLYGONS_URL=https://your-production-url.com
   POLYGONS_BACKEND_URL=https://your-production-url.com
   ```

2. Push changes to trigger Vercel rebuild

3. Test ocean features on your live site!
