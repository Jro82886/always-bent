# 🚀 Google Cloud Run Deployment Guide

Quick guide to deploy the FastAPI ocean features backend to your existing Google Cloud Run service.

## Prerequisites

1. **Google Cloud SDK installed**
   - If not installed: https://cloud.google.com/sdk/docs/install
   - On Mac: `brew install google-cloud-sdk`

2. **Authenticated with Google Cloud**
   ```bash
   gcloud auth login
   ```

3. **Environment variables set** (for Copernicus data)
   ```bash
   export COPERNICUS_USER="your_username"
   export COPERNICUS_PASS="your_password"
   ```

## Quick Deploy (Automatic)

We've created a deployment script that handles everything:

```bash
cd python
./deploy.sh
```

This script will:
- ✅ Check prerequisites
- ✅ Build the Docker image
- ✅ Deploy to Cloud Run
- ✅ Show you the service URL

## Manual Deploy (Step by Step)

If you prefer to deploy manually:

1. **Navigate to python directory**
   ```bash
   cd python
   ```

2. **Set your project ID**
   ```bash
   gcloud config set project always-bent
   ```

3. **Build the Docker image**
   ```bash
   gcloud builds submit --tag gcr.io/always-bent/always-bent-python
   ```

4. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy always-bent-python \
     --image gcr.io/always-bent/always-bent-python \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars COPERNICUS_USER=$COPERNICUS_USER,COPERNICUS_PASS=$COPERNICUS_PASS
   ```

## Testing the Deployment

Once deployed, test your endpoints:

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe always-bent-python --region us-central1 --format 'value(status.url)')

# Test health check
curl $SERVICE_URL/

# Test polygon endpoint
curl "$SERVICE_URL/polygons?bbox=-75,35,-70,40"

# Test live features
curl "$SERVICE_URL/ocean-features/live?bbox=-75,35,-70,40"
```

## Troubleshooting

### "Permission denied" error
```bash
gcloud auth login
gcloud config set project always-bent
```

### Build fails
- Check that you're in the `python` directory
- Verify `requirements.txt` is present
- Ensure Docker daemon is running

### Deployment fails
- Check Cloud Run API is enabled
- Verify billing is enabled on the project
- Check resource quotas

## Monitoring

View logs:
```bash
gcloud run services logs read always-bent-python --region us-central1
```

View metrics in Cloud Console:
https://console.cloud.google.com/run

## Cost Optimization

Cloud Run charges only for actual usage:
- First 2 million requests/month are FREE
- Pay only when the service is handling requests
- Scales to zero when not in use

## Next Steps

After deployment:
1. ✅ Verify the service URL matches what's in Vercel env vars
2. ✅ Test all endpoints are working
3. ✅ Monitor initial performance
4. ✅ Set up alerts if needed

Your ocean features backend is now live! 🎣
