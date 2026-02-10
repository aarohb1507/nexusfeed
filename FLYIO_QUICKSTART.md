# 🚀 Quick Start - Fly.io Deployment

**Time:** 1-2 hours | **Cost:** $0 (with free tier setup)

---

## ⚡ Super Quick Version

```bash
# 1. Install Fly CLI
brew install flyctl

# 2. Login
flyctl auth login

# 3. Set up external services (see below)

# 4. Run deployment script
./deploy-flyio.sh

# 5. Deploy UI to Vercel
cd ui && vercel --prod
```

---

## 📋 Step-by-Step Guide

### **Step 1: Install Fly CLI** (2 mins)

```bash
brew install flyctl
flyctl version
```

---

### **Step 2: Create Fly.io Account** (5 mins)

```bash
flyctl auth signup
# OR
flyctl auth login
```

**Important:** Add credit card for verification (won't charge on free tier)

---

### **Step 3: Set Up Upstash Redis** (5 mins)

1. Go to: **https://upstash.com**
2. Click **Sign Up** → Sign up with GitHub (easiest)
3. Click **Create Database**
   - Name: `nexusfeed-redis`
   - Type: Regional
   - Region: **ap-south-1 (Mumbai)** ← Choose this (closest to India)
   - Primary: Yes
4. Click **Create**
5. Copy **Redis URL** from dashboard

**Example:** `redis://default:xxxxxxxxxxxxx@fine-mollusk-12345.upstash.io:6379`

📋 **Save this URL** - you'll need it in Step 5

---

### **Step 4: Set Up CloudAMQP RabbitMQ** (5 mins)

1. Go to: **https://customer.cloudamqp.com/signup**
2. Sign up (use your email or GitHub)
3. Click **Create New Instance**
   - Name: `nexusfeed-rabbitmq`
   - Plan: **Lemur (Free)** ← Choose this
   - Region: **Amazon Web Services** → **Mumbai (ap-south-1)** ← Choose this
   - Tags: leave blank
4. Click **Create Instance**
5. Click on your new instance → **Details** tab
6. Copy **AMQP URL**

**Example:** `amqps://username:password@puffin.rmq2.cloudamqp.com/username`

📋 **Save this URL** - you'll need it in Step 5

---

### **Step 5: Run Deployment Script** (30-45 mins)

```bash
cd /Users/z0diac/Desktop/nexusfeed

# Run the deployment script
./deploy-flyio.sh
```

When prompted, enter:
- **Upstash Redis URL:** (paste from Step 3)
- **CloudAMQP URL:** (paste from Step 4)
- **Vercel UI URL:** Press Enter (skip for now)

The script will:
- Deploy all 5 backend services to Fly.io
- Set up all secrets and environment variables
- Give you the URLs for each service

**Wait while it deploys** - each service takes 3-5 minutes.

---

### **Step 6: Deploy Frontend to Vercel** (10 mins)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy UI
cd ui
vercel --prod
```

When prompted:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name?** nexusfeed (or whatever you want)
- **Directory?** `.` (press Enter)
- **Override settings?** No

After deployment:
1. Copy your Vercel URL (e.g., `https://nexusfeed-xxxxx.vercel.app`)
2. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
3. Add variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://nexusfeed-gateway.fly.dev`
   - **Environment:** Production
4. Click **Save**
5. Go to **Deployments** → Click **⋯** → **Redeploy**

---

### **Step 7: Update Backend with Frontend URL** (2 mins)

```bash
cd /Users/z0diac/Desktop/nexusfeed/api-gateway

# Update with your actual Vercel URL
flyctl secrets set CLIENT_URL="https://nexusfeed-xxxxx.vercel.app"
```

---

## ✅ **Verification**

Test all services:

```bash
# Test Identity Service
curl https://nexusfeed-identity.fly.dev/health

# Test Post Service
curl https://nexusfeed-post.fly.dev/health

# Test Media Service
curl https://nexusfeed-media.fly.dev/health

# Test Search Service
curl https://nexusfeed-search.fly.dev/health

# Test API Gateway
curl https://nexusfeed-gateway.fly.dev/health

# Test UI (open in browser)
open https://nexusfeed-xxxxx.vercel.app
```

All should return `{"status":"ok"}` or similar health check response.

---

## 🎯 **Your Live URLs** (Save for Resume!)

After deployment, you'll have:

- **Live App:** `https://nexusfeed-xxxxx.vercel.app`
- **API Gateway:** `https://nexusfeed-gateway.fly.dev`
- **Backend Services:** All on Fly.io
- **GitHub Repo:** Your existing repo

---

## 📊 **Cost Breakdown**

| Service | Provider | Cost |
|---------|----------|------|
| Identity Service | Fly.io | $1.94/month (256MB) |
| Post Service | Fly.io | $1.94/month (256MB) |
| Media Service | Fly.io | $1.94/month (256MB) |
| Search Service | Fly.io | $1.94/month (256MB) |
| API Gateway | Fly.io | $1.94/month (256MB) |
| Frontend (UI) | Vercel | FREE |
| MongoDB | Atlas | FREE (M0) |
| Redis | Upstash | FREE (10K/day) |
| RabbitMQ | CloudAMQP | FREE (Lemur) |
| Media Storage | Cloudinary | FREE (25GB) |
| **TOTAL** | | **~$10/month** |

**Note:** Fly.io free tier = 3 VMs (256MB each). You're using 5 VMs, so ~$10/month.

---

## 🆓 **Want to Stay 100% Free?**

You have 2 options:

### **Option 1: Accept Lower Performance**
- Use free tier (3 VMs)
- Services may be slower
- Might hit rate limits

### **Option 2: Combine Services** (Recommended)
Combine services to fit in 3 free VMs:
- VM 1: API Gateway
- VM 2: Identity + Post (combined)
- VM 3: Media + Search (combined)

This requires code changes. Let me know if you want help with this.

---

## 🚨 **Troubleshooting**

### **Deployment fails:**
```bash
# Check logs
flyctl logs -a nexusfeed-gateway

# Try manual deploy
cd api-gateway
flyctl deploy
```

### **Service not responding:**
```bash
# Check status
flyctl status -a nexusfeed-gateway

# Restart service
flyctl apps restart nexusfeed-gateway
```

### **Update a secret:**
```bash
flyctl secrets set KEY=VALUE -a nexusfeed-gateway
```

### **View current secrets:**
```bash
flyctl secrets list -a nexusfeed-gateway
```

---

## 🎯 **Next Steps After Deployment**

1. **Test all features:** Register, login, create post, upload media, search
2. **Update README.md** with live URLs
3. **Update resume** with project link
4. **Monitor costs:** Check Fly.io dashboard weekly
5. **Set up monitoring:** Fly.io has built-in metrics

---

## 📞 **Need Help?**

**Common Issues:**

1. **"Error: app already exists"**
   - App name already taken
   - Change app name in `fly.toml` files

2. **"Connection refused"**
   - Service URLs might be wrong
   - Check secrets: `flyctl secrets list -a app-name`

3. **"Out of memory"**
   - 256MB might be too small
   - Upgrade to 512MB: Edit `fly.toml` → `memory_mb = 512`

4. **UI not connecting to API**
   - Check CORS settings in API Gateway
   - Verify `CLIENT_URL` in backend secrets
   - Verify `NEXT_PUBLIC_API_URL` in Vercel

---

Ready to deploy? Just run:

```bash
./deploy-flyio.sh
```

And follow the prompts! 🚀
