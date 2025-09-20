#!/bin/bash

# Always Bent Python Backend Deployment Script
# Deploys FastAPI ocean features backend to Google Cloud Run

set -e  # Exit on error

echo "🚀 Deploying Always Bent Ocean Features Backend to Google Cloud Run..."

# Configuration
PROJECT_ID="always-bent"  # Update this if different
SERVICE_NAME="always-bent-python"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first:${NC}"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Not authenticated with gcloud. Running authentication...${NC}"
    gcloud auth login
fi

# Set project
echo -e "${YELLOW}📋 Setting project to ${PROJECT_ID}...${NC}"
gcloud config set project ${PROJECT_ID} 2>/dev/null || {
    echo -e "${RED}❌ Failed to set project. Make sure project ID is correct.${NC}"
    exit 1
}

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Build the Docker image using Cloud Build
echo -e "${YELLOW}🏗️  Building Docker image...${NC}"
gcloud builds submit --tag ${IMAGE_NAME} . || {
    echo -e "${RED}❌ Build failed. Check your Dockerfile and requirements.${NC}"
    exit 1
}

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 60 \
    --max-instances 10 \
    --set-env-vars "PORT=8000" \
    --set-env-vars "COPERNICUS_USER=${COPERNICUS_USER}" \
    --set-env-vars "COPERNICUS_PASS=${COPERNICUS_PASS}" || {
    echo -e "${RED}❌ Deployment failed.${NC}"
    exit 1
}

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Test the API: curl ${SERVICE_URL}/"
echo "2. Verify polygon endpoint: curl '${SERVICE_URL}/polygons?bbox=-75,35,-70,40'"
echo "3. Update Vercel environment variables if URL changed:"
echo "   POLYGONS_BACKEND_URL=${SERVICE_URL}"
echo "   NEXT_PUBLIC_POLYGONS_URL=${SERVICE_URL}"
echo ""
echo -e "${GREEN}🎣 Happy fishing with Always Bent!${NC}"
