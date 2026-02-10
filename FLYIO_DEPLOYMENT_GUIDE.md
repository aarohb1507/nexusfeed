# 🚀 NexusFeed Fly.io Deployment Guide

**Time:** 2-3 hours | **Cost:** $0 (Free tier)

---

## 📋 **Prerequisites**

- MongoDB Atlas account (M0 free tier)
- Upstash Redis account (free tier)
- CloudAMQP account (Lemur free plan)
- Cloudinary account (already have: `ddsqzvt6z`)
- GitHub repo pushed
- Credit card (for Fly.io verification - won't charge on free tier)

---

## 🎯 **Architecture Overview**

```
┌─────────────────────────────────────────────────────────┐
│                    FLY.IO (Free Tier)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  VM 1 (256MB): api-gateway                             │
│  VM 2 (256MB): identity-service + post-service         │
│  VM 3 (256MB): media-service + search-service          │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES (Free)                   │
├─────────────────────────────────────────────────────────┤
│  MongoDB Atlas: Database (M0 - 512MB)                   │
│  Upstash Redis: Cache (Free - 10K commands/day)         │
│  CloudAMQP: Message Queue (Lemur - Free)                │
│  Cloudinary: Media Storage (Free - 25GB)                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   VERCEL (Free)                         │
│              Next.js UI (Frontend)                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 **Step 1: Install Fly.io CLI**

```bash
# Install Fly CLI
brew install flyctl

# Verify installation
flyctl version
```

---

## 🔐 **Step 2: Sign Up & Login**

```bash
# Sign up (opens browser)
flyctl auth signup

# OR if you already have account
flyctl auth login
```

**Important:** Add credit card for verification (won't charge on free tier)

---

## 📦 **Step 3: Set Up External Services**

### **3.1 MongoDB Atlas** (Already have connection string)
Your existing: `mongodb+srv://aarohb1507_db_user:oYQwXwOCKxwRGHN2@cluster0.p7scfqn.mongodb.net/`

✅ **Already set up - no changes needed**

---

### **3.2 Upstash Redis** (Need to create)

1. Go to: https://upstash.com
2. Sign up → Create Database
3. Name: `nexusfeed-redis`
4. Region: Choose closest to your Fly.io region
5. Copy **Redis URL**: `redis://default:xxxxx@xxxxx.upstash.io:6379`

---

### **3.3 CloudAMQP RabbitMQ** (Need to create)

1. Go to: https://customer.cloudamqp.com/signup
2. Create instance → Select **Lemur (Free)**
3. Name: `nexusfeed-rabbitmq`
4. Region: Choose closest
5. Copy **AMQP URL**: `amqps://xxxxx:xxxxx@xxx.cloudamqp.com/xxxxx`

---

### **3.4 Cloudinary** (Already configured)
Your existing credentials:
- Cloud Name: `ddsqzvt6z`
- API Key: `856373348936954`
- API Secret: `9z5cLj1UUEZaUOIPN4qczZdHCZ4`

✅ **Already set up - no changes needed**

---

## 🚀 **Step 4: Deploy Services to Fly.io**

We'll deploy 3 apps on Fly.io (combining services to fit free tier):

### **App 1: API Gateway** (Standalone)
### **App 2: Backend Core** (Identity + Post services)
### **App 3: Backend Extended** (Media + Search services)

---

## 📝 **Step 5: Create Fly.io Configuration Files**

### **5.1 API Gateway Configuration**

Create `fly.toml` in `api-gateway/` directory:

```bash
cd /Users/z0diac/Desktop/nexusfeed/api-gateway
```

Create file `fly.toml`:

```toml
app = "nexusfeed-gateway"
primary_region = "sin"  # Singapore (closest to India)

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3000"
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

---

### **5.2 Update API Gateway Dockerfile**

The Dockerfile needs to reference files correctly since we're deploying from subdirectory.

Check current Dockerfile:
```bash
cat Dockerfile
```

If it has `COPY . .`, you're good. If not, update it.

---

### **5.3 Create Combined Backend Services**

For free tier optimization, we'll combine services. Create a new directory structure:

```bash
cd /Users/z0diac/Desktop/nexusfeed

# Create combined backend directory
mkdir -p combined-backend-core
mkdir -p combined-backend-extended
```

Actually, let's use a simpler approach - deploy each service individually first, then combine if needed.

---

## 🚢 **Step 6: Deploy API Gateway**

```bash
cd /Users/z0diac/Desktop/nexusfeed/api-gateway

# Initialize Fly app
flyctl launch --name nexusfeed-gateway --no-deploy

# Set secrets (DO THIS BEFORE DEPLOYING)
flyctl secrets set \
  JWT_SECRET="ujdencikmdecokmdcok290dcswvghnßlklwodeskowql" \
  REDIS_URL="YOUR_UPSTASH_REDIS_URL_HERE"

# Set environment variables for service URLs (we'll update these after deploying other services)
flyctl secrets set \
  IDENTITY_SERVICE_URL="https://nexusfeed-identity.fly.dev" \
  POST_SERVICE_URL="https://nexusfeed-post.fly.dev" \
  MEDIA_SERVICE_URL="https://nexusfeed-media.fly.dev" \
  SEARCH_SERVICE_URL="https://nexusfeed-search.fly.dev" \
  CLIENT_URL="https://your-app.vercel.app"

# Deploy
flyctl deploy

# Get URL
flyctl info
```

**Save the URL:** `https://nexusfeed-gateway.fly.dev`

---

## 🔐 **Step 7: Deploy Identity Service**

```bash
cd /Users/z0diac/Desktop/nexusfeed/identity-service

# Create fly.toml
cat > fly.toml << 'EOF'
app = "nexusfeed-identity"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3001"
  NODE_ENV = "production"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
EOF

# Launch (don't deploy yet)
flyctl launch --name nexusfeed-identity --no-deploy

# Set secrets
flyctl secrets set \
  MONGODB_URI="mongodb+srv://aarohb1507_db_user:oYQwXwOCKxwRGHN2@cluster0.p7scfqn.mongodb.net/?appName=Cluster0" \
  JWT_SECRET="ujdencikmdecokmdcok290dcswvghnßlklwodeskowql" \
  REDIS_URL="YOUR_UPSTASH_REDIS_URL_HERE" \
  CLIENT_URL="https://your-app.vercel.app"

# Deploy
flyctl deploy
```

---

## 📮 **Step 8: Deploy Post Service**

```bash
cd /Users/z0diac/Desktop/nexusfeed/post-service

# Create fly.toml
cat > fly.toml << 'EOF'
app = "nexusfeed-post"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3002"
  NODE_ENV = "production"

[http_service]
  internal_port = 3002
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
EOF

# Launch
flyctl launch --name nexusfeed-post --no-deploy

# Set secrets
flyctl secrets set \
  MONGODB_URI="mongodb+srv://aarohb1507_db_user:oYQwXwOCKxwRGHN2@cluster0.p7scfqn.mongodb.net/?appName=Cluster0" \
  JWT_SECRET="ujdencikmdecokmdcok290dcswvghnßlklwodeskowql" \
  REDIS_URL="YOUR_UPSTASH_REDIS_URL_HERE" \
  RABBITMQ_URL="YOUR_CLOUDAMQP_URL_HERE" \
  IDENTITY_SERVICE_URL="https://nexusfeed-identity.fly.dev" \
  API_GATEWAY_URL="https://nexusfeed-gateway.fly.dev" \
  CLIENT_URL="https://your-app.vercel.app"

# Deploy
flyctl deploy
```

---

## 📷 **Step 9: Deploy Media Service**

```bash
cd /Users/z0diac/Desktop/nexusfeed/media-service

# Create fly.toml
cat > fly.toml << 'EOF'
app = "nexusfeed-media"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3003"
  NODE_ENV = "production"

[http_service]
  internal_port = 3003
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
EOF

# Launch
flyctl launch --name nexusfeed-media --no-deploy

# Set secrets
flyctl secrets set \
  MONGODB_URI="mongodb+srv://aarohb1507_db_user:oYQwXwOCKxwRGHN2@cluster0.p7scfqn.mongodb.net/?appName=Cluster0" \
  cloud_name="ddsqzvt6z" \
  api_key="856373348936954" \
  api_secret="9z5cLj1UUEZaUOIPN4qczZdHCZ4" \
  REDIS_URL="YOUR_UPSTASH_REDIS_URL_HERE" \
  RABBITMQ_URL="YOUR_CLOUDAMQP_URL_HERE" \
  IDENTITY_SERVICE_URL="https://nexusfeed-identity.fly.dev" \
  API_GATEWAY_URL="https://nexusfeed-gateway.fly.dev" \
  CLIENT_URL="https://your-app.vercel.app"

# Deploy
flyctl deploy
```

---

## 🔍 **Step 10: Deploy Search Service**

```bash
cd /Users/z0diac/Desktop/nexusfeed/search-service

# Create fly.toml
cat > fly.toml << 'EOF'
app = "nexusfeed-search"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3004"
  NODE_ENV = "production"

[http_service]
  internal_port = 3004
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
EOF

# Launch
flyctl launch --name nexusfeed-search --no-deploy

# Set secrets
flyctl secrets set \
  MONGODB_URI="mongodb+srv://aarohb1507_db_user:oYQwXwOCKxwRGHN2@cluster0.p7scfqn.mongodb.net/?appName=Cluster0" \
  JWT_SECRET="ujdencikmdecokmdcok290dcswvghnßlklwodeskowql" \
  REDIS_URL="YOUR_UPSTASH_REDIS_URL_HERE" \
  RABBITMQ_URL="YOUR_CLOUDAMQP_URL_HERE" \
  IDENTITY_SERVICE_URL="https://nexusfeed-identity.fly.dev" \
  POST_SERVICE_URL="https://nexusfeed-post.fly.dev" \
  API_GATEWAY_URL="https://nexusfeed-gateway.fly.dev" \
  CLIENT_URL="https://your-app.vercel.app"

# Deploy
flyctl deploy
```

---

## 🌐 **Step 11: Deploy UI to Vercel**

```bash
cd /Users/z0diac/Desktop/nexusfeed

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy UI
cd ui
vercel --prod

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://nexusfeed-gateway.fly.dev
```

---

## 🔄 **Step 12: Update API Gateway with Final URLs**

Once Vercel gives you the UI URL, update API Gateway:

```bash
cd /Users/z0diac/Desktop/nexusfeed/api-gateway

# Update CLIENT_URL with your actual Vercel URL
flyctl secrets set CLIENT_URL="https://nexusfeed-xxxxx.vercel.app"

# Restart to apply changes
flyctl apps restart nexusfeed-gateway
```

---

## ✅ **Step 13: Verify Deployment**

Test each service:

```bash
# Check API Gateway
curl https://nexusfeed-gateway.fly.dev/health

# Check Identity Service
curl https://nexusfeed-identity.fly.dev/health

# Check Post Service
curl https://nexusfeed-post.fly.dev/health

# Check Media Service
curl https://nexusfeed-media.fly.dev/health

# Check Search Service
curl https://nexusfeed-search.fly.dev/health

# Open UI in browser
open https://nexusfeed-xxxxx.vercel.app
```

---

## 📊 **Monitor Your Apps**

```bash
# View logs
flyctl logs -a nexusfeed-gateway

# Check status
flyctl status -a nexusfeed-gateway

# View all apps
flyctl apps list

# SSH into machine (for debugging)
flyctl ssh console -a nexusfeed-gateway
```

---

## 💰 **Free Tier Limits**

- ✅ 3 VMs (256MB each) = 5 apps deployed
- ✅ 160GB bandwidth/month
- ✅ 3GB storage
- ⚠️ **You're using 5 VMs** - this exceeds free tier

**Wait!** 5 apps = 5 VMs = **will cost money (~$10/month)**

---

## 🔄 **Option: Combine Services (Stay Free)**

To stay truly free, combine services into 3 apps. This requires changes but keeps you on free tier.

Would you like me to create a combined version? Or are you okay with ~$10/month for 5 separate services?

---

## 🚨 **Quick Troubleshooting**

**Service won't start:**
```bash
flyctl logs -a nexusfeed-gateway
```

**Need to update secrets:**
```bash
flyctl secrets set KEY=VALUE -a nexusfeed-gateway
```

**Redeploy after changes:**
```bash
flyctl deploy
```

**Check current secrets:**
```bash
flyctl secrets list -a nexusfeed-gateway
```

---

## 📋 **Checklist**

- [ ] Fly CLI installed
- [ ] Fly.io account created
- [ ] Upstash Redis created (get URL)
- [ ] CloudAMQP created (get URL)
- [ ] Identity Service deployed
- [ ] Post Service deployed
- [ ] Media Service deployed
- [ ] Search Service deployed
- [ ] API Gateway deployed
- [ ] UI deployed to Vercel
- [ ] All URLs updated
- [ ] Tested in browser

---

## 🎯 **Final URLs**

Save these for your resume:

- **Live App:** https://nexusfeed-xxxxx.vercel.app
- **API Gateway:** https://nexusfeed-gateway.fly.dev
- **GitHub Repo:** https://github.com/aarohb1507/microservices-social-app

---

## 💡 **Important Notes**

1. **Replace placeholder URLs** with actual Upstash Redis and CloudAMQP URLs
2. **Free tier = 3 VMs** - currently using 5, so ~$10/month cost
3. **To stay free:** Combine services (I can help with this)
4. **Auto-stop disabled** - services stay awake (no sleep like Render)
5. **Vercel deployment** is always free for frontend

---

Ready to deploy? Start with Step 1 and work your way down. Let me know when you need help with any step!
