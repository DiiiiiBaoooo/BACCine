#!/bin/bash

# Cấu hình
PROJECT_ID="baccine"  # Thay bằng GCP Project ID của bạn
REGION="asia-southeast1"      # Region gần Việt Nam
SERVICE_NAME="movie-ticket-backend"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Starting deployment to Google Cloud Run..."

# 1. Set project
echo "📌 Setting GCP project..."
gcloud config set project $PROJECT_ID

# 2. Build Docker image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME .

# 3. Push to Google Container Registry
echo "📤 Pushing image to GCR..."
docker push $IMAGE_NAME

# 4. Deploy to Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "NODE_ENV=production"

echo "✅ Deployment completed!"
echo "🔗 Your service URL:"
gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'