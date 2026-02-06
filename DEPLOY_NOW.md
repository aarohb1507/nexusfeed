# 🚀 NexusFeed Deployment - Quick Start

**Time**: ~2 hours | **Difficulty**: Easy (3/10)

---

## ✅ Pre-Deployment Checklist

- [x] GitHub repo connected: `aarohb1507/microservices-social-app`
- [x] All services have Dockerfiles
- [x] JWT secrets generated
- [x] `.deployment-credentials.md` created (for tracking)
- [ ] All infrastructure accounts created
- [ ] All credentials filled in `.deployment-credentials.md`

---

## 📖 Where to Find Things

- **Full Deployment Guide**: `.agent/workflows/deploy-to-production.md`
- **Credentials Tracker**: `.deployment-credentials.md`
- **Original Guide**: `DEPLOYMENT.md`

---

## 🎯 Your Next Steps

### Step 1: Create Infrastructure Accounts (30 mins)

Open these tabs in your browser:

1. **MongoDB Atlas**: https://mongodb.com/cloud/atlas
   - [ ] Create account
   - [ ] Create M0 cluster
   - [ ] Get connection string
   - [ ] Fill in `.deployment-credentials.md`

2. **Upstash Redis**: https://upstash.com
   - [ ] Create account
   - [ ] Create Redis database
   - [ ] Get Redis URL
   - [ ] Fill in `.deployment-credentials.md`

3. **CloudAMQP**: https://customer.cloudamqp.com/login
   - [ ] Create account
   - [ ] Create Lemur instance (free)
   - [ ] Get AMQP URL
   - [ ] Fill in `.deployment-credentials.md`

4. **Cloudinary**: https://cloudinary.com/users/register_free
   - [ ] Create account
   - [ ] Get Cloud Name, API Key, API Secret
   - [ ] Fill in `.deployment-credentials.md`

---

### Step 2: Deploy Backend (60 mins)

Open: https://render.com

**Deploy in this ORDER** (important!):

1. [ ] **Identity Service** (3001)
   - Root Dir: `identity-service`
   - Copy env vars from `.deployment-credentials.md`
   - Deploy → Save URL

2. [ ] **Post Service** (3002)
   - Root Dir: `post-service`
   - Use Identity URL from step 1
   - Deploy → Save URL

3. [ ] **Media Service** (3003)
   - Root Dir: `media-service`
   - Use Identity URL from step 1
   - Deploy → Save URL

4. [ ] **Search Service** (3004)
   - Root Dir: `search-service`
   - Use Identity + Post URLs
   - Deploy → Save URL

5. [ ] **API Gateway** (3000)
   - Root Dir: `api-gateway`
   - Use ALL service URLs
   - Deploy → Save URL

---

### Step 3: Deploy Frontend (15 mins)

Open: https://vercel.com

1. [ ] Import repo: `aarohb1507/microservices-social-app`
2. [ ] Root Directory: `ui`
3. [ ] Add env: `NEXT_PUBLIC_API_URL=<gateway-url>`
4. [ ] Deploy → Save Vercel URL

---

### Step 4: Update Service URLs (10 mins)

1. [ ] Update ALL Render services:
   - `API_GATEWAY_URL` → gateway URL
   - `CLIENT_URL` → Vercel URL
2. [ ] Redeploy all services

---

### Step 5: Test Everything (20 mins)

1. [ ] Check health endpoints (all 5 services)
2. [ ] Open Vercel URL
3. [ ] Register account
4. [ ] Create post
5. [ ] Upload image
6. [ ] Search
7. [ ] Delete post

---

## 🔥 Quick Commands

### Check Git Status
```bash
cd /Users/z0diac/Desktop/nexusfeed
git status
```

### View Deployment Workflow
```bash
cat .agent/workflows/deploy-to-production.md
```

### Open Credentials File
```bash
open .deployment-credentials.md
```

---

## 🆘 Need Help?

- Check `.agent/workflows/deploy-to-production.md` for detailed steps
- Each section has troubleshooting tips
- Render has excellent logs (Dashboard → Service → Logs)

---

## 💡 Pro Tips

1. **Keep tabs open**: Have all 4 infrastructure dashboards open
2. **Copy-paste carefully**: URLs must be exact (no trailing slashes)
3. **Deploy in order**: Identity first, Gateway last
4. **Save URLs immediately**: After each deployment
5. **Use checkboxes**: Track progress in this file

---

## 🎉 Success Metrics

When deployment is complete, you'll have:
- ✅ 5 services running on Render
- ✅ 1 UI on Vercel
- ✅ All health checks passing
- ✅ Full app functionality working
- ✅ Total cost: $0/month (free tier)

---

**Ready to start? Begin with Step 1!** 🚀

Open `.deployment-credentials.md` in a text editor and start filling in credentials as you create accounts.
