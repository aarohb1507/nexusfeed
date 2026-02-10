# 🔧 Fly.io Deployment Troubleshooting Guide

Common issues and how to fix them during NexusFeed deployment.

---

## ❌ Issue: "Error: app name already taken"

**Cause:** Someone else already used that app name on Fly.io

**Fix:**
```bash
# Edit fly.toml in each service directory
# Change app name to something unique

# Example:
app = "nexusfeed-gateway-yourname"
# OR
app = "yourname-nexusfeed-gateway"
```

---

## ❌ Issue: "Error: no Docker daemon found"

**Cause:** Docker Desktop not running

**Fix:**
```bash
# Start Docker Desktop
open -a Docker

# Wait 30 seconds, then try again
flyctl deploy
```

---

## ❌ Issue: "Error: failed to fetch an image or build from source"

**Cause:** Dockerfile path issue or build context wrong

**Fix:**
```bash
# Make sure you're in the service directory
cd identity-service

# Check Dockerfile exists
ls -la Dockerfile

# Try manual build first
docker build -t test .

# If that works, try Fly deploy again
flyctl deploy
```

---

## ❌ Issue: "Health check never passed"

**Cause:** Service crashed or health endpoint not working

**Fix:**
```bash
# Check logs
flyctl logs -a nexusfeed-gateway

# Common issues:
# 1. Missing environment variables
flyctl secrets list -a nexusfeed-gateway

# 2. Wrong PORT in Dockerfile
# Make sure Dockerfile EXPOSE matches fly.toml internal_port

# 3. Health endpoint doesn't exist
# Add health endpoint to your service:
# app.get('/health', (req, res) => res.json({status: 'ok'}))
```

---

## ❌ Issue: "Cannot connect to MongoDB"

**Cause:** Wrong MongoDB URI or network issue

**Fix:**
```bash
# Test MongoDB connection locally first
mongosh "mongodb+srv://aarohb1507_db_user:oYQwXwOCKxwRGHN2@cluster0.p7scfqn.mongodb.net/"

# If that works, check Fly secret
flyctl secrets list -a nexusfeed-identity

# Re-set the secret if needed
flyctl secrets set MONGODB_URI="your-connection-string" -a nexusfeed-identity

# Check logs for actual error
flyctl logs -a nexusfeed-identity
```

---

## ❌ Issue: "Redis connection refused"

**Cause:** Wrong Redis URL or Upstash not set up

**Fix:**
```bash
# Test Redis URL locally
redis-cli -u "your-redis-url"

# Or use telnet
telnet your-upstash-host 6379

# Check secret in Fly
flyctl secrets list -a nexusfeed-gateway

# Re-set if wrong
flyctl secrets set REDIS_URL="redis://default:pass@host:6379" -a nexusfeed-gateway
```

---

## ❌ Issue: "RabbitMQ connection failed"

**Cause:** Wrong AMQP URL or CloudAMQP not set up

**Fix:**
```bash
# Verify CloudAMQP URL format
# Should be: amqps://user:pass@host.cloudamqp.com/user

# Check if it's set correctly
flyctl secrets list -a nexusfeed-post

# Re-set if needed
flyctl secrets set RABBITMQ_URL="your-cloudamqp-url" -a nexusfeed-post

# Test locally first
# In your service, add console.log(process.env.RABBITMQ_URL)
```

---

## ❌ Issue: "Service is running but 404 on routes"

**Cause:** Routes not registered or API Gateway routing wrong

**Fix:**
```bash
# Check if service is actually running
curl https://nexusfeed-identity.fly.dev/health

# Check API Gateway logs
flyctl logs -a nexusfeed-gateway

# Verify service URL in gateway secrets
flyctl secrets list -a nexusfeed-gateway

# Make sure URLs match: https://nexusfeed-identity.fly.dev
# NOT http:// and NOT with port numbers
```

---

## ❌ Issue: "CORS error in browser"

**Cause:** CLIENT_URL not set correctly in backend

**Fix:**
```bash
# Update CLIENT_URL in all services
flyctl secrets set CLIENT_URL="https://your-vercel-app.vercel.app" -a nexusfeed-identity
flyctl secrets set CLIENT_URL="https://your-vercel-app.vercel.app" -a nexusfeed-post
flyctl secrets set CLIENT_URL="https://your-vercel-app.vercel.app" -a nexusfeed-media
flyctl secrets set CLIENT_URL="https://your-vercel-app.vercel.app" -a nexusfeed-search
flyctl secrets set CLIENT_URL="https://your-vercel-app.vercel.app" -a nexusfeed-gateway

# Restart all services
flyctl apps restart nexusfeed-gateway
flyctl apps restart nexusfeed-identity
# ... etc
```

---

## ❌ Issue: "Out of memory" / Service keeps crashing

**Cause:** 256MB RAM not enough

**Fix:**
```bash
# Upgrade to 512MB
# Edit fly.toml:
[[vm]]
  memory_mb = 512  # Changed from 256

# Redeploy
flyctl deploy

# Note: 512MB = $3.94/month (instead of $1.94)
```

---

## ❌ Issue: "Deployment is very slow"

**Cause:** Large Docker image or slow internet

**Fix:**
```bash
# Optimize Dockerfile - use multi-stage builds
# Example:
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
CMD ["node", "src/server.js"]

# This reduces image size significantly
```

---

## ❌ Issue: "UI not connecting to backend"

**Cause:** Wrong API URL in frontend

**Fix:**
```bash
# In Vercel dashboard:
# Settings → Environment Variables
# Check NEXT_PUBLIC_API_URL = https://nexusfeed-gateway.fly.dev

# Redeploy UI after changing
vercel --prod

# Also check browser console for actual error
# Open DevTools → Console tab
```

---

## ❌ Issue: "JWT token not working"

**Cause:** JWT_SECRET mismatch between services

**Fix:**
```bash
# All services must have SAME JWT_SECRET
# Check each one:
flyctl secrets list -a nexusfeed-identity
flyctl secrets list -a nexusfeed-post
flyctl secrets list -a nexusfeed-gateway

# They should all have same JWT_SECRET
# If different, update them all to match:
flyctl secrets set JWT_SECRET="ujdencikmdecokmdcok290dcswvghnßlklwodeskowql" -a nexusfeed-identity
flyctl secrets set JWT_SECRET="ujdencikmdecokmdcok290dcswvghnßlklwodeskowql" -a nexusfeed-post
flyctl secrets set JWT_SECRET="ujdencikmdecokmdcok290dcswvghnßlklwodeskowql" -a nexusfeed-gateway
```

---

## ❌ Issue: "Cloudinary upload failing"

**Cause:** Wrong Cloudinary credentials

**Fix:**
```bash
# Check secrets in media service
flyctl secrets list -a nexusfeed-media

# Should have:
# - cloud_name
# - api_key
# - api_secret

# Re-set if missing:
flyctl secrets set \
  cloud_name="ddsqzvt6z" \
  api_key="856373348936954" \
  api_secret="9z5cLj1UUEZaUOIPN4qczZdHCZ4" \
  -a nexusfeed-media
```

---

## ❌ Issue: "Can't access Fly.io app from India"

**Cause:** DNS or routing issue (rare)

**Fix:**
```bash
# Try different DNS
# Change Mac DNS to:
# System Settings → Network → WiFi → Details → DNS
# Add: 8.8.8.8, 1.1.1.1

# Or use VPN

# Or try different region in fly.toml:
primary_region = "bom"  # Mumbai instead of Singapore
```

---

## 🔍 Debug Commands Cheatsheet

```bash
# View logs (live)
flyctl logs -a app-name

# View logs (last 100 lines)
flyctl logs -a app-name --lines 100

# Check app status
flyctl status -a app-name

# List all apps
flyctl apps list

# SSH into running machine
flyctl ssh console -a app-name

# View secrets (values hidden)
flyctl secrets list -a app-name

# Set new secret
flyctl secrets set KEY=VALUE -a app-name

# Unset secret
flyctl secrets unset KEY -a app-name

# Restart app
flyctl apps restart app-name

# Scale memory
flyctl scale memory 512 -a app-name

# Scale VM count
flyctl scale count 2 -a app-name

# View metrics
flyctl metrics -a app-name

# View regions
flyctl platform regions

# Destroy app (careful!)
flyctl apps destroy app-name
```

---

## 🚨 Emergency: Start Over

If everything is broken and you want to start fresh:

```bash
# Delete all apps
flyctl apps destroy nexusfeed-gateway -y
flyctl apps destroy nexusfeed-identity -y
flyctl apps destroy nexusfeed-post -y
flyctl apps destroy nexusfeed-media -y
flyctl apps destroy nexusfeed-search -y

# Run deployment script again
./deploy-flyio.sh
```

---

## 📞 When to Ask for Help

**You've tried everything and:**
- ✅ Checked logs
- ✅ Verified secrets
- ✅ Tested locally
- ✅ Redeployed multiple times
- ❌ Still not working

**What to share:**
1. Full error message from `flyctl logs -a app-name`
2. Output of `flyctl status -a app-name`
3. What you've tried so far
4. Which service is failing

---

## 💡 Pro Tips

1. **Always check logs first:**
   ```bash
   flyctl logs -a app-name
   ```

2. **Test locally before deploying:**
   ```bash
   docker-compose up
   ```

3. **Deploy one service at a time:**
   Don't run script all at once if having issues

4. **Keep secrets organized:**
   Create a local file (DON'T commit to Git):
   ```
   .deployment-secrets.txt
   
   MONGODB_URI=...
   REDIS_URL=...
   RABBITMQ_URL=...
   etc.
   ```

5. **Use health checks:**
   Every service should have `/health` endpoint

6. **Monitor costs:**
   Check Fly.io dashboard daily for first week

---

## ✅ Verification Checklist

Before asking for help, verify:

- [ ] Docker Desktop is running
- [ ] All services work locally (`docker-compose up`)
- [ ] MongoDB connection works (test with mongosh)
- [ ] Redis connection works (test with redis-cli)
- [ ] RabbitMQ URL is correct (amqps://)
- [ ] All secrets are set (`flyctl secrets list`)
- [ ] Health endpoints return 200 OK
- [ ] fly.toml has correct ports
- [ ] Dockerfile exposes correct port
- [ ] No typos in service names/URLs

---

Good luck! 🚀 Most issues are just typos in URLs or missing secrets. Check those first!
