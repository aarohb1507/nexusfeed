# 🎨 NexusFeed UI - Complete Overview

## What is NexusFeed UI?

A modern, clean Next.js frontend that provides a social media interface for the NexusFeed microservices backend. Built with TypeScript and Tailwind CSS for a responsive, user-friendly experience.

---

## 📋 Features Overview

### Authentication
- **Register**: Create new account with username, email, password
- **Login**: Sign in with email and password
- **Logout**: Securely log out and clear session
- **Auto-redirect**: Unauthorized users redirected to login

### Post Management
- **Create Posts**: Text posts with optional media attachments
- **View Feed**: Paginated list of all posts (10 per page)
- **Delete Posts**: Remove your own posts with confirmation
- **Real-time Updates**: Feed refreshes after creating/deleting posts

### Media Upload
- **File Support**: Images and videos up to 5MB
- **Cloudinary Integration**: CDN-hosted media
- **Preview**: Shows attached file name before upload
- **Validation**: Client-side file size checking

### Search
- **Full-text Search**: Find posts by content
- **Live Results**: Instant search with backend indexing
- **Clear Search**: Return to full feed with one click

### UX Features
- **Loading States**: Spinners and disabled buttons during operations
- **Error Messages**: Clear feedback on failures
- **Responsive Design**: Mobile-friendly layout
- **Accessibility**: Semantic HTML and ARIA labels
- **Smooth Transitions**: Hover effects and animations

---

## 🏗️ Architecture

### Frontend Architecture
```
Browser
   ↓
Next.js UI (Port 3005)
   ↓ (Axios + Cookies)
API Gateway (Port 3000)
   ↓
Microservices (Identity, Post, Media, Search)
```

### Cookie-Based Authentication Flow
```
1. User logs in
   ↓
2. Identity Service sets httpOnly cookies
   ↓
3. Gateway forwards cookies to client
   ↓
4. Browser auto-sends cookies with every request
   ↓
5. Gateway validates access token from cookie
   ↓
6. Gateway forwards x-user-id to services
```

---

## 📂 Project Structure

```
ui/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── CreatePost.tsx    # Post creation form with media upload
│   │   ├── PostCard.tsx      # Individual post display with delete
│   │   └── SearchBar.tsx     # Search input with clear button
│   │
│   ├── lib/                  # Utility libraries
│   │   └── api.ts            # Axios client with all API functions
│   │
│   ├── pages/                # Next.js routes
│   │   ├── _app.tsx          # App wrapper
│   │   ├── _document.tsx     # HTML document
│   │   ├── index.tsx         # Home feed (protected)
│   │   ├── login.tsx         # Login page (public)
│   │   └── register.tsx      # Registration page (public)
│   │
│   └── styles/
│       └── globals.css       # Tailwind + global styles
│
├── public/                   # Static assets
├── Dockerfile                # Production container
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS setup
├── tsconfig.json             # TypeScript config
├── package.json              # Dependencies
├── README.md                 # Documentation
└── QUICKSTART.md             # Quick start guide
```

---

## 🔌 API Integration

### Authentication APIs (Identity Service)

```typescript
// Register new user
authAPI.register(username, email, password)
// Response: Sets cookies, returns user data

// Login user
authAPI.login(email, password)
// Response: Sets cookies, returns user data

// Logout
authAPI.logout()
// Response: Clears cookies

// Refresh token
authAPI.refreshToken()
// Response: New tokens in cookies
```

### Post APIs (Post Service)

```typescript
// Create post
postAPI.createPost(content, mediaIds?)
// Response: Created post object

// Get all posts (paginated)
postAPI.getAllPosts(page, limit)
// Response: { posts, currentPage, totalPages, totalPosts }

// Get single post
postAPI.getPost(id)
// Response: Post object

// Delete post
postAPI.deletePost(id)
// Response: Success message
```

### Media APIs (Media Service)

```typescript
// Upload media file
mediaAPI.uploadMedia(file)
// Response: { mediaId, url }

// Get user's media
mediaAPI.getUserMedia()
// Response: Array of media objects
```

### Search APIs (Search Service)

```typescript
// Search posts
searchAPI.searchPosts(query, page, limit)
// Response: { data, pagination }
```

---

## 🎨 Design System

### Colors (Tailwind)
- **Primary**: Blue (#1da1f2) - Buttons, links
- **Secondary**: Dark Gray (#14171a) - Text
- **Accent**: Gray (#657786) - Secondary text
- **Background**: Light Gray (#f5f8fa) - Page background
- **White**: (#ffffff) - Cards, modals

### Typography
- **Headings**: Bold, Gray-800
- **Body**: Regular, Gray-800
- **Secondary**: Regular, Gray-600
- **Small**: Text-sm, Gray-500

### Components
- **Buttons**: Rounded-lg, px-6, py-3
- **Inputs**: Border, rounded-lg, focus:ring
- **Cards**: White bg, rounded-lg, shadow
- **Modals**: Fixed overlay, centered, shadow-2xl

---

## 🔒 Security Features

### Cookie Security
```javascript
// Set in Identity Service
res.cookie('accessToken', token, {
  httpOnly: true,      // No JS access
  secure: true,        // HTTPS only (production)
  sameSite: 'strict',  // CSRF protection
  maxAge: 900000       // 15 minutes
})
```

### CORS Configuration
```javascript
// API Gateway
cors({
  origin: 'http://localhost:3005',
  credentials: true  // Allow cookies
})
```

### Axios Configuration
```typescript
// UI API Client
axios.create({
  withCredentials: true,  // Send cookies
  baseURL: process.env.NEXT_PUBLIC_API_URL
})
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Layout
- **Max Width**: 4xl (896px) for content
- **Padding**: px-4 on mobile, adjusts on larger screens
- **Cards**: Full width on mobile, fixed width on desktop

---

## 🚀 Performance

### Optimizations
- **Code Splitting**: Automatic via Next.js
- **Image Optimization**: Next/Image for Cloudinary URLs
- **Lazy Loading**: Components loaded on demand
- **Caching**: Browser caches static assets
- **Standalone Build**: Minimal Docker image

### Bundle Size
- **Next.js**: ~85KB (gzipped)
- **React**: ~40KB (gzipped)
- **Axios**: ~13KB (gzipped)
- **Tailwind**: ~10KB (purged)
- **Total**: ~150KB (initial load)

---

## 🧪 Development Tips

### Hot Reload
```bash
npm run dev
# Changes auto-reload in browser
```

### Type Checking
```bash
npm run lint
# Checks TypeScript types
```

### Building
```bash
npm run build
# Creates optimized production build
```

### Docker Development
```bash
docker-compose up ui
# Rebuilds on code changes (with volumes)
```

---

## 🐛 Common Issues & Solutions

### Issue: "Network Error"
**Solution**: Check API Gateway is running on port 3000

### Issue: "Unauthorized" on every request
**Solution**: Clear cookies and re-login

### Issue: Media upload fails
**Solution**: Check file size < 5MB and Cloudinary config

### Issue: Search returns nothing
**Solution**: Ensure Search Service consumed post.created events

### Issue: Styling not applied
**Solution**: Run `npm install` and restart dev server

---

## 📦 Dependencies

### Production
```json
{
  "next": "^14.2.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "axios": "^1.7.0"
}
```

### Development
```json
{
  "typescript": "^5",
  "tailwindcss": "^3.4.0",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.4.47"
}
```

---

## 🔄 State Management

Currently using **React Hooks** for local state:
- `useState` - Form inputs, loading states
- `useEffect` - Data fetching on mount
- `useRouter` - Navigation and redirects

**No global state library needed** because:
- Authentication via cookies (no need to store tokens)
- Each page fetches its own data
- Simple parent-child component communication

---

## 🌐 Deployment Ready

### Docker
- Multi-stage build for minimal image
- Standalone Next.js output
- Production-optimized
- Port 3005

### Environment Variables
```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:3000

# Production (Docker)
NEXT_PUBLIC_API_URL=http://api-gateway:3000

# Production (Cloud)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 📊 Testing Checklist

- [ ] Register new account
- [ ] Login with valid credentials
- [ ] Login fails with invalid credentials
- [ ] Create text-only post
- [ ] Create post with media
- [ ] View paginated feed
- [ ] Navigate between pages
- [ ] Search for posts
- [ ] Clear search
- [ ] Delete own post
- [ ] Logout clears session
- [ ] Unauthorized redirect to login
- [ ] Responsive on mobile
- [ ] Loading states show properly
- [ ] Error messages display

---

## 🎯 Future Enhancements (Not Implemented)

- User profiles and avatars
- Like/comment on posts
- Follow/unfollow users
- Real-time notifications
- Direct messaging
- Image preview before upload
- Video player for uploaded videos
- Infinite scroll instead of pagination
- Dark mode toggle
- PWA support

---

## 📝 Code Quality

### TypeScript
- Strict type checking enabled
- Interface definitions for all props
- Type-safe API responses

### React Best Practices
- Functional components only
- Custom hooks for reusable logic
- Proper key props in lists
- Error boundaries (can be added)

### Tailwind Best Practices
- Utility-first approach
- Custom theme configuration
- Responsive modifiers
- Hover/focus states

---

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Axios Docs](https://axios-http.com/docs)

---

**Built with ❤️ for NexusFeed**
