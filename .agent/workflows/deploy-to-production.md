---
description: Deploy NexusFeed to Render + Vercel (Production)
---

# 🚀 Production Deployment Workflow

This workflow will deploy NexusFeed to production using:
- **Backend Services**: Render (5 microservices)
- **Frontend**: Vercel (Next.js UI)
- **Infrastructure**: Managed services (all free tier)

**Estimated Time**: 2 hours  
**Difficulty**: Easy (3/10)

---

## Phase 1: Setup Managed Infrastructure (30 mins)

### 1.1 MongoDB Atlas (Database)
1. Go to https://mongodb.com/cloud/atlas
2. Sign up / Login with Google
3. Create a new project: "NexusFeed"
4. Build a Database → M0 FREE tier
5. Provider: AWS, Region: closest to you
6. Cluster Name: "nexusfeed-cluster"
7. Create cluster (takes 3-5 minutes)

**Security Setup**:
- Database Access → Add New Database User
  - Username: `nexusfeed_user`
  - Password: (auto-generate strong password - SAVE IT!)
  - Role: Read and write to any database
- Network Access → Add IP Address → **Allow Access from Anywhere** (0.0.0.0/0)

**Get Connection String**:
- Click "Connect" → Drivers → Node.js
- Copy connection string:
  ```
  mongodb+srv://nexusfeed_user:<password>@nexusfeed-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
  ```
- Replace `<password>` with your actual password
- Add database name: `.../nexusfeed?retryWrites=true&w=majority`
- **SAVE THIS** as `MONGODB_URI`

---

### 1.2 Upstash Redis (Caching)
1. Go to https://upstash.com
2. Sign up with GitHub
3. Create Redis Database
   - Name: `nexusfeed-cache`
   - Type: Regional
   - Region: closest to you
   - Eviction: allkeys-lru
4. Go to Details tab
5. Copy **REST URL** (starts with `https://`)
6. Convert to Redis URL format:
   ```
   From: https://amazing-slug-12345.upstash.io
   To: rediss://default:<YOUR_TOKEN>@amazing-slug-12345.upstash.io:6379
   ```
7. **SAVE THIS** as `REDIS_URL`

---

### 1.3 CloudAMQP (RabbitMQ)
1. Go to https://customer.cloudamqp.com/login
2. Sign up (email or GitHub)
3. Create New Instance
   - Name: `nexusfeed-queue`
   - Plan: Lemur (FREE)
   - Region: closest to you
4. Click on instance → Details
5. Copy **AMQP URL**:
   ```
   amqps://username:password@hostname.cloudamqp.com/vhost
   ```
6. **SAVE THIS** as `RABBITMQ_URL`

---

### 1.4 Cloudinary (Media CDN)
1. Go to https://cloudinary.com/users/register_free
2. Sign up (email or GitHub)
3. Go to Dashboard
4. Copy these values:
   - Cloud Name: `dxxxxxx`
   - API Key: `123456789012345`
   - API Secret: `AbCdEfGhIjKlMnOpQrStUvWxYz`
5. **SAVE THESE** as:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

---

### 1.5 Generate JWT Secrets
Run this command to generate secure random strings:

```bash
# Generate JWT_SECRET (32 characters)
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET (32 characters)
openssl rand -base64 32
```

**SAVE THESE** as:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

---

## Phase 2: Deploy Backend to Render (60 mins)

### Important: Deploy in this ORDER!

1. Identity Service (required by all)
2. Post Service
3. Media Service
4. Search Service
5. API Gateway (LAST - needs all service URLs)

---

### 2.1 Deploy Identity Service

1. Go to https://render.com → Sign up with GitHub
2. New → Web Service
3. Connect your repository: `aarohb1507/microservices-social-app`
4. Configure:
   - **Name**: `nexusfeed-identity`
   - **Root Directory**: `identity-service`
   - **Environment**: Docker
   - **Plan**: Free
   - **Region**: Oregon (US West) or closest

5. **Environment Variables** (click "Advanced"):
   ```
   MONGODB_URI=<your-mongodb-uri-from-1.1>
   PORT=3001
   JWT_SECRET=<your-jwt-secret-from-1.5>
   JWT_REFRESH_SECRET=<your-jwt-refresh-secret-from-1.5>
   JWT_EXPIRY=20m
   JWT_REFRESH_EXPIRY=7d
   NODE_ENV=production
   REDIS_URL=<your-redis-url-from-1.2>
   CLIENT_URL=https://placeholder.vercel.app
   ```

6. Click **Create Web Service**
7. Wait for deployment (5-10 mins) ☕
8. **Copy the service URL**: `https://nexusfeed-identity.onrender.com`

---

### 2.2 Deploy Post Service

1. Render Dashboard → New → Web Service
2. Same repository: `aarohb1507/microservices-social-app`
3. Configure:
   - **Name**: `nexusfeed-post`
   - **Root Directory**: `post-service`
   - **Environment**: Docker
   - **Plan**: Free

4. **Environment Variables**:
   ```
   MONGODB_URI=<your-mongodb-uri>
   PORT=3002
   REDIS_URL=<your-redis-url>
   RABBITMQ_URL=<your-rabbitmq-url-from-1.3>
   API_GATEWAY_URL=https://placeholder.com
   IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
   CACHE_TTL_POSTS=300
   CACHE_TTL_POST=3600
   NODE_ENV=production
   CLIENT_URL=https://placeholder.vercel.app
   ```

5. Deploy → Wait 5-10 mins
6. **Copy URL**: `https://nexusfeed-post.onrender.com`

---

### 2.3 Deploy Media Service

1. New → Web Service
2. Configure:
   - **Name**: `nexusfeed-media`
   - **Root Directory**: `media-service`
   - **Environment**: Docker
   - **Plan**: Free

3. **Environment Variables**:
   ```
   MONGODB_URI=<your-mongodb-uri>
   PORT=3003
   REDIS_URL=<your-redis-url>
   RABBITMQ_URL=<your-rabbitmq-url>
   CLOUDINARY_CLOUD_NAME=<from-1.4>
   CLOUDINARY_API_KEY=<from-1.4>
   CLOUDINARY_API_SECRET=<from-1.4>
   API_GATEWAY_URL=https://placeholder.com
   IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
   NODE_ENV=production
   CLIENT_URL=https://placeholder.vercel.app
   ```

4. Deploy → Wait 5-10 mins
5. **Copy URL**: `https://nexusfeed-media.onrender.com`

---

### 2.4 Deploy Search Service

1. New → Web Service
2. Configure:
   - **Name**: `nexusfeed-search`
   - **Root Directory**: `search-service`
   - **Environment**: Docker
   - **Plan**: Free

3. **Environment Variables**:
   ```
   MONGODB_URI=<your-mongodb-uri>
   PORT=3004
   REDIS_URL=<your-redis-url>
   RABBITMQ_URL=<your-rabbitmq-url>
   API_GATEWAY_URL=https://placeholder.com
   IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
   POST_SERVICE_URL=https://nexusfeed-post.onrender.com
   CACHE_TTL_SEARCH=300
   NODE_ENV=production
   CLIENT_URL=https://placeholder.vercel.app
   ```

4. Deploy → Wait 5-10 mins
5. **Copy URL**: `https://nexusfeed-search.onrender.com`

---

### 2.5 Deploy API Gateway (LAST)

1. New → Web Service
2. Configure:
   - **Name**: `nexusfeed-gateway`
   - **Root Directory**: `api-gateway`
   - **Environment**: Docker
   - **Plan**: Free

3. **Environment Variables**:
   ```
   PORT=3000
   REDIS_URL=<your-redis-url>
   IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
   POST_SERVICE_URL=https://nexusfeed-post.onrender.com
   MEDIA_SERVICE_URL=https://nexusfeed-media.onrender.com
   SEARCH_SERVICE_URL=https://nexusfeed-search.onrender.com
   JWT_SECRET=<same-as-identity-service>
   CLIENT_URL=https://placeholder.vercel.app
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=1200
   NODE_ENV=production
   ```

4. Deploy → Wait 5-10 mins
5. **Copy URL**: `https://nexusfeed-gateway.onrender.com`

---

### 2.6 Update All Services with Gateway URL

Go back to services 2.2, 2.3, 2.4 and update:
- **API_GATEWAY_URL**: `https://nexusfeed-gateway.onrender.com`

In Render Dashboard:
1. Click on each service
2. Environment tab
3. Edit `API_GATEWAY_URL`
4. Save → Trigger manual deploy

---

## Phase 3: Deploy Frontend to Vercel (15 mins)

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repos

---

### 3.2 Deploy UI
1. New Project → Import Git Repository
2. Select: `aarohb1507/microservices-social-app`
3. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `ui`
   - **Build Command**: `npm run build` (auto)
   - **Output Directory**: `.next` (auto)
   - **Install Command**: `npm install` (auto)

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://nexusfeed-gateway.onrender.com
   ```

5. Click **Deploy**
6. Wait for build (3-5 minutes)
7. **Copy your Vercel URL**: `https://your-project-xyz.vercel.app`

---

### 3.3 Update Backend with Vercel URL

Go back to ALL Render services (all 5) and update:
- **CLIENT_URL**: `https://your-project-xyz.vercel.app`

1. Render Dashboard → Each service
2. Environment → Edit `CLIENT_URL`
3. Save → Manual deploy

**Wait for all services to redeploy (10-15 mins total)**

---

## Phase 4: Test Deployment (20 mins)

### 4.1 Test Health Endpoints

Open browser and check:
```
✅ https://nexusfeed-identity.onrender.com/health
✅ https://nexusfeed-post.onrender.com/health
✅ https://nexusfeed-media.onrender.com/health
✅ https://nexusfeed-search.onrender.com/health
✅ https://nexusfeed-gateway.onrender.com/health
```

Each should return: `{"status":"ok"}`

---

### 4.2 Test UI

1. Open: `https://your-project-xyz.vercel.app`
2. Register a new account
3. Create a post
4. Upload an image
5. Search for your post
6. Delete the post

---

### 4.3 Check Logs

If any errors occur:

1. **Render**: Dashboard → Service → Logs tab
2. **Vercel**: Dashboard → Project → Deployments → View Function Logs
3. **MongoDB**: Atlas → Database → Metrics (check connections)
4. **RabbitMQ**: CloudAMQP → Instance → Metrics

---

## 🎉 Deployment Complete!

Your NexusFeed app is now live at:
- **Frontend**: https://your-project-xyz.vercel.app
- **API Gateway**: https://nexusfeed-gateway.onrender.com

---

## 📊 Monitoring

### Free Tier Limits
- **Render**: 750 hours/month (monitor in dashboard)
- **MongoDB Atlas**: 512MB storage
- **Upstash**: 10k commands/day
- **CloudAMQP**: 1M messages/month
- **Cloudinary**: 25GB storage
- **Vercel**: Unlimited deployments

### Set Up UptimeRobot (Prevent Cold Starts)
1. Go to https://uptimerobot.com
2. Add monitors for each Render service
3. Check every 5 minutes
4. This keeps services "warm" (avoids 30s cold start)

---

## 🔧 Troubleshooting

### Service shows "Build Failed"
- Check Render logs
- Verify Dockerfile exists in service folder
- Check package.json scripts

### CORS Errors
- Verify CLIENT_URL matches Vercel URL exactly
- No trailing slash in URLs
- Check browser console for details

### 401 Unauthorized
- Verify JWT_SECRET matches between identity-service and api-gateway
- Clear browser cookies
- Check cookies are enabled

### Media Upload Fails
- Verify Cloudinary credentials
- Check file size (max 5MB)
- Check media-service logs

### Search No Results
- Wait 30 seconds after creating posts (indexing delay)
- Check RabbitMQ connection
- Trigger manual sync: POST to search-service

---

## 🚀 Next Steps

- [ ] Add custom domain (Vercel: Settings → Domains)
- [ ] Set up error tracking (Sentry)
- [ ] Enable MongoDB backups (Atlas: Backup tab)
- [ ] Add Google Analytics
- [ ] Set up UptimeRobot monitoring
- [ ] Create GitHub Actions CI/CD
