# Ocean Features FastAPI Backend

Real-time ocean feature detection for Always Bent Fishing Intelligence.

## Features

- **Thermal Front Detection**: Identifies SST gradients and temperature breaks
- **Chlorophyll Edge Detection**: Finds productivity zones and phytoplankton blooms  
- **Eddy Detection**: Locates mesoscale eddies using Okubo-Weiss parameter
- **Live Features API**: Combined endpoint for all ocean features

## API Endpoints

- `GET /` - Health check
- `GET /polygons` - Get ocean feature polygons (main endpoint)
- `GET /ocean-features/fronts` - Detect thermal fronts
- `GET /ocean-features/edges` - Detect chlorophyll edges
- `GET /ocean-features/eddies` - Detect mesoscale eddies
- `GET /ocean-features/live` - Get all features combined

## Local Development

1. Create virtual environment:
```bash
cd python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
export COPERNICUS_USER=your_username
export COPERNICUS_PASS=your_password
export POLYGONS_BACKEND_URL=http://localhost:8000
export NEXT_PUBLIC_POLYGONS_URL=http://localhost:8000
```

4. Run the server:
```bash
python main.py
```

The API will be available at http://localhost:8000

## Docker Deployment

1. Build the image:
```bash
docker build -t abfi-ocean-features .
```

2. Run the container:
```bash
docker run -p 8000:8000 \
  -e COPERNICUS_USER=your_username \
  -e COPERNICUS_PASS=your_password \
  abfi-ocean-features
```

## Google Cloud Run Deployment

1. Build and push to Google Container Registry:
```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Build and tag
docker build -t gcr.io/YOUR_PROJECT_ID/abfi-ocean-features .

# Push to GCR
docker push gcr.io/YOUR_PROJECT_ID/abfi-ocean-features
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy abfi-ocean-features \
  --image gcr.io/YOUR_PROJECT_ID/abfi-ocean-features \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars COPERNICUS_USER=$COPERNICUS_USER,COPERNICUS_PASS=$COPERNICUS_PASS
```

3. Update environment variables in Vercel:
```
POLYGONS_BACKEND_URL=https://abfi-ocean-features-xxxxx.a.run.app
NEXT_PUBLIC_POLYGONS_URL=https://abfi-ocean-features-xxxxx.a.run.app
```

## Vercel Deployment (Alternative)

1. Create `vercel.json` in python directory:
```json
{
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ]
}
```

2. Deploy:
```bash
vercel --prod
```

## Environment Variables

- `COPERNICUS_USER` - Copernicus Marine username
- `COPERNICUS_PASS` - Copernicus Marine password  
- `PORT` - Server port (default: 8000)

## Testing

Run tests:
```bash
pytest
```

Test endpoints:
```bash
# Health check
curl http://localhost:8000/

# Get polygons for a bounding box
curl "http://localhost:8000/polygons?bbox=-75,35,-70,40"

# Detect thermal fronts
curl "http://localhost:8000/ocean-features/fronts?bbox=-75,35,-70,40&threshold=0.5"

# Get all live features
curl "http://localhost:8000/ocean-features/live?bbox=-75,35,-70,40&features=fronts,edges,eddies"
```

## Architecture

The backend uses:
- **FastAPI** for the REST API
- **NumPy/SciPy** for numerical computations
- **OpenCV/scikit-image** for image processing
- **Shapely/GeoJSON** for geospatial operations
- **XArray** for handling NetCDF data from Copernicus

## Future Enhancements

- [ ] Real-time data fetching from Copernicus Marine
- [ ] Caching layer for processed features
- [ ] WebSocket support for live updates
- [ ] Machine learning models for improved detection
- [ ] Historical analysis endpoints
- [ ] Multi-resolution processing