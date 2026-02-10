#!/bin/bash

# NexusFeed Fly.io Deployment Script
# Run this after setting up Upstash Redis and CloudAMQP

set -e  # Exit on error

echo "🚀 NexusFeed Fly.io Deployment"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ Fly CLI not found. Installing...${NC}"
    brew install flyctl
fi

echo -e "${GREEN}✅ Fly CLI found${NC}"
echo ""

# Prompt for credentials
echo -e "${YELLOW}📝 Enter your service URLs:${NC}"
echo ""

read -p "Upstash Redis URL: " REDIS_URL
read -p "CloudAMQP RabbitMQ URL: " RABBITMQ_URL
read -p "Vercel UI URL (or press enter to skip): " CLIENT_URL

if [ -z "$CLIENT_URL" ]; then
    CLIENT_URL="http://localhost:3005"
fi

echo ""
echo -e "${GREEN}Starting deployment...${NC}"
echo ""

# MongoDB (already configured)
MONGODB_URI="mongodb+srv://aarohb1507_db_user:oYQwXwOCKxwRGHN2@cluster0.p7scfqn.mongodb.net/?appName=Cluster0"
JWT_SECRET="ujdencikmdecokmdcok290dcswvghnßlklwodeskowql"

# Cloudinary (already configured)
CLOUDINARY_NAME="ddsqzvt6z"
CLOUDINARY_KEY="856373348936954"
CLOUDINARY_SECRET="9z5cLj1UUEZaUOIPN4qczZdHCZ4"

# Deploy Identity Service
echo -e "${YELLOW}📦 Deploying Identity Service...${NC}"
cd identity-service
flyctl launch --name nexusfeed-identity --copy-config --yes || true
flyctl secrets set \
  MONGODB_URI="$MONGODB_URI" \
  JWT_SECRET="$JWT_SECRET" \
  REDIS_URL="$REDIS_URL" \
  CLIENT_URL="$CLIENT_URL"
flyctl deploy
cd ..
echo -e "${GREEN}✅ Identity Service deployed${NC}"
echo ""

# Deploy Post Service
echo -e "${YELLOW}📦 Deploying Post Service...${NC}"
cd post-service
flyctl launch --name nexusfeed-post --copy-config --yes || true
flyctl secrets set \
  MONGODB_URI="$MONGODB_URI" \
  JWT_SECRET="$JWT_SECRET" \
  REDIS_URL="$REDIS_URL" \
  RABBITMQ_URL="$RABBITMQ_URL" \
  IDENTITY_SERVICE_URL="https://nexusfeed-identity.fly.dev" \
  CLIENT_URL="$CLIENT_URL"
flyctl deploy
cd ..
echo -e "${GREEN}✅ Post Service deployed${NC}"
echo ""

# Deploy Media Service
echo -e "${YELLOW}📦 Deploying Media Service...${NC}"
cd media-service
flyctl launch --name nexusfeed-media --copy-config --yes || true
flyctl secrets set \
  MONGODB_URI="$MONGODB_URI" \
  cloud_name="$CLOUDINARY_NAME" \
  api_key="$CLOUDINARY_KEY" \
  api_secret="$CLOUDINARY_SECRET" \
  REDIS_URL="$REDIS_URL" \
  RABBITMQ_URL="$RABBITMQ_URL" \
  IDENTITY_SERVICE_URL="https://nexusfeed-identity.fly.dev" \
  CLIENT_URL="$CLIENT_URL"
flyctl deploy
cd ..
echo -e "${GREEN}✅ Media Service deployed${NC}"
echo ""

# Deploy Search Service
echo -e "${YELLOW}📦 Deploying Search Service...${NC}"
cd search-service
flyctl launch --name nexusfeed-search --copy-config --yes || true
flyctl secrets set \
  MONGODB_URI="$MONGODB_URI" \
  JWT_SECRET="$JWT_SECRET" \
  REDIS_URL="$REDIS_URL" \
  RABBITMQ_URL="$RABBITMQ_URL" \
  IDENTITY_SERVICE_URL="https://nexusfeed-identity.fly.dev" \
  POST_SERVICE_URL="https://nexusfeed-post.fly.dev" \
  CLIENT_URL="$CLIENT_URL"
flyctl deploy
cd ..
echo -e "${GREEN}✅ Search Service deployed${NC}"
echo ""

# Deploy API Gateway
echo -e "${YELLOW}📦 Deploying API Gateway...${NC}"
cd api-gateway
flyctl launch --name nexusfeed-gateway --copy-config --yes || true
flyctl secrets set \
  JWT_SECRET="$JWT_SECRET" \
  REDIS_URL="$REDIS_URL" \
  IDENTITY_SERVICE_URL="https://nexusfeed-identity.fly.dev" \
  POST_SERVICE_URL="https://nexusfeed-post.fly.dev" \
  MEDIA_SERVICE_URL="https://nexusfeed-media.fly.dev" \
  SEARCH_SERVICE_URL="https://nexusfeed-search.fly.dev" \
  CLIENT_URL="$CLIENT_URL"
flyctl deploy
cd ..
echo -e "${GREEN}✅ API Gateway deployed${NC}"
echo ""

# Summary
echo ""
echo "================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================"
echo ""
echo "Your services are now live:"
echo ""
echo "🔐 Identity: https://nexusfeed-identity.fly.dev"
echo "📮 Post:     https://nexusfeed-post.fly.dev"
echo "📷 Media:    https://nexusfeed-media.fly.dev"
echo "🔍 Search:   https://nexusfeed-search.fly.dev"
echo "🌐 Gateway:  https://nexusfeed-gateway.fly.dev"
echo ""
echo "Next steps:"
echo "1. Deploy UI to Vercel with:"
echo "   NEXT_PUBLIC_API_URL=https://nexusfeed-gateway.fly.dev"
echo ""
echo "2. Update API Gateway CLIENT_URL if needed:"
echo "   cd api-gateway && flyctl secrets set CLIENT_URL=<your-vercel-url>"
echo ""
echo "3. Test the API:"
echo "   curl https://nexusfeed-gateway.fly.dev/health"
echo ""
