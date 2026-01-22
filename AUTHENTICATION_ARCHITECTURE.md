# NexusFeed Authentication Architecture

## Overview
NexusFeed uses a **cookie-based JWT authentication system** with a centralized validation model at the API Gateway.

---

## 🔐 Token Types

### 1. Access Token (JWT)
- **Type**: JSON Web Token (JWT)
- **Lifespan**: 20 minutes
- **Storage**: httpOnly cookie named `accessToken`
- **Purpose**: Authorizes API requests
- **Contains**: `{ id: user._id, username: user.username }`
- **Validation**: Only at API Gateway

### 2. Refresh Token (Random Hex)
- **Type**: Cryptographically secure random hex string (40 bytes)
- **Lifespan**: 7 days
- **Storage**: 
  - httpOnly cookie named `refreshToken`
  - MongoDB `RefreshTokens` collection
- **Purpose**: Issues new access tokens without re-login
- **Behavior**: **Token Reuse** (NOT rotation) - same refresh token for full 7 days

---

## 🏗️ Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (UI)                              │
│                    http://localhost:3005                         │
│                                                                   │
│  Cookies: accessToken, refreshToken                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTP Request with cookies
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY :3000                             │
│                                                                   │
│  ✅ Validates JWT from cookies                                   │
│  ✅ Extracts user info (id, username)                            │
│  ✅ Forwards request with x-user-id header                       │
│                                                                   │
│  /v1/auth    → Identity Service (no validation, pass through)    │
│  /v1/posts   → Post Service (validates & forwards)               │
│  /v1/media   → Media Service (validates & forwards)              │
│  /v1/search  → Search Service (validates & forwards)             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Headers: x-user-id: <userId>
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              DOWNSTREAM SERVICES                                 │
│                                                                   │
│  📍 Post Service :3002                                           │
│  📍 Media Service :3003                                          │
│  📍 Search Service :3004                                         │
│                                                                   │
│  ✅ Trust x-user-id header from gateway                          │
│  ❌ DO NOT validate JWT themselves                               │
│  ❌ DO NOT read cookies                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              IDENTITY SERVICE :3001                              │
│                                                                   │
│  ✅ Issues tokens (sets httpOnly cookies)                        │
│  ✅ Validates refresh tokens from MongoDB                        │
│  ✅ Creates new access tokens on refresh                         │
│  ❌ Does NOT validate access tokens (gateway's job)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Authentication Flows

### 1. Registration Flow
1. **Client** → POST `/v1/auth/register` → **API Gateway** → **Identity Service**
2. **Identity Service**:
   - Validates input
   - Creates user in MongoDB
   - Deletes any existing refresh tokens for this user (cleanup)
   - Generates new access token (20 min) + refresh token (7 days)
   - Stores refresh token in MongoDB
   - Sets both tokens as httpOnly cookies
3. **Response**: User data + cookies set
4. **Client**: Receives cookies automatically

### 2. Login Flow
1. **Client** → POST `/v1/auth/login` → **API Gateway** → **Identity Service**
2. **Identity Service**:
   - Validates credentials
   - Deletes any existing refresh tokens for this user (single session)
   - Generates new access token (20 min) + refresh token (7 days)
   - Stores refresh token in MongoDB
   - Sets both tokens as httpOnly cookies
3. **Response**: User data + cookies set
4. **Client**: Receives cookies automatically

### 3. Authenticated Request Flow
1. **Client** → GET `/v1/posts/all-posts` (with cookies) → **API Gateway**
2. **API Gateway**:
   - Reads `accessToken` from cookies
   - Validates JWT signature and expiry
   - Extracts user info: `{ id, username }`
   - Forwards request to Post Service with header: `x-user-id: <userId>`
3. **Post Service**:
   - Reads `x-user-id` from headers
   - Trusts the gateway's validation
   - Processes request using user ID
4. **Response**: Posts data

### 4. Token Refresh Flow (Automatic)
**Trigger**: Access token expires after 20 minutes

1. **Client** → POST `/v1/auth/refresh-token` (with cookies) → **API Gateway** → **Identity Service**
2. **Identity Service**:
   - Reads `refreshToken` from cookies
   - Looks up token in MongoDB `RefreshTokens` collection
   - Validates: token exists, not expired, user exists
   - Generates **NEW access token only** (20 min)
   - **KEEPS the same refresh token** (no rotation)
   - Sets only new `accessToken` cookie (refresh cookie unchanged)
3. **Response**: Success message + new access token cookie
4. **Client**: Automatically uses new access token

### 5. Logout Flow
1. **Client** → POST `/v1/auth/logout` (with cookies) → **API Gateway** → **Identity Service**
2. **Identity Service**:
   - Reads `refreshToken` from cookies
   - Deletes token from MongoDB
   - Clears both `accessToken` and `refreshToken` cookies
3. **Response**: Logout success
4. **Client**: No longer has valid tokens

---

## 🛡️ Security Model

### Token Storage Strategy
| Location | Access Token | Refresh Token |
|----------|--------------|---------------|
| **Client Cookies** | ✅ httpOnly, sameSite | ✅ httpOnly, sameSite |
| **MongoDB** | ❌ Not stored | ✅ Stored with expiry |
| **JWT Payload** | ✅ User info | ❌ Not JWT |

### Cookie Security Settings
```javascript
{
  httpOnly: true,              // Cannot be accessed by JavaScript
  secure: NODE_ENV === 'production',  // HTTPS only in production
  sameSite: NODE_ENV === 'production' ? 'strict' : 'lax',  // CSRF protection
  maxAge: 20 * 60 * 1000       // Access: 20 min, Refresh: 7 days
}
```

### Refresh Token Reuse Strategy
- **Old behavior** (token rotation): Generate new refresh token on every refresh → session breaks
- **New behavior** (token reuse): Keep same refresh token for 7 days → stable sessions

**Benefits**:
- ✅ No session expiration issues
- ✅ One refresh token per user (single active session)
- ✅ 7-day window without re-login
- ✅ Access token stays short-lived (20 min) for security

---

## 📋 Service-by-Service Breakdown

### 1. Identity Service `:3001`
**Role**: Token issuer and validator

**Endpoints**:
- `POST /api/register` - No auth required
- `POST /api/login` - No auth required
- `POST /api/refresh-token` - Reads refresh token from cookies
- `POST /api/logout` - Reads refresh token from cookies

**Responsibilities**:
- ✅ Issue access + refresh tokens
- ✅ Store refresh tokens in MongoDB
- ✅ Validate refresh tokens from MongoDB
- ✅ Set httpOnly cookies
- ✅ Delete old tokens on login/register
- ❌ Does NOT validate access tokens

**Dependencies**:
- MongoDB (user data + refresh tokens)
- JWT library (sign access tokens)
- crypto (generate refresh tokens)

---

### 2. API Gateway `:3000`
**Role**: Central authentication validator and traffic router

**Routes**:
- `/v1/auth/*` → Identity Service (pass through, no validation)
- `/v1/posts/*` → Post Service (validate + forward)
- `/v1/media/*` → Media Service (validate + forward)
- `/v1/search/*` → Search Service (validate + forward)

**Responsibilities**:
- ✅ Read `accessToken` from cookies
- ✅ Validate JWT signature and expiry
- ✅ Extract user info from JWT
- ✅ Forward requests with `x-user-id` header
- ✅ Forward cookies to Identity Service
- ✅ Forward set-cookie headers back to client

**Middleware**: `validateToken` (in `middleware/authMiddleware.js`)
```javascript
// Reads JWT from cookies, validates, attaches req.user
```

**Dependencies**:
- cookie-parser (read cookies)
- JWT library (verify tokens)
- express-http-proxy (forward requests)

---

### 3. Post Service `:3002`
**Role**: Post CRUD operations

**Endpoints**: (All require authentication via gateway)
- `POST /api/create-post` → Creates new post
- `GET /api/all-posts` → Fetches all posts
- `GET /api/:id` → Fetches single post
- `DELETE /api/delete/:id` → Deletes post

**Responsibilities**:
- ✅ Read `x-user-id` from headers (set by gateway)
- ✅ Trust gateway's validation
- ✅ Process post operations using user ID
- ❌ Does NOT validate JWT
- ❌ Does NOT read cookies

**Middleware**: `authenticateUser` (in `middleware/authMiddleware.js`)
```javascript
// Reads x-user-id header, attaches req.user = { id: userId }
```

**Dependencies**:
- MongoDB (post data)
- RabbitMQ (publish post.created, post.deleted events)

---

### 4. Media Service `:3003`
**Role**: Media upload and storage

**Endpoints**: (All require authentication via gateway)
- `POST /api/upload` → Uploads media to Cloudinary
- `GET /api/user-media` → Fetches user's media

**Responsibilities**:
- ✅ Read `x-user-id` from headers (set by gateway)
- ✅ Trust gateway's validation
- ✅ Upload media using user ID
- ❌ Does NOT validate JWT
- ❌ Does NOT read cookies

**Middleware**: `authenticateUser` (in `middleware/authMiddleware.js`)
```javascript
// Reads x-user-id header, attaches req.user = { id: userId }
```

**Dependencies**:
- MongoDB (media metadata)
- Cloudinary (media storage)
- RabbitMQ (listen for post.deleted events)

---

### 5. Search Service `:3004`
**Role**: Post search functionality

**Endpoints**: (All require authentication via gateway)
- `GET /api/posts?query=...` → Searches posts by query

**Responsibilities**:
- ✅ Read `x-user-id` from headers (set by gateway)
- ✅ Trust gateway's validation
- ✅ Search posts (authenticated context)
- ❌ Does NOT validate JWT
- ❌ Does NOT read cookies

**Middleware**: `authenticateUser` (in `middleware/authMiddleware.js`)
```javascript
// Reads x-user-id header, attaches req.user = { id: userId }
```

**Dependencies**:
- MongoDB (search index)
- RabbitMQ (listen for post.created, post.deleted events)

---

## 🔧 Implementation Details

### API Gateway - Token Validation
```javascript
// api-gateway/src/middleware/authMiddleware.js
const validateToken = (req, res, next) => {
    const token = req.cookies.accessToken
    if (!token) {
        return res.status(401).json({ message: 'Access token missing' })
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' })
        }
        req.user = user  // { id, username }
        next()
    })
}
```

### API Gateway - Request Forwarding
```javascript
// api-gateway/src/server.js
app.use('/v1/posts', validateToken, proxy(POST_SERVICE_URL, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        // Forward cookies for identity service
        if (srcReq.headers.cookie) {
            proxyReqOpts.headers['cookie'] = srcReq.headers.cookie
        }
        // Forward user ID to downstream services
        proxyReqOpts.headers['x-user-id'] = srcReq.user?.id || ''
        return proxyReqOpts
    }
}))
```

### Downstream Services - Header Trust
```javascript
// post-service/src/middleware/authMiddleware.js
// media-service/src/middleware/authMiddleware.js
// search-service/src/middleware/authMiddleware.js
const authenticateUser = (req, res, next) => {
    const userId = req.headers['x-user-id']
    if (!userId) {
        return res.status(401).json({ message: 'User ID not provided by gateway' })
    }
    req.user = { id: userId }
    next()
}
```

### Identity Service - Token Generation
```javascript
// identity-service/src/utils/generateToken.js
const generateTokens = async (user) => {
    // Access token: JWT, 20 minutes
    const accessToken = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '20m' }
    )
    
    // Refresh token: Random hex, 7 days
    const refreshToken = crypto.randomBytes(40).toString('hex')
    const expiresAt = new Date(Date.now() + 7*24*60*60*1000)
    
    // Store refresh token in MongoDB
    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt
    })
    
    return { accessToken, refreshToken }
}
```

### Identity Service - Token Refresh
```javascript
// identity-service/src/controllers/identity-controller.js
const refreshTokenUser = async (req, res) => {
    const refreshToken = req.cookies.refreshToken
    
    // Validate refresh token from MongoDB
    const storedToken = await RefreshToken.findOne({ token: refreshToken })
    if (!storedToken || storedToken.expiresAt < new Date()) {
        return res.status(401).json({ message: 'Invalid or expired refresh token' })
    }
    
    const user = await User.findById(storedToken.user)
    
    // Generate ONLY new access token (reuse refresh token)
    const newAccessToken = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '20m' }
    )
    
    // Set ONLY new access token cookie
    res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 20 * 60 * 1000
    })
    
    return res.status(200).json({ message: 'Token refreshed' })
}
```

---

## 📊 Token Lifecycle

```
Day 0: Login
├─ Access Token: Generated (20 min)
├─ Refresh Token: Generated (7 days)
└─ MongoDB: Refresh token stored

Day 0 + 20 min: Access Token Expires
├─ Client: Calls /refresh-token
├─ Identity Service: Validates refresh token from DB
├─ New Access Token: Generated (20 min)
└─ Refresh Token: REUSED (no change)

Day 0 + 40 min: Access Token Expires Again
├─ Client: Calls /refresh-token
├─ Identity Service: Validates same refresh token
├─ New Access Token: Generated (20 min)
└─ Refresh Token: STILL REUSED (no change)

Day 7: Refresh Token Expires
├─ Client: Calls /refresh-token
├─ Identity Service: Refresh token expired
└─ Response: 401 - User must login again

Day 7 + 1: MongoDB Auto-Cleanup
└─ TTL Index: Automatically deletes expired refresh token
```

---

## 🚨 Error Scenarios

### 1. No Access Token
- **Trigger**: Client requests protected route without cookies
- **Response**: 401 from API Gateway
- **Action**: Client should redirect to login

### 2. Expired Access Token
- **Trigger**: Access token older than 20 minutes
- **Response**: 403 from API Gateway
- **Action**: Client should call `/refresh-token`

### 3. No Refresh Token
- **Trigger**: Client calls `/refresh-token` without refresh token cookie
- **Response**: 401 from Identity Service
- **Action**: Client should redirect to login

### 4. Invalid Refresh Token
- **Trigger**: Refresh token not found in MongoDB (revoked/expired)
- **Response**: 401 from Identity Service
- **Action**: Client should redirect to login

### 5. Expired Refresh Token
- **Trigger**: Refresh token older than 7 days
- **Response**: 401 from Identity Service
- **Action**: Client should redirect to login

---

## ✅ Services Requiring Tokens

| Service | Port | Requires Tokens | Validation Method |
|---------|------|-----------------|-------------------|
| **Identity Service** | 3001 | ❌ No (issues tokens) | N/A |
| **API Gateway** | 3000 | ✅ Yes (validates) | JWT from cookies |
| **Post Service** | 3002 | ✅ Yes (trusts gateway) | x-user-id header |
| **Media Service** | 3003 | ✅ Yes (trusts gateway) | x-user-id header |
| **Search Service** | 3004 | ✅ Yes (trusts gateway) | x-user-id header |
| **UI** | 3005 | ❌ No (uses tokens) | Sends cookies |

---

## 🔑 Key Takeaways

1. **Centralized Validation**: Only API Gateway validates JWT
2. **Token Reuse**: Refresh token lasts 7 days without rotation
3. **Single Session**: Login/register deletes old refresh tokens
4. **Cookie-Based**: Tokens stored in httpOnly cookies (XSS safe)
5. **Trust Model**: Downstream services trust x-user-id from gateway
6. **No JWT in Services**: Post/Media/Search never touch JWT
7. **MongoDB Cleanup**: TTL index auto-deletes expired tokens
8. **Short Access Token**: 20-minute expiry for security
9. **Stateful Refresh**: Refresh tokens stored in DB (can be revoked)
10. **Production Ready**: sameSite=strict, secure=true in production

---

## 📝 Configuration Checklist

### Environment Variables Required

**All Services**:
```env
NODE_ENV=development|production
PORT=300X
MONGODB_URI=mongodb://...
```

**Identity Service + API Gateway**:
```env
JWT_SECRET=<your-secret-key>
```

**API Gateway**:
```env
CLIENT_URL=http://localhost:3005
IDENTITY_SERVICE_URL=http://localhost:3001
POST_SERVICE_URL=http://localhost:3002
MEDIA_SERVICE_URL=http://localhost:3003
SEARCH_SERVICE_URL=http://localhost:3004
REDIS_URL=redis://localhost:6379
```

---

## 🎯 Summary

**What Changed**:
- ✅ Fixed refresh token to **reuse** for 7 days (no rotation)
- ✅ Removed cookie-parser from downstream services
- ✅ Downstream services now trust `x-user-id` header (no JWT validation)
- ✅ API Gateway is the **only** place that validates JWT
- ✅ Identity Service issues tokens, doesn't validate access tokens
- ✅ Access token lifespan: 20 minutes
- ✅ Login/register cleans up old refresh tokens (single session)

**Result**: Stable, scalable authentication with proper separation of concerns.
