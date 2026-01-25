const Search = require("../models/Search");
const logger = require("../utils/logger");

/**
 * Search posts with pagination-aware caching
 * Cache key includes: query + page + limit (ensures proper pagination caching)
 * Follows same pattern as post service getAllPosts
 */
const searchPostController = async (req, res) => {
  logger.info("🔍 Search endpoint hit!");
  try {
    const { q, page = 1, limit = 10 } = req.query;

    // Validation
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    // Normalize query for consistent caching
    const normalizedQuery = q.trim().toLowerCase();
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Step 1: Build cache key (pagination-aware like post service)
    const cacheKey = `search:${normalizedQuery}:${pageNum}:${limitNum}`;
    
    // Step 2: Check Redis cache
    const cachedResults = await req.redisClient.get(cacheKey);
    if (cachedResults) {
      logger.info(`🎯 Cache HIT for query: "${q}" (page ${pageNum}, limit ${limitNum})`);
      const parsed = JSON.parse(cachedResults);
      return res.json({
        ...parsed,
        cached: true,
        cacheKey
      });
    }

    logger.info(`🔍 Cache MISS for query: "${q}" (page ${pageNum}, limit ${limitNum}) - querying DB`);

    // Step 3: Query MongoDB with text search
    const skip = (pageNum - 1) * limitNum;
    
    const results = await Search.find(
      { $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limitNum);

    const totalResults = await Search.countDocuments({
      $text: { $search: q }
    });

    const totalPages = Math.ceil(totalResults / limitNum);

    const response = {
      success: true,
      data: results,
      pagination: {
        currentPage: pageNum,
        limit: limitNum,
        totalResults: totalResults,
        totalPages: totalPages
      },
      cached: false
    };

    // Step 4: Cache results for 5 minutes (300 seconds) - TTL-based invalidation
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(response));
    logger.info(`💾 Cached search results for: "${q}" (page ${pageNum}, limit ${limitNum})`);

    return res.json(response);
    
  } catch (e) {
    logger.error("❌ Error while searching post: %s", e.message);
    res.status(500).json({
      success: false,
      message: "Error while searching post",
    });
  }
};

/**
 * Manual sync endpoint (admin use)
 * Allows forcing sync without waiting for background task
 */
const { syncPostsFromPostService } = require("../utils/syncPosts");

const manualSync = async (req, res) => {
  try {
    logger.info("🔄 Manual sync triggered by admin");
    const result = await syncPostsFromPostService();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error("❌ Manual sync failed:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { searchPostController, manualSync };