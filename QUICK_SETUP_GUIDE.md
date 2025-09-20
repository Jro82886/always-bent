# 🚀 5-Minute Setup: GitHub Actions + Cloud Run

## Step 1: Add GitHub Secrets (2 minutes)

1. Go to: https://github.com/Jro82886/always-bent/settings/secrets/actions
2. Click "New repository secret"
3. Add these two secrets:

**Secret 1:**
- Name: `COPERNICUS_USER`
- Value: (your Copernicus username)

**Secret 2:**
- Name: `COPERNICUS_PASS`
- Value: (your Copernicus password)

## Step 2: Test the Workflow (1 minute)

1. Go to: https://github.com/Jro82886/always-bent/actions
2. Click "Generate Ocean Feature Polygons" on the left
3. Click "Run workflow" button
4. Click green "Run workflow" in the dropdown
5. Watch it run! (takes ~5 minutes)

## Step 3: Update Your Cloud Run API (2 minutes)

The API is already configured to serve the polygons! Just deploy the latest code:

```bash
cd python
./deploy.sh
```

Or if you prefer manual deploy:
```bash
cd python
gcloud run deploy always-bent-python \
  --source . \
  --region us-central1
```

## ✅ That's It! You're Done!

### What Happens Now:

- **Every day at 6 AM UTC**: GitHub Actions generates fresh polygons
- **Polygons saved to**: `/public/data/polygons/ocean_features_latest.geojson`
- **Your API serves them**: From cache for instant loading
- **Cost**: $0 for GitHub Actions + $0-5 for Cloud Run = **Under $5/month total**

### Verify It's Working:

1. **Check GitHub Actions**: 
   - https://github.com/Jro82886/always-bent/actions
   - You should see a green checkmark when complete

2. **Check Generated Files**:
   - https://github.com/Jro82886/always-bent/tree/main/public/data/polygons
   - You'll see `ocean_features_latest.geojson`

3. **Test Your API**:
   ```bash
   curl "https://always-bent-python-1039366079125.us-central1.run.app/polygons?bbox=-75,35,-70,40"
   ```

### Monitor Performance:

- **GitHub Actions**: Free monitoring at `/actions` tab
- **Cloud Run**: Free monitoring at https://console.cloud.google.com/run
- **Costs**: Check at https://console.cloud.google.com/billing

### 🎉 Congratulations!

You now have enterprise-grade ocean polygon generation for less than a coffee per month!

## FAQ

**Q: When will the first polygons generate?**
A: If you run the workflow manually now, in ~5 minutes. Otherwise, tomorrow at 6 AM UTC.

**Q: How do I change the schedule?**
A: Edit `.github/workflows/generate-ocean-polygons.yml`, change the cron expression.

**Q: How do I know it's working?**
A: Check the Actions tab - you'll see green checkmarks for successful runs.

**Q: What if it fails?**
A: You'll get a GitHub notification and an issue will be created automatically.

**Q: Can I generate polygons for specific regions only?**
A: Yes! When running manually, you can specify regions like "north_carolina,virginia"

## Next Steps

1. ✅ Add Copernicus credentials to GitHub Secrets
2. ✅ Run the workflow manually to test
3. ✅ Deploy the updated API
4. 🎣 Start fishing with real-time ocean intelligence!

---

Need help? The system is designed to be maintenance-free, but if you have issues:
- Check the Actions tab for error logs
- Ensure Copernicus credentials are correct
- Verify Cloud Run is deployed and running
