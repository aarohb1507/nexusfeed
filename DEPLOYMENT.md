# NexusFeed Deployment Guide 🚀

Complete step-by-step guide to deploy NexusFeed to the cloud with free tier options.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Understanding Docker & Environment Variables](#understanding-docker--environment-variables)
3. [Local Development Setup](#local-development-setup)
4. [Cloud Deployment Strategy](#cloud-deployment-strategy)
5. [Step-by-Step Deployment](#step-by-step-deployment)
6. [Post-Deployment Testing](#post-deployment-testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Accounts Needed (All Free Tier Available)
- ✅ GitHub account (code hosting)
- ✅ MongoDB Atlas (free M0 cluster - 512MB)
- ✅ Upstash or RedisCloud (free Redis instance)
- ✅ CloudAMQP (free Lemur plan - RabbitMQ)
- ✅ Cloudinary (free tier - 25GB storage)
- ✅ Vercel (frontend deployment)
- ✅ Render or Railway (backend services - 750 free hours/month)

### Tools Installed Locally
```bash
node -v  # v18+ required
npm -v
docker -v  # for local testing
git -v
```

---

## Understanding Docker & Environment Variables

### How Docker Handles Environment Variables

**Question: How does Docker automatically set envs for each service?**

**Answer:** Docker has multiple ways to inject environment variables into containers:

#### 1. Docker Compose - `env_file` (Local Development)
```yaml
identity-service:
  env_file:
    - ./identity-service/.env  # Reads all vars from this file
  environment:
    # These override values from .env file
    MONGODB_URI: mongodb://root:rootpassword@mongo:27017/nexusfeed
```

**How it works:**
- Docker reads `identity-service/.env` and sets ALL variables as environment variables inside the container
- Your Node.js code uses `process.env.MONGODB_URI` which reads from the container's environment
- `dotenv` package is NOT needed for Docker (but useful for local `npm start`)

#### 2. Cloud Platforms - Environment Variable Injection
Platforms like Render/Railway inject envs directly into the container at runtime:
- You set envs in the platform dashboard
- Platform injects them as environment variables before starting the container
- Your code reads `process.env.X` - same as Docker

#### 3. Dockerfile `ENV` (Build-Time Defaults)
```dockerfile
ENV NODE_ENV=production
ENV PORT=3001
```
- These are **baked into the image** at build time
- Should only be used for non-secret defaults
- Can be overridden by docker-compose or cloud platform envs

### Service Startup Sequence

**Question: How do services start in the correct order?**

**Answer:** Use `depends_on` with health checks in docker-compose.yml:

```yaml
post-service:
  depends_on:
    mongo:
      condition: service_healthy  # Waits for mongo health check to pass
    redis:
      condition: service_healthy
    rabbitmq:
      condition: service_healthy
```

**In Cloud Deployments:**
- Services are deployed independently
- Each service must handle connection retries (RabbitMQ/MongoDB reconnection logic)
- Health checks ensure platform doesn't route traffic until service is ready

---

## Local Development Setup

### Step 1: Create Local .env Files

For each service, copy `.env.example` to `.env`:

```bash
cd identity-service && cp .env.example .env && cd ..
cd post-service && cp .env.example .env && cd ..
cd media-service && cp .env.example .env && cd ..
cd search-service && cp .env.example .env && cd ..
cd api-gateway && cp .env.example .env && cd ..
cd ui && cp .env.example .env.local && cd ..
```

### Step 2: Fill in Local Values

Edit each `.env` file with local Docker values:

**identity-service/.env:**
```env
MONGODB_URI=mongodb://root:rootpassword@mongo:27017/nexusfeed?authSource=admin
PORT=3001
JWT_SECRET=local-dev-secret-change-in-production
JWT_REFRESH_SECRET=local-dev-refresh-secret
JWT_EXPIRY=20m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=development
REDIS_URL=redis://redis:6379
CLIENT_URL=http://localhost:3005
```

**post-service/.env:**
```env
MONGODB_URI=mongodb://root:rootpassword@mongo:27017/nexusfeed?authSource=admin
PORT=3002
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
API_GATEWAY_URL=http://api-gateway:3000
IDENTITY_SERVICE_URL=http://identity-service:3001
CACHE_TTL_POSTS=300
CACHE_TTL_POST=3600
NODE_ENV=development
CLIENT_URL=http://localhost:3005
```

**media-service/.env:**
```env
MONGODB_URI=mongodb://root:rootpassword@mongo:27017/nexusfeed?authSource=admin
PORT=3003
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
API_GATEWAY_URL=http://api-gateway:3000
IDENTITY_SERVICE_URL=http://identity-service:3001
NODE_ENV=development
CLIENT_URL=http://localhost:3005
```

**search-service/.env:**
```env
MONGODB_URI=mongodb://root:rootpassword@mongo:27017/nexusfeed?authSource=admin
PORT=3004
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
API_GATEWAY_URL=http://api-gateway:3000
IDENTITY_SERVICE_URL=http://identity-service:3001
POST_SERVICE_URL=http://post-service:3002
CACHE_TTL_SEARCH=300
NODE_ENV=development
CLIENT_URL=http://localhost:3005
```

**api-gateway/.env:**
```env
PORT=3000
REDIS_URL=redis://redis:6379
IDENTITY_SERVICE_URL=http://identity-service:3001
POST_SERVICE_URL=http://post-service:3002
MEDIA_SERVICE_URL=http://media-service:3003
SEARCH_SERVICE_URL=http://search-service:3004
JWT_SECRET=local-dev-secret-change-in-production
CLIENT_URL=http://localhost:3005
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1200
NODE_ENV=development
```

**ui/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CLIENT_URL=http://localhost:3005
```

### Step 3: Test Locally with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Check logs
docker-compose logs -f

# Test health endpoints
curl http://localhost:3001/health  # identity
curl http://localhost:3002/health  # post
curl http://localhost:3003/health  # media
curl http://localhost:3004/health  # search
curl http://localhost:3000/health  # gateway

# Access UI
open http://localhost:3005
```

---

## Cloud Deployment Strategy

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Vercel (Frontend)                             │
│  - UI (Next.js)                                │
│  - NEXT_PUBLIC_API_URL → API Gateway URL       │
└─────────────────────────────────────────────────┘
                    │
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────────┐
│  Render/Railway (Backend Services)             │
│  ┌──────────────────────────────────────────┐  │
│  │ API Gateway (3000)                       │  │
│  │ - Routes to all services                 │  │
│  │ - JWT validation                         │  │
│  │ - Rate limiting                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Identity Service (3001)                  │  │
│  │ - User auth & tokens                     │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Post Service (3002)                      │  │
│  │ - Post CRUD + caching                    │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Media Service (3003)                     │  │
│  │ - File uploads → Cloudinary              │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Search Service (3004)                    │  │
│  │ - Full-text search                       │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    │
                    │ Connections
                    ▼
┌─────────────────────────────────────────────────┐
│  Managed Infrastructure (All Free Tier)        │
│  - MongoDB Atlas (database)                    │
│  - Upstash/RedisCloud (cache)                  │
│  - CloudAMQP (message queue)                   │
│  - Cloudinary (media CDN)                      │
└─────────────────────────────────────────────────┘
```

### Why This Approach?

1. **Simplicity**: Each service is independently deployable
2. **Free Tier**: All platforms offer generous free tiers
3. **No Docker Required in Cloud**: Platforms handle containerization
4. **Auto-scaling**: Services scale independently
5. **Easy Env Management**: Set envs in platform dashboards

---

## Step-by-Step Deployment

### Phase 1: Setup Managed Infrastructure (30 mins)

#### 1.1 MongoDB Atlas
```
1. Go to mongodb.com/cloud/atlas
2. Create free account
3. Create M0 cluster (free)
4. Add Database User: nexusfeed_user / <strong-password>
5. Network Access: Add 0.0.0.0/0 (allow all IPs)
6. Get connection string:
   mongodb+srv://nexusfeed_user:<password>@cluster0.xxxxx.mongodb.net/nexusfeed?retryWrites=true&w=majority
7. Save as MONGODB_URI
```

#### 1.2 Upstash Redis
```
1. Go to upstash.com
2. Create free account
3. Create Redis database
4. Copy connection string:
   rediss://default:<password>@<host>:6379
5. Save as REDIS_URL
```

#### 1.3 CloudAMQP RabbitMQ
```
1. Go to cloudamqp.com
2. Create free account
3. Create Lemur instance (free)
4. Copy AMQP URL:
   amqps://username:password@<host>/vhost
5. Save as RABBITMQ_URL
```

#### 1.4 Cloudinary
```
1. Go to cloudinary.com
2. Create free account
3. Go to Dashboard
4. Copy:
   - Cloud Name
   - API Key
   - API Secret
5. Save as CLOUDINARY_* variables
```

### Phase 2: Deploy Backend Services to Render (60 mins)

#### Why Render?
- Easy GitHub integration
- Dockerfile support
- Free 750 hours/month
- Auto-deploy on push
- Built-in env management

#### 2.1 Deploy Identity Service

```
1. Go to render.com → Sign up with GitHub
2. New → Web Service
3. Connect repository: <your-repo>
4. Configure:
   Name: nexusfeed-identity
   Root Directory: identity-service
   Environment: Docker
   Docker Command: (leave empty, uses Dockerfile)
   Plan: Free
   
5. Add Environment Variables:
   MONGODB_URI=<your-mongodb-atlas-uri>
   PORT=3001
   JWT_SECRET=<generate-strong-random-string-32-chars>
   JWT_REFRESH_SECRET=<generate-another-random-string>
   JWT_EXPIRY=20m
   JWT_REFRESH_EXPIRY=7d
   NODE_ENV=production
   REDIS_URL=<your-upstash-redis-url>
   CLIENT_URL=<will-add-vercel-url-later>

6. Click "Create Web Service"
7. Wait for deployment (5-10 mins)
8. Copy service URL: https://nexusfeed-identity.onrender.com
```

#### 2.2 Deploy Post Service

```
1. Render Dashboard → New → Web Service
2. Same repository
3. Configure:
   Name: nexusfeed-post
   Root Directory: post-service
   Environment: Docker
   Plan: Free
   
4. Add Environment Variables:
   MONGODB_URI=<your-mongodb-atlas-uri>
   PORT=3002
   REDIS_URL=<your-upstash-redis-url>
   RABBITMQ_URL=<your-cloudamqp-url>
   API_GATEWAY_URL=<will-add-later>
   IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
   CACHE_TTL_POSTS=300
   CACHE_TTL_POST=3600
   NODE_ENV=production
   CLIENT_URL=<will-add-vercel-url-later>

5. Deploy
6. Copy URL: https://nexusfeed-post.onrender.com
```

#### 2.3 Deploy Media Service

```
1. New Web Service
2. Configure:
   Name: nexusfeed-media
   Root Directory: media-service
   Environment: Docker
   
3. Environment Variables:
   MONGODB_URI=<your-mongodb-atlas-uri>
   PORT=3003
   REDIS_URL=<your-upstash-redis-url>
   RABBITMQ_URL=<your-cloudamqp-url>
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
   CLOUDINARY_API_KEY=<your-cloudinary-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-secret>
   API_GATEWAY_URL=<will-add-later>
   IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
   NODE_ENV=production
   CLIENT_URL=<will-add-vercel-url-later>

4. Deploy
5. Copy URL: https://nexusfeed-media.onrender.com
```

#### 2.4 Deploy Search Service

```
1. New Web Service
2. Configure:
   Name: nexusfeed-search
   Root Directory: search-service
   Environment: Docker
   
3. Environment Variables:
   MONGODB_URI=<your-mongodb-atlas-uri>
   PORT=3004
   REDIS_URL=<your-upstash-redis-url>
   RABBITMQ_URL=<your-cloudamqp-url>
   API_GATEWAY_URL=<will-add-later>
   IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
   POST_SERVICE_URL=https://nexusfeed-post.onrender.com
   CACHE_TTL_SEARCH=300
   NODE_ENV=production
   CLIENT_URL=<will-add-vercel-url-later>

4. Deploy
5. Copy URL: https://nexusfeed-search.onrender.com
```

#### 2.5 Deploy API Gateway (LAST)

```
1. New Web Service
2. Configure:
   Name: nexusfeed-gateway
   Root Directory: api-gateway
   Environment: Docker
   
3. Environment Variables:
   PORT=3000
   REDIS_URL=<your-upstash-redis-url>
   IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
   POST_SERVICE_URL=https://nexusfeed-post.onrender.com
   MEDIA_SERVICE_URL=https://nexusfeed-media.onrender.com
   SEARCH_SERVICE_URL=https://nexusfeed-search.onrender.com
   JWT_SECRET=<same-as-identity-service>
   CLIENT_URL=<will-add-vercel-url-later>
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=1200
   NODE_ENV=production

4. Deploy
5. Copy URL: https://nexusfeed-gateway.onrender.com
```

#### 2.6 Update Service URLs

Go back to each service and update these envs:
- `API_GATEWAY_URL=https://nexusfeed-gateway.onrender.com`
- `CLIENT_URL=https://<will-get-from-vercel>.vercel.app`

### Phase 3: Deploy Frontend to Vercel (15 mins)

#### 3.1 Connect GitHub to Vercel

```
1. Go to vercel.com → Sign up with GitHub
2. New Project → Import Git Repository
3. Select your repository
4. Configure:
   Framework Preset: Next.js
   Root Directory: ui
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
```

#### 3.2 Add Environment Variables

```
In Vercel Dashboard → Settings → Environment Variables:

Production:
  NEXT_PUBLIC_API_URL=https://nexusfeed-gateway.onrender.com

Preview (optional):
  NEXT_PUBLIC_API_URL=https://nexusfeed-gateway.onrender.com

Development (optional):
  NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### 3.3 Deploy

```
1. Click "Deploy"
2. Wait for build (3-5 mins)
3. Get URL: https://<your-project>.vercel.app
```

#### 3.4 Update Backend CLIENT_URL

Go back to ALL Render services and update:
```
CLIENT_URL=https://<your-project>.vercel.app
```

Click "Manual Deploy" on each service to apply changes.

---

## Post-Deployment Testing

### Test API Gateway
```bash
curl https://nexusfeed-gateway.onrender.com/health
```

### Test Each Service
```bash
curl https://nexusfeed-identity.onrender.com/health
curl https://nexusfeed-post.onrender.com/health
curl https://nexusfeed-media.onrender.com/health
curl https://nexusfeed-search.onrender.com/health
```

### Test Full Flow
```
1. Open https://<your-project>.vercel.app
2. Register new account
3. Create a post
4. Upload media
5. Search for posts
6. Delete a post
```

---

## Troubleshooting

### Issue: Service shows "Build failed"
**Solution:**
- Check Render logs
- Verify Dockerfile exists in service folder
- Ensure package.json has correct start script

### Issue: Service shows "Deployed" but doesn't work
**Solution:**
- Check service logs in Render dashboard
- Verify all environment variables are set
- Test connection to MongoDB/Redis/RabbitMQ

### Issue: CORS errors in browser
**Solution:**
- Ensure CLIENT_URL is set correctly in all backend services
- Verify Vercel URL matches CLIENT_URL exactly
- Check browser console for exact error

### Issue: 401 Unauthorized
**Solution:**
- Verify JWT_SECRET matches between identity-service and api-gateway
- Check cookies are enabled in browser
- Clear browser cookies and try again

### Issue: Media upload fails
**Solution:**
- Verify Cloudinary credentials in media-service
- Check file size (max 5MB)
- Check media-service logs

### Issue: Search returns no results
**Solution:**
- Wait 30 seconds after creating posts (indexing delay)
- Check RabbitMQ connection in search-service logs
- Trigger manual sync: POST https://nexusfeed-search.onrender.com/api/search/sync

---

## Cost Breakdown (Free Tier Limits)

| Service | Free Tier | Limit |
|---------|-----------|-------|
| Render | 750 hours/month | 5 services × 150 hours = enough for 1 app |
| Vercel | Unlimited | Hobby plan sufficient |
| MongoDB Atlas | 512MB storage | ~100k posts |
| Upstash Redis | 10k commands/day | Sufficient for testing |
| CloudAMQP | 1M messages/month | More than enough |
| Cloudinary | 25GB storage | ~25k images |

**Total Cost: $0/month** (within free tiers)

---

## Maintenance

### Monitoring
- Render: Built-in metrics and logs
- Vercel: Analytics dashboard
- MongoDB: Atlas monitoring
- Upstash: Redis dashboard

### Scaling
When you exceed free tier:
1. Upgrade Render to paid plan ($7/month per service)
2. Upgrade MongoDB Atlas to M10 cluster ($10/month)
3. Upgrade Redis to higher tier
4. Consider Kubernetes for advanced scaling

---

## Security Checklist

- [x] JWT secrets are strong random strings (32+ characters)
- [x] Passwords are hashed with argon2
- [x] Environment variables are not committed to Git
- [x] HTTPS is enforced (Render/Vercel provide SSL)
- [x] CORS is configured with specific origins
- [x] Rate limiting is enabled
- [x] MongoDB access is restricted to services
- [x] Cookies are httpOnly and secure

---

## Next Steps

1. ✅ **Custom Domain**: Add custom domain in Vercel
2. ✅ **Monitoring**: Set up error tracking (Sentry)
3. ✅ **CI/CD**: GitHub Actions for automated testing
4. ✅ **Backup**: Enable MongoDB Atlas backups
5. ✅ **Analytics**: Add Google Analytics or Plausible

---

**🎉 Congratulations! Your NexusFeed app is now live!**

Share your deployed URL and showcase this project in your portfolio!
