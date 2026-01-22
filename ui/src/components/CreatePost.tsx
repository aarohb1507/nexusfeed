import { useState } from 'react';
import { postAPI, mediaAPI } from '@/lib/api';

interface CreatePostProps {
  onPostCreated: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Post content is required');
      return;
    }

    if (content.length > 5000) {
      setError('Post is too long. Maximum 5000 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let mediaIds: string[] = [];

      // Upload media if file is selected
      if (file) {
        setUploading(true);
        const mediaResponse = await mediaAPI.uploadMedia(file);
        if (mediaResponse.success && mediaResponse.mediaId) {
          mediaIds.push(mediaResponse.mediaId);
        }
        setUploading(false);
      }

      // Create post
      await postAPI.createPost(content, mediaIds.length > 0 ? mediaIds : undefined);
      
      // Reset form
      setContent('');
      setFile(null);
      onPostCreated();
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      
      if (status === 401 || status === 403) {
        setError('Session expired. Please login again.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (status === 429) {
        setError('Too many posts. Please wait a moment.');
      } else if (status >= 500) {
        setError('Server error. Please try again.');
      } else {
        setError(message || 'Failed to create post');
      }
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          rows={4}
        />

        {error && (
          <div className="mt-2 text-red-600 text-sm">{error}</div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">
                  {file ? file.name : 'Add Media'}
                </span>
              </div>
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-red-600 text-sm hover:underline"
              >
                Remove
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
