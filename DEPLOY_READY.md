# 🚀 PRODUCTION DEPLOYMENT - COPY-PASTE READY

**Status**: ⚠️ Need Redis password, then ready to deploy!

---

## 🔑 Get Redis Password

1. Go to your Redis Cloud dashboard: https://app.redislabs.com/
2. Click on your database
3. Look for "Default user password" or "Security" tab
4. Copy the password
5. Replace `<REDIS_PASSWORD>` below with your password

---

## 📋 RENDER ENVIRONMENT VARIABLES (Copy-Paste for Each Service)

### 1️⃣ IDENTITY SERVICE

**Root Directory**: `identity-service`

```
MONGODB_URI=mongodb+srv://aarohb1507_db_user:oYQwXwOCKxwRGHN2@cluster0.p7scfqn.mongodb.net/nexusfeed?appName=Cluster0
PORT=3001
JWT_SECRET=VIcd4TPTVgFKfaB4VOnU9F7vI9TB2oL1LMfJSekHjQk=
JWT_REFRESH_SECRET=6snqzJsdJRGk+TDYHHMMnCH9JHexN9i0zyyRR6L6bLg=
JWT_EXPIRY=20m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=production
REDIS_URL=redis://default:<REDIS_PASSWORD>@redis-16682.c264.ap-south-1-1.ec2.cloud.redislabs.com:16682
CLIENT_URL=https://placeholder.vercel.app
```

---

### 2️⃣ POST SERVICE

**Root Directory**: `post-service`

```
MONGODB_URI=mongodb+srv://aarohb1507_db_user:oYQwXwOCKxwRGHN2@cluster0.p7scfqn.mongodb.net/nexusfeed?appName=Cluster0
PORT=3002
REDIS_URL=redis://default:<REDIS_PASSWORD>@redis-16682.c264.ap-south-1-1.ec2.cloud.redislabs.com:16682
RABBITMQ_URL=amqps://rkbqfzib:a2EbmapRKf7u2jAkmF96TM7BaBdjOlVA@chameleon.lmq.cloudamqp.com/rkbqfzib
API_GATEWAY_URL=https://placeholder.com
IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
CACHE_TTL_POSTS=300
CACHE_TTL_POST=3600
NODE_ENV=production
CLIENT_URL=https://placeholder.vercel.app
```

---

### 3️⃣ MEDIA SERVICE

**Root Directory**: `media-service`

**⚠️ IMPORTANT**: Use lowercase for Cloudinary variables!

```
MONGODB_URI=mongodb+srv://aarohb1507_db_user:oYQwXwOCKxwRGHN2@cluster0.p7scfqn.mongodb.net/nexusfeed?appName=Cluster0
PORT=3003
REDIS_URL=redis://default:<REDIS_PASSWORD>@redis-16682.c264.ap-south-1-1.ec2.cloud.redislabs.com:16682
RABBITMQ_URL=amqps://rkbqfzib:a2EbmapRKf7u2jAkmF96TM7BaBdjOlVA@chameleon.lmq.cloudamqp.com/rkbqfzib
cloud_name=ddsqzvt6z
api_key=856373348936954
api_secret=9z5cLj1UUEZaUOIPN4qczZdHCZ4
API_GATEWAY_URL=https://placeholder.com
IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
NODE_ENV=production
CLIENT_URL=https://placeholder.vercel.app
```

---

### 4️⃣ SEARCH SERVICE

**Root Directory**: `search-service`

```
MONGODB_URI=mongodb+srv://aarohb1507_db_user:oYQwXwOCKxwRGHN2@cluster0.p7scfqn.mongodb.net/nexusfeed?appName=Cluster0
PORT=3004
REDIS_URL=redis://default:<REDIS_PASSWORD>@redis-16682.c264.ap-south-1-1.ec2.cloud.redislabs.com:16682
RABBITMQ_URL=amqps://rkbqfzib:a2EbmapRKf7u2jAkmF96TM7BaBdjOlVA@chameleon.lmq.cloudamqp.com/rkbqfzib
API_GATEWAY_URL=https://placeholder.com
IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
POST_SERVICE_URL=https://nexusfeed-post.onrender.com
CACHE_TTL_SEARCH=300
NODE_ENV=production
CLIENT_URL=https://placeholder.vercel.app
```

---

### 5️⃣ API GATEWAY (Deploy LAST)

**Root Directory**: `api-gateway`

```
PORT=3000
REDIS_URL=redis://default:<REDIS_PASSWORD>@redis-16682.c264.ap-south-1-1.ec2.cloud.redislabs.com:16682
IDENTITY_SERVICE_URL=https://nexusfeed-identity.onrender.com
POST_SERVICE_URL=https://nexusfeed-post.onrender.com
MEDIA_SERVICE_URL=https://nexusfeed-media.onrender.com
SEARCH_SERVICE_URL=https://nexusfeed-search.onrender.com
JWT_SECRET=VIcd4TPTVgFKfaB4VOnU9F7vI9TB2oL1LMfJSekHjQk=
CLIENT_URL=https://placeholder.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1200
NODE_ENV=production
```

---

## 🎯 DEPLOYMENT STEPS

### Phase 1: Get Redis Password (2 mins)
1. Go to https://app.redislabs.com/
2. Find your database password
3. Replace `<REDIS_PASSWORD>` in ALL env vars above

### Phase 2: Deploy to Render (60 mins)

**For EACH service (1-5 above):**

1. Go to https://render.com
2. New → Web Service
3. Connect repo: `aarohb1507/microservices-social-app`
4. Configure:
   - **Name**: `nexusfeed-<service-name>`
   - **Root Directory**: (see above for each service)
   - **Environment**: Docker
   - **Plan**: Free
5. **Environment Variables**: Copy-paste the entire block above
6. Click "Create Web Service"
7. **SAVE THE URL** (e.g., `https://nexusfeed-identity.onrender.com`)
8. Wait for deployment (5-10 mins)

**Deploy in this ORDER**:
1. Identity Service (others depend on it)
2. Post Service
3. Media Service
4. Search Service
5. API Gateway (needs all other URLs)

### Phase 3: Update Service URLs (10 mins)

After deploying all 5 services, go back and update:

**In services 2, 3, 4** (Post, Media, Search):
- Update `API_GATEWAY_URL` to actual gateway URL

**In ALL services**:
- Update `CLIENT_URL` to Vercel URL (after deploying UI)

### Phase 4: Deploy UI to Vercel (15 mins)

1. Go to https://vercel.com
2. New Project → Import `aarohb1507/microservices-social-app`
3. Configure:
   - **Root Directory**: `ui`
   - **Framework**: Next.js (auto-detected)
4. **Environment Variable**:
   ```
   NEXT_PUBLIC_API_URL=https://nexusfeed-gateway.onrender.com
   ```
5. Deploy
6. **SAVE VERCEL URL**

### Phase 5: Final Update (5 mins)

Update ALL 5 Render services:
- Change `CLIENT_URL` to your Vercel URL
- Trigger manual deploy on each

---

## ✅ CHECKLIST

- [ ] Got Redis password
- [ ] Replaced `<REDIS_PASSWORD>` in all env vars
- [ ] Deployed Identity Service → Saved URL
- [ ] Deployed Post Service → Saved URL
- [ ] Deployed Media Service → Saved URL
- [ ] Deployed Search Service → Saved URL
- [ ] Deployed API Gateway → Saved URL
- [ ] Updated API_GATEWAY_URL in services 2-4
- [ ] Deployed UI to Vercel → Saved URL
- [ ] Updated CLIENT_URL in all 5 services
- [ ] Tested all health endpoints
- [ ] Tested full app flow

---

**Ready to deploy once you have Redis password!** 🚀
