import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { postAPI, searchAPI, authAPI } from '@/lib/api';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import SearchBar from '@/components/SearchBar';

interface Post {
  _id: string;
  content: string;
  user: string;
  mediaIds?: string[];
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Assume authenticated initially

  useEffect(() => {
    // Longer delay on initial load to ensure cookies are fully available after login/register redirect
    const timer = setTimeout(() => {
      fetchPosts();
    }, 500); // Increased from 200ms to 500ms
    return () => clearTimeout(timer);
  }, [page]);

  const fetchPosts = async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await postAPI.getAllPosts(page, 10);
      setPosts(response.data?.posts || response.posts || []);
      setTotalPages(response.data?.totalPages || response.totalPages || 1);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.log('Failed to fetch posts (attempt ' + (retryCount + 1) + '):', error?.message || error);
      
      // Only retry for auth errors, not network errors
      if (error.response?.status === 401 && retryCount < 1) {
        console.log('Got 401, retrying after delay...');
        setTimeout(() => fetchPosts(retryCount + 1), 1000); // Increased to 1 second
        return;
      }
      
      setIsAuthenticated(false);
      setPosts([]);
      
      // Redirect to login only for confirmed auth failures
      if (
        error.response?.status === 401 || 
        error.response?.status === 403
      ) {
        console.log('Auth failed after retry, redirecting to login');
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
        return;
      }
      
      // For network errors without status code, don't auto-redirect
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
        console.log('Network error - check if backend is running');
        // Show empty state but don't redirect - might be temporary
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchMode(false);
      setSearchQuery('');
      fetchPosts();
      return;
    }

    try {
      setLoading(true);
      setSearchMode(true);
      setSearchQuery(query);
      const response = await searchAPI.searchPosts(query, 1, 10);
      setPosts(response.data?.posts || response.data || []);
    } catch (error: any) {
      console.error('Search failed:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        router.push('/login');
      } else {
        // Show empty results on error
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    setPage(1);
    fetchPosts();
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(post => post._id !== postId));
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors - user might already be logged out
      console.log('Logout error (ignored):', error);
    } finally {
      // Always redirect to login regardless of server response
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">NexusFeed</h1>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} />

        {/* Create Post */}
        <CreatePost onPostCreated={handlePostCreated} />

        {/* Posts Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600">
                {searchMode ? 'No posts found for your search.' : 'No posts yet. Create the first one!'}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />
            ))
          )}
        </div>

        {/* Pagination */}
        {!searchMode && totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
