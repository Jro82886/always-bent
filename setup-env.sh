#!/bin/bash

# ABFI Environment Setup Script
# This script helps manage environment variables properly

echo "🌊 ABFI Environment Setup"
echo "========================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    touch .env.local
fi

# Function to update or add environment variable
update_env() {
    local key=$1
    local value=$2
    
    if grep -q "^${key}=" .env.local; then
        # Update existing
        sed -i.bak "s|^${key}=.*|${key}=${value}|" .env.local
        echo "✅ Updated: ${key}"
    else
        # Add new
        echo "${key}=${value}" >> .env.local
        echo "✅ Added: ${key}"
    fi
}

echo ""
echo "Updating Copernicus credentials..."
update_env "COPERNICUS_USER" "jrosenkilde"
update_env "COPERNICUS_PASS" "fevhuh-wuvmo2-mafFus"

echo ""
echo "Adding Chlorophyll WMTS endpoint..."
update_env "CMEMS_CHL_WMTS_TEMPLATE" "https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_NRT_009_102/cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D_202311/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&TIME={TIME}"

echo ""
echo "Adding API tokens..."
update_env "NEXT_PUBLIC_STORMGLASS_API_KEY" "b07a-0242ac130006-ad72e440-93f3-11f0-b07a-0242ac13000"
update_env "NEXT_PUBLIC_GFW_API_TOKEN" "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtpZEtleSJ9.eyJkYXRhIjp7Im5hbWUiOiJBbHdheXMgQmVudCBGaXNoaW5nIEludGVsbGlnZW5jZSIsInVzZXJJZCI6NDk3NDUsImFwcGxpY2F0aW9uTmFtZSI6IkFsd2F5cyBCZW50IEZpc2hpbmcgSW50ZWxsaWdlbmNlIiwiaWQiOjMyNjgsInR5cGUiOiJ1c2VyLWFwcGxpY2F0aW9uIn0sImlhdCI6MTc1Nzg3NjgwNSwiZXhwIjoyMDczMjM2ODA1LCJhdWQiOiJnZnciLCJpc3MiOiJnZncifQ.Zx5RG1whprsmiDWNR9Bc7bf19zsbJ2CRRVACzXRpLJGaI2VniIHR2BDYK2jdnt2pnrMEu6KUApjuyXgxqBMYmdpgBjTLI8C9T-Yz0eoPJ_p9Ocjiqh_LE4LFlFO9ujgwFoVY29smwHiLQlaWdyPPAyeIPnr2RY9ictDVa1WErSoZDEXb_yO2g6BHOCOms0leE9-x_OHSI47bL5endkEq84Jd-CFcNYt6ykdwGyfUG_uY2dnn3keoSSZ0PwI_aL4nXK3TBAIYojeiH_mucV4mPSrzjl-ThVGI0gixFsf_yY0vi_1-OeyB8KPPigK5TcqLP7C_n2QJwN1qFDQTWqB6DtoChgnuo7y95MGbtT3Wqa4n3zHg95s-nr_NDJV0al434WkLDJWFsACTM6-QIAdjTKtRgeTPcEzliRb_d2mETIHanFAABB0RImrioWClV_ieyiAxwCBDeDhWmz8aH-Yv1ZkOixP6-uhEmrLKPQdmxqqEHdJ6WUR9t4ppZAdRf7Jd"

# Clean up backup files
rm -f .env.local.bak

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Review .env.local to ensure all variables are correct"
echo "2. Copy these same values to Vercel Environment Variables"
echo "3. Restart your development server: npm run dev"
echo ""
echo "For Vercel:"
echo "- Go to: https://vercel.com/dashboard"
echo "- Select your 'always-bent' project"
echo "- Go to Settings → Environment Variables"
echo "- Add/Update the variables above"
echo "- Redeploy your application"