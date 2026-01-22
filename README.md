# NexusFeed 🚀

A complete microservices social media platform with event-driven architecture, distributed caching, real-time search, and a modern Next.js UI.

## Architecture

**6 services** connected via RabbitMQ + Redis caching:
- **API Gateway** (3000) - Request routing, JWT validation, rate limiting
- **Identity Service** (3001) - Cookie-based auth, refresh tokens
- **Post Service** (3002) - CRUD with Redis caching
- **Media Service** (3003) - Cloudinary CDN uploads (5MB limit)
- **Search Service** (3004) - Full-text search with event indexing
- **UI** (3005) - Next.js frontend with TypeScript + Tailwind CSS

## Tech Stack

**Backend**: Node.js, Express  
**Frontend**: Next.js 14, TypeScript, Tailwind CSS  
**Databases**: MongoDB, Redis  
**Message Queue**: RabbitMQ  
**Media**: Multer, Cloudinary  
**Auth**: JWT (httpOnly cookies), argon2  
**Containerization**: Docker, Docker Compose

## Features

✅ Cookie-based authentication (httpOnly, secure, sameSite)  
✅ Event-driven messaging (post.created, post.deleted)  
✅ Pagination-aware caching with intelligent invalidation  
✅ Rate limiting (global + per-endpoint)  
✅ Full-text search with MongoDB text indexing  
✅ Media upload with Cloudinary CDN  
✅ Service independence & eventual consistency  
✅ Responsive UI with real-time updates

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/nexusfeed.git
cd nexusfeed

# Start all services
docker-compose up --build

# Access the application
# UI: http://localhost:3005
# API Gateway: http://localhost:3000
# RabbitMQ Management: http://localhost:15672 (guest/guest)
```

### Option 2: Local Development

**Prerequisites**: Node.js 18+, MongoDB, Redis, RabbitMQ, Cloudinary account

```bash
# Install dependencies for all services
cd api-gateway && npm install && cd ..
cd identity-service && npm install && cd ..
cd post-service && npm install && cd ..
cd media-service && npm install && cd ..
cd search-service && npm install && cd ..
cd ui && npm install && cd ..

# Configure environment variables (see each service's .env file)

# Start services (6 terminals)
cd api-gateway && npm start
cd identity-service && npm start
cd post-service && npm start
cd media-service && npm start
cd search-service && npm start
cd ui && npm run dev
```

## Project Structure

```
nexusfeed/
├── api-gateway/          # Port 3000 - Routes & JWT validation
├── identity-service/     # Port 3001 - Auth & cookies
├── post-service/         # Port 3002 - Posts CRUD
├── media-service/        # Port 3003 - File uploads
├── search-service/       # Port 3004 - Full-text search
├── ui/                   # Port 3005 - Next.js frontend
├── docker-compose.yml    # Container orchestration
└── README.md
```
cd api-gateway && npm run dev
cd identity-service && npm run dev
cd post-service && npm run dev
cd media-service && npm run dev
cd search-service && npm run dev
```

## API Endpoints

**Auth**: `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/refresh`, `/v1/auth/logout`  
**Posts**: `/v1/posts/create-post`, `/v1/posts/all-posts`, `/v1/posts/:id`  
**Media**: `/v1/media/upload`, `/v1/media/:id`  
**Search**: `/v1/search?query=`

## Rate Limits

- Global: 100 req/15min
- Create Post: 20 req/min
- Delete Post: 20 req/10min
- Search: 30 req/min

## Roadmap

- [ ] Docker + docker-compose
- [ ] GitHub Actions CI/CD
- [ ] AWS EC2 deployment
- [ ] React/Next.js frontend

## Documentation

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed system design, data flow, and implementation patterns.

## License

MIT - See [LICENSE](LICENSE)

---

⭐ **Star this repo if you find it useful!**
