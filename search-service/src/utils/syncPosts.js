const axios = require('axios');
const Search = require('../models/Search');
const logger = require('./logger');

/**
 * Smart sync: Only syncs if collection sizes don't match
 * Uses count-based validation + batch processing + bulk insert
 */
const syncPostsFromPostService = async () => {
  const startTime = Date.now();
  
  try {
    logger.info('🔍 Checking if post sync is needed...');
    
    // Step 1: Get collection sizes (FAST - O(1) operations)
    const searchCount = await Search.countDocuments();
    
    // Call post-service to get total count
    const countResponse = await axios.get(
      `${process.env.POST_SERVICE_URL || 'http://localhost:3002'}/api/posts/count`,
      { timeout: 5000 }
    );
    const postCount = countResponse.data.count;
    
    logger.info(`📊 Search DB: ${searchCount} posts | Post DB: ${postCount} posts`);
    
    // Step 2: Smart gate - exit early if already in sync
    if (searchCount === postCount) {
      logger.info('✅ Collections are in sync. No action needed.');
      return { 
        synced: false, 
        reason: 'Already in sync', 
        searchCount, 
        postCount,
        duration: `${Date.now() - startTime}ms`
      };
    }
    
    const missing = postCount - searchCount;
    logger.warn(`⚠️ Mismatch detected! Syncing ${missing} missing posts...`);
    
    // Step 3: Paginated sync with bulk insert (batch processing)
    const batchSize = 100; // Process 100 posts at a time
    let page = 1;
    let syncedCount = 0;
    let skippedCount = 0;
    
    while (true) {
      // Fetch batch from post service
      const response = await axios.get(
        `${process.env.POST_SERVICE_URL || 'http://localhost:3002'}/api/posts/sync/all-posts`,
        {
          params: { page, limit: batchSize },
          timeout: 10000
        }
      );
      
      const posts = response.data.posts || []; // Correct data structure
      
      if (posts.length === 0) break; // No more posts, done!
      
      // Prepare bulk insert array (accumulate first, insert once)
      const searchDocs = [];
      
      for (const post of posts) {
        // Check if already indexed (prevents duplicates)
        const existing = await Search.exists({ postId: post._id.toString() });
        
        if (!existing) {
          searchDocs.push({
            postId: post._id.toString(),
            userId: post.user.toString(), // Field is 'user' not 'userId'
            content: post.content,
            createdAt: post.createdAt,
          });
        } else {
          skippedCount++;
        }
      }
      
      // Bulk insert - single DB call instead of N calls (20x faster)
      if (searchDocs.length > 0) {
        await Search.insertMany(searchDocs, { ordered: false }); // Continue on duplicates
        syncedCount += searchDocs.length;
        logger.info(`✅ Synced batch ${page}: ${searchDocs.length} new posts (${skippedCount} skipped)`);
      }
      
      page++;
    }
    
    const duration = Date.now() - startTime;
    logger.info(`🎉 Sync complete! Indexed ${syncedCount} new posts in ${duration}ms`);
    
    return { 
      synced: true, 
      syncedCount, 
      skippedCount,
      totalBatches: page - 1,
      duration: `${duration}ms`,
      throughput: `${(syncedCount / (duration / 1000)).toFixed(0)} posts/sec`
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`❌ Sync failed after ${duration}ms:`, error.message);
    return { 
      synced: false, 
      error: error.message,
      duration: `${duration}ms`
    };
  }
};

/**
 * Run sync in background (non-blocking)
 * Waits 5 seconds after startup to ensure all services are ready
 */
const backgroundSync = () => {
  logger.info('📅 Background sync scheduled for 5 seconds from now...');
  
  setTimeout(async () => {
    logger.info('🔄 Starting background sync...');
    const result = await syncPostsFromPostService();
    
    if (result.synced) {
      logger.info(`✅ Background sync completed: ${result.syncedCount} posts synced in ${result.duration}`);
    } else {
      logger.info(`ℹ️ Background sync result: ${result.reason || result.error}`);
    }
  }, 5000); // 5 second delay
};

module.exports = { syncPostsFromPostService, backgroundSync };
