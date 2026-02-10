# 🚀 NexusFeed - Fly.io Deployment

Complete deployment guide for deploying NexusFeed microservices to Fly.io.

---

## 📚 Documentation Index

| File | Purpose | Read This If... |
|------|---------|-----------------|
| **[FLYIO_QUICKSTART.md](FLYIO_QUICKSTART.md)** | ⚡ Fast deployment | You want step-by-step deployment NOW |
| **[FLYIO_DEPLOYMENT_GUIDE.md](FLYIO_DEPLOYMENT_GUIDE.md)** | 📖 Detailed guide | You want to understand everything |
| **[FLYIO_ARCHITECTURE.md](FLYIO_ARCHITECTURE.md)** | 🎨 Visual diagrams | You want to see the architecture |
| **[FLYIO_TROUBLESHOOTING.md](FLYIO_TROUBLESHOOTING.md)** | 🔧 Fix issues | Something's not working |
| **[deploy-flyio.sh](deploy-flyio.sh)** | 🤖 Auto-deploy script | You want automated deployment |

---

## ⚡ Quick Start (5 mins to first deploy)

### **Prerequisites:**
1. ✅ Fly.io account (free) - https://fly.io
2. ✅ Upstash Redis (free) - https://upstash.com
3. ✅ CloudAMQP (free) - https://cloudamqp.com
4. ✅ Credit card (for Fly.io verification - won't charge on free tier)

### **Deploy:**

```bash
# 1. Install Fly CLI
brew install flyctl

# 2. Login to Fly.io
flyctl auth login

# 3. Run deployment script
./deploy-flyio.sh
# Enter your Redis URL and RabbitMQ URL when prompted

# 4. Deploy UI to Vercel
cd ui
vercel --prod

# Done! 🎉
```

**Total time:** 30-45 minutes  
**Total cost:** ~$10/month (or $0 with optimization)

---

## 📊 What Gets Deployed

### **Backend (Fly.io):**
- ✅ API Gateway - `https://nexusfeed-gateway.fly.dev`
- ✅ Identity Service - `https://nexusfeed-identity.fly.dev`
- ✅ Post Service - `https://nexusfeed-post.fly.dev`
- ✅ Media Service - `https://nexusfeed-media.fly.dev`
- ✅ Search Service - `https://nexusfeed-search.fly.dev`

### **Frontend (Vercel):**
- ✅ Next.js UI - `https://nexusfeed-xxxxx.vercel.app`

### **Databases (External Free Services):**
- ✅ MongoDB Atlas (M0 Free)
- ✅ Upstash Redis (Free)
- ✅ CloudAMQP RabbitMQ (Lemur Free)
- ✅ Cloudinary (Free)

---

## 💰 Cost Breakdown

| Service | Provider | Cost/Month |
|---------|----------|------------|
| 5 Backend Services (256MB each) | Fly.io | $9.70 |
| Frontend | Vercel | FREE |
| MongoDB | Atlas | FREE |
| Redis | Upstash | FREE |
| RabbitMQ | CloudAMQP | FREE |
| Media Storage | Cloudinary | FREE |
| **TOTAL** | | **~$10/month** |

**In Indian Rupees:** ₹840/month

### **Want $0/month?**
Combine services to fit in 3 free VMs. See [FLYIO_QUICKSTART.md](FLYIO_QUICKSTART.md) for details.

---

## 🎯 Deployment Strategy

### **Recommended: Standard Deployment ($10/month)**

```
✅ Best for: Resume/portfolio projects
✅ Setup time: 30-45 mins
✅ Maintenance: Minimal
✅ Performance: Good
✅ Reliability: Excellent
```

Deploy all 5 services separately for best performance and reliability.

### **Budget: Free Tier Optimization ($0/month)**

```
⚠️  Best for: Testing/learning
⚠️  Setup time: 2-3 hours
⚠️  Maintenance: Medium
⚠️  Performance: Acceptable
⚠️  Reliability: Good
```

Combine services to use only 3 VMs (Fly.io free tier limit).

---

## 📋 Deployment Checklist

### **Before You Start:**
- [ ] MongoDB Atlas account created (free M0 cluster)
- [ ] Upstash Redis account created
- [ ] CloudAMQP account created (Lemur free plan)
- [ ] Cloudinary credentials (already have: `ddsqzvt6z`)
- [ ] Fly.io account with credit card added
- [ ] Fly CLI installed (`brew install flyctl`)

### **During Deployment:**
- [ ] All 5 backend services deployed to Fly.io
- [ ] All secrets set correctly
- [ ] Health checks passing
- [ ] UI deployed to Vercel
- [ ] Environment variables set in Vercel

### **After Deployment:**
- [ ] Test registration/login
- [ ] Test creating post
- [ ] Test image upload
- [ ] Test search
- [ ] All features working
- [ ] URLs saved for resume

---

## 🚨 Common Issues

| Issue | Quick Fix |
|-------|-----------|
| "app name taken" | Change `app` name in `fly.toml` |
| "health check failed" | Check `flyctl logs -a app-name` |
| CORS error | Update `CLIENT_URL` secret |
| MongoDB won't connect | Verify `MONGODB_URI` secret |
| Out of memory | Increase to 512MB in `fly.toml` |

**Full troubleshooting:** See [FLYIO_TROUBLESHOOTING.md](FLYIO_TROUBLESHOOTING.md)

---

## 📖 Detailed Guides

### **Choose Your Path:**

#### 🏃 **Fast Track** → [FLYIO_QUICKSTART.md](FLYIO_QUICKSTART.md)
- Step-by-step deployment
- Beginner-friendly
- Copy-paste commands
- 30-45 mins total

#### 📚 **Deep Dive** → [FLYIO_DEPLOYMENT_GUIDE.md](FLYIO_DEPLOYMENT_GUIDE.md)
- Detailed explanations
- Manual deployment steps
- Understanding each component
- 2-3 hours total

#### 🎨 **Visual Learner** → [FLYIO_ARCHITECTURE.md](FLYIO_ARCHITECTURE.md)
- Architecture diagrams
- Request flow visualization
- Cost breakdown charts
- Understanding the system

#### 🔧 **Problem Solver** → [FLYIO_TROUBLESHOOTING.md](FLYIO_TROUBLESHOOTING.md)
- Common issues & fixes
- Debug commands
- Error messages explained
- When something breaks

---

## 🤖 Automated Deployment

Use the deployment script for fastest deployment:

```bash
# Make executable (already done)
chmod +x deploy-flyio.sh

# Run
./deploy-flyio.sh
```

**What it does:**
1. Deploys all 5 backend services to Fly.io
2. Sets all secrets automatically
3. Configures service URLs
4. Runs health checks
5. Shows summary with all URLs

**Time:** 20-30 mins (mostly waiting for builds)

---

## 📊 Architecture Overview

```
User Browser
     ↓
Vercel (Next.js UI)
     ↓
API Gateway (Fly.io)
     ↓
┌────────┬─────────┬─────────┬─────────┐
│Identity│  Post   │  Media  │ Search  │
│Service │ Service │ Service │ Service │
└────────┴─────────┴─────────┴─────────┘
     ↓           ↓           ↓
MongoDB     RabbitMQ    Cloudinary
(Atlas)     (CloudAMQP)
```

**Full diagrams:** See [FLYIO_ARCHITECTURE.md](FLYIO_ARCHITECTURE.md)

---

## 🎓 What You'll Learn

Deploying this project teaches you:

- ✅ Microservices deployment
- ✅ Docker containerization
- ✅ Cloud platforms (Fly.io, Vercel)
- ✅ Database management (MongoDB Atlas)
- ✅ Caching strategies (Redis)
- ✅ Message queues (RabbitMQ)
- ✅ CDN & storage (Cloudinary)
- ✅ Environment variables & secrets
- ✅ Health checks & monitoring
- ✅ API Gateway pattern
- ✅ Event-driven architecture
- ✅ JWT authentication
- ✅ CORS configuration
- ✅ Cost optimization

**Great for:** Fresher resumes, interviews, portfolio

---

## 🔄 Update/Redeploy

After making code changes:

```bash
# From service directory
cd api-gateway
flyctl deploy

# Or from root (deploy all)
./deploy-flyio.sh
```

---

## 🗑️ Cleanup/Delete

To delete everything:

```bash
# Delete Fly.io apps
flyctl apps destroy nexusfeed-gateway -y
flyctl apps destroy nexusfeed-identity -y
flyctl apps destroy nexusfeed-post -y
flyctl apps destroy nexusfeed-media -y
flyctl apps destroy nexusfeed-search -y

# Delete Vercel deployment
vercel rm nexusfeed --yes

# Optionally delete external services:
# - MongoDB Atlas cluster
# - Upstash Redis database
# - CloudAMQP instance
```

---

## 💡 Tips for Success

1. **Start with Quickstart:** Follow [FLYIO_QUICKSTART.md](FLYIO_QUICKSTART.md) first
2. **Test locally first:** Run `docker-compose up` before deploying
3. **Deploy one by one:** If script fails, deploy services manually
4. **Check logs often:** `flyctl logs -a app-name` is your friend
5. **Keep secrets safe:** Don't commit `.env` files to Git
6. **Monitor costs:** Check Fly.io dashboard weekly
7. **Use Mumbai region:** Change to `bom` in fly.toml (closest to India)

---

## 📞 Need Help?

1. **Check:** [FLYIO_TROUBLESHOOTING.md](FLYIO_TROUBLESHOOTING.md)
2. **View logs:** `flyctl logs -a app-name`
3. **Test locally:** `docker-compose up`
4. **Verify secrets:** `flyctl secrets list -a app-name`

---

## 🎉 After Successful Deployment

### **For Your Resume:**

```
NexusFeed - Social Media Microservices Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 Live: https://nexusfeed-xxxxx.vercel.app
🔗 GitHub: https://github.com/your-username/nexusfeed
🔗 API: https://nexusfeed-gateway.fly.dev

Tech Stack:
• Backend: Node.js, Express, Microservices
• Frontend: Next.js, React, TypeScript
• Database: MongoDB Atlas
• Cache: Redis (Upstash)
• Queue: RabbitMQ (CloudAMQP)
• Storage: Cloudinary
• Deployment: Fly.io, Vercel, Docker

Features:
• 5 independent microservices
• Event-driven architecture
• JWT authentication
• Image uploads with CDN
• Full-text search
• Rate limiting
• API Gateway pattern
```

### **For Interviews:**

Talk about:
- ✅ Microservices architecture design
- ✅ Service-to-service communication
- ✅ Event-driven patterns with RabbitMQ
- ✅ Deployment strategies
- ✅ Scaling considerations
- ✅ Security (JWT, rate limiting)

---

## 🚀 Ready to Deploy?

```bash
# Start here:
open FLYIO_QUICKSTART.md

# Or just run:
./deploy-flyio.sh
```

Good luck! 🎉
