# NexusFeed UI

Clean and simple Next.js frontend for NexusFeed social media platform.

## Features

- 🔐 **Cookie-based Authentication** - Secure login/register with httpOnly cookies
- 📝 **Create Posts** - Write posts with optional media uploads
- 🖼️ **Media Upload** - Upload images/videos via Cloudinary integration
- 🔍 **Search Posts** - Full-text search powered by MongoDB
- 📱 **Responsive Design** - Mobile-friendly Tailwind CSS
- ⚡ **Real-time Feed** - Paginated posts with live updates
- 🗑️ **Delete Posts** - Remove your own posts

## Tech Stack

- **Framework**: Next.js 14 (TypeScript)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with cookie support
- **State Management**: React Hooks

## API Integration

All requests go through the API Gateway at `http://localhost:3000`:

### Authentication (Identity Service)
- `POST /v1/auth/register` - Create account
- `POST /v1/auth/login` - Sign in
- `POST /v1/auth/logout` - Sign out
- `POST /v1/auth/refresh-token` - Refresh access token

### Posts (Post Service)
- `POST /v1/posts/create-post` - Create new post
- `GET /v1/posts/all-posts?page=1&limit=10` - Get all posts
- `GET /v1/posts/:id` - Get single post
- `DELETE /v1/posts/delete/:id` - Delete post

### Media (Media Service)
- `POST /v1/media/upload` - Upload media file (max 5MB)
- `GET /v1/media/get` - Get user's media

### Search (Search Service)
- `GET /v1/search/posts?query=text` - Search posts

## Local Development

```bash
# Install dependencies
cd ui
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Docker

```bash
# Build and run with docker-compose (from root)
docker-compose up ui

# Access at http://localhost:3005
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Project Structure

```
ui/
├── src/
│   ├── components/
│   │   ├── CreatePost.tsx    # Post creation form
│   │   ├── PostCard.tsx      # Individual post display
│   │   └── SearchBar.tsx     # Search interface
│   ├── lib/
│   │   └── api.ts            # API client utilities
│   ├── pages/
│   │   ├── index.tsx         # Home feed
│   │   ├── login.tsx         # Login page
│   │   └── register.tsx      # Registration page
│   └── styles/
│       └── globals.css       # Global styles
├── Dockerfile
├── next.config.js
└── package.json
```

## Usage

1. **Register**: Create an account at `/register`
2. **Login**: Sign in at `/login`
3. **Create Post**: Use the form at the top of the feed
4. **Upload Media**: Click "Add Media" when creating a post
5. **Search**: Use the search bar to find posts
6. **Delete**: Click the trash icon on your posts

## Notes

- Cookies are automatically handled by axios
- Authentication redirects to `/login` if unauthorized
- Images are lazy-loaded via Cloudinary CDN
- Posts are cached and paginated for performance
