# 🎨 NexusFeed Fly.io Architecture

## 📊 Complete Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
│                      (Anyone can access)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL (FREE)                              │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐   │
│   │  Next.js Frontend (UI)                                │   │
│   │  https://nexusfeed-xxxxx.vercel.app                   │   │
│   │                                                        │   │
│   │  • User Interface                                     │   │
│   │  • Login/Register Pages                               │   │
│   │  • Feed Display                                       │   │
│   │  • Post Creation                                      │   │
│   └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓ HTTP Requests
┌─────────────────────────────────────────────────────────────────┐
│                    FLY.IO (5 VMs - ~$10/month)                  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────┐     │
│   │  API GATEWAY (VM 1 - 256MB)                         │     │
│   │  https://nexusfeed-gateway.fly.dev                  │     │
│   │                                                      │     │
│   │  • Single entry point                               │     │
│   │  • Rate limiting                                    │     │
│   │  • Request routing                                  │     │
│   │  • JWT validation                                   │     │
│   └─────────────────────────────────────────────────────┘     │
│                    │        │        │         │               │
│         ┌──────────┴────┬───┴────┬───┴─────┬───┴─────┐        │
│         │               │        │         │         │         │
│   ┌─────▼─────┐  ┌──────▼──┐  ┌─▼──────┐ ┌─▼──────┐ │        │
│   │ IDENTITY  │  │  POST   │  │ MEDIA  │ │ SEARCH │ │        │
│   │ SERVICE   │  │ SERVICE │  │SERVICE │ │SERVICE │ │        │
│   │           │  │         │  │        │ │        │ │        │
│   │ VM 2      │  │ VM 3    │  │ VM 4   │ │ VM 5   │ │        │
│   │ 256MB     │  │ 256MB   │  │ 256MB  │ │ 256MB  │ │        │
│   │           │  │         │  │        │ │        │ │        │
│   │ Port 3001 │  │Port 3002│  │Prt 3003│ │Prt 3004│ │        │
│   └───────────┘  └─────────┘  └────────┘ └────────┘ │        │
│                                                        │        │
└────────────────────────────────────────────────────────────────┘
         │              │             │           │
         │              │             │           │
         └──────────────┴─────────────┴───────────┘
                        │
                        ↓ Connect to databases
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES (ALL FREE)                       │
│                                                                 │
│   ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│   │  MongoDB Atlas  │  │ Upstash Redis   │  │  CloudAMQP   │ │
│   │                 │  │                 │  │              │ │
│   │  M0 Free Tier   │  │  Free Tier      │  │  Lemur Free  │ │
│   │  512MB Storage  │  │  10K cmds/day   │  │  RabbitMQ    │ │
│   │                 │  │                 │  │              │ │
│   │  Database       │  │  Cache &        │  │  Message     │ │
│   │  for all data   │  │  Rate Limits    │  │  Queue       │ │
│   └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │              Cloudinary (FREE)                          │ │
│   │              25GB Media Storage                         │ │
│   │              CDN for images/videos                      │ │
│   └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Example

### **User Creates a Post with Image**

```
1. User clicks "Create Post" → UI (Vercel)
   ↓
2. Browser → POST /api/posts → API Gateway (Fly.io VM1)
   ↓
3. Gateway validates JWT → checks Redis for rate limit
   ↓
4. Gateway → forwards to POST Service (Fly.io VM3)
   ↓
5. POST Service → saves to MongoDB Atlas
   ↓
6. POST Service → publishes "post.created" event to RabbitMQ (CloudAMQP)
   ↓
7. POST Service → returns response → Gateway → UI
   ↓
8. Media Service (VM4) hears "post.created" event from RabbitMQ
   ↓
9. Media Service → uploads image to Cloudinary
   ↓
10. Search Service (VM5) hears event → indexes post in MongoDB
   ↓
11. UI shows new post to user ✅
```

---

## 💾 Data Flow

```
┌──────────────┐
│     USER     │
└──────┬───────┘
       │
       ↓
┌──────────────────┐         ┌─────────────────┐
│   Vercel UI      │────────▶│  API Gateway    │
│  (Frontend)      │         │  (Fly.io)       │
└──────────────────┘         └────────┬────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ↓                 ↓                 ↓
            ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
            │   Identity   │  │     Post     │  │    Media     │
            │   Service    │  │   Service    │  │   Service    │
            └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                   │                 │                 │
                   │                 │                 │
                   └────────┬────────┴─────────┬───────┘
                            │                  │
                            ↓                  ↓
                   ┌──────────────┐   ┌──────────────┐
                   │   MongoDB    │   │  Cloudinary  │
                   │   (Database) │   │   (Storage)  │
                   └──────────────┘   └──────────────┘
```

---

## 🔐 Security Flow

```
1. User logs in → Identity Service
   ↓
2. Identity Service generates JWT token
   ↓
3. Token stored in browser cookie
   ↓
4. Every request includes JWT in Authorization header
   ↓
5. API Gateway validates JWT before forwarding
   ↓
6. If valid → request forwarded to service
   If invalid → 401 Unauthorized
```

---

## 🚀 Event-Driven Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  RabbitMQ (CloudAMQP)                   │
│                    Message Broker                       │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ↓              ↓              ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Post Service │ │Media Service │ │Search Service│
│              │ │              │ │              │
│ PUBLISHES:   │ │ LISTENS:     │ │ LISTENS:     │
│ post.created │ │ post.created │ │ post.created │
│ post.updated │ │ post.updated │ │ post.updated │
│ post.deleted │ │              │ │ post.deleted │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Benefits:**
- Services don't need to know about each other
- Async processing (faster responses)
- Retry mechanism built-in
- Easy to add new services

---

## 📊 Cost Breakdown Visual

```
┌────────────────────────────────────────────────────┐
│                  MONTHLY COSTS                     │
├────────────────────────────────────────────────────┤
│                                                    │
│  Fly.io Services:                     $9.70/month │
│  ├─ Identity Service (256MB)          $1.94       │
│  ├─ Post Service (256MB)              $1.94       │
│  ├─ Media Service (256MB)             $1.94       │
│  ├─ Search Service (256MB)            $1.94       │
│  └─ API Gateway (256MB)               $1.94       │
│                                                    │
│  Vercel (Frontend):                    FREE       │
│  MongoDB Atlas (M0):                   FREE       │
│  Upstash Redis:                        FREE       │
│  CloudAMQP (Lemur):                    FREE       │
│  Cloudinary:                           FREE       │
│                                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  TOTAL:                           ~$10/month      │
│                               (₹840/month)        │
└────────────────────────────────────────────────────┘
```

---

## 🎯 Free Tier Optimization

**Current Setup: 5 VMs = $10/month**

**To stay FREE (3 VMs):**

```
Option 1: Combine Services
━━━━━━━━━━━━━━━━━━━━━━━━━
VM 1: API Gateway (256MB)                    FREE
VM 2: Identity + Post (256MB)                FREE
VM 3: Media + Search (256MB)                 FREE
━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: $0/month

Pros: Free
Cons: Services share RAM, might be slow
```

```
Option 2: Skip Some Features
━━━━━━━━━━━━━━━━━━━━━━━━━
VM 1: API Gateway                            FREE
VM 2: Identity + Post                        FREE
VM 3: Media (skip Search)                    FREE
━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: $0/month

Pros: Free, better performance
Cons: No search feature
```

```
Option 3: Current Setup (Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━
5 separate VMs                         $10/month
━━━━━━━━━━━━━━━━━━━━━━━━━

Pros: Full features, good performance
Cons: ₹840/month (less than a movie ticket!)
```

---

## 🔄 Deployment Workflow

```
┌────────────────────────────────────────────────┐
│  YOUR MACBOOK                                  │
│                                                │
│  1. Make code changes                          │
│  2. Test locally: docker-compose up            │
│  3. Push to GitHub                             │
│  4. Run: flyctl deploy                         │
│                                                │
└────────────┬───────────────────────────────────┘
             │
             ↓ (Deployment)
┌────────────────────────────────────────────────┐
│  FLY.IO                                        │
│                                                │
│  1. Pulls code from GitHub                     │
│  2. Builds Docker image                        │
│  3. Deploys to VM                              │
│  4. Health check                               │
│  5. Live! ✅                                   │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 📍 Data Center Location

**Recommended Region:** `sin` (Singapore)

```
┌────────────────────────────────────────┐
│         FLY.IO DATA CENTERS            │
├────────────────────────────────────────┤
│                                        │
│  sin  → Singapore    ⭐ BEST FOR INDIA │
│  bom  → Mumbai       ⭐ EVEN BETTER!   │
│  maa  → Chennai                        │
│  del  → Delhi                          │
│                                        │
│  (Check: flyctl platform regions)      │
└────────────────────────────────────────┘
```

**Tip:** Change `primary_region = "sin"` to `"bom"` in all `fly.toml` files for Mumbai (closer to you!)

---

## 🎓 What Recruiters See

When recruiters visit your deployed app:

```
1. Visit: https://nexusfeed-xxxxx.vercel.app
   ↓
2. Fast loading (Vercel CDN)
   ↓
3. Register/Login works (Identity Service on Fly.io)
   ↓
4. Create post works (Post Service)
   ↓
5. Image upload works (Media Service + Cloudinary)
   ↓
6. Search works (Search Service)
   ↓
7. Everything smooth ✅
   ↓
8. Impressed! 🎉 "This person knows microservices!"
```

---

This architecture shows you understand:
- ✅ Microservices architecture
- ✅ Event-driven design
- ✅ Cloud deployment
- ✅ Database management
- ✅ API design
- ✅ Security (JWT)
- ✅ CDN & storage
- ✅ Message queues

**Perfect for a fresher portfolio!** 🚀
