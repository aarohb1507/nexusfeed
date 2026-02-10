# 🚀 NexusFeed Deployment Guide

## 📍 Live URLs

- **Frontend:** https://nexusfeed.vercel.app
- **API Gateway:** https://nexusfeed-gateway.fly.dev
- **Backend Services:** All deployed on Fly.io (Singapore region)

---

## 🏗️ Architecture

### Frontend
- **Platform:** Vercel
- **Framework:** Next.js + TypeScript
- **Cost:** FREE

### Backend Microservices (Fly.io)
- **API Gateway:** https://nexusfeed-gateway.fly.dev
- **Identity Service:** https://nexusfeed-identity.fly.dev
- **Post Service:** https://nexusfeed-post.fly.dev
- **Media Service:** https://nexusfeed-media.fly.dev
- **Search Service:** https://nexusfeed-search.fly.dev

**Configuration:** 1 machine per service (256MB RAM each)

### External Services
- **MongoDB:** Atlas M0 (FREE)
- **Redis:** Redis Cloud (FREE)
- **RabbitMQ:** CloudAMQP Lemur (FREE)
- **Media Storage:** Cloudinary (FREE)

---

## 💰 Cost

**Total:** ~$0-4/month (likely $0 due to Fly.io's <$5 invoice waiver)

- Vercel: $0
- Fly.io: ~$3.88/month (waived if under $5)
- All external services: $0

---

## 🔧 Deployment Commands

### Backend (Fly.io)

```bash
# Deploy a service
cd <service-directory>
flyctl deploy

# View logs
flyctl logs -a nexusfeed-<service-name>

# Update secrets
flyctl secrets set KEY=VALUE -a nexusfeed-<service-name>

# Scale machines
flyctl scale count 1 -a nexusfeed-<service-name>
```

### Frontend (Vercel)

```bash
cd ui
vercel --prod

# Update environment variables
vercel env add NEXT_PUBLIC_API_URL production
```

---

## 🌍 Environment Variables

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL`: https://nexusfeed-gateway.fly.dev

### Backend Services (Fly.io)
All services have:
- `CLIENT_URL`: https://nexusfeed.vercel.app
- `MONGODB_URI`: (from MongoDB Atlas)
- `REDIS_URL`: (from Redis Cloud)
- `RABBITMQ_URL`: (from CloudAMQP)

Service-specific variables are configured via Fly.io secrets.

---

## 📊 Monitoring

- **Fly.io Dashboard:** https://fly.io/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **MongoDB Atlas:** https://cloud.mongodb.com

---

## 🔄 Migration Notes

**Previous:** Render.com (had auto-sleep issues)
**Current:** Fly.io (always-on, reliable)

The migration was transparent to users - same frontend URL, improved backend reliability.

---

## 📝 Notes

- All services run in Singapore (sin) region for optimal performance
- High availability disabled to reduce costs (1 machine per service)
- CORS configured for Vercel frontend
- Services communicate via internal Fly.io networking
