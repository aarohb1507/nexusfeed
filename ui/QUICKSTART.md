# 🚀 NexusFeed UI - Quick Start Guide

## Prerequisites

- Node.js 18+
- Backend services running (API Gateway, Identity, Post, Media, Search services)

## Option 1: Local Development

```bash
# Navigate to UI folder
cd ui

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

The UI will connect to `http://localhost:3000` (API Gateway) by default.

## Option 2: Docker (Recommended)

From the project root:

```bash
# Build and start all services including UI
docker-compose up --build

# UI will be available at http://localhost:3005
```

## Option 3: Docker UI Only

If backend is already running:

```bash
# Build UI container
docker-compose build ui

# Start UI
docker-compose up ui

# Access at http://localhost:3005
```

## Environment Configuration

Create `ui/.env.local` for local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For Docker, it's configured in `docker-compose.yml`.

## Usage Flow

1. **Register Account**
   - Go to http://localhost:3005/register
   - Enter username, email, password
   - Auto-login after registration

2. **Login**
   - Go to http://localhost:3005/login
   - Enter email and password
   - Redirected to feed on success

3. **Create Post**
   - Type content in the text area
   - (Optional) Click "Add Media" to upload image/video
   - Click "Post" button

4. **Search Posts**
   - Type search query in search bar
   - Click "Search" or press Enter
   - Clear search to return to full feed

5. **Delete Post**
   - Click trash icon on any post
   - Confirm deletion in modal

6. **Logout**
   - Click "Logout" button in header
   - Redirected to login page

## Troubleshooting

### UI can't connect to backend
- Ensure API Gateway is running on port 3000
- Check `NEXT_PUBLIC_API_URL` in environment variables
- Verify CORS is enabled on backend with correct origin

### Authentication not working
- Clear browser cookies
- Check API Gateway and Identity Service logs
- Ensure JWT_SECRET matches across services

### Media upload fails
- Check file size (max 5MB)
- Verify Cloudinary credentials in Media Service
- Check Media Service logs

### Search returns no results
- Ensure Search Service is running and consuming RabbitMQ events
- Check if posts are indexed (create a new post)
- Verify MongoDB text index on Search collection

## Production Build

```bash
cd ui
npm run build
npm start
```

## Tech Stack

- **Framework**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS
- **HTTP**: Axios with cookie support
- **Port**: 3005 (Docker), 3000 (local dev)

## API Endpoints Used

All through API Gateway (`http://localhost:3000`):

- `POST /v1/auth/register` - Register
- `POST /v1/auth/login` - Login
- `POST /v1/auth/logout` - Logout
- `POST /v1/posts/create-post` - Create post
- `GET /v1/posts/all-posts` - Get feed
- `DELETE /v1/posts/delete/:id` - Delete post
- `POST /v1/media/upload` - Upload media
- `GET /v1/search/posts` - Search posts

## Security

- ✅ HttpOnly cookies for authentication
- ✅ CSRF protection via SameSite cookies
- ✅ Secure flag in production
- ✅ No tokens in localStorage/sessionStorage
- ✅ Automatic token refresh

## Notes

- Cookies are automatically sent with every request
- No need to manually handle Authorization headers
- Token refresh happens automatically via refresh token cookie
- All forms have client-side validation
