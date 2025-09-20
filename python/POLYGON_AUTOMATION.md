# 🔄 Automatic Daily Polygon Generation

The ocean feature detection system now automatically generates polygons daily when SST imagery is updated.

## Overview

The system consists of:
1. **Scheduler** - Runs daily at 6 AM UTC to process new SST/CHL data
2. **FastAPI Server** - Serves pre-generated polygons with caching
3. **Storage** - Saves daily polygons and maintains a "latest" version

## How It Works

### Daily Schedule
- **6:00 AM UTC** - Automatic generation starts (after typical SST updates)
- Processes all East Coast fishing regions
- Detects thermal fronts, chlorophyll edges, and eddies
- Saves results as GeoJSON files

### Regions Processed
- Maine to Florida coastal waters
- Each region optimized for local fishing areas
- ~150nm offshore coverage

### Performance
- Pre-generated polygons load instantly
- Cached for 24 hours
- Filtered by bounding box on request
- Falls back to on-demand generation if needed

## API Usage

### Get Polygons (Default - Uses Cache)
```bash
curl "https://your-backend.run.app/polygons?bbox=-75,35,-70,40"
```

### Force Fresh Generation
```bash
curl "https://your-backend.run.app/polygons?bbox=-75,35,-70,40&use_cached=false"
```

### Download Full Dataset
```bash
# Latest polygons
curl "https://your-backend.run.app/polygons/download"

# Specific date
curl "https://your-backend.run.app/polygons/download?date=20240920"
```

## Admin Endpoints

### Manual Trigger
```bash
curl -X POST "https://your-backend.run.app/admin/generate-polygons?api_key=your-admin-key"

# Generate specific regions only
curl -X POST "https://your-backend.run.app/admin/generate-polygons?api_key=your-admin-key&regions=north_carolina,virginia"
```

### Check Status
```bash
curl "https://your-backend.run.app/admin/polygon-status?api_key=your-admin-key"
```

Response:
```json
{
  "latest_file_exists": true,
  "latest_file_modified": "2024-09-20T06:15:32",
  "file_age_hours": 2.5,
  "total_features": 1247,
  "files": [
    {
      "name": "ocean_features_20240920.geojson",
      "size_mb": 12.4,
      "modified": "2024-09-20T06:15:32"
    }
  ]
}
```

## Deployment Options

### Option 1: Docker Compose (Recommended)
```bash
cd python
docker-compose up -d
```

This runs both API and scheduler together.

### Option 2: Separate Services
```bash
# API on Cloud Run
gcloud run deploy always-bent-python --image gcr.io/PROJECT/always-bent-python

# Scheduler on Cloud Scheduler
gcloud scheduler jobs create app-engine daily-polygons \
  --schedule="0 6 * * *" \
  --http-method=POST \
  --uri="https://your-backend.run.app/admin/generate-polygons?api_key=your-key"
```

### Option 3: Kubernetes CronJob
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ocean-polygon-generator
spec:
  schedule: "0 6 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: scheduler
            image: gcr.io/PROJECT/always-bent-python
            command: ["python", "scheduler.py"]
            env:
            - name: RUN_ON_STARTUP
              value: "true"
```

## Environment Variables

### Required
- `COPERNICUS_USER` - For ocean data access
- `COPERNICUS_PASS` - For ocean data access

### Optional
- `RUN_ON_STARTUP` - Generate immediately on container start
- `ADMIN_API_KEY` - For admin endpoint access
- `GCS_BUCKET` - Google Cloud Storage bucket for backups
- `NOTIFICATION_WEBHOOK` - Slack/Discord webhook for notifications

## Monitoring

### Health Checks
- API health: `/`
- Polygon status: `/admin/polygon-status`
- Latest generation time in file metadata

### Alerts
Configure alerts for:
- Generation failures
- File age > 36 hours
- Feature count anomalies

## Benefits

1. **Performance**: Pre-generated polygons load in milliseconds
2. **Reliability**: No dependency on external APIs during user requests
3. **Cost Efficiency**: Processes data once daily instead of per-request
4. **Scalability**: Serves thousands of users from cached files
5. **Freshness**: Automatically updates with latest SST data

## Troubleshooting

### No polygons showing
1. Check if scheduler is running: `docker-compose ps`
2. Check latest file exists: `/admin/polygon-status`
3. Check logs: `docker-compose logs scheduler`

### Old data
1. Check file age in status endpoint
2. Manually trigger: `/admin/generate-polygons`
3. Check Copernicus credentials

### Performance issues
1. Ensure `use_cached=true` (default)
2. Check file size - may need region filtering
3. Consider CDN for polygon files

## Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] Historical polygon archives
- [ ] Machine learning for better detection
- [ ] Custom alerts for specific features
- [ ] Integration with weather data
