# 💰 Most Cost-Effective Deployment Strategy

## 🏆 Winner: Hybrid Approach (GitHub Actions + Cloud Run)

### Total Monthly Cost: ~$0-5

## Architecture

1. **Polygon Generation**: GitHub Actions (FREE)
2. **API Serving**: Google Cloud Run (Pay-per-use)
3. **Storage**: GitHub Repository (FREE)

## Implementation

### Step 1: GitHub Actions for Daily Generation

Create `.github/workflows/generate-polygons.yml`:

```yaml
name: Generate Ocean Polygons

on:
  schedule:
    # Run at 6 AM UTC daily
    - cron: '0 6 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd python
          pip install -r requirements.txt
      
      - name: Generate polygons
        env:
          COPERNICUS_USER: ${{ secrets.COPERNICUS_USER }}
          COPERNICUS_PASS: ${{ secrets.COPERNICUS_PASS }}
          RUN_ON_STARTUP: true
        run: |
          cd python
          python scheduler.py
      
      - name: Commit and push polygons
        run: |
          git config --global user.name 'Polygon Bot'
          git config --global user.email 'bot@always-bent.com'
          git add data/polygons/*.geojson
          git commit -m "🌊 Daily polygon update $(date +%Y-%m-%d)" || exit 0
          git push
```

### Step 2: Minimal Cloud Run API

Update `main.py` to read from GitHub:

```python
@app.get("/polygons")
async def get_polygons(bbox: str):
    # First try local file
    local_file = Path("data/polygons/ocean_features_latest.geojson")
    
    if not local_file.exists():
        # Fallback to GitHub raw content
        github_url = "https://raw.githubusercontent.com/Jro82886/always-bent/main/data/polygons/ocean_features_latest.geojson"
        response = requests.get(github_url)
        if response.status_code == 200:
            data = response.json()
        else:
            # Generate on-demand as last resort
            return await generate_realtime_polygons(bbox)
    else:
        with open(local_file, 'r') as f:
            data = json.load(f)
    
    # Filter by bbox and return
    return filter_features_by_bbox(data, bbox)
```

### Step 3: Deploy Minimal API

```bash
# Deploy only the API (no scheduler needed)
cd python
./deploy.sh
```

## Cost Breakdown

### GitHub Actions: FREE
- 2,000 minutes/month free
- Polygon generation takes ~5 minutes
- 30 days × 5 minutes = 150 minutes (well under limit)

### Cloud Run: ~$0-5/month
- First 2 million requests FREE
- 180 vCPU-seconds FREE per request
- 360,000 vCPU-seconds FREE per month
- Your API only serves pre-generated files (minimal CPU)

### Storage: FREE
- GitHub repo stores GeoJSON files
- No cloud storage costs
- Version history included

## Alternative: Vercel Edge Functions

Even cheaper option using your existing Vercel deployment:

1. Create `/api/generate-polygons.ts`:
```typescript
export const config = {
  runtime: 'edge',
  // Run daily via Vercel Cron
  schedule: '0 6 * * *'
};

export default async function handler() {
  // Call Python backend to generate
  await fetch('https://your-backend.run.app/admin/generate-polygons', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ADMIN_API_KEY }
  });
}
```

2. Serve polygons from Vercel:
```typescript
// /api/polygons.ts
export default async function handler(req: Request) {
  // Serve from public directory or GitHub
  const data = await fetch('/polygons/latest.geojson');
  return new Response(data.body, {
    headers: { 'Content-Type': 'application/geo+json' }
  });
}
```

## Quick Start (5 minutes)

1. **Add GitHub Action**:
```bash
mkdir -p .github/workflows
# Create the workflow file above
git add .github/workflows/generate-polygons.yml
git commit -m "Add polygon generation workflow"
git push
```

2. **Add GitHub Secrets**:
- Go to repo Settings → Secrets
- Add `COPERNICUS_USER`
- Add `COPERNICUS_PASS`

3. **Update API to read from GitHub**:
```bash
# Update main.py with GitHub fallback
cd python
./deploy.sh
```

## Monitoring (Also Free)

- GitHub Actions: Built-in logs and notifications
- Cloud Run: Free tier includes basic monitoring
- Uptime monitoring: Use free tier of UptimeRobot

## Scaling Path

When you grow:
1. **Stage 1** (Current): GitHub Actions + Cloud Run ($0-5/month)
2. **Stage 2** (1K users): Add CloudFlare CDN ($0-20/month)
3. **Stage 3** (10K users): Add Redis cache ($10-30/month)
4. **Stage 4** (100K users): Full cloud solution ($100+/month)

## Summary

✅ **Recommended Setup**:
- GitHub Actions for generation (FREE)
- Cloud Run for API ($0-5/month)
- GitHub for storage (FREE)
- Total: **Under $5/month**

This gives you:
- Automatic daily updates
- Global availability
- Zero maintenance
- Easy scaling path
- Professional reliability

🎣 Start fishing smarter for less than a coffee per month!
